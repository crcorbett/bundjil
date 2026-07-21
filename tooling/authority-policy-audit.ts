import { lstatSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { Console, Effect, Schema } from "effect";
import { parse as parseYamlDocument } from "yaml";

import {
  auditAuthority,
  AuthorityPolicyReportJson,
  AuthorityRegisterJson,
  boundedAuthorityFindings,
  GitHubActionsLockJson,
} from "./authority-policy.js";
import type { AuthorityWorkflow } from "./authority-policy.js";

const repositoryRoot = resolve(import.meta.dirname, "..");
const detailPath = "tmp/authority-policy-report.json";
const maximumConsoleFindings = 20;

const AuditOperation = Schema.Literals([
  "discover",
  "read",
  "decode",
  "parse",
  "encode",
  "write",
]);

class AuthorityAuditError extends Schema.TaggedErrorClass<AuthorityAuditError>()(
  "AuthorityAuditError",
  {
    detail: Schema.NonEmptyString,
    operation: AuditOperation,
    target: Schema.NonEmptyString,
  }
) {}

const requiredFiles = {
  authorityRegister: "docs/operations/authority-register.json",
  automationRegister: "docs/operations/automation-register.md",
  githubActionsLock: "docs/operations/github-actions-lock.json",
} as const;

const workflowPath = (path: string) =>
  /^\.github\/workflows\/[^/]+\.ya?ml$/.test(path);

const discoverPaths = Effect.fn("AuthorityAudit.discoverPaths")(() =>
  Effect.tryPromise({
    try: async () => {
      const child = Bun.spawn(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        { cwd: repositoryRoot, stderr: "pipe", stdout: "pipe" }
      );
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      if (exitCode !== 0) {
        throw new Error(stderr || `git ls-files exited ${exitCode}`);
      }
      return stdout.split("\0").filter(Boolean).toSorted();
    },
    catch: (cause) =>
      new AuthorityAuditError({
        detail: String(cause),
        operation: "discover",
        target: repositoryRoot,
      }),
  })
);

const readFile = Effect.fn("AuthorityAudit.readFile")((path: string) =>
  Effect.tryPromise({
    try: () => Bun.file(resolve(repositoryRoot, path)).text(),
    catch: (cause) =>
      new AuthorityAuditError({
        detail: String(cause),
        operation: "read",
        target: path,
      }),
  })
);

const readRequired = (path: string, paths: readonly string[]) =>
  paths.includes(path)
    ? readFile(path)
    : Effect.fail(
        new AuthorityAuditError({
          detail:
            "Required policy input is missing from the repository path set",
          operation: "read",
          target: path,
        })
      );

const parseWorkflow = Effect.fn("AuthorityAudit.parseWorkflow")(
  (path: string, content: string) =>
    Effect.try({
      try: () =>
        ({
          content,
          document: parseYamlDocument(content),
          path,
        }) satisfies AuthorityWorkflow,
      catch: (cause) =>
        new AuthorityAuditError({
          detail: String(cause),
          operation: "parse",
          target: path,
        }),
    })
);

const decodeAuthorityRegister = Effect.fn(
  "AuthorityAudit.decodeAuthorityRegister"
)((content: string) =>
  Schema.decodeUnknownEffect(AuthorityRegisterJson)(content).pipe(
    Effect.mapError(
      (cause) =>
        new AuthorityAuditError({
          detail: String(cause),
          operation: "decode",
          target: requiredFiles.authorityRegister,
        })
    )
  )
);

const decodeActionLock = Effect.fn("AuthorityAudit.decodeActionLock")(
  (content: string) =>
    Schema.decodeUnknownEffect(GitHubActionsLockJson)(content).pipe(
      Effect.mapError(
        (cause) =>
          new AuthorityAuditError({
            detail: String(cause),
            operation: "decode",
            target: requiredFiles.githubActionsLock,
          })
      )
    )
);

const exists = (path: string) => {
  try {
    lstatSync(resolve(repositoryRoot, path));
    return true;
  } catch {
    return false;
  }
};

const program = Effect.gen(function* () {
  const discovered = yield* discoverPaths();
  const repositoryPaths = discovered.filter(exists);
  const [authorityContent, lockContent, automationRegister] = yield* Effect.all(
    [
      readRequired(requiredFiles.authorityRegister, repositoryPaths),
      readRequired(requiredFiles.githubActionsLock, repositoryPaths),
      readRequired(requiredFiles.automationRegister, repositoryPaths),
    ],
    { concurrency: 3 }
  );
  const [authorityRegister, githubActionsLock] = yield* Effect.all(
    [decodeAuthorityRegister(authorityContent), decodeActionLock(lockContent)],
    { concurrency: 2 }
  );
  const workflows = yield* Effect.forEach(
    repositoryPaths.filter(workflowPath),
    (path) =>
      readFile(path).pipe(
        Effect.flatMap((content) => parseWorkflow(path, content))
      ),
    { concurrency: 4 }
  );
  const report = auditAuthority(
    {
      automationRegister,
      authorityRegister,
      githubActionsLock,
      repositoryPaths,
      workflows,
    },
    {
      detailPath,
      generatedAt: new Date().toISOString(),
      maxFindings: maximumConsoleFindings,
    }
  );
  const encoded = yield* Schema.encodeEffect(AuthorityPolicyReportJson)(
    report
  ).pipe(
    Effect.mapError(
      (cause) =>
        new AuthorityAuditError({
          detail: String(cause),
          operation: "encode",
          target: detailPath,
        })
    )
  );
  const absoluteDetailPath = resolve(repositoryRoot, detailPath);
  yield* Effect.tryPromise({
    try: async () => {
      await mkdir(dirname(absoluteDetailPath), { recursive: true });
      await Bun.write(absoluteDetailPath, `${encoded}\n`);
    },
    catch: (cause) =>
      new AuthorityAuditError({
        detail: String(cause),
        operation: "write",
        target: detailPath,
      }),
  });
  if (report.ok) {
    yield* Console.log(
      `check:authority passed: ${report.checkedWorkflows} workflows; receipt ${report.detailPath}`
    );
    return yield* Effect.void;
  }
  yield* Console.error(
    `check:authority failed: ${report.findings.length} invariant violation(s)`
  );
  for (const issue of boundedAuthorityFindings(report)) {
    yield* Console.error(
      `[${issue.code}] ${issue.invariant}\n  target: ${issue.target}\n  repair: ${issue.repairHint}\n  detail: ${issue.detail}\n  postcondition: ${issue.postcondition}`
    );
  }
  yield* Console.error(
    report.omittedFindings > 0
      ? `${report.omittedFindings} finding(s) omitted; full detail: ${report.detailPath}`
      : `full detail: ${report.detailPath}`
  );
  return yield* new AuthorityAuditError({
    detail: `${report.findings.length} invariant violation(s)`,
    operation: "write",
    target: report.detailPath,
  });
});

if (import.meta.main) {
  try {
    await Effect.runPromise(program);
  } catch (error) {
    console.error(`check:authority stopped: ${String(error)}`);
    process.exitCode = 1;
  }
}

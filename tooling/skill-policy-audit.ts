import { lstatSync } from "node:fs";
import { lstat, mkdir, readlink, stat } from "node:fs/promises";
import { dirname, posix, resolve } from "node:path";

import { Console, Effect, Schema } from "effect";

import {
  auditSkills,
  boundedSkillFindings,
  SkillPolicyReportJson,
} from "./skill-policy.js";
import type { SkillFile, SkillLink } from "./skill-policy.js";

const repositoryRoot = resolve(import.meta.dirname, "..");
const detailPath = "tmp/skill-policy-report.json";
const maximumConsoleFindings = 20;

const pathEntryExists = (path: string) => {
  try {
    lstatSync(resolve(repositoryRoot, path));
    return true;
  } catch {
    return false;
  }
};

const AuditOperation = Schema.Literals([
  "discover",
  "inspect-link",
  "read",
  "encode",
  "write",
]);

class SkillAuditError extends Schema.TaggedErrorClass<SkillAuditError>()(
  "SkillAuditError",
  {
    detail: Schema.NonEmptyString,
    operation: AuditOperation,
    target: Schema.NonEmptyString,
  }
) {}

const discoverRepositoryPaths = Effect.fn("SkillAudit.discoverRepositoryPaths")(
  () =>
    Effect.tryPromise({
      try: async () => {
        const process = Bun.spawn(
          [
            "git",
            "ls-files",
            "--cached",
            "--others",
            "--exclude-standard",
            "-z",
          ],
          { cwd: repositoryRoot, stderr: "pipe", stdout: "pipe" }
        );
        const [stdout, stderr, exitCode] = await Promise.all([
          new Response(process.stdout).text(),
          new Response(process.stderr).text(),
          process.exited,
        ]);
        if (exitCode !== 0) {
          throw new Error(stderr || `git ls-files exited ${exitCode}`);
        }
        return stdout.split("\0").filter(Boolean).toSorted();
      },
      catch: (cause) =>
        new SkillAuditError({
          detail: String(cause),
          operation: "discover",
          target: repositoryRoot,
        }),
    })
);

const selectedPolicyFile = (path: string) =>
  path === "AGENTS.md" ||
  path === "docs/architecture/effect-patterns.md" ||
  (path.startsWith(".agents/skills/") && /\.(?:md|mdx|ya?ml)$/.test(path));

const readPolicyFile = Effect.fn("SkillAudit.readPolicyFile")((path: string) =>
  Effect.tryPromise({
    try: () => Bun.file(resolve(repositoryRoot, path)).text(),
    catch: (cause) =>
      new SkillAuditError({
        detail: String(cause),
        operation: "read",
        target: path,
      }),
  }).pipe(Effect.map((content): SkillFile => ({ content, path })))
);

const inspectLink = Effect.fn("SkillAudit.inspectLink")((path: string) =>
  Effect.tryPromise({
    try: async (): Promise<SkillLink> => {
      const absolutePath = resolve(repositoryRoot, path);
      const linkStatus = await lstat(absolutePath);
      const isSymbolicLink = linkStatus.isSymbolicLink();
      const target = isSymbolicLink
        ? await readlink(absolutePath)
        : "not-a-link";
      const resolvedPath = isSymbolicLink
        ? posix.normalize(posix.join(posix.dirname(path), target))
        : path;
      const targetExists = await stat(resolve(repositoryRoot, resolvedPath))
        .then(() => true)
        .catch(() => false);
      return { isSymbolicLink, path, resolvedPath, target, targetExists };
    },
    catch: (cause) =>
      new SkillAuditError({
        detail: String(cause),
        operation: "inspect-link",
        target: path,
      }),
  })
);

const program = Effect.gen(function* () {
  const discoveredPaths = yield* discoverRepositoryPaths();
  const repositoryPaths = discoveredPaths.filter(pathEntryExists);
  const files = yield* Effect.forEach(
    repositoryPaths.filter(selectedPolicyFile),
    readPolicyFile,
    { concurrency: 24 }
  );
  const links = yield* Effect.forEach(
    repositoryPaths.filter((path) => /^\.claude\/skills\/[^/]+$/.test(path)),
    inspectLink,
    { concurrency: 16 }
  );
  const report = auditSkills(
    { files, links, repositoryPaths },
    {
      detailPath,
      generatedAt: new Date().toISOString(),
      maxFindings: maximumConsoleFindings,
    }
  );
  const encoded = yield* Schema.encodeEffect(SkillPolicyReportJson)(
    report
  ).pipe(
    Effect.mapError(
      (cause) =>
        new SkillAuditError({
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
      new SkillAuditError({
        detail: String(cause),
        operation: "write",
        target: detailPath,
      }),
  });

  if (report.ok) {
    yield* Console.log(
      `check:skills passed: ${report.checkedFiles} files, ${report.checkedLinks} mirrors; receipt ${report.detailPath}`
    );
    return yield* Effect.void;
  }

  yield* Console.error(
    `check:skills failed: ${report.findings.length} invariant violation(s)`
  );
  for (const issue of boundedSkillFindings(report)) {
    yield* Console.error(
      `[${issue.code}] ${issue.invariant}\n  owner: ${issue.owner}\n  target: ${issue.target}\n  repair: ${issue.repairHint}\n  detail: ${issue.detail}`
    );
  }
  yield* Console.error(
    report.omittedFindings > 0
      ? `${report.omittedFindings} finding(s) omitted; full detail: ${report.detailPath}`
      : `full detail: ${report.detailPath}`
  );
  return yield* new SkillAuditError({
    detail: `${report.findings.length} invariant violation(s)`,
    operation: "write",
    target: report.detailPath,
  });
});

if (import.meta.main) {
  try {
    await Effect.runPromise(program);
  } catch (error) {
    console.error(`check:skills stopped: ${String(error)}`);
    process.exitCode = 1;
  }
}

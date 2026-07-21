import { lstatSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { Console, Effect, Schema } from "effect";

import {
  auditDocumentation,
  boundedDocumentationFindings,
  DocumentationPolicyReportJson,
} from "./documentation-policy.js";
import type {
  CurrentOwnerPolicy,
  DocumentationFile,
  DocumentationManifest,
} from "./documentation-policy.js";

const repositoryRoot = resolve(import.meta.dirname, "..");
const detailPath = "tmp/docs-policy-report.json";
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
  "read",
  "decode",
  "encode",
  "write",
]);

class DocumentationAuditError extends Schema.TaggedErrorClass<DocumentationAuditError>()(
  "DocumentationAuditError",
  {
    detail: Schema.NonEmptyString,
    operation: AuditOperation,
    target: Schema.NonEmptyString,
  }
) {}

const ManifestJson = Schema.fromJsonString(
  Schema.Struct({
    name: Schema.NonEmptyString,
    scripts: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  })
);
const OwnerPolicyJson = Schema.fromJsonString(
  Schema.Struct({
    acceptedTaskStates: Schema.Record(Schema.String, Schema.NonEmptyString),
    nonterminalTaskTerms: Schema.Array(Schema.NonEmptyString),
    owners: Schema.Array(Schema.NonEmptyString),
    rules: Schema.Array(
      Schema.Struct({
        claimType: Schema.NonEmptyString,
        id: Schema.NonEmptyString,
        nonClaimTerms: Schema.Array(Schema.NonEmptyString),
        ownerPaths: Schema.Array(Schema.NonEmptyString),
        requiredTermGroups: Schema.Array(Schema.Array(Schema.NonEmptyString)),
        repairHint: Schema.NonEmptyString,
      })
    ),
    schemaVersion: Schema.Literal(2),
    taskStateOwnerPaths: Schema.Array(Schema.NonEmptyString),
  })
);

const discoverRepositoryPaths = Effect.fn(
  "DocumentationAudit.discoverRepositoryPaths"
)(() =>
  Effect.tryPromise({
    try: async () => {
      const process = Bun.spawn(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
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
      new DocumentationAuditError({
        detail: String(cause),
        operation: "discover",
        target: repositoryRoot,
      }),
  })
);

const selectedDocumentationFile = (path: string) =>
  path.endsWith(".md") ||
  path === "package.json" ||
  /^(apps|packages)\/[^/]+\/package\.json$/.test(path) ||
  path === "apps/agent/agent/instructions.md" ||
  path === "tooling/documentation/current-owner-policy.json" ||
  path === "docs/documentation-audit/HGI-308-boundary-exceptions.decision.json";

const readRepositoryFile = Effect.fn("DocumentationAudit.readRepositoryFile")(
  (path: string) =>
    Effect.tryPromise({
      try: () => Bun.file(resolve(repositoryRoot, path)).text(),
      catch: (cause) =>
        new DocumentationAuditError({
          detail: String(cause),
          operation: "read",
          target: path,
        }),
    }).pipe(Effect.map((content): DocumentationFile => ({ content, path })))
);

const decodeManifest = Effect.fn("DocumentationAudit.decodeManifest")(
  (file: DocumentationFile) =>
    Schema.decodeUnknownEffect(ManifestJson)(file.content).pipe(
      Effect.map(
        (manifest): DocumentationManifest => ({
          name: manifest.name,
          path: file.path,
          scripts: manifest.scripts ?? {},
        })
      ),
      Effect.mapError(
        (cause) =>
          new DocumentationAuditError({
            detail: String(cause),
            operation: "decode",
            target: file.path,
          })
      )
    )
);

const program = Effect.gen(function* () {
  const discoveredPaths = yield* discoverRepositoryPaths();
  const repositoryPaths = discoveredPaths.filter(pathEntryExists);
  const files = yield* Effect.forEach(
    repositoryPaths.filter(selectedDocumentationFile),
    readRepositoryFile,
    { concurrency: 16 }
  );
  const manifests = yield* Effect.forEach(
    files.filter((file) => file.path.endsWith("package.json")),
    decodeManifest,
    { concurrency: 8 }
  );
  const ownerPolicyFile = yield* Effect.fromNullishOr(
    files.find(
      (file) => file.path === "tooling/documentation/current-owner-policy.json"
    )
  ).pipe(
    Effect.mapError(
      () =>
        new DocumentationAuditError({
          detail: "Current-owner policy is missing from the selected corpus",
          operation: "read",
          target: "tooling/documentation/current-owner-policy.json",
        })
    )
  );
  const ownerPolicy = yield* Schema.decodeUnknownEffect(OwnerPolicyJson)(
    ownerPolicyFile.content
  ).pipe(
    Effect.mapError(
      (cause) =>
        new DocumentationAuditError({
          detail: String(cause),
          operation: "decode",
          target: ownerPolicyFile.path,
        })
    ),
    Effect.map((decoded): CurrentOwnerPolicy => decoded)
  );
  const report = auditDocumentation(
    { files, manifests, ownerPolicy, repositoryPaths },
    {
      detailPath,
      generatedAt: new Date().toISOString(),
      maxFindings: maximumConsoleFindings,
    }
  );
  const encoded = yield* Schema.encodeEffect(DocumentationPolicyReportJson)(
    report
  ).pipe(
    Effect.mapError(
      (cause) =>
        new DocumentationAuditError({
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
      new DocumentationAuditError({
        detail: String(cause),
        operation: "write",
        target: detailPath,
      }),
  });

  if (report.ok) {
    yield* Console.log(
      `check:docs passed: ${report.checkedFiles} files; receipt ${report.detailPath}`
    );
    return yield* Effect.void;
  }

  yield* Console.error(
    `check:docs failed: ${report.findings.length} invariant violation(s)`
  );
  for (const issue of boundedDocumentationFindings(report)) {
    yield* Console.error(
      `[${issue.code}] ${issue.invariant}\n  owner: ${issue.owner}\n  target: ${issue.target}\n  repair: ${issue.repairHint}\n  detail: ${issue.detail}`
    );
  }
  yield* Console.error(
    report.omittedFindings > 0
      ? `${report.omittedFindings} finding(s) omitted; full detail: ${report.detailPath}`
      : `full detail: ${report.detailPath}`
  );
  return yield* new DocumentationAuditError({
    detail: `${report.findings.length} invariant violation(s)`,
    operation: "write",
    target: report.detailPath,
  });
});

if (import.meta.main) {
  try {
    await Effect.runPromise(program);
  } catch (error) {
    console.error(`check:docs stopped: ${String(error)}`);
    process.exitCode = 1;
  }
}

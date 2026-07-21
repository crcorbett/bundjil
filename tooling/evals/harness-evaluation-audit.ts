import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { Console, Effect, Schema } from "effect";

import {
  auditHarnessEvaluation,
  HarnessEpochJson,
  HarnessEvaluationReportJson,
  HarnessImpactLedgerJson,
  HarnessScenarioManifestJson,
} from "./harness-evaluation.js";

const repositoryRoot = resolve(import.meta.dirname, "../..");
const detailPath = "tmp/harness-evaluation-report.json";
const requiredFiles = {
  epoch: "docs/verification/hgi-307-epoch.json",
  impact: "docs/documentation-audit/HGI-307-impact-ledger.json",
  manifest: "tooling/evals/hgi-307/scenarios.json",
} as const;

class HarnessEvaluationError extends Schema.TaggedErrorClass<HarnessEvaluationError>()(
  "HarnessEvaluationError",
  {
    detail: Schema.NonEmptyString,
    operation: Schema.Literals([
      "decode",
      "discover",
      "encode",
      "read",
      "write",
    ]),
    target: Schema.NonEmptyString,
  }
) {}

const discoverPaths = Effect.tryPromise({
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
      throw new Error(stderr ?? `git ls-files exited ${exitCode}`);
    }
    return stdout.split("\0").filter(Boolean).toSorted();
  },
  catch: (cause) =>
    new HarnessEvaluationError({
      detail: String(cause),
      operation: "discover",
      target: repositoryRoot,
    }),
});

const read = (path: string) =>
  Effect.tryPromise({
    try: () => Bun.file(resolve(repositoryRoot, path)).text(),
    catch: (cause) =>
      new HarnessEvaluationError({
        detail: String(cause),
        operation: "read",
        target: path,
      }),
  });

const decode = <A, I>(path: string, schema: Schema.Codec<A, I>) =>
  read(path).pipe(
    Effect.flatMap((content) =>
      Schema.decodeUnknownEffect(schema)(content, {
        onExcessProperty: "error",
      })
    ),
    Effect.mapError(
      (cause) =>
        new HarnessEvaluationError({
          detail: String(cause),
          operation: "decode",
          target: path,
        })
    )
  );

const sha256 = (content: string) =>
  Effect.promise(async () => {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(content)
    );
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  });

const program = Effect.gen(function* () {
  const repositoryPaths = yield* discoverPaths;
  for (const path of Object.values(requiredFiles)) {
    if (!repositoryPaths.includes(path)) {
      return yield* new HarnessEvaluationError({
        detail: "Required harness-evaluation input is absent",
        operation: "read",
        target: path,
      });
    }
  }
  const [epoch, impactLedger, manifest] = yield* Effect.all(
    [
      decode(requiredFiles.epoch, HarnessEpochJson),
      decode(requiredFiles.impact, HarnessImpactLedgerJson),
      decode(requiredFiles.manifest, HarnessScenarioManifestJson),
    ],
    { concurrency: 3 }
  );
  const digestPaths = [
    epoch.scenarioManifest.path,
    ...epoch.scenarios.map(({ report }) => report.path),
    ...epoch.skills.map(({ path }) => path),
  ];
  const contentDigests = Object.fromEntries(
    yield* Effect.forEach(
      [...new Set(digestPaths)],
      (path) =>
        read(path).pipe(
          Effect.flatMap(sha256),
          Effect.map((digest) => [path, digest] as const)
        ),
      { concurrency: 4 }
    )
  );
  const docsPaths = repositoryPaths
    .filter((path) => path.startsWith("docs/"))
    .toSorted();
  const readmePaths = repositoryPaths
    .filter((path) => path === "README.md" || path.endsWith("/README.md"))
    .toSorted();
  const findings = yield* Effect.promise(() =>
    auditHarnessEvaluation({
      contentDigests,
      docsPaths,
      epoch,
      impactLedger,
      manifest,
      readmePaths,
      repositoryPaths,
    })
  );
  const report = {
    checkedImpactAreas: impactLedger.impactAreas.length,
    checkedScenarios: epoch.scenarios.length,
    detailPath,
    findings,
    generatedAt: new Date().toISOString(),
    ok: findings.length === 0,
    schemaVersion: 1 as const,
  };
  const encoded = yield* Schema.encodeEffect(HarnessEvaluationReportJson)(
    report
  ).pipe(
    Effect.mapError(
      (cause) =>
        new HarnessEvaluationError({
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
      new HarnessEvaluationError({
        detail: String(cause),
        operation: "write",
        target: detailPath,
      }),
  });
  if (!report.ok) {
    for (const issue of report.findings.slice(0, 20)) {
      yield* Console.error(
        `${issue.code} ${issue.target}: ${issue.detail} Repair: ${issue.repairHint}`
      );
    }
    return yield* new HarnessEvaluationError({
      detail: `${report.findings.length} finding(s); full receipt ${detailPath}`,
      operation: "decode",
      target: "Bundjil HGI-307 harness evaluation",
    });
  }
  return yield* Console.log(
    `eval:hgi-307 passed: ${report.checkedScenarios} scenarios; ${report.checkedImpactAreas} impact areas; receipt ${detailPath}`
  );
});

await Effect.runPromise(
  program.pipe(
    Effect.catchTag("HarnessEvaluationError", (error) =>
      Console.error(
        `eval:hgi-307 failed: ${error.target}: ${error.detail}`
      ).pipe(
        Effect.andThen(
          Effect.sync(() => {
            process.exitCode = 1;
          })
        )
      )
    )
  )
);

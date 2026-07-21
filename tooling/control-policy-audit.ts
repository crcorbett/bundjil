import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { Console, Effect, Schema } from "effect";

import { boundaryExceptions } from "./boundary-exceptions.js";
import {
  auditControlPolicy,
  AutomationRegisterJson,
  BoundaryControlDecisionJson,
  ControlPolicyReportJson,
  ControlRegisterJson,
  FeedbackPromotionJson,
} from "./control-policy.js";
import { FreshnessCandidateJson } from "./documentation/freshness-candidate.js";

const repositoryRoot = resolve(import.meta.dirname, "..");
const detailPath = "tmp/control-policy-report.json";
const candidateRoot = "docs/documentation-audit/freshness-candidates/";

const requiredFiles = {
  automation: "docs/standards/automation-register.json",
  boundaryDecision:
    "docs/documentation-audit/HGI-306-boundary-exceptions.decision.json",
  controls: "docs/standards/control-register.json",
  feedback: "docs/documentation-audit/HGI-306-feedback-promotion.json",
  ownerPolicy: "tooling/documentation/current-owner-policy.json",
} as const;

class ControlAuditError extends Schema.TaggedErrorClass<ControlAuditError>()(
  "ControlAuditError",
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
    new ControlAuditError({
      detail: String(cause),
      operation: "discover",
      target: repositoryRoot,
    }),
});

const read = (path: string) =>
  Effect.tryPromise({
    try: () => Bun.file(resolve(repositoryRoot, path)).text(),
    catch: (cause) =>
      new ControlAuditError({
        detail: String(cause),
        operation: "read",
        target: path,
      }),
  });

const decode = <A, I>(path: string, schema: Schema.Codec<A, I>) =>
  read(path).pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(schema)),
    Effect.mapError((cause) =>
      cause instanceof ControlAuditError
        ? cause
        : new ControlAuditError({
            detail: String(cause),
            operation: "decode",
            target: path,
          })
    )
  );

const OwnerPolicyJson = Schema.fromJsonString(
  Schema.Struct({ owners: Schema.Array(Schema.NonEmptyString) })
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
      return yield* new ControlAuditError({
        detail:
          "Required control-policy input is absent from the repository path set",
        operation: "read",
        target: path,
      });
    }
  }
  const [
    automationRegister,
    boundaryDecision,
    controlRegister,
    feedbackPromotion,
    ownerPolicy,
  ] = yield* Effect.all(
    [
      decode(requiredFiles.automation, AutomationRegisterJson),
      decode(requiredFiles.boundaryDecision, BoundaryControlDecisionJson),
      decode(requiredFiles.controls, ControlRegisterJson),
      decode(requiredFiles.feedback, FeedbackPromotionJson),
      decode(requiredFiles.ownerPolicy, OwnerPolicyJson),
    ],
    { concurrency: 5 }
  );
  const candidatePaths = repositoryPaths.filter(
    (path) => path.startsWith(candidateRoot) && path.endsWith(".json")
  );
  const freshnessCandidates = yield* Effect.forEach(
    candidatePaths,
    (path) => decode(path, FreshnessCandidateJson),
    { concurrency: 4 }
  );
  const sourceDigests = Object.fromEntries(
    yield* Effect.forEach(
      [...new Set(freshnessCandidates.map(({ source }) => source.path))],
      (path) =>
        read(path).pipe(
          Effect.flatMap(sha256),
          Effect.map((digest) => [path, digest] as const)
        ),
      { concurrency: 4 }
    )
  );
  const report = auditControlPolicy(
    {
      automationRegister,
      boundaryDecision,
      boundaryExceptions,
      controlRegister,
      currentOwnerPaths: ownerPolicy.owners,
      feedbackPromotion,
      freshnessCandidates,
      repositoryPaths,
      sourceDigests,
    },
    { detailPath, generatedAt: new Date().toISOString() }
  );
  const encoded = yield* Schema.encodeEffect(ControlPolicyReportJson)(
    report
  ).pipe(
    Effect.mapError(
      (cause) =>
        new ControlAuditError({
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
      new ControlAuditError({
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
    return yield* new ControlAuditError({
      detail: `${report.findings.length} control-policy finding(s); full receipt ${detailPath}`,
      operation: "decode",
      target: "Bundjil controls and automation",
    });
  }
  return yield* Console.log(
    `check:controls passed: ${report.checkedControls} controls; ${report.checkedAutomations} automations; ${report.checkedFreshnessCandidates} freshness candidates; receipt ${detailPath}`
  );
});

await Effect.runPromise(
  program.pipe(
    Effect.catchTag("ControlAuditError", (error) =>
      Console.error(
        `check:controls failed: ${error.target}: ${error.detail}`
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

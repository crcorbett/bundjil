import { createHash } from "node:crypto";
import { dirname, isAbsolute } from "node:path";

import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import {
  Cause,
  Config,
  ConfigProvider,
  Console,
  Effect,
  Exit,
  FileSystem,
  Layer,
  Match,
  Option,
  Schema,
} from "effect";

import {
  preflightProductionPromotion,
  ProductionPreflightDetail,
  ProductionPreflightError,
  ProductionPreflightReceipt,
  ProductionPreflightSnapshot,
  ProductionPreflightSnapshotPath,
} from "../agent/production-preflight.js";

declare const process: {
  exitCode: number | undefined;
};

const SafeDetailPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 200 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "Production preflight detail path must be a bounded safe repository-relative path."
    )
  )
);

const snapshotPath = Config.schema(
  ProductionPreflightSnapshotPath,
  "BUNDJIL_PRODUCTION_PREFLIGHT_SNAPSHOT"
);
const detailPath = Config.schema(
  SafeDetailPath,
  "BUNDJIL_PRODUCTION_PREFLIGHT_DETAILS_PATH"
).pipe(Config.withDefault("tmp/proof/production-preflight-detail.json"));

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const maximumSnapshotBytes = 256n * 1024n;

const evaluate = Effect.gen(function* evaluateProductionPreflight() {
  const path = yield* snapshotPath.pipe(
    Effect.mapError(
      () =>
        new ProductionPreflightError({
          failureCode: "configuration-unavailable",
          message:
            "Production preflight snapshot configuration is unavailable.",
        })
    )
  );
  const fileSystem = yield* FileSystem.FileSystem;
  const metadata = yield* fileSystem.stat(path).pipe(
    Effect.mapError(
      () =>
        new ProductionPreflightError({
          failureCode: "snapshot-unavailable",
          message: "Production preflight metadata snapshot is unavailable.",
        })
    )
  );

  if (metadata.mode % 0o1000 !== 0o600) {
    return yield* new ProductionPreflightError({
      failureCode: "snapshot-permission-invalid",
      message: "Production preflight metadata must have mode 0600.",
    });
  }

  if (metadata.size > maximumSnapshotBytes) {
    return yield* new ProductionPreflightError({
      failureCode: "snapshot-too-large",
      message: "Production preflight metadata exceeds the bounded input size.",
    });
  }

  const content = yield* fileSystem.readFileString(path).pipe(
    Effect.mapError(
      () =>
        new ProductionPreflightError({
          failureCode: "snapshot-unavailable",
          message: "Production preflight metadata snapshot is unavailable.",
        })
    )
  );
  const snapshot = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(ProductionPreflightSnapshot),
    { onExcessProperty: "error" }
  )(content).pipe(
    Effect.mapError(
      () =>
        new ProductionPreflightError({
          failureCode: "snapshot-invalid",
          message: "Production preflight metadata snapshot is invalid.",
        })
    )
  );
  const evidence = yield* preflightProductionPromotion(snapshot);
  return { evidence, snapshot };
});

const main = Effect.gen(function* renderProductionPreflight() {
  const observedAt = new Date(
    yield* Effect.clockWith((clock) => clock.currentTimeMillis)
  ).toISOString();
  const outputDetailPathExit = yield* Effect.exit(
    detailPath.pipe(
      Effect.mapError(
        () =>
          new ProductionPreflightError({
            failureCode: "configuration-unavailable",
            message:
              "Production preflight detail-artifact configuration is unavailable.",
          })
      )
    )
  );
  if (Exit.isFailure(outputDetailPathExit)) {
    const fallback = ProductionPreflightReceipt.make({
      candidateCommit: "unresolved",
      classification: "configuration-unavailable",
      command: "production-preflight",
      detailArtifact: {
        path: "tmp/proof/production-preflight-detail.json",
        sha256: null,
        state: "unavailable",
      },
      exitCode: 1,
      invariant:
        "Production preflight output must use one bounded safe repository-relative detail path.",
      journeyId: "BND-J09-deployment-promotion-readback",
      limitation:
        "No snapshot or provider state was evaluated because the local detail-artifact boundary was unavailable.",
      nonClaim:
        "An inconclusive configuration receipt is never mutation authority or Production proof.",
      observedAt,
      postcondition:
        "No staged preflight or external claim was established and no mutation is permitted.",
      recoveryHint:
        "Set a bounded safe repository-relative detail path, rerun locally, and do not infer provider state.",
      rejected: [],
      schemaVersion: 1,
      stage: "unresolved",
      status: "inconclusive",
      target: "bundjil-agent+codex-proxy:production",
    });
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(ProductionPreflightReceipt)
    )(fallback);
    yield* Console.error(output);
    return yield* Effect.sync(() => {
      process.exitCode = 1;
    });
  }
  const outputDetailPath = outputDetailPathExit.value;
  const exit = yield* Effect.exit(evaluate);
  const failure = Exit.isFailure(exit)
    ? Cause.findErrorOption(exit.cause)
    : Option.none();
  const preflightFailure = Option.filter((value: unknown) =>
    Schema.is(ProductionPreflightError)(value)
  )(failure);
  const candidateCommit = Exit.isSuccess(exit)
    ? exit.value.snapshot.source.pushedSha
    : "unresolved";
  const evidence = Exit.isSuccess(exit) ? exit.value.evidence : null;
  const failureCode = Option.match(preflightFailure, {
    onNone: () => (Exit.isFailure(exit) ? ("snapshot-invalid" as const) : null),
    onSome: (error) => error.failureCode,
  });
  const detail = ProductionPreflightDetail.make({
    candidateCommit,
    evidence,
    failureCode,
    observedAt,
    schemaVersion: 1,
    target: "bundjil-agent+codex-proxy:production",
  });
  const encodedDetail = yield* Schema.encodeEffect(
    Schema.fromJsonString(ProductionPreflightDetail)
  )(detail);
  const detailDigest = sha256(encodedDetail);
  const fileSystem = yield* FileSystem.FileSystem;
  const persisted = yield* fileSystem
    .makeDirectory(dirname(outputDetailPath), { mode: 0o700, recursive: true })
    .pipe(
      Effect.andThen(
        fileSystem.writeFileString(outputDetailPath, encodedDetail, {
          mode: 0o600,
        })
      ),
      Effect.andThen(fileSystem.chmod(outputDetailPath, 0o600)),
      Effect.andThen(fileSystem.readFileString(outputDetailPath)),
      Effect.map((readback) => sha256(readback) === detailDigest),
      Effect.catch(() => Effect.succeed(false))
    );

  const programSucceeded = Exit.isSuccess(exit);
  const semanticPass = programSucceeded && exit.value.evidence.go;
  const status = Match.value({
    persisted,
    programSucceeded,
    semanticPass,
  }).pipe(
    Match.when({ persisted: false }, () => "inconclusive" as const),
    Match.when({ semanticPass: true }, () => "passed" as const),
    Match.when({ programSucceeded: true }, () => "blocked" as const),
    Match.orElse(() => "inconclusive" as const)
  );
  const classification = Match.value(status).pipe(
    Match.when("passed", () => "passed" as const),
    Match.when("blocked", () => "staged-invariant-rejected" as const),
    Match.when("inconclusive", () => {
      if (!persisted) {
        return "detail-artifact-unavailable" as const;
      }
      return failureCode ?? "snapshot-invalid";
    }),
    Match.exhaustive
  );
  const exitCode = Match.value(status).pipe(
    Match.when("passed", () => 0 as const),
    Match.when("blocked", () => 2 as const),
    Match.when("inconclusive", () => 1 as const),
    Match.exhaustive
  );
  const postcondition = Match.value(status).pipe(
    Match.when(
      "passed",
      () =>
        "The supplied snapshot passed the local staged preflight; every external claim remains separately unproved."
    ),
    Match.when(
      "blocked",
      () =>
        "The supplied snapshot violated one or more staged preflight invariants and no mutation is permitted."
    ),
    Match.when(
      "inconclusive",
      () =>
        "The preflight or its integrity-checked detail artifact was unavailable, so the result is inconclusive and no mutation is permitted."
    ),
    Match.exhaustive
  );
  const receipt = ProductionPreflightReceipt.make({
    candidateCommit,
    classification,
    command: "production-preflight",
    detailArtifact: {
      path: outputDetailPath,
      sha256: persisted ? detailDigest : null,
      state: persisted ? "available" : "unavailable",
    },
    exitCode,
    invariant:
      "Production promotion requires a validated staged metadata snapshot whose runtime bindings, accepted source, and rollback identities are internally coherent.",
    journeyId: "BND-J09-deployment-promotion-readback",
    limitation:
      "This command validates a supplied metadata snapshot only; it neither reads Vercel nor proves approval, deployment, live traffic, provider behavior, or Production health.",
    nonClaim:
      "A passed preflight is observed input validation, never mutation authority or Production proof.",
    observedAt,
    postcondition,
    recoveryHint:
      status === "passed"
        ? "Attach current target-owned readback and a separate authority receipt before following the deployment runbook."
        : "Correct the named snapshot/configuration or detail-artifact boundary, rerun locally, and do not infer provider state.",
    rejected: Exit.isSuccess(exit) ? exit.value.evidence.rejected : [],
    schemaVersion: 1,
    stage: Exit.isSuccess(exit) ? exit.value.evidence.stage : "unresolved",
    status,
    target: "bundjil-agent+codex-proxy:production",
  });
  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(ProductionPreflightReceipt)
  )(receipt);

  if (status === "passed") {
    return yield* Console.log(output);
  }

  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = exitCode;
  });
}).pipe(
  Effect.provide(
    Layer.merge(
      BunFileSystem.layer,
      ConfigProvider.layer(ConfigProvider.fromEnv())
    )
  )
);

await Effect.runPromise(main);

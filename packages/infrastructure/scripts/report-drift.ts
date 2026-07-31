import { createHash } from "node:crypto";
import { dirname } from "node:path";
// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- The pinned Alchemy Stack and Sync APIs expose upstream any/unknown channels.
/** @effect-diagnostics anyUnknownInErrorContext:off, missingEffectContext:off */

import { Ajv2020 } from "ajv/dist/2020.js";
import { AlchemyContextLive } from "alchemy/AlchemyContext";
import { ArtifactStore, createArtifactStore } from "alchemy/Artifacts";
import { selectCli } from "alchemy/Cli/selectCli";
import * as AlchemyPlan from "alchemy/Plan";
import * as AlchemyStack from "alchemy/Stack";
import * as AlchemySync from "alchemy/Sync";
import { PlatformServices } from "alchemy/Util/PlatformServices";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  FileSystem,
  Layer,
  Match,
  Record,
  Schema,
} from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import boundedReceiptSchema from "../../../.agents/skills/docs-maintainer/assets/harness/bounded-receipt.schema.json" with { type: "json" };
import { makeStableInfrastructureStack } from "../../../alchemy.stable.run.js";
import driftAuthorityPolicy from "../schemas/drift-report-authority.schema.json" with { type: "json" };
import {
  buildInfrastructureDriftReceipt,
  buildInfrastructureDriftReport,
  InfrastructureArtifactDigest,
  InfrastructureBoundedReceiptJson,
  InfrastructureDriftArtifactPath,
  InfrastructureDriftObservation,
  InfrastructureDriftReportInput,
  InfrastructureDriftReportJson,
  InfrastructureDriftResourceFingerprint,
  InfrastructureDriftSourceSha,
  InfrastructureStage,
  layerAlchemyR2State,
  loadAdoptionCommand,
  validateStableAdoptionCommand,
} from "../src/index.js";
import type {
  AdoptionManifest,
  InfrastructureDriftReport as InfrastructureDriftReportType,
} from "../src/index.js";
import { InfrastructureOwnershipState } from "../src/schemas.js";
import { SecretOwnership } from "../src/secret-reference.js";

declare const process: {
  exitCode: number | undefined;
};

const NativeSyncAction = Schema.Literals([
  "unchanged",
  "drifted",
  "missing",
  "skipped",
]);
const NativeSyncResource = Schema.Struct({
  action: NativeSyncAction,
  attr: Schema.optional(Schema.Unknown),
  fqn: Schema.NonEmptyString,
  logicalId: Schema.NonEmptyString,
  reason: Schema.optional(Schema.NonEmptyString),
  resourceType: Schema.NonEmptyString,
});
const NativeSyncResult = Schema.Struct({
  resources: Schema.Record(Schema.String, NativeSyncResource),
});
const NativeDesiredPlanResource = Schema.Struct({
  action: Schema.Literals(["create", "update", "replace", "noop"]),
  resource: Schema.Struct({
    LogicalId: Schema.NonEmptyString,
  }),
});
const NativeDesiredPlanDeletion = Schema.Struct({
  action: Schema.Literal("delete"),
  resource: Schema.Struct({
    LogicalId: Schema.NonEmptyString,
  }),
});
const NativeDesiredPlan = Schema.Struct({
  deletions: Schema.Record(Schema.String, NativeDesiredPlanDeletion),
  resources: Schema.Record(Schema.String, NativeDesiredPlanResource),
});
const DriftAttributeProjection = Schema.Struct({
  ownership: Schema.optional(InfrastructureOwnershipState),
  valueOwnership: Schema.optional(SecretOwnership),
});

const authorityPathConfig = Config.schema(
  InfrastructureDriftArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_DRIFT_AUTHORITY_PATH"
);
const reportPathConfig = Config.schema(
  InfrastructureDriftArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_DRIFT_REPORT_PATH"
);
const receiptPathConfig = Config.schema(
  InfrastructureDriftArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_DRIFT_RECEIPT_PATH"
);
const sourceShaConfig = Config.schema(
  InfrastructureDriftSourceSha,
  "BUNDJIL_INFRASTRUCTURE_DRIFT_SOURCE_SHA"
);
const acceptUnownedConfig = Config.schema(
  Schema.Boolean,
  "BUNDJIL_INFRASTRUCTURE_DRIFT_ACCEPT_UNOWNED"
).pipe(Config.withDefault(false));
const stageConfig = Config.schema(
  InfrastructureStage,
  "BUNDJIL_INFRASTRUCTURE_DRIFT_STAGE"
);

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const readAuthority = Effect.fn("InfrastructureDriftAuthority.read")(function* (
  path: typeof InfrastructureDriftArtifactPath.Type
) {
  const fileSystem = yield* FileSystem.FileSystem;
  const metadata = yield* fileSystem.stat(path);
  if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 64n * 1024n) {
    return yield* Effect.fail("authority-file-invalid");
  }
  const text = yield* fileSystem.readFileString(path);
  const decoded = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(Schema.Unknown)
  )(text);
  const validateEnvelope = new Ajv2020({
    allErrors: true,
    strict: false,
  }).compile(authorityEnvelopeSchema);
  const validatePolicy = new Ajv2020({
    allErrors: true,
    strict: false,
  }).compile(driftAuthorityPolicy);
  if (!validateEnvelope(decoded) || !validatePolicy(decoded)) {
    return yield* Effect.fail("authority-invalid");
  }
  return InfrastructureDriftResourceFingerprint.make(sha256(text));
});

const toObservation = Effect.fn("InfrastructureDriftObservation.decode")(
  function* (
    manifest: AdoptionManifest,
    acceptUnowned: boolean,
    stage: typeof InfrastructureStage.Type,
    resource: typeof NativeSyncResource.Type
  ) {
    const manifestResource = manifest.resources.find(
      (candidate) => candidate.logicalId === resource.logicalId
    );
    if (manifestResource === undefined) {
      return yield* Effect.fail("manifest-resource-missing");
    }
    const projection =
      resource.attr === undefined
        ? undefined
        : yield* Schema.decodeUnknownEffect(DriftAttributeProjection)(
            resource.attr
          );
    const ownership = projection?.ownership ?? "Unknown";
    const secretRevision = Match.value({
      resourceKind: manifestResource.resourceKind,
      valueOwnership: projection?.valueOwnership,
    }).pipe(
      Match.when(
        ({ resourceKind }) => resourceKind !== "vercelEnvironmentVariable",
        () => "notApplicable" as const
      ),
      Match.when(
        ({ valueOwnership }) => valueOwnership?._tag === "ObservedUnknown",
        () => "unknown" as const
      ),
      Match.orElse(() => "known" as const)
    );
    return InfrastructureDriftObservation.make({
      action: resource.action,
      attempts: { _tag: "NotExposed" },
      baselineDisposition:
        ownership === "Unowned" && acceptUnowned ? "accepted" : "rejected",
      certainty: { _tag: "Known" },
      diffClass: Match.value(resource.action).pipe(
        Match.when("drifted", () => "update" as const),
        Match.when("unchanged", () => "no_op" as const),
        Match.orElse(() => "unknown" as const)
      ),
      duration: { _tag: "NotExposed" },
      ownership,
      providerRead: resource.action === "skipped" ? "skipped" : "performed",
      readback: "available",
      resourceFingerprint: InfrastructureDriftResourceFingerprint.make(
        sha256(resource.fqn)
      ),
      resourceKind: manifestResource.resourceKind,
      retry: "backoff",
      secretRevision,
      source: "nativeSync",
      stage,
    });
  }
);

const toPlanObservation = Effect.fn(
  "InfrastructureDesiredPlanObservation.decode"
)(function* (
  manifest: AdoptionManifest,
  stage: typeof InfrastructureStage.Type,
  fqn: string,
  logicalId: string,
  action: "create" | "update" | "replace" | "delete"
) {
  const manifestResource = manifest.resources.find(
    (candidate) => candidate.logicalId === logicalId
  );
  if (manifestResource === undefined) {
    return yield* Effect.fail("manifest-resource-missing");
  }
  return InfrastructureDriftObservation.make({
    action: action === "create" ? "missing" : "drifted",
    attempts: { _tag: "Observed", count: 0 },
    baselineDisposition: "rejected",
    certainty: { _tag: "Known" },
    diffClass: Match.value(action).pipe(
      Match.when("update", () => "update" as const),
      Match.when(
        (value) => value === "replace" || value === "delete",
        () => "replace" as const
      ),
      Match.orElse(() => "unknown" as const)
    ),
    duration: { _tag: "NotExposed" },
    ownership: "Unknown",
    providerRead: "performed",
    readback: "available",
    resourceFingerprint: InfrastructureDriftResourceFingerprint.make(
      sha256(fqn)
    ),
    resourceKind: manifestResource.resourceKind,
    retry: "never",
    secretRevision: "notApplicable",
    source: "desiredPlan",
    stage,
  });
});

const runNativeSync = Effect.fn("InfrastructureDriftNativeSync.run")(function* (
  manifest: AdoptionManifest,
  acceptUnowned: boolean,
  stage: typeof InfrastructureStage.Type
) {
  return yield* AlchemyStack.evalStack(
    makeStableInfrastructureStack(manifest),
    (stack) =>
      Effect.gen(function* () {
        const desiredPlan = yield* AlchemyPlan.make(stack);
        const desired =
          yield* Schema.decodeUnknownEffect(NativeDesiredPlan)(desiredPlan);
        const desiredResources = Object.entries(desired.resources);
        const desiredDeletions = Object.entries(desired.deletions);
        const planObservations = yield* Effect.forEach(
          [
            ...desiredResources.flatMap(([fqn, resource]) =>
              resource.action === "noop"
                ? []
                : [
                    {
                      action: resource.action,
                      fqn,
                      logicalId: resource.resource.LogicalId,
                    } as const,
                  ]
            ),
            ...desiredDeletions.map(([fqn, resource]) => ({
              action: resource.action,
              fqn,
              logicalId: resource.resource.LogicalId,
            })),
          ],
          ({ action, fqn, logicalId }) =>
            toPlanObservation(manifest, stage, fqn, logicalId, action),
          { concurrency: 1 }
        );
        const native = yield* AlchemySync.plan({
          name: stack.name,
          stage: stack.stage,
        });
        const decoded = yield* Schema.decodeUnknownEffect(NativeSyncResult)(
          native.result,
          { onExcessProperty: "error" }
        );
        const syncObservations = yield* Effect.forEach(
          Record.values(decoded.resources),
          (resource) => toObservation(manifest, acceptUnowned, stage, resource),
          { concurrency: 1 }
        );
        return {
          desiredPlan: {
            _tag: "Observed" as const,
            create: desiredResources.filter(
              ([, resource]) => resource.action === "create"
            ).length,
            delete: desiredDeletions.length,
            noOp: desiredResources.filter(
              ([, resource]) => resource.action === "noop"
            ).length,
            replace: desiredResources.filter(
              ([, resource]) => resource.action === "replace"
            ).length,
            update: desiredResources.filter(
              ([, resource]) => resource.action === "update"
            ).length,
          },
          observations: [...planObservations, ...syncObservations],
        };
      }),
    { stage }
  );
});

const persistReport = Effect.fn("InfrastructureDriftReport.persist")(function* (
  authorityPath: typeof InfrastructureDriftArtifactPath.Type,
  reportPath: typeof InfrastructureDriftArtifactPath.Type,
  receiptPath: typeof InfrastructureDriftArtifactPath.Type,
  report: InfrastructureDriftReportType
) {
  const driftJson = yield* Schema.encodeEffect(InfrastructureDriftReportJson)(
    report
  );
  const digest = InfrastructureArtifactDigest.make(sha256(driftJson));
  const receipt = yield* buildInfrastructureDriftReceipt({
    authorityReceipt: authorityPath,
    detailDigest: digest,
    report,
    reportPath,
  });
  const receiptJson = yield* Schema.encodeEffect(
    InfrastructureBoundedReceiptJson
  )(receipt);
  const receiptEncoded = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(Schema.Unknown)
  )(receiptJson);
  const validateReceipt = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
  }).compile(boundedReceiptSchema);
  if (!validateReceipt(receiptEncoded)) {
    return yield* Effect.fail("receipt-incompatible");
  }
  const fileSystem = yield* FileSystem.FileSystem;
  yield* fileSystem.makeDirectory(dirname(reportPath), {
    recursive: true,
    mode: 0o700,
  });
  yield* fileSystem.writeFileString(reportPath, driftJson, { mode: 0o600 });
  yield* fileSystem.chmod(reportPath, 0o600);
  yield* fileSystem.makeDirectory(dirname(receiptPath), {
    recursive: true,
    mode: 0o700,
  });
  yield* fileSystem.writeFileString(receiptPath, receiptJson, {
    mode: 0o600,
  });
  yield* fileSystem.chmod(receiptPath, 0o600);
  return {
    counts: report.counts,
    receiptPath,
    reportPath,
    stage: report.stage,
    status: report.status,
  };
});

const program = Effect.gen(function* () {
  const startedAt = Date.now();
  const stage = yield* stageConfig;
  if (stage !== "preview") {
    return yield* Effect.fail("production-target-rejected");
  }
  const authorityPath = yield* authorityPathConfig;
  const reportPath = yield* reportPathConfig;
  const receiptPath = yield* receiptPathConfig;
  const sourceSha = yield* sourceShaConfig;
  const acceptUnowned = yield* acceptUnownedConfig;
  const authorityFingerprint = yield* readAuthority(authorityPath);
  const command = yield* loadAdoptionCommand;
  const manifest = yield* validateStableAdoptionCommand(command);
  const native = yield* runNativeSync(manifest, acceptUnowned, stage).pipe(
    Effect.catch(() =>
      Effect.succeed({
        desiredPlan: { _tag: "NotExposed" as const },
        observations: [
          InfrastructureDriftObservation.make({
            action: "unavailable",
            attempts: { _tag: "NotExposed" },
            baselineDisposition: "rejected",
            certainty: {
              _tag: "Uncertain",
              recovery: "operatorReview",
            },
            diffClass: "unknown",
            duration: { _tag: "NotExposed" },
            ownership: "Unknown",
            providerRead: "performed",
            readback: "unavailable",
            resourceFingerprint: InfrastructureDriftResourceFingerprint.make(
              sha256("alchemy:BundjilInfrastructure:preview")
            ),
            resourceKind: "infrastructureStack",
            retry: "never",
            secretRevision: "notApplicable",
            source: "nativeSync",
            stage,
          }),
        ],
      })
    )
  );
  const { observations } = native;
  const report = yield* buildInfrastructureDriftReport(
    InfrastructureDriftReportInput.make({
      authorityFingerprint,
      desiredPlan: native.desiredPlan,
      observations,
      observedAt: new Date().toISOString(),
      runDurationMilliseconds: Date.now() - startedAt,
      sourceSha,
      stage,
    })
  );
  const summary = yield* persistReport(
    authorityPath,
    reportPath,
    receiptPath,
    report
  );
  if (summary.status === "failed") {
    process.exitCode = 1;
  }
  if (summary.status === "inconclusive") {
    process.exitCode = 2;
  }
  return summary;
});

const main = program.pipe(
  Effect.flatMap(Console.log),
  /* oxlint-disable-next-line eslint-plugin-promise/prefer-await-to-then, eslint-plugin-promise/prefer-await-to-callbacks -- Effect.catch handles the typed Effect error channel, not a Promise callback. */
  Effect.catch(() =>
    Console.error({
      reason: "drift-report-boundary-failed" as const,
      status: "blocked" as const,
    }).pipe(
      Effect.andThen(
        Effect.sync(() => {
          process.exitCode = 2;
        })
      )
    )
  ),
  Effect.provide(
    Layer.mergeAll(
      PlatformServices,
      FetchHttpClient.layer,
      Layer.provideMerge(AlchemyContextLive, PlatformServices),
      Layer.succeed(ArtifactStore, createArtifactStore()),
      selectCli(),
      layerAlchemyR2State,
      ConfigProvider.layer(ConfigProvider.fromEnv())
    )
  )
);

await Effect.runPromise(main);

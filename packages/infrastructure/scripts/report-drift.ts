import { createHash } from "node:crypto";
import { dirname } from "node:path";
/* oxlint-disable max-classes-per-file -- Native Alchemy failures and operator command failures are distinct local boundaries. */
// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- The pinned Alchemy Stack and Sync APIs expose upstream any/unknown channels.
/** @effect-diagnostics anyUnknownInErrorContext:off, missingEffectContext:off */

import { Ajv2020 } from "ajv/dist/2020.js";
import { AlchemyContextLive } from "alchemy/AlchemyContext";
import { ArtifactStore, createArtifactStore } from "alchemy/Artifacts";
import { selectCli } from "alchemy/Cli/selectCli";
import * as AlchemyPlan from "alchemy/Plan";
import * as AlchemyStack from "alchemy/Stack";
import { State } from "alchemy/State";
import * as AlchemySync from "alchemy/Sync";
import { PlatformServices } from "alchemy/Util/PlatformServices";
import {
  Cause,
  Config,
  ConfigProvider,
  Console,
  DateTime,
  Effect,
  FileSystem,
  Layer,
  Match,
  Option,
  Record,
  Schema,
} from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import boundedReceiptSchema from "../../../.agents/skills/docs-maintainer/assets/harness/bounded-receipt.schema.json" with { type: "json" };
import { makeStableInfrastructureDriftStack } from "../../../alchemy.stable.run.js";
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
  InfrastructureDriftRunIdentity,
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
    Type: Schema.NonEmptyString,
  }),
});
const NativeDesiredPlanDeletion = Schema.Struct({
  action: Schema.Literal("delete"),
  resource: Schema.Struct({
    LogicalId: Schema.NonEmptyString,
    RemovalPolicy: Schema.optional(Schema.Literals(["destroy", "retain"])),
    Type: Schema.NonEmptyString,
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
const InfrastructureDriftNativePhase = Schema.Literals([
  "desiredPlan",
  "desiredPlanDecode",
  "desiredPlanObservation",
  "nativeSync",
  "nativeSyncDecode",
  "nativeSyncObservation",
]);
const InfrastructureDriftNativeProviderFailure = Schema.Literals([
  "PhotonBillingReadError",
  "PhotonLinesReadError",
  "PhotonPlatformsReadError",
  "PhotonProjectsReadError",
  "PhotonSharedUsersReadError",
  "PhotonWebhooksReadError",
  "VercelDeploymentsReadError",
  "VercelDomainsReadError",
  "VercelEnvironmentVariablesReadError",
  "VercelMarketplaceBindingsReadError",
  "VercelProjectsReadError",
  "not-classified",
]);
const InfrastructureDriftNativeProviderFailureReason = Schema.Literals([
  "ambiguous",
  "conflict",
  "invalidResponse",
  "not-classified",
  "notFound",
  "rateLimited",
  "requestFailed",
  "teamMismatch",
  "transient",
  "unavailable",
  "writeForbidden",
]);
const InfrastructureDriftNativeProviderFailureError = Schema.Struct({
  _tag: InfrastructureDriftNativeProviderFailure,
  reason: InfrastructureDriftNativeProviderFailureReason,
});
type InfrastructureDriftNativeProviderFailureError =
  typeof InfrastructureDriftNativeProviderFailureError.Type;
class InfrastructureDriftNativeBoundaryError extends Schema.TaggedErrorClass<InfrastructureDriftNativeBoundaryError>()(
  "InfrastructureDriftNativeBoundaryError",
  {
    phase: InfrastructureDriftNativePhase,
    providerFailure: Schema.optional(InfrastructureDriftNativeProviderFailure),
    providerFailureReason: Schema.optional(
      InfrastructureDriftNativeProviderFailureReason
    ),
  }
) {}
const InfrastructureDriftCommandFailureReason = Schema.Literals([
  "authorityFileInvalid",
  "authorityInvalid",
  "productionTargetRejected",
  "receiptIncompatible",
]);
class InfrastructureDriftCommandError extends Schema.TaggedErrorClass<InfrastructureDriftCommandError>()(
  "InfrastructureDriftCommandError",
  { reason: InfrastructureDriftCommandFailureReason }
) {}
const InfrastructureDriftBoundaryFailureReason = Schema.Literals([
  "authorityArtifactInvalid",
  "configurationInvalid",
  "manifestArtifactInvalid",
  "reportConstructionInvalid",
  "receiptPersistenceFailed",
  "runtimeInitializationFailed",
  "stateConfigurationInvalid",
  "stateInitializationFailed",
]);
class InfrastructureDriftBoundaryError extends Schema.TaggedErrorClass<InfrastructureDriftBoundaryError>()(
  "InfrastructureDriftBoundaryError",
  { reason: InfrastructureDriftBoundaryFailureReason }
) {}

const resourceKindFromNativeType = (resourceType: string) =>
  Match.value(resourceType).pipe(
    Match.when(
      "Bundjil.Infrastructure.SyntheticResource",
      () => "syntheticResource" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.VercelProject",
      () => "vercelProject" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.VercelProjectDomain",
      () => "vercelDomain" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.VercelEnvironmentVariable",
      () => "vercelEnvironmentVariable" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.VercelMarketplaceBinding",
      () => "vercelMarketplaceBinding" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.VercelDeploymentObservation",
      () => "vercelDeploymentObservation" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.PhotonProjectObservation",
      () => "photonProjectObservation" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.PhotonPlatformConfiguration",
      () => "photonPlatformConfiguration" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.PhotonSharedUser",
      () => "photonSharedUser" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.PhotonWebhookObservation",
      () => "photonWebhookObservation" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.PhotonLineObservation",
      () => "photonLineObservation" as const
    ),
    Match.when(
      "Bundjil.Infrastructure.PhotonBillingObservation",
      () => "photonBillingObservation" as const
    ),
    Match.orElse(() => "infrastructureStack" as const)
  );

const classifyNativeProviderFailure = (cause: Cause.Cause<unknown>) =>
  Option.match(
    Option.filter(
      Cause.findErrorOption(cause),
      Schema.is(InfrastructureDriftNativeProviderFailureError)
    ),
    {
      onNone: () => ({
        providerFailure: "not-classified" as const,
        providerFailureReason: "not-classified" as const,
      }),
      onSome: (error: InfrastructureDriftNativeProviderFailureError) => ({
        providerFailure: error._tag,
        providerFailureReason: error.reason,
      }),
    }
  );

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
const runIdentityConfig = Config.schema(
  InfrastructureDriftRunIdentity,
  "BUNDJIL_INFRASTRUCTURE_DRIFT_RUN_IDENTITY"
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

const unavailableNativeResult = (stage: typeof InfrastructureStage.Type) => ({
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
});

const readAuthority = Effect.fn("InfrastructureDriftAuthority.read")(function* (
  path: typeof InfrastructureDriftArtifactPath.Type
) {
  const fileSystem = yield* FileSystem.FileSystem;
  const metadata = yield* fileSystem.stat(path);
  if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 64n * 1024n) {
    return yield* new InfrastructureDriftCommandError({
      reason: "authorityFileInvalid",
    });
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
    return yield* new InfrastructureDriftCommandError({
      reason: "authorityInvalid",
    });
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
    const resourceKind =
      manifestResource?.resourceKind ?? "infrastructureStack";
    const projection =
      resource.attr === undefined ||
      resourceKind !== "vercelEnvironmentVariable"
        ? undefined
        : yield* Schema.decodeUnknownEffect(DriftAttributeProjection)(
            resource.attr
          );
    const ownership = projection?.ownership ?? "Unknown";
    const secretRevision = Match.value({
      resourceKind,
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
      resourceKind,
      retry: "backoff",
      secretRevision,
      source: "nativeSync",
      stage,
    });
  }
);

const toPlanObservation = Effect.fn(
  "InfrastructureDesiredPlanObservation.decode"
)(function (
  manifest: AdoptionManifest,
  stage: typeof InfrastructureStage.Type,
  fqn: string,
  logicalId: string,
  resourceType: string,
  action: "create" | "update" | "replace" | "delete",
  removalPolicy: "destroy" | "retain" | undefined
) {
  const manifestResource = manifest.resources.find(
    (candidate) => candidate.logicalId === logicalId
  );
  return Effect.succeed(
    InfrastructureDriftObservation.make({
      action: action === "create" ? "missing" : "drifted",
      attempts: { _tag: "Observed", count: 0 },
      baselineDisposition: "rejected",
      certainty: { _tag: "Known" },
      diffClass: Match.value(action).pipe(
        Match.when("update", () => "update" as const),
        Match.when(
          (value) =>
            value === "replace" ||
            (value === "delete" && removalPolicy !== "retain"),
          () => "replace" as const
        ),
        Match.when("delete", () => "update" as const),
        Match.orElse(() => "unknown" as const)
      ),
      duration: { _tag: "NotExposed" },
      ownership: "Unknown",
      providerRead: "performed",
      readback: "available",
      resourceFingerprint: InfrastructureDriftResourceFingerprint.make(
        sha256(fqn)
      ),
      resourceKind:
        manifestResource?.resourceKind ??
        resourceKindFromNativeType(resourceType),
      retry: "never",
      secretRevision: "notApplicable",
      source: "desiredPlan",
      stage,
    })
  );
});

const runNativeSync = Effect.fn("InfrastructureDriftNativeSync.run")(function* (
  manifest: AdoptionManifest,
  acceptUnowned: boolean,
  stage: typeof InfrastructureStage.Type
) {
  return yield* AlchemyStack.evalStack(
    makeStableInfrastructureDriftStack(manifest),
    (stack) =>
      Effect.gen(function* () {
        const desiredPlan = yield* AlchemyPlan.make(stack).pipe(
          Effect.catchCause(() =>
            Effect.fail(
              new InfrastructureDriftNativeBoundaryError({
                phase: "desiredPlan",
              })
            )
          )
        );
        const desired = yield* Schema.decodeUnknownEffect(NativeDesiredPlan)(
          desiredPlan
        ).pipe(
          Effect.catchCause(() =>
            Effect.fail(
              new InfrastructureDriftNativeBoundaryError({
                phase: "desiredPlanDecode",
              })
            )
          )
        );
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
                      removalPolicy: undefined,
                      resourceType: resource.resource.Type,
                    } as const,
                  ]
            ),
            ...desiredDeletions.map(([fqn, resource]) => ({
              action: resource.action,
              fqn,
              logicalId: resource.resource.LogicalId,
              removalPolicy: resource.resource.RemovalPolicy,
              resourceType: resource.resource.Type,
            })),
          ],
          ({ action, fqn, logicalId, removalPolicy, resourceType }) =>
            toPlanObservation(
              manifest,
              stage,
              fqn,
              logicalId,
              resourceType,
              action,
              removalPolicy
            ),
          { concurrency: 1 }
        ).pipe(
          Effect.catchCause(() =>
            Effect.fail(
              new InfrastructureDriftNativeBoundaryError({
                phase: "desiredPlanObservation",
              })
            )
          )
        );
        const native = yield* AlchemySync.plan({
          name: stack.name,
          stage: stack.stage,
        }).pipe(
          Effect.catchCause((cause) => {
            const { providerFailure, providerFailureReason } =
              classifyNativeProviderFailure(cause);
            return Effect.fail(
              new InfrastructureDriftNativeBoundaryError({
                phase: "nativeSync",
                providerFailure,
                providerFailureReason,
              })
            );
          })
        );
        const decoded = yield* Schema.decodeUnknownEffect(NativeSyncResult)(
          native.result,
          { onExcessProperty: "error" }
        ).pipe(
          Effect.catchCause(() =>
            Effect.fail(
              new InfrastructureDriftNativeBoundaryError({
                phase: "nativeSyncDecode",
              })
            )
          )
        );
        const syncObservations = yield* Effect.forEach(
          Record.values(decoded.resources),
          (resource) => toObservation(manifest, acceptUnowned, stage, resource),
          { concurrency: 1 }
        ).pipe(
          Effect.catchCause(() =>
            Effect.fail(
              new InfrastructureDriftNativeBoundaryError({
                phase: "nativeSyncObservation",
              })
            )
          )
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
    return yield* new InfrastructureDriftCommandError({
      reason: "receiptIncompatible",
    });
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
  const startedAt = yield* DateTime.now;
  const stage = yield* stageConfig.pipe(
    Effect.mapError(
      () =>
        new InfrastructureDriftBoundaryError({
          reason: "configurationInvalid",
        })
    )
  );
  if (stage !== "preview") {
    return yield* new InfrastructureDriftCommandError({
      reason: "productionTargetRejected",
    });
  }
  const configuration = yield* Effect.gen(function* () {
    const authorityPath = yield* authorityPathConfig;
    const reportPath = yield* reportPathConfig;
    const receiptPath = yield* receiptPathConfig;
    const sourceSha = yield* sourceShaConfig;
    const runIdentity = yield* runIdentityConfig;
    const acceptUnowned = yield* acceptUnownedConfig;
    return {
      acceptUnowned,
      authorityPath,
      receiptPath,
      reportPath,
      runIdentity,
      sourceSha,
    };
  }).pipe(
    Effect.mapError(
      () =>
        new InfrastructureDriftBoundaryError({
          reason: "configurationInvalid",
        })
    )
  );
  const {
    acceptUnowned,
    authorityPath,
    receiptPath,
    reportPath,
    runIdentity,
    sourceSha,
  } = configuration;
  const authorityFingerprint = yield* readAuthority(authorityPath).pipe(
    Effect.mapError(
      () =>
        new InfrastructureDriftBoundaryError({
          reason: "authorityArtifactInvalid",
        })
    )
  );
  const { command, manifest } = yield* Effect.gen(function* () {
    const command = yield* loadAdoptionCommand;
    const manifest = yield* validateStableAdoptionCommand(command);
    return { command, manifest };
  }).pipe(
    Effect.mapError(
      () =>
        new InfrastructureDriftBoundaryError({
          reason: "manifestArtifactInvalid",
        })
    )
  );
  const native = yield* runNativeSync(manifest, acceptUnowned, stage).pipe(
    Effect.catchTag(
      "InfrastructureDriftNativeBoundaryError",
      ({ phase, providerFailure, providerFailureReason }) =>
        Console.error({
          phase,
          providerFailure: providerFailure ?? "not-classified",
          providerFailureReason: providerFailureReason ?? "not-classified",
          reason: "native-drift-readback-failed" as const,
        }).pipe(Effect.as(unavailableNativeResult(stage)))
    ),
    Effect.catch(() => Effect.succeed(unavailableNativeResult(stage)))
  );
  const { observations } = native;
  const observedAt = yield* DateTime.now;
  const report = yield* buildInfrastructureDriftReport(
    InfrastructureDriftReportInput.make({
      authorityFingerprint,
      desiredPlan: native.desiredPlan,
      manifestDigest: command.manifest.digest,
      observations,
      observedAt: DateTime.formatIso(observedAt),
      runDurationMilliseconds:
        DateTime.toEpochMillis(observedAt) - DateTime.toEpochMillis(startedAt),
      runIdentity,
      sourceSha,
      stage,
    })
  ).pipe(
    Effect.mapError(
      () =>
        new InfrastructureDriftBoundaryError({
          reason: "reportConstructionInvalid",
        })
    )
  );
  const summary = yield* persistReport(
    authorityPath,
    reportPath,
    receiptPath,
    report
  ).pipe(
    Effect.mapError(
      () =>
        new InfrastructureDriftBoundaryError({
          reason: "receiptPersistenceFailed",
        })
    )
  );
  if (summary.status === "failed") {
    process.exitCode = 1;
  }
  if (summary.status === "inconclusive") {
    process.exitCode = 2;
  }
  return summary;
});

const driftStateLayer = layerAlchemyR2State.pipe(
  /* oxlint-disable-next-line eslint-plugin-promise/prefer-await-to-then, eslint-plugin-promise/prefer-await-to-callbacks -- Layer.catch recovers the typed Layer error channel, not a Promise callback. */
  Layer.catch(({ reason }) =>
    Layer.effect(
      State,
      new InfrastructureDriftBoundaryError({
        reason: Match.value(reason).pipe(
          Match.when(
            "configurationInvalid",
            () => "stateConfigurationInvalid" as const
          ),
          Match.when(
            "initializationFailed",
            () => "stateInitializationFailed" as const
          ),
          Match.exhaustive
        ),
      })
    )
  )
);

const runtime = Layer.mergeAll(
  PlatformServices,
  FetchHttpClient.layer,
  Layer.provideMerge(AlchemyContextLive, PlatformServices),
  Layer.succeed(ArtifactStore, createArtifactStore()),
  selectCli(),
  driftStateLayer,
  ConfigProvider.layer(ConfigProvider.fromEnv())
);

const main = program.pipe(
  Effect.provide(runtime),
  /* oxlint-disable-next-line eslint-plugin-promise/prefer-await-to-callbacks -- Effect maps the typed error channel, not a Promise callback. */
  Effect.mapError((error) =>
    Schema.is(InfrastructureDriftBoundaryError)(error) ||
    Schema.is(InfrastructureDriftCommandError)(error)
      ? error
      : new InfrastructureDriftBoundaryError({
          reason: "runtimeInitializationFailed",
        })
  ),
  Effect.flatMap(Console.log),
  Effect.catchTag("InfrastructureDriftBoundaryError", ({ reason }) =>
    Console.error({ reason, status: "blocked" as const }).pipe(
      Effect.andThen(
        Effect.sync(() => {
          process.exitCode = 2;
        })
      )
    )
  ),
  Effect.catchTag("InfrastructureDriftCommandError", ({ reason }) =>
    Console.error({ reason, status: "blocked" as const }).pipe(
      Effect.andThen(
        Effect.sync(() => {
          process.exitCode = 2;
        })
      )
    )
  )
);

await Effect.runPromise(main);

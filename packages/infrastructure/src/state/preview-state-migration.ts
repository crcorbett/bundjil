/* oxlint-disable max-classes-per-file, unicorn/no-array-method-this-argument -- The exact migration, backup capability and safe failure form one state-only boundary; Effect.forEach is not Array.prototype.forEach. */
import { createHash } from "node:crypto";
import { dirname, isAbsolute } from "node:path";

import { State } from "alchemy/State";
import {
  Context,
  Effect,
  FileSystem,
  HashSet,
  Layer,
  Match,
  Redacted,
  Schema,
} from "effect";

import type { AdoptionManifest } from "../adoption-manifest.js";
import {
  AdoptionManifestDigest,
  AlchemyLogicalResourceId,
  InfrastructureStage,
} from "../schemas.js";

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export const PreviewStateResourceFingerprint = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
  Schema.brand("@bundjil/infrastructure/state/PreviewStateResourceFingerprint")
);
export type PreviewStateResourceFingerprint =
  typeof PreviewStateResourceFingerprint.Type;
export type PreviewStateResourceFingerprintEncoded =
  typeof PreviewStateResourceFingerprint.Encoded;

export const PreviewStateBackupPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "Preview state backup path must be repository-relative and bounded."
    )
  ),
  Schema.brand("@bundjil/infrastructure/state/PreviewStateBackupPath")
);
export type PreviewStateBackupPath = typeof PreviewStateBackupPath.Type;
export type PreviewStateBackupPathEncoded =
  typeof PreviewStateBackupPath.Encoded;

export const PreviewStateResourceType = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/state/PreviewStateResourceType")
);
export type PreviewStateResourceType = typeof PreviewStateResourceType.Type;
export type PreviewStateResourceTypeEncoded =
  typeof PreviewStateResourceType.Encoded;

export const PreviewStateNamespaceId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/state/PreviewStateNamespaceId")
);
export type PreviewStateNamespaceId = typeof PreviewStateNamespaceId.Type;
export type PreviewStateNamespaceIdEncoded =
  typeof PreviewStateNamespaceId.Encoded;

export const PreviewStateFqn = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/state/PreviewStateFqn")
);
export type PreviewStateFqn = typeof PreviewStateFqn.Type;
export type PreviewStateFqnEncoded = typeof PreviewStateFqn.Encoded;

export const PreviewStateInstanceId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/state/PreviewStateInstanceId")
);
export type PreviewStateInstanceId = typeof PreviewStateInstanceId.Type;
export type PreviewStateInstanceIdEncoded =
  typeof PreviewStateInstanceId.Encoded;

export const PreviewStateMigrationErrorMessage = Schema.NonEmptyString.pipe(
  Schema.brand(
    "@bundjil/infrastructure/state/PreviewStateMigrationErrorMessage"
  )
);
export type PreviewStateMigrationErrorMessage =
  typeof PreviewStateMigrationErrorMessage.Type;
export type PreviewStateMigrationErrorMessageEncoded =
  typeof PreviewStateMigrationErrorMessage.Encoded;

export const PreviewStateMigrationCount = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0)),
  Schema.brand("@bundjil/infrastructure/state/PreviewStateMigrationCount")
);
export type PreviewStateMigrationCount = typeof PreviewStateMigrationCount.Type;
export type PreviewStateMigrationCountEncoded =
  typeof PreviewStateMigrationCount.Encoded;

export const PreviewStateMigrationFailureReason = Schema.Literals([
  "stateListFailed",
  "stateReadFailed",
  "stateRowMissing",
  "stateRowInvalid",
  "stageMismatch",
  "stateVersionUnavailable",
  "stateVersionMismatch",
  "currentCountMismatch",
  "desiredCountMismatch",
  "staleCountMismatch",
  "staleTypeMismatch",
  "staleFingerprintMismatch",
  "backupUnavailable",
  "backupEncodeFailed",
  "backupCredentialLeak",
  "backupWriteFailed",
  "backupReadFailed",
  "retirementFailed",
  "retirementReadbackMismatch",
  "retirementRecoveryMismatch",
  "restoreDeleteFailed",
  "restoreWriteFailed",
  "restoreComparisonFailed",
  "restoreMismatch",
]);
export type PreviewStateMigrationFailureReason =
  typeof PreviewStateMigrationFailureReason.Type;
export type PreviewStateMigrationFailureReasonEncoded =
  typeof PreviewStateMigrationFailureReason.Encoded;

export const PreviewStateForbiddenValue = Schema.Redacted(
  Schema.NonEmptyString.pipe(
    Schema.brand("@bundjil/infrastructure/state/PreviewStateForbiddenValue")
  )
);
export type PreviewStateForbiddenValue = typeof PreviewStateForbiddenValue.Type;
export type PreviewStateForbiddenValueEncoded =
  typeof PreviewStateForbiddenValue.Encoded;

const PreviewStateBinding = Schema.Struct({
  sid: Schema.String,
  data: Schema.Unknown,
});

const PreviewStateRecord = Schema.Record(Schema.String, Schema.Unknown);

const NonNegativeInt = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0))
);
const PositiveInt = Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0)));

export const PreviewStateBackupResource = Schema.Struct({
  kind: Schema.optional(Schema.Literal("resource")),
  resourceType: PreviewStateResourceType,
  namespace: Schema.optional(
    Schema.Struct({
      Id: PreviewStateNamespaceId,
    })
  ),
  fqn: PreviewStateFqn,
  logicalId: AlchemyLogicalResourceId,
  instanceId: PreviewStateInstanceId,
  providerVersion: Schema.Number,
  status: Schema.Literal("updated"),
  downstream: Schema.Array(Schema.String),
  bindings: Schema.Array(PreviewStateBinding),
  props: PreviewStateRecord,
  attr: PreviewStateRecord,
  removalPolicy: Schema.Literal("retain"),
});
export type PreviewStateBackupResource = typeof PreviewStateBackupResource.Type;
export type PreviewStateBackupResourceEncoded =
  typeof PreviewStateBackupResource.Encoded;

export const PreviewStateBackup = Schema.Struct({
  schemaVersion: Schema.Literal("1"),
  stack: Schema.Literal("BundjilInfrastructure"),
  stage: InfrastructureStage,
  stateVersion: Schema.Literal(5),
  manifestDigest: AdoptionManifestDigest,
  resources: Schema.Array(PreviewStateBackupResource),
});
export type PreviewStateBackup = typeof PreviewStateBackup.Type;
export type PreviewStateBackupEncoded = typeof PreviewStateBackup.Encoded;

export const PreviewStateMigrationResult = Schema.Struct({
  status: Schema.Literals(["planned", "retired", "restored"]),
  currentCount: NonNegativeInt,
  desiredCount: NonNegativeInt,
  staleCount: NonNegativeInt,
  retainedCount: NonNegativeInt,
  staleFingerprints: Schema.Array(PreviewStateResourceFingerprint),
  providerWrites: Schema.Literal(0),
});
export type PreviewStateMigrationResult =
  typeof PreviewStateMigrationResult.Type;
export type PreviewStateMigrationResultEncoded =
  typeof PreviewStateMigrationResult.Encoded;

export const PreviewStateMigrationPolicy = Schema.Struct({
  stage: InfrastructureStage,
  currentCount: PositiveInt,
  desiredCount: PositiveInt,
  staleFingerprints: Schema.NonEmptyArray(PreviewStateResourceFingerprint),
  staleResourceTypes: Schema.NonEmptyArray(PreviewStateResourceType),
});
export type PreviewStateMigrationPolicy =
  typeof PreviewStateMigrationPolicy.Type;
export type PreviewStateMigrationPolicyEncoded =
  typeof PreviewStateMigrationPolicy.Encoded;

export class PreviewStateMigrationError extends Schema.TaggedErrorClass<PreviewStateMigrationError>()(
  "PreviewStateMigrationError",
  {
    reason: PreviewStateMigrationFailureReason,
    message: PreviewStateMigrationErrorMessage,
    observedCount: Schema.optional(PreviewStateMigrationCount),
    expectedCount: Schema.optional(PreviewStateMigrationCount),
  }
) {}

const migrationError = (
  reason: PreviewStateMigrationFailureReason,
  message: string,
  counts?: {
    readonly observedCount: number;
    readonly expectedCount: number;
  }
) =>
  new PreviewStateMigrationError({
    reason,
    message: PreviewStateMigrationErrorMessage.make(message),
    ...(counts === undefined
      ? {}
      : {
          observedCount: PreviewStateMigrationCount.make(counts.observedCount),
          expectedCount: PreviewStateMigrationCount.make(counts.expectedCount),
        }),
  });

export class PreviewStateBackupStore extends Context.Service<
  PreviewStateBackupStore,
  {
    readonly save: (
      backup: PreviewStateBackup
    ) => Effect.Effect<void, PreviewStateMigrationError>;
    readonly load: Effect.Effect<
      PreviewStateBackup,
      PreviewStateMigrationError
    >;
  }
>()("@bundjil/infrastructure/state/PreviewStateBackupStore") {}

export class PreviewStateMigration extends Context.Service<
  PreviewStateMigration,
  {
    readonly plan: (
      manifest: AdoptionManifest
    ) => Effect.Effect<PreviewStateMigrationResult, PreviewStateMigrationError>;
    readonly retire: (
      manifest: AdoptionManifest
    ) => Effect.Effect<PreviewStateMigrationResult, PreviewStateMigrationError>;
    readonly restore: Effect.Effect<
      PreviewStateMigrationResult,
      PreviewStateMigrationError
    >;
  }
>()("@bundjil/infrastructure/state/PreviewStateMigration") {}

const CanonicalPreviewStateMigrationPolicy = PreviewStateMigrationPolicy.make({
  stage: "preview",
  currentCount: 106,
  desiredCount: 147,
  staleResourceTypes: [
    PreviewStateResourceType.make(
      "Bundjil.Infrastructure.PhotonBillingObservation"
    ),
    PreviewStateResourceType.make(
      "Bundjil.Infrastructure.PhotonPlatformConfiguration"
    ),
    PreviewStateResourceType.make(
      "Bundjil.Infrastructure.PhotonProjectObservation"
    ),
    PreviewStateResourceType.make("Bundjil.Infrastructure.PhotonSharedUser"),
    PreviewStateResourceType.make("Bundjil.Infrastructure.PhotonSharedUser"),
    PreviewStateResourceType.make(
      "Bundjil.Infrastructure.PhotonWebhookObservation"
    ),
    PreviewStateResourceType.make(
      "Bundjil.Infrastructure.PhotonWebhookObservation"
    ),
  ],
  staleFingerprints: [
    PreviewStateResourceFingerprint.make(
      "7b05e660d39ec05e43f904f5f42e58073dc0f03a9c60aba76ce19f2384148dd1"
    ),
    PreviewStateResourceFingerprint.make(
      "02b1212b6bfc0cee23fb5321a2367d7a873dca8826178892c0a3f8f0ec4ea5e8"
    ),
    PreviewStateResourceFingerprint.make(
      "b4b05ed6e1d56fbd2468cedd5fc3af065eca961288e8b18fca651d8e8ff695a2"
    ),
    PreviewStateResourceFingerprint.make(
      "8b858599bad0b7048d84757fb89e59a13cb5b7dc68b895b7828dd069cc7dd518"
    ),
    PreviewStateResourceFingerprint.make(
      "1ca10a09a30373fc034a66259027527895978b4e84a0927b25cc89e88fca02ad"
    ),
    PreviewStateResourceFingerprint.make(
      "0f7472767c87d78ee9863e7e560527be52a17d4f58ef6c8a2dc3faeda5c789a1"
    ),
    PreviewStateResourceFingerprint.make(
      "5ef46e0a632363f9256f1729c1696c0a48c2fa3a3dc667c6c148e0aedb892cf5"
    ),
  ],
});

const fingerprint = (value: string) =>
  PreviewStateResourceFingerprint.make(sha256(value));

export const makePreviewStateMigrationLayer = (
  policy: PreviewStateMigrationPolicy
) =>
  Layer.effect(
    PreviewStateMigration,
    Effect.gen(function* makePreviewStateMigration() {
      const resolveState = yield* State;
      const state = yield* resolveState;
      const backupStore = yield* PreviewStateBackupStore;

      const readResources = Effect.fn("PreviewStateMigration.readResources")(
        function* () {
          const fqns = yield* state
            .list({
              stack: "BundjilInfrastructure",
              stage: policy.stage,
            })
            .pipe(
              Effect.mapError(() =>
                migrationError(
                  "stateListFailed",
                  "Preview state identities could not be listed."
                )
              )
            );
          return yield* Effect.forEach(fqns, (fqn) =>
            state
              .get({
                stack: "BundjilInfrastructure",
                stage: policy.stage,
                fqn,
              })
              .pipe(
                Effect.mapError(() =>
                  migrationError(
                    "stateReadFailed",
                    "A Preview state row could not be read."
                  )
                ),
                Effect.flatMap((resource) =>
                  resource === undefined
                    ? Effect.fail(
                        migrationError(
                          "stateRowMissing",
                          "A listed Preview state row was missing."
                        )
                      )
                    : Schema.decodeUnknownEffect(PreviewStateBackupResource)(
                        resource,
                        { onExcessProperty: "error" }
                      ).pipe(
                        Effect.mapError(() =>
                          migrationError(
                            "stateRowInvalid",
                            "A Preview state row was not a completed retained resource."
                          )
                        )
                      )
                )
              )
          );
        }
      );

      const validateBoundary = Effect.fn(
        "PreviewStateMigration.validateBoundary"
      )(function* (manifest: AdoptionManifest) {
        if (manifest.stage !== policy.stage) {
          return yield* migrationError(
            "stageMismatch",
            "State migration requires the exact policy-owned stage manifest."
          );
        }
        const version = yield* state
          .getVersion()
          .pipe(
            Effect.mapError(() =>
              migrationError(
                "stateVersionUnavailable",
                "The state-store version could not be read."
              )
            )
          );
        if (version !== 5) {
          return yield* migrationError(
            "stateVersionMismatch",
            "The state-store contract version is not accepted."
          );
        }
        return yield* Effect.void;
      });

      const prepareResources = Effect.fn(
        "PreviewStateMigration.prepareResources"
      )(function* (
        manifest: AdoptionManifest,
        resources: readonly PreviewStateBackupResource[]
      ) {
        const desired = HashSet.fromIterable(
          manifest.resources.map((resource) => resource.logicalId)
        );
        const stale = resources.filter(
          (resource) => !HashSet.has(desired, resource.logicalId)
        );
        const staleFingerprints = stale
          .map((resource) => fingerprint(resource.fqn))
          .toSorted();
        const staleTypes = stale
          .map((resource) => resource.resourceType)
          .toSorted();
        const expectedStaleTypes = policy.staleResourceTypes.toSorted();
        const expectedStaleFingerprints = policy.staleFingerprints.toSorted();
        if (resources.length !== policy.currentCount) {
          return yield* migrationError(
            "currentCountMismatch",
            "State does not match the exact accepted stage discontinuity.",
            {
              observedCount: resources.length,
              expectedCount: policy.currentCount,
            }
          );
        }
        if (manifest.resources.length !== policy.desiredCount) {
          return yield* migrationError(
            "desiredCountMismatch",
            "State does not match the exact accepted stage discontinuity.",
            {
              observedCount: manifest.resources.length,
              expectedCount: policy.desiredCount,
            }
          );
        }
        if (stale.length !== policy.staleFingerprints.length) {
          return yield* migrationError(
            "staleCountMismatch",
            "State does not match the exact accepted stage discontinuity.",
            {
              observedCount: stale.length,
              expectedCount: policy.staleFingerprints.length,
            }
          );
        }
        if (
          staleTypes.some(
            (resourceType, index) => resourceType !== expectedStaleTypes[index]
          )
        ) {
          return yield* migrationError(
            "staleTypeMismatch",
            "State does not match the exact accepted stage discontinuity."
          );
        }
        if (
          staleFingerprints.some(
            (resourceFingerprint, index) =>
              resourceFingerprint !== expectedStaleFingerprints[index]
          )
        ) {
          return yield* migrationError(
            "staleFingerprintMismatch",
            "State does not match the exact accepted stage discontinuity."
          );
        }
        return {
          resources,
          stale,
          result: PreviewStateMigrationResult.make({
            status: "planned",
            currentCount: resources.length,
            desiredCount: manifest.resources.length,
            staleCount: stale.length,
            retainedCount: resources.length - stale.length,
            staleFingerprints,
            providerWrites: 0,
          }),
          backup: PreviewStateBackup.make({
            schemaVersion: "1",
            stack: "BundjilInfrastructure",
            stage: policy.stage,
            stateVersion: 5,
            manifestDigest: manifest.digest,
            resources,
          }),
        } as const;
      });

      const prepare = Effect.fn("PreviewStateMigration.prepare")(function* (
        manifest: AdoptionManifest
      ) {
        yield* validateBoundary(manifest);
        const resources = yield* readResources();
        return yield* prepareResources(manifest, resources);
      });

      const resumeRetirement = Effect.fn(
        "PreviewStateMigration.resumeRetirement"
      )(function* (manifest: AdoptionManifest) {
        yield* validateBoundary(manifest);
        const current = yield* readResources();
        const expectedRetainedCount =
          policy.currentCount - policy.staleFingerprints.length;
        if (current.length !== expectedRetainedCount) {
          return yield* migrationError(
            "retirementRecoveryMismatch",
            "State retirement recovery did not find the exact post-write count.",
            {
              observedCount: current.length,
              expectedCount: expectedRetainedCount,
            }
          );
        }
        const backup = yield* backupStore.load;
        if (
          backup.stage !== policy.stage ||
          backup.manifestDigest !== manifest.digest ||
          backup.resources.length !== policy.currentCount
        ) {
          return yield* migrationError(
            "retirementRecoveryMismatch",
            "State retirement recovery did not match the exact backup boundary."
          );
        }
        const prepared = yield* prepareResources(manifest, backup.resources);
        const staleFqns = HashSet.fromIterable(
          prepared.stale.map((resource) => resource.fqn)
        );
        const expectedRetained = prepared.resources.filter(
          (resource) => !HashSet.has(staleFqns, resource.fqn)
        );
        const currentEncoded = yield* Schema.encodeEffect(
          Schema.fromJsonString(Schema.Array(PreviewStateBackupResource))
        )(
          current.toSorted((left, right) => left.fqn.localeCompare(right.fqn))
        ).pipe(
          Effect.mapError(() =>
            migrationError(
              "retirementRecoveryMismatch",
              "State retirement recovery could not compare retained rows."
            )
          )
        );
        const expectedEncoded = yield* Schema.encodeEffect(
          Schema.fromJsonString(Schema.Array(PreviewStateBackupResource))
        )(
          expectedRetained.toSorted((left, right) =>
            left.fqn.localeCompare(right.fqn)
          )
        ).pipe(
          Effect.mapError(() =>
            migrationError(
              "retirementRecoveryMismatch",
              "State retirement recovery could not compare the backup."
            )
          )
        );
        if (sha256(currentEncoded) !== sha256(expectedEncoded)) {
          return yield* migrationError(
            "retirementRecoveryMismatch",
            "State retirement recovery did not match every retained row."
          );
        }
        return PreviewStateMigrationResult.make({
          ...prepared.result,
          status: "retired",
        });
      });

      return PreviewStateMigration.of({
        plan: (manifest) =>
          prepare(manifest).pipe(Effect.map(({ result }) => result)),
        retire: (manifest) =>
          Effect.gen(function* retireObsoletePreviewState() {
            const prepared = yield* prepare(manifest);
            yield* backupStore.save(prepared.backup);
            yield* Effect.forEach(
              prepared.stale,
              (resource) =>
                state
                  .delete({
                    stack: "BundjilInfrastructure",
                    stage: policy.stage,
                    fqn: resource.fqn,
                  })
                  .pipe(
                    Effect.mapError(() =>
                      migrationError(
                        "retirementFailed",
                        "An obsolete Preview state row could not be retired."
                      )
                    )
                  ),
              { concurrency: 1, discard: true }
            );
            const remaining = yield* readResources();
            if (
              remaining.length !==
                policy.currentCount - policy.staleFingerprints.length ||
              remaining.some((resource) =>
                policy.staleFingerprints.includes(fingerprint(resource.fqn))
              )
            ) {
              return yield* migrationError(
                "retirementReadbackMismatch",
                "Preview state retirement did not reach the exact readback."
              );
            }
            return PreviewStateMigrationResult.make({
              ...prepared.result,
              status: "retired",
            });
          }).pipe(
            /* oxlint-disable-next-line eslint-plugin-promise/prefer-await-to-callbacks -- Effect.catchTag handles the typed Effect failure channel after the named retirement Effect. */
            Effect.catchTag("PreviewStateMigrationError", (error) =>
              Match.value(error.reason).pipe(
                Match.when("currentCountMismatch", () =>
                  resumeRetirement(manifest)
                ),
                Match.orElse(() => Effect.fail(error))
              )
            )
          ),
        restore: Effect.gen(function* restorePreviewState() {
          const backup = yield* backupStore.load;
          const current = yield* readResources();
          const backupFqns = HashSet.fromIterable(
            backup.resources.map((resource) => resource.fqn)
          );
          yield* Effect.forEach(
            current.filter(
              (resource) => !HashSet.has(backupFqns, resource.fqn)
            ),
            (resource) =>
              state
                .delete({
                  stack: backup.stack,
                  stage: backup.stage,
                  fqn: resource.fqn,
                })
                .pipe(
                  Effect.mapError(() =>
                    migrationError(
                      "restoreDeleteFailed",
                      "A post-migration Preview state row could not be removed during restore."
                    )
                  )
                ),
            { concurrency: 1, discard: true }
          );
          yield* Effect.forEach(
            backup.resources,
            (resource) => {
              const value = {
                resourceType: resource.resourceType,
                namespace: resource.namespace,
                fqn: resource.fqn,
                logicalId: resource.logicalId,
                instanceId: resource.instanceId,
                providerVersion: resource.providerVersion,
                status: resource.status,
                downstream: [...resource.downstream],
                bindings: resource.bindings.map((binding) => ({
                  sid: binding.sid,
                  data: binding.data,
                })),
                props: { ...resource.props },
                attr: { ...resource.attr },
                removalPolicy: resource.removalPolicy,
                ...(resource.kind === undefined ? {} : { kind: resource.kind }),
              };
              return state
                .set({
                  stack: backup.stack,
                  stage: backup.stage,
                  fqn: resource.fqn,
                  value,
                })
                .pipe(
                  Effect.mapError(() =>
                    migrationError(
                      "restoreWriteFailed",
                      "A backed-up Preview state row could not be restored."
                    )
                  )
                );
            },
            { concurrency: 1, discard: true }
          );
          const restored = yield* readResources();
          const restoredFingerprints = restored
            .map((resource) => fingerprint(resource.fqn))
            .toSorted();
          const backupFingerprints = backup.resources
            .map((resource) => fingerprint(resource.fqn))
            .toSorted();
          const restoredEncoded = yield* Schema.encodeEffect(
            Schema.fromJsonString(Schema.Array(PreviewStateBackupResource))
          )(
            restored.toSorted((left, right) =>
              left.fqn.localeCompare(right.fqn)
            )
          ).pipe(
            Effect.mapError(() =>
              migrationError(
                "restoreComparisonFailed",
                "The restored Preview state could not be compared with its backup."
              )
            )
          );
          const backupEncoded = yield* Schema.encodeEffect(
            Schema.fromJsonString(Schema.Array(PreviewStateBackupResource))
          )(
            backup.resources.toSorted((left, right) =>
              left.fqn.localeCompare(right.fqn)
            )
          ).pipe(
            Effect.mapError(() =>
              migrationError(
                "restoreComparisonFailed",
                "The Preview state backup could not be compared with restored state."
              )
            )
          );
          if (
            restored.length !== backup.resources.length ||
            restoredFingerprints.some(
              (resourceFingerprint, index) =>
                resourceFingerprint !== backupFingerprints[index]
            ) ||
            sha256(restoredEncoded) !== sha256(backupEncoded)
          ) {
            return yield* migrationError(
              "restoreMismatch",
              "Preview state restore did not match the exact backup."
            );
          }
          return PreviewStateMigrationResult.make({
            status: "restored",
            currentCount: restored.length,
            desiredCount: restored.length,
            staleCount: 0,
            retainedCount: restored.length,
            staleFingerprints: [],
            providerWrites: 0,
          });
        }),
      });
    })
  );

export const PreviewStateMigrationLive = makePreviewStateMigrationLayer(
  CanonicalPreviewStateMigrationPolicy
);

const CanonicalProductionStateMigrationPolicy =
  PreviewStateMigrationPolicy.make({
    stage: "prod",
    currentCount: 73,
    desiredCount: 72,
    staleResourceTypes: [
      PreviewStateResourceType.make(
        "Bundjil.Infrastructure.PhotonWebhookObservation"
      ),
    ],
    staleFingerprints: [
      PreviewStateResourceFingerprint.make(
        "5ef46e0a632363f9256f1729c1696c0a48c2fa3a3dc667c6c148e0aedb892cf5"
      ),
    ],
  });

export const ProductionStateMigrationLive = makePreviewStateMigrationLayer(
  CanonicalProductionStateMigrationPolicy
);

export const makePreviewStateBackupStoreMemory = () => {
  let retainedBackup: PreviewStateBackup | undefined;
  return Layer.succeed(
    PreviewStateBackupStore,
    PreviewStateBackupStore.of({
      save: (backup) =>
        Effect.sync(() => {
          retainedBackup = backup;
        }),
      load: Effect.suspend(() =>
        retainedBackup === undefined
          ? Effect.fail(
              migrationError(
                "backupUnavailable",
                "No Preview state backup is retained."
              )
            )
          : Effect.succeed(retainedBackup)
      ),
    })
  );
};

export const makePreviewStateBackupStoreLive = (
  path: PreviewStateBackupPath,
  forbiddenValues: readonly PreviewStateForbiddenValue[]
) =>
  Layer.effect(
    PreviewStateBackupStore,
    Effect.gen(function* makePreviewStateBackupStore() {
      const fileSystem = yield* FileSystem.FileSystem;
      return PreviewStateBackupStore.of({
        save: (backup) =>
          Effect.gen(function* savePreviewStateBackup() {
            const encoded = yield* Schema.encodeEffect(
              Schema.fromJsonString(PreviewStateBackup)
            )(backup).pipe(
              Effect.mapError(() =>
                migrationError(
                  "backupEncodeFailed",
                  "The Preview state backup could not be encoded."
                )
              )
            );
            if (
              forbiddenValues.some((value) =>
                encoded.includes(Redacted.value(value))
              )
            ) {
              return yield* migrationError(
                "backupCredentialLeak",
                "The Preview state backup contains a forbidden credential value."
              );
            }
            return yield* fileSystem
              .makeDirectory(dirname(path), {
                recursive: true,
                mode: 0o700,
              })
              .pipe(
                Effect.andThen(
                  fileSystem.writeFileString(path, encoded, { mode: 0o600 })
                ),
                Effect.andThen(fileSystem.chmod(path, 0o600)),
                Effect.mapError(() =>
                  migrationError(
                    "backupWriteFailed",
                    "The Preview state backup could not be written."
                  )
                ),
                Effect.asVoid
              );
          }),
        load: Effect.gen(function* loadPreviewStateBackup() {
          const metadata = yield* fileSystem.stat(path);
          if (
            metadata.mode % 0o1000 !== 0o600 ||
            metadata.size > 2n * 1024n * 1024n
          ) {
            return yield* migrationError(
              "backupReadFailed",
              "The Preview state backup is not a bounded mode-0600 file."
            );
          }
          const encoded = yield* fileSystem.readFileString(path);
          return yield* Schema.decodeUnknownEffect(
            Schema.fromJsonString(PreviewStateBackup)
          )(encoded, { onExcessProperty: "error" });
        }).pipe(
          Effect.mapError(() =>
            migrationError(
              "backupReadFailed",
              "The Preview state backup could not be loaded."
            )
          )
        ),
      });
    })
  );

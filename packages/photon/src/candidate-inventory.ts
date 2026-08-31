import { createHash } from "node:crypto";

import { Clock, Config, Context, Effect, HashSet, Layer, Schema } from "effect";
import { HttpClient } from "effect/unstable/http";

/* oxlint-disable max-classes-per-file -- The owner service and its operation-specific safe error share one bounded contract file. */
import {
  layerPhotonManagementLive,
  PhotonManagement,
} from "./operator-management.js";
import { PhotonProjectId, PhotonProjectSecret } from "./schemas.js";

export const PhotonIdentityFingerprint = Schema.String.check(
  Schema.isPattern(/^[0-9a-f]{64}$/u)
).pipe(Schema.brand("@bundjil/photon/PhotonIdentityFingerprint"));
export type PhotonIdentityFingerprint = typeof PhotonIdentityFingerprint.Type;
export type PhotonIdentityFingerprintEncoded =
  typeof PhotonIdentityFingerprint.Encoded;

export const PhotonCandidateBinding = Schema.Struct({
  assignedIdentityFingerprint: PhotonIdentityFingerprint,
  projectFingerprint: PhotonIdentityFingerprint,
  userFingerprint: PhotonIdentityFingerprint,
});
export type PhotonCandidateBinding = typeof PhotonCandidateBinding.Type;
export type PhotonCandidateBindingEncoded =
  typeof PhotonCandidateBinding.Encoded;

export const PhotonCandidateObservation = Schema.Struct({
  candidateFingerprint: PhotonIdentityFingerprint,
  previewAvailable: Schema.Boolean,
  previewBinding: Schema.NullOr(PhotonCandidateBinding),
  sourceBinding: PhotonCandidateBinding,
});
export type PhotonCandidateObservation = typeof PhotonCandidateObservation.Type;
export type PhotonCandidateObservationEncoded =
  typeof PhotonCandidateObservation.Encoded;

export const PhotonCandidateInventoryManifest = Schema.Struct({
  candidates: Schema.Array(PhotonCandidateObservation),
  previewProjectFingerprint: PhotonIdentityFingerprint,
  sourceProjectFingerprint: PhotonIdentityFingerprint,
});
export type PhotonCandidateInventoryManifest =
  typeof PhotonCandidateInventoryManifest.Type;
export type PhotonCandidateInventoryManifestEncoded =
  typeof PhotonCandidateInventoryManifest.Encoded;

export const PhotonCandidateInventoryObservedAt = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u)
).pipe(Schema.brand("@bundjil/photon/PhotonCandidateInventoryObservedAt"));
export type PhotonCandidateInventoryObservedAt =
  typeof PhotonCandidateInventoryObservedAt.Type;
export type PhotonCandidateInventoryObservedAtEncoded =
  typeof PhotonCandidateInventoryObservedAt.Encoded;

export const CapturePhotonCandidateInventory = Schema.Struct({
  selectedCandidateFingerprint: PhotonIdentityFingerprint,
});
export type CapturePhotonCandidateInventory =
  typeof CapturePhotonCandidateInventory.Type;
export type CapturePhotonCandidateInventoryEncoded =
  typeof CapturePhotonCandidateInventory.Encoded;

export const PhotonCandidateInventoryReceipt = Schema.Struct({
  firstManifestDigest: PhotonIdentityFingerprint,
  manifest: PhotonCandidateInventoryManifest,
  matching: Schema.Literal(true),
  observedAt: PhotonCandidateInventoryObservedAt,
  secondManifestDigest: PhotonIdentityFingerprint,
  selectedCandidateFingerprint: PhotonIdentityFingerprint,
  selectedPreviewBindingPresent: Schema.Literal(true),
});
export type PhotonCandidateInventoryReceipt =
  typeof PhotonCandidateInventoryReceipt.Type;
export type PhotonCandidateInventoryReceiptEncoded =
  typeof PhotonCandidateInventoryReceipt.Encoded;

export const PhotonCandidateInventoryOperation = Schema.Literal(
  "captureCandidateInventory"
);
export type PhotonCandidateInventoryOperation =
  typeof PhotonCandidateInventoryOperation.Type;
export type PhotonCandidateInventoryOperationEncoded =
  typeof PhotonCandidateInventoryOperation.Encoded;

export const PhotonCandidateInventoryFailureReason = Schema.Literals([
  "configurationUnavailable",
  "providerReadFailed",
  "inventoryDrift",
  "selectionConflict",
]);
export type PhotonCandidateInventoryFailureReason =
  typeof PhotonCandidateInventoryFailureReason.Type;
export type PhotonCandidateInventoryFailureReasonEncoded =
  typeof PhotonCandidateInventoryFailureReason.Encoded;

export const PhotonCandidateInventoryFailureMessage = Schema.NonEmptyString;
export type PhotonCandidateInventoryFailureMessage =
  typeof PhotonCandidateInventoryFailureMessage.Type;
export type PhotonCandidateInventoryFailureMessageEncoded =
  typeof PhotonCandidateInventoryFailureMessage.Encoded;

export class PhotonCandidateInventoryError extends Schema.TaggedErrorClass<PhotonCandidateInventoryError>()(
  "PhotonCandidateInventoryError",
  {
    operation: PhotonCandidateInventoryOperation,
    reason: PhotonCandidateInventoryFailureReason,
    retry: Schema.Literals(["never", "backoff"]),
    message: PhotonCandidateInventoryFailureMessage,
  }
) {}

export interface PhotonCandidateInventoryContract {
  readonly captureCandidateInventory: (
    input: CapturePhotonCandidateInventory
  ) => Effect.Effect<
    PhotonCandidateInventoryReceipt,
    PhotonCandidateInventoryError
  >;
}

export class PhotonCandidateInventory extends Context.Service<
  PhotonCandidateInventory,
  PhotonCandidateInventoryContract
>()("@bundjil/photon/PhotonCandidateInventory") {}

const sourceProjectIdConfig = Config.schema(
  PhotonProjectId,
  "BUNDJIL_PHOTON_MANAGEMENT_PROJECT_ID"
);
const sourceProjectSecretConfig = Config.schema(
  PhotonProjectSecret,
  "BUNDJIL_PHOTON_MANAGEMENT_PROJECT_SECRET"
);
const previewProjectIdConfig = Config.schema(
  PhotonProjectId,
  "BUNDJIL_PHOTON_PREVIEW_PROJECT_ID"
);
const previewProjectSecretConfig = Config.schema(
  PhotonProjectSecret,
  "BUNDJIL_PHOTON_PREVIEW_PROJECT_SECRET"
);

const credentials = Config.all({
  previewProjectId: previewProjectIdConfig,
  previewProjectSecret: previewProjectSecretConfig,
  sourceProjectId: sourceProjectIdConfig,
  sourceProjectSecret: sourceProjectSecretConfig,
});

const fingerprint = (value: string) =>
  PhotonIdentityFingerprint.make(
    createHash("sha256").update(value).digest("hex")
  );

export const layerPhotonCandidateInventoryLive = Layer.effect(
  PhotonCandidateInventory,
  Effect.gen(function* makePhotonCandidateInventoryLive() {
    const client = yield* HttpClient.HttpClient;
    const httpLayer = Layer.succeed(HttpClient.HttpClient, client);

    return PhotonCandidateInventory.of({
      captureCandidateInventory: Effect.fn(
        "PhotonCandidateInventory.captureCandidateInventory"
      )(function* (input) {
        const configured = yield* credentials.pipe(
          Effect.mapError(
            () =>
              new PhotonCandidateInventoryError({
                operation: "captureCandidateInventory",
                reason: "configurationUnavailable",
                retry: "never",
                message:
                  "Photon candidate inventory credentials are unavailable.",
              })
          )
        );
        if (configured.sourceProjectId === configured.previewProjectId) {
          return yield* new PhotonCandidateInventoryError({
            operation: "captureCandidateInventory",
            reason: "selectionConflict",
            retry: "never",
            message:
              "Photon candidate inventory requires distinct source and Preview projects.",
          });
        }

        const sourceManagement = yield* PhotonManagement.pipe(
          Effect.provide(
            layerPhotonManagementLive(
              configured.sourceProjectId,
              configured.sourceProjectSecret
            ).pipe(Layer.provide(httpLayer))
          ),
          Effect.mapError(
            () =>
              new PhotonCandidateInventoryError({
                operation: "captureCandidateInventory",
                reason: "providerReadFailed",
                retry: "backoff",
                message:
                  "Photon source candidate inventory could not be initialized.",
              })
          )
        );
        const previewManagement = yield* PhotonManagement.pipe(
          Effect.provide(
            layerPhotonManagementLive(
              configured.previewProjectId,
              configured.previewProjectSecret
            ).pipe(Layer.provide(httpLayer))
          ),
          Effect.mapError(
            () =>
              new PhotonCandidateInventoryError({
                operation: "captureCandidateInventory",
                reason: "providerReadFailed",
                retry: "backoff",
                message:
                  "Photon Preview candidate inventory could not be initialized.",
              })
          )
        );

        const captureManifest = Effect.fn(
          "PhotonCandidateInventory.captureManifest"
        )(function* () {
          const sourceUsers = yield* sourceManagement.listSharedUsers();
          const previewUsers = yield* previewManagement.listSharedUsers();
          if (
            HashSet.size(
              HashSet.fromIterable(sourceUsers.map((user) => user.phoneNumber))
            ) !== sourceUsers.length ||
            HashSet.size(
              HashSet.fromIterable(previewUsers.map((user) => user.phoneNumber))
            ) !== previewUsers.length
          ) {
            return yield* new PhotonCandidateInventoryError({
              operation: "captureCandidateInventory",
              reason: "selectionConflict",
              retry: "never",
              message:
                "Photon returned more than one shared user for a candidate identity.",
            });
          }

          const candidates = yield* Effect.forEach(
            sourceUsers,
            (sourceUser) =>
              Effect.gen(function* observeCandidate() {
                const previewAvailable =
                  yield* previewManagement.checkSharedAvailability(
                    sourceUser.phoneNumber
                  );
                const previewUser = previewUsers.find(
                  (candidate) =>
                    candidate.phoneNumber === sourceUser.phoneNumber
                );
                return PhotonCandidateObservation.make({
                  candidateFingerprint: fingerprint(sourceUser.phoneNumber),
                  previewAvailable,
                  previewBinding:
                    previewUser === undefined
                      ? null
                      : PhotonCandidateBinding.make({
                          assignedIdentityFingerprint: fingerprint(
                            previewUser.assignedPhoneNumber
                          ),
                          projectFingerprint: fingerprint(
                            configured.previewProjectId
                          ),
                          userFingerprint: fingerprint(previewUser.id),
                        }),
                  sourceBinding: PhotonCandidateBinding.make({
                    assignedIdentityFingerprint: fingerprint(
                      sourceUser.assignedPhoneNumber
                    ),
                    projectFingerprint: fingerprint(configured.sourceProjectId),
                    userFingerprint: fingerprint(sourceUser.id),
                  }),
                });
              }),
            { concurrency: 1 }
          );

          return PhotonCandidateInventoryManifest.make({
            candidates: candidates.toSorted((left, right) =>
              left.candidateFingerprint.localeCompare(
                right.candidateFingerprint
              )
            ),
            previewProjectFingerprint: fingerprint(configured.previewProjectId),
            sourceProjectFingerprint: fingerprint(configured.sourceProjectId),
          });
        });

        const first = yield* captureManifest().pipe(
          Effect.catchTag(
            "PhotonProviderProofError",
            () =>
              new PhotonCandidateInventoryError({
                operation: "captureCandidateInventory",
                reason: "providerReadFailed",
                retry: "backoff",
                message:
                  "Photon candidate inventory could not read provider state.",
              })
          )
        );
        const firstJson = yield* Schema.encodeEffect(
          Schema.fromJsonString(PhotonCandidateInventoryManifest)
        )(first).pipe(
          Effect.mapError(
            () =>
              new PhotonCandidateInventoryError({
                operation: "captureCandidateInventory",
                reason: "providerReadFailed",
                retry: "never",
                message:
                  "Photon candidate inventory could not encode the first manifest.",
              })
          )
        );
        const firstManifestDigest = fingerprint(firstJson);

        const second = yield* captureManifest().pipe(
          Effect.catchTag(
            "PhotonProviderProofError",
            () =>
              new PhotonCandidateInventoryError({
                operation: "captureCandidateInventory",
                reason: "providerReadFailed",
                retry: "backoff",
                message:
                  "Photon candidate inventory could not repeat provider reads.",
              })
          )
        );
        const secondJson = yield* Schema.encodeEffect(
          Schema.fromJsonString(PhotonCandidateInventoryManifest)
        )(second).pipe(
          Effect.mapError(
            () =>
              new PhotonCandidateInventoryError({
                operation: "captureCandidateInventory",
                reason: "providerReadFailed",
                retry: "never",
                message:
                  "Photon candidate inventory could not encode the second manifest.",
              })
          )
        );
        const secondManifestDigest = fingerprint(secondJson);
        if (firstManifestDigest !== secondManifestDigest) {
          return yield* new PhotonCandidateInventoryError({
            operation: "captureCandidateInventory",
            reason: "inventoryDrift",
            retry: "never",
            message:
              "Photon candidate inventory changed between consecutive reads.",
          });
        }
        const selected = first.candidates.filter(
          (candidate) =>
            candidate.candidateFingerprint ===
            input.selectedCandidateFingerprint
        );
        if (
          selected.length !== 1 ||
          selected[0]?.previewBinding === null ||
          selected[0]?.previewAvailable !== true
        ) {
          return yield* new PhotonCandidateInventoryError({
            operation: "captureCandidateInventory",
            reason: "selectionConflict",
            retry: "never",
            message:
              "The selected Photon candidate is not uniquely and safely bound in Preview.",
          });
        }

        const observedAtEpochMilliseconds = yield* Clock.currentTimeMillis;
        return PhotonCandidateInventoryReceipt.make({
          firstManifestDigest,
          manifest: first,
          matching: true,
          observedAt: PhotonCandidateInventoryObservedAt.make(
            new Date(observedAtEpochMilliseconds).toISOString()
          ),
          secondManifestDigest,
          selectedCandidateFingerprint: input.selectedCandidateFingerprint,
          selectedPreviewBindingPresent: true,
        });
      }),
    });
  })
);

export const PhotonCandidateInventoryMemoryConfig = Schema.Struct({
  receipt: PhotonCandidateInventoryReceipt,
});
export type PhotonCandidateInventoryMemoryConfig =
  typeof PhotonCandidateInventoryMemoryConfig.Type;
export type PhotonCandidateInventoryMemoryConfigEncoded =
  typeof PhotonCandidateInventoryMemoryConfig.Encoded;

export const layerPhotonCandidateInventoryMemory = (
  config: PhotonCandidateInventoryMemoryConfig
) =>
  Layer.succeed(
    PhotonCandidateInventory,
    PhotonCandidateInventory.of({
      captureCandidateInventory: Effect.fn(
        "PhotonCandidateInventoryMemory.captureCandidateInventory"
      )(function* (input) {
        if (
          input.selectedCandidateFingerprint !==
          config.receipt.selectedCandidateFingerprint
        ) {
          return yield* new PhotonCandidateInventoryError({
            operation: "captureCandidateInventory",
            reason: "selectionConflict",
            retry: "never",
            message:
              "The selected Photon candidate does not match the memory inventory.",
          });
        }
        return config.receipt;
      }),
    })
  );

export const loadSelectedPhotonCandidateFingerprint = Config.schema(
  PhotonIdentityFingerprint,
  "BUNDJIL_PHOTON_PREVIEW_CANDIDATE_FINGERPRINT"
);

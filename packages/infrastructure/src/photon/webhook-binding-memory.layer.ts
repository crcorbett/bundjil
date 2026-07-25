import { Context, Effect, Layer, Ref, Schema } from "effect";

import {
  SecretOwner,
  SecretReference,
  SecretReferenceId,
  SecretRevision,
} from "../secret-reference.js";
import {
  PhotonWebhookBindingSink,
  PhotonWebhookBindingWrite,
  PhotonWebhookBindingWriteError,
} from "./webhook-binding.js";

export const PhotonWebhookBindingMemoryFailureMode = Schema.Literals([
  "none",
  "sinkFailure",
  "timeoutAfterWrite",
  "vercelPartialFailure",
]);
export type PhotonWebhookBindingMemoryFailureMode =
  typeof PhotonWebhookBindingMemoryFailureMode.Type;
export type PhotonWebhookBindingMemoryFailureModeEncoded =
  typeof PhotonWebhookBindingMemoryFailureMode.Encoded;

export const PhotonWebhookBindingMemoryRecord = Schema.Struct({
  stage: Schema.Literal("preview"),
  teamId: PhotonWebhookBindingWrite.fields.teamId,
  vercelProjectId: PhotonWebhookBindingWrite.fields.vercelProjectId,
  photonProjectId: PhotonWebhookBindingWrite.fields.photonProjectId,
  webhookId: PhotonWebhookBindingWrite.fields.webhookId,
  secretReference: SecretReference,
});
export type PhotonWebhookBindingMemoryRecord =
  typeof PhotonWebhookBindingMemoryRecord.Type;
export type PhotonWebhookBindingMemoryRecordEncoded =
  typeof PhotonWebhookBindingMemoryRecord.Encoded;

export const PhotonWebhookBindingMemoryConfig = Schema.Struct({
  binding: Schema.NullOr(PhotonWebhookBindingMemoryRecord),
  failureMode: PhotonWebhookBindingMemoryFailureMode,
  partialWebhookIdPersisted: Schema.Boolean,
});
export type PhotonWebhookBindingMemoryConfig =
  typeof PhotonWebhookBindingMemoryConfig.Type;
export type PhotonWebhookBindingMemoryConfigEncoded =
  typeof PhotonWebhookBindingMemoryConfig.Encoded;

export const PhotonWebhookBindingMemoryCount = Schema.Struct({
  count: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
});
export type PhotonWebhookBindingMemoryCount =
  typeof PhotonWebhookBindingMemoryCount.Type;

export interface PhotonWebhookBindingMemoryControlShape {
  readonly setFailureMode: (
    mode: PhotonWebhookBindingMemoryFailureMode
  ) => Effect.Effect<void>;
  readonly snapshot: Effect.Effect<PhotonWebhookBindingMemoryConfig>;
  readonly writeCount: Effect.Effect<PhotonWebhookBindingMemoryCount>;
}

export class PhotonWebhookBindingMemoryControl extends Context.Service<
  PhotonWebhookBindingMemoryControl,
  PhotonWebhookBindingMemoryControlShape
>()("@bundjil/infrastructure/photon/PhotonWebhookBindingMemoryControl") {}

const owner = SecretOwner.make("bundjil-agent-preview-vercel-environment");

const referenceFor = Effect.fn("PhotonWebhookBindingMemory.referenceFor")(
  function* (input: PhotonWebhookBindingWrite) {
    const webhookId = yield* Schema.encodeEffect(
      PhotonWebhookBindingWrite.fields.webhookId
    )(input.webhookId).pipe(
      Effect.mapError(
        () =>
          new PhotonWebhookBindingWriteError({
            operation: "persistPreviewWebhookBinding",
            reason: "requestFailed",
            retry: "never",
            certainty: { _tag: "Known" },
            message: "The webhook identity could not be encoded.",
          })
      )
    );
    return SecretReference.make({
      owner,
      reference: SecretReferenceId.make(webhookId),
      revision: SecretRevision.make(webhookId),
    });
  }
);

const matches = (
  record: PhotonWebhookBindingMemoryRecord,
  input: PhotonWebhookBindingWrite
) =>
  record.stage === input.stage &&
  record.teamId === input.teamId &&
  record.vercelProjectId === input.vercelProjectId &&
  record.photonProjectId === input.photonProjectId &&
  record.webhookId === input.webhookId;

export const emptyPhotonWebhookBindingMemory =
  PhotonWebhookBindingMemoryConfig.make({
    binding: null,
    failureMode: "none",
    partialWebhookIdPersisted: false,
  });

export const layerPhotonWebhookBindingMemory = (
  config: PhotonWebhookBindingMemoryConfig
) =>
  Layer.effectContext(
    Effect.gen(function* makePhotonWebhookBindingMemory() {
      const binding = yield* Ref.make(config.binding);
      const failureMode = yield* Ref.make(config.failureMode);
      const partialWebhookIdPersisted = yield* Ref.make(
        config.partialWebhookIdPersisted
      );
      const writes = yield* Ref.make(0);

      const persistPreviewWebhookBinding = Effect.fn(
        "PhotonWebhookBindingMemory.persistPreviewWebhookBinding"
      )(function* (input: PhotonWebhookBindingWrite) {
        const existing = yield* Ref.get(binding);
        if (existing !== null) {
          if (matches(existing, input)) {
            return existing.secretReference;
          }
          return yield* new PhotonWebhookBindingWriteError({
            operation: "persistPreviewWebhookBinding",
            reason: "conflict",
            retry: "never",
            certainty: { _tag: "Known" },
            message:
              "A different Photon webhook already owns the Preview binding.",
          });
        }

        const mode = yield* Ref.get(failureMode);
        if (mode === "sinkFailure") {
          return yield* new PhotonWebhookBindingWriteError({
            operation: "persistPreviewWebhookBinding",
            reason: "requestFailed",
            retry: "never",
            certainty: { _tag: "Known" },
            message: "The binding sink rejected the write before persistence.",
          });
        }

        yield* Ref.update(writes, (count) => count + 1);
        if (mode === "vercelPartialFailure") {
          yield* Ref.set(partialWebhookIdPersisted, true);
          yield* Ref.set(failureMode, "none");
          return yield* new PhotonWebhookBindingWriteError({
            operation: "persistPreviewWebhookBinding",
            reason: "uncertainOutcome",
            retry: "readbackRequired",
            certainty: {
              _tag: "Uncertain",
              recovery: "observeByPhysicalIdentity",
            },
            message:
              "Vercel persisted only part of the Preview webhook binding.",
          });
        }

        const secretReference = yield* referenceFor(input);
        const record = PhotonWebhookBindingMemoryRecord.make({
          stage: input.stage,
          teamId: input.teamId,
          vercelProjectId: input.vercelProjectId,
          photonProjectId: input.photonProjectId,
          webhookId: input.webhookId,
          secretReference,
        });
        yield* Ref.set(binding, record);
        yield* Ref.set(partialWebhookIdPersisted, false);
        yield* Ref.set(failureMode, "none");

        if (mode === "timeoutAfterWrite") {
          return yield* new PhotonWebhookBindingWriteError({
            operation: "persistPreviewWebhookBinding",
            reason: "uncertainOutcome",
            retry: "readbackRequired",
            certainty: {
              _tag: "Uncertain",
              recovery: "observeByPhysicalIdentity",
            },
            message:
              "The binding was persisted but the sink response was lost.",
          });
        }
        return secretReference;
      });

      return Context.empty().pipe(
        Context.add(
          PhotonWebhookBindingSink,
          PhotonWebhookBindingSink.of({ persistPreviewWebhookBinding })
        ),
        Context.add(
          PhotonWebhookBindingMemoryControl,
          PhotonWebhookBindingMemoryControl.of({
            setFailureMode: (mode) => Ref.set(failureMode, mode),
            snapshot: Effect.all({
              binding: Ref.get(binding),
              failureMode: Ref.get(failureMode),
              partialWebhookIdPersisted: Ref.get(partialWebhookIdPersisted),
            }).pipe(
              Effect.map((snapshot) =>
                PhotonWebhookBindingMemoryConfig.make(snapshot)
              )
            ),
            writeCount: Ref.get(writes).pipe(
              Effect.map((count) =>
                PhotonWebhookBindingMemoryCount.make({ count })
              )
            ),
          })
        )
      );
    })
  );

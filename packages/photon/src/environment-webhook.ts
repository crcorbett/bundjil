import { Effect, Exit, Schedule, Schema } from "effect";

import { PhotonManagement } from "./operator-management.js";
import { PhotonProviderProofError } from "./provider-proof.error.js";
import { PhotonWebhookId, PhotonWebhookSecret } from "./schemas.js";

export const PhotonEnvironmentWebhookBinding = Schema.Struct({
  webhookId: PhotonWebhookId,
  webhookSecret: PhotonWebhookSecret,
});
export type PhotonEnvironmentWebhookBinding =
  typeof PhotonEnvironmentWebhookBinding.Type;

export const PhotonEnvironmentWebhookReceipt = Schema.Struct({
  finalWebhookCount: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  managementAuthenticated: Schema.Literal(true),
  preexistingWebhookCount: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  status: Schema.Literal("registered"),
  webhookCreated: Schema.Literal(true),
  webhookReadBack: Schema.Literal(true),
});
export type PhotonEnvironmentWebhookReceipt =
  typeof PhotonEnvironmentWebhookReceipt.Type;

export const PhotonEnvironmentWebhookDeletionReceipt = Schema.Struct({
  finalMatchingWebhookCount: Schema.Literal(0),
  managementAuthenticated: Schema.Literal(true),
  preexistingMatchingWebhookCount: Schema.Literal(1),
  status: Schema.Literal("deleted"),
  webhookDeleted: Schema.Literal(true),
});
export type PhotonEnvironmentWebhookDeletionReceipt =
  typeof PhotonEnvironmentWebhookDeletionReceipt.Type;

const observeEnvironmentWebhookAfterWrite = Effect.fn(
  "PhotonEnvironmentWebhook.observeAfterWrite"
)(function* (webhookUrl: URL) {
  const management = yield* PhotonManagement;
  return yield* management.listWebhooks().pipe(
    Effect.flatMap((webhooks) => {
      const matching = webhooks.filter(
        (webhook) => webhook.webhookUrl.href === webhookUrl.href
      );
      if (matching.length === 0) {
        return Effect.fail(
          new PhotonProviderProofError({
            operation: "assert",
            reason: "requestFailed",
          })
        );
      }
      if (matching.length > 1) {
        return Effect.fail(
          new PhotonProviderProofError({
            operation: "assert",
            reason: "resourceConflict",
          })
        );
      }
      return Effect.succeed({ matching: matching[0], webhooks });
    }),
    Effect.retry({
      times: 2,
      schedule: Schedule.exponential("10 millis").pipe(Schedule.jittered),
      while: (failure) => failure.reason === "requestFailed",
    })
  );
});

export const deletePhotonEnvironmentWebhook = Effect.fn(
  "PhotonEnvironmentWebhook.delete"
)(function* (webhookUrl: URL) {
  const management = yield* PhotonManagement;
  const baseline = yield* management.listWebhooks();
  const target = baseline.find(
    (webhook) => webhook.webhookUrl.href === webhookUrl.href
  );
  const duplicate = baseline.find(
    (webhook) =>
      webhook.id !== target?.id && webhook.webhookUrl.href === webhookUrl.href
  );
  if (target === undefined || duplicate !== undefined) {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }
  yield* management.deleteWebhook(target.id);
  const final = yield* management.listWebhooks();
  if (final.some((webhook) => webhook.webhookUrl.href === webhookUrl.href)) {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }
  return PhotonEnvironmentWebhookDeletionReceipt.make({
    finalMatchingWebhookCount: 0,
    managementAuthenticated: true,
    preexistingMatchingWebhookCount: 1,
    status: "deleted",
    webhookDeleted: true,
  });
});

export const registerPhotonEnvironmentWebhook = Effect.fn(
  "PhotonEnvironmentWebhook.register"
)(function* (webhookUrl: URL) {
  const management = yield* PhotonManagement;
  const baseline = yield* management.listWebhooks();
  if (baseline.some((webhook) => webhook.webhookUrl.href === webhookUrl.href)) {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }

  const createExit = yield* Effect.exit(management.registerWebhook(webhookUrl));
  if (Exit.isFailure(createExit)) {
    const observed = yield* Effect.exit(
      observeEnvironmentWebhookAfterWrite(webhookUrl)
    );
    if (Exit.isSuccess(observed)) {
      return yield* new PhotonProviderProofError({
        operation: "registerWebhook",
        reason: "resourceConflict",
      });
    }
    return yield* new PhotonProviderProofError({
      operation: "registerWebhook",
      reason: "requestFailed",
    });
  }

  const observed = yield* observeEnvironmentWebhookAfterWrite(webhookUrl);
  if (observed.matching?.id !== createExit.value.id) {
    return yield* new PhotonProviderProofError({
      operation: "assert",
      reason: "resourceConflict",
    });
  }

  return {
    binding: PhotonEnvironmentWebhookBinding.make({
      webhookId: createExit.value.id,
      webhookSecret: createExit.value.signingSecret,
    }),
    receipt: PhotonEnvironmentWebhookReceipt.make({
      finalWebhookCount: observed.webhooks.length,
      managementAuthenticated: true,
      preexistingWebhookCount: baseline.length,
      status: "registered",
      webhookCreated: true,
      webhookReadBack: true,
    }),
  };
});

import { Effect, Exit, Schema } from "effect";

import { PhotonManagement } from "./management.js";
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
    const residual = yield* management.listWebhooks();
    yield* Effect.forEach(
      residual.filter((webhook) => webhook.webhookUrl.href === webhookUrl.href),
      (webhook) => management.deleteWebhook(webhook.id),
      { concurrency: 1, discard: true }
    );
    return yield* new PhotonProviderProofError({
      operation: "registerWebhook",
      reason: "requestFailed",
    });
  }

  const final = yield* management.listWebhooks();
  const matching = final.filter(
    (webhook) =>
      webhook.id === createExit.value.id &&
      webhook.webhookUrl.href === webhookUrl.href
  );
  if (matching.length !== 1) {
    yield* management.deleteWebhook(createExit.value.id);
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
      finalWebhookCount: final.length,
      managementAuthenticated: true,
      preexistingWebhookCount: baseline.length,
      status: "registered",
      webhookCreated: true,
      webhookReadBack: true,
    }),
  };
});

import { Config, Effect, Exit, Redacted, Schema } from "effect";

import { PhotonLifecycleProbe } from "./lifecycle-probe.js";
import { PhotonManagement } from "./management.js";
import { PhotonProviderProofError } from "./provider-proof.error.js";
import {
  PhotonConfig,
  PhotonProjectId,
  PhotonProjectSecret,
  PhotonWebhookToleranceSeconds,
} from "./schemas.js";
import type {
  PhotonProjectId as PhotonProjectIdType,
  PhotonProjectSecret as PhotonProjectSecretType,
} from "./schemas.js";

export const PhotonProviderProofReceipt = Schema.Struct({
  dedicatedLineMutation: Schema.Literal(false),
  finalWebhookCount: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  managementAuthenticated: Schema.Literal(true),
  messageMutation: Schema.Literal(false),
  preexistingWebhookCount: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  sdkLifecycleReleased: Schema.Literal(true),
  signingSecretObservedOnce: Schema.Literal(true),
  staleProofWebhookRecovered: Schema.Boolean,
  status: Schema.Literal("proved"),
  topologyRestored: Schema.Literal(true),
  webhookCreated: Schema.Literal(true),
  webhookDeleted: Schema.Literal(true),
  webhookListedAfterCreate: Schema.Literal(true),
});
export type PhotonProviderProofReceipt = typeof PhotonProviderProofReceipt.Type;

const projectIdConfig = Config.schema(PhotonProjectId, "PHOTON_PROJECT_ID");
const projectSecretConfig = Config.schema(
  PhotonProjectSecret,
  "PHOTON_PROJECT_SECRET"
);

export const loadPhotonProviderProofConfig = Effect.gen(
  function* loadPhotonProviderProofConfig() {
    return {
      projectId: yield* projectIdConfig,
      projectSecret: yield* projectSecretConfig,
    };
  }
);

export const provePhotonProvider = (
  projectId: PhotonProjectIdType,
  projectSecret: PhotonProjectSecretType,
  proofWebhookUrl: URL
) =>
  Effect.gen(function* provePhotonProvider() {
    const management = yield* PhotonManagement;
    const lifecycle = yield* PhotonLifecycleProbe;
    const discovered = yield* management.listWebhooks();
    const staleProofWebhooks = discovered.filter(
      (webhook) => webhook.webhookUrl.href === proofWebhookUrl.href
    );
    yield* Effect.forEach(
      staleProofWebhooks,
      (webhook) => management.deleteWebhook(webhook.id),
      { concurrency: 1, discard: true }
    );
    const baseline = yield* management.listWebhooks();
    const tolerance = yield* Schema.decodeEffect(PhotonWebhookToleranceSeconds)(
      300
    );
    const attempt = yield* Effect.exit(
      Effect.acquireUseRelease(
        management.registerWebhook(proofWebhookUrl),
        (created) =>
          Effect.gen(function* useProofWebhook() {
            const observed = yield* management.listWebhooks();
            const matching = observed.filter(
              (webhook) =>
                webhook.id === created.id &&
                webhook.webhookUrl.href === proofWebhookUrl.href
            );
            if (matching.length !== 1) {
              return yield* new PhotonProviderProofError({
                operation: "assert",
                reason: "resourceConflict",
              });
            }
            const config = PhotonConfig.make({
              projectId,
              projectSecret,
              webhookId: created.id,
              webhookSecret: created.signingSecret,
              webhookToleranceSeconds: tolerance,
            });
            if (Redacted.value(created.signingSecret).length === 0) {
              return yield* new PhotonProviderProofError({
                operation: "assert",
                reason: "invalidResponse",
              });
            }
            yield* lifecycle.run(config);
            return {
              signingSecretObservedOnce: true,
              webhookListedAfterCreate: true,
            } as const;
          }),
        (created) => management.deleteWebhook(created.id)
      )
    );
    const possiblyResidual = yield* management.listWebhooks();
    yield* Effect.forEach(
      possiblyResidual.filter(
        (webhook) => webhook.webhookUrl.href === proofWebhookUrl.href
      ),
      (webhook) => management.deleteWebhook(webhook.id),
      { concurrency: 1, discard: true }
    );
    const final = yield* management.listWebhooks();
    const topologyRestored =
      final.length === baseline.length &&
      final.every(
        (webhook) => webhook.webhookUrl.href !== proofWebhookUrl.href
      );
    if (!topologyRestored) {
      return yield* new PhotonProviderProofError({
        operation: "assert",
        reason: "topologyNotRestored",
      });
    }
    if (Exit.isFailure(attempt)) {
      return yield* new PhotonProviderProofError({
        operation: "assert",
        reason: "lifecycleUnavailable",
      });
    }
    return PhotonProviderProofReceipt.make({
      dedicatedLineMutation: false,
      finalWebhookCount: final.length,
      managementAuthenticated: true,
      messageMutation: false,
      preexistingWebhookCount: baseline.length,
      sdkLifecycleReleased: true,
      signingSecretObservedOnce: attempt.value.signingSecretObservedOnce,
      staleProofWebhookRecovered: staleProofWebhooks.length > 0,
      status: "proved",
      topologyRestored: true,
      webhookCreated: true,
      webhookDeleted: true,
      webhookListedAfterCreate: attempt.value.webhookListedAfterCreate,
    });
  });

import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";

import {
  deletePhotonEnvironmentWebhook,
  registerPhotonEnvironmentWebhook,
} from "../src/environment-webhook.js";
import { PhotonManagement } from "../src/management.js";
import { PhotonProviderProofError } from "../src/provider-proof.error.js";
import { PhotonWebhookId, PhotonWebhookSecret } from "../src/schemas.js";

const fixtures = Effect.gen(function* decodeEnvironmentWebhookFixtures() {
  return {
    webhookId: yield* Schema.decodeEffect(PhotonWebhookId)(
      "60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"
    ),
    webhookSecret: yield* Schema.decodeEffect(PhotonWebhookSecret)(
      Redacted.make("synthetic-webhook-secret")
    ),
  };
});

const unusedOperations = {
  checkSharedAvailability: () => Effect.die("unexpected availability"),
  createSharedUser: () => Effect.die("unexpected user create"),
  deleteSharedUser: () => Effect.die("unexpected user delete"),
  getIMessagePlatform: () => Effect.die("unexpected platform read"),
  getIMessageService: () => Effect.die("unexpected service read"),
  listSharedUsers: () => Effect.die("unexpected user list"),
  setIMessagePlatformEnabled: () => Effect.die("unexpected platform write"),
} as const;

it.effect("registers and reads back one exact environment webhook", () =>
  Effect.gen(function* registerEnvironmentWebhook() {
    const fixture = yield* fixtures;
    const webhookUrl = new URL("https://preview.example.invalid/webhook");
    let webhooks: {
      readonly id: typeof PhotonWebhookId.Type;
      readonly webhookUrl: URL;
    }[] = [];
    const management = PhotonManagement.of({
      ...unusedOperations,
      deleteWebhook: () => Effect.die("unexpected delete"),
      listWebhooks: () => Effect.sync(() => webhooks),
      registerWebhook: (target) =>
        Effect.sync(() => {
          webhooks = [{ id: fixture.webhookId, webhookUrl: target }];
          return {
            id: fixture.webhookId,
            signingSecret: fixture.webhookSecret,
            webhookUrl: target,
          };
        }),
    });

    const result = yield* registerPhotonEnvironmentWebhook(webhookUrl).pipe(
      Effect.provide(Layer.succeed(PhotonManagement, management))
    );

    assert.strictEqual(result.receipt.status, "registered");
    assert.strictEqual(result.receipt.preexistingWebhookCount, 0);
    assert.strictEqual(result.receipt.finalWebhookCount, 1);
    assert.strictEqual(result.binding.webhookId, fixture.webhookId);
    assert.strictEqual(
      Redacted.value(result.binding.webhookSecret),
      "synthetic-webhook-secret"
    );
  })
);

it.effect(
  "blocks an existing target without replacing its write-only secret",
  () =>
    Effect.gen(function* rejectExistingEnvironmentWebhook() {
      const fixture = yield* fixtures;
      const webhookUrl = new URL("https://preview.example.invalid/webhook");
      const management = PhotonManagement.of({
        ...unusedOperations,
        deleteWebhook: () => Effect.die("unexpected delete"),
        listWebhooks: () =>
          Effect.succeed([{ id: fixture.webhookId, webhookUrl }]),
        registerWebhook: () => Effect.die("unexpected register"),
      });

      const error = yield* registerPhotonEnvironmentWebhook(webhookUrl).pipe(
        Effect.provide(Layer.succeed(PhotonManagement, management)),
        Effect.flip
      );

      assert.strictEqual(Schema.is(PhotonProviderProofError)(error), true);
      assert.strictEqual(error.reason, "resourceConflict");
    })
);

it.effect("deletes exactly one target and proves its absence", () =>
  Effect.gen(function* deleteEnvironmentWebhook() {
    const fixture = yield* fixtures;
    const webhookUrl = new URL("https://preview.example.invalid/webhook");
    let webhooks = [{ id: fixture.webhookId, webhookUrl }];
    const management = PhotonManagement.of({
      ...unusedOperations,
      deleteWebhook: (webhookId) =>
        Effect.sync(() => {
          webhooks = webhooks.filter((webhook) => webhook.id !== webhookId);
        }),
      listWebhooks: () => Effect.sync(() => webhooks),
      registerWebhook: () => Effect.die("unexpected register"),
    });

    const receipt = yield* deletePhotonEnvironmentWebhook(webhookUrl).pipe(
      Effect.provide(Layer.succeed(PhotonManagement, management))
    );

    assert.strictEqual(receipt.status, "deleted");
    assert.strictEqual(receipt.preexistingMatchingWebhookCount, 1);
    assert.strictEqual(receipt.finalMatchingWebhookCount, 0);
    assert.strictEqual(webhooks.length, 0);
  })
);

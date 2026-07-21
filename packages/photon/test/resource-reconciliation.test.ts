import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";

import { PhotonManagement } from "../src/management.js";
import { PhotonProviderProofError } from "../src/provider-proof.error.js";
import { reconcilePhotonResources } from "../src/resource-reconciliation.js";
import {
  PhotonLineId,
  PhotonSubscriptionTier,
  PhotonWebhookId,
  PhotonWebhookSecret,
} from "../src/schemas.js";

const fixtures = Effect.gen(function* decodeReconciliationFixtures() {
  return {
    lineId: yield* Schema.decodeEffect(PhotonLineId)(
      "60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"
    ),
    businessTier: yield* Schema.decodeEffect(PhotonSubscriptionTier)(
      "business"
    ),
    freeTier: yield* Schema.decodeEffect(PhotonSubscriptionTier)("free"),
    webhookId: yield* Schema.decodeEffect(PhotonWebhookId)(
      "5e53fe3d-0776-424d-9713-f76f28459d41"
    ),
    webhookSecret: yield* Schema.decodeEffect(PhotonWebhookSecret)(
      Redacted.make("synthetic-webhook-secret")
    ),
  };
});

it.effect("inspects provider topology without mutation", () =>
  Effect.gen(function* inspectPhotonResources() {
    const fixture = yield* fixtures;
    let writes = 0;
    const management = PhotonManagement.of({
      createDedicatedLine: () => {
        writes += 1;
        return Effect.die("unexpected create");
      },
      deleteDedicatedLine: () => Effect.die("unexpected delete"),
      deleteWebhook: () => Effect.die("unexpected delete"),
      getIMessagePlatform: () => Effect.succeed({ enabled: false }),
      getSubscription: () =>
        Effect.succeed({ status: null, tier: fixture.freeTier }),
      listDedicatedLines: () => Effect.succeed([]),
      listWebhooks: () =>
        Effect.succeed([
          {
            id: fixture.webhookId,
            webhookUrl: new URL("https://example.invalid/webhook"),
          },
        ]),
      registerWebhook: () => Effect.die("unexpected register"),
      setIMessagePlatformEnabled: () => {
        writes += 1;
        return Effect.die("unexpected platform update");
      },
    });

    const receipt = yield* reconcilePhotonResources("inspect").pipe(
      Effect.provide(Layer.succeed(PhotonManagement, management))
    );

    assert.strictEqual(receipt.status, "inspected");
    assert.strictEqual(receipt.platformEnabled, false);
    assert.strictEqual(receipt.initialDedicatedLineCount, 0);
    assert.strictEqual(receipt.lineCreationEligible, false);
    assert.strictEqual(receipt.subscriptionTier, "free");
    assert.strictEqual(receipt.webhookCount, 1);
    assert.strictEqual(writes, 0);
  })
);

it.effect("enables iMessage and creates one dedicated line exactly once", () =>
  Effect.gen(function* createPhotonLine() {
    const fixture = yield* fixtures;
    let creates = 0;
    let enabled = false;
    const management = PhotonManagement.of({
      createDedicatedLine: () => {
        creates += 1;
        return Effect.succeed({
          billingSyncStatus: "in_sync",
          line: { id: fixture.lineId, status: "available" },
        });
      },
      deleteDedicatedLine: () => Effect.die("unexpected delete"),
      deleteWebhook: () => Effect.die("unexpected delete"),
      getIMessagePlatform: () => Effect.succeed({ enabled }),
      getSubscription: () =>
        Effect.succeed({ status: "active", tier: fixture.businessTier }),
      listDedicatedLines: () =>
        Effect.succeed(
          creates === 0
            ? []
            : [{ id: fixture.lineId, status: "available" as const }]
        ),
      listWebhooks: () => Effect.succeed([]),
      registerWebhook: () =>
        Effect.succeed({
          id: fixture.webhookId,
          signingSecret: fixture.webhookSecret,
          webhookUrl: new URL("https://example.invalid/webhook"),
        }),
      setIMessagePlatformEnabled: (next) => {
        enabled = next;
        return Effect.succeed({ enabled });
      },
    });

    const receipt = yield* reconcilePhotonResources("reconcile-line").pipe(
      Effect.provide(Layer.succeed(PhotonManagement, management))
    );

    assert.strictEqual(receipt.status, "reconciled");
    assert.strictEqual(receipt.platformAction, "enabled");
    assert.strictEqual(receipt.lineAction, "created");
    assert.strictEqual(receipt.billingSyncStatus, "in_sync");
    assert.strictEqual(creates, 1);
  })
);

it.effect("blocks an ambiguous or unhealthy line inventory", () =>
  Effect.gen(function* rejectUnsafeLineInventory() {
    const fixture = yield* fixtures;
    const management = PhotonManagement.of({
      createDedicatedLine: () => Effect.die("unexpected create"),
      deleteDedicatedLine: () => Effect.die("unexpected delete"),
      deleteWebhook: () => Effect.die("unexpected delete"),
      getIMessagePlatform: () => Effect.succeed({ enabled: true }),
      getSubscription: () =>
        Effect.succeed({ status: "active", tier: fixture.businessTier }),
      listDedicatedLines: () =>
        Effect.succeed([{ id: fixture.lineId, status: "unavailable" }]),
      listWebhooks: () => Effect.succeed([]),
      registerWebhook: () => Effect.die("unexpected register"),
      setIMessagePlatformEnabled: () => Effect.die("unexpected update"),
    });

    const error = yield* reconcilePhotonResources("reconcile-line").pipe(
      Effect.provide(Layer.succeed(PhotonManagement, management)),
      Effect.flip
    );

    assert.strictEqual(Schema.is(PhotonProviderProofError)(error), true);
    assert.strictEqual(error.reason, "resourceConflict");
  })
);

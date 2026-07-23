import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";

import { PhotonManagement } from "../src/management.js";
import { PhotonProviderProofError } from "../src/provider-proof.error.js";
import { reconcilePhotonResources } from "../src/resource-reconciliation.js";
import {
  PhotonE164PhoneNumber,
  PhotonSharedUserPhoneNumber,
  PhotonUserId,
  PhotonWebhookId,
  PhotonWebhookSecret,
} from "../src/schemas.js";

const fixtures = Effect.gen(function* decodeReconciliationFixtures() {
  return {
    assignedPhoneNumber: yield* Schema.decodeEffect(PhotonE164PhoneNumber)(
      "+14155550177"
    ),
    phoneNumber: yield* Schema.decodeEffect(PhotonE164PhoneNumber)(
      "+14155550199"
    ),
    redactedPhoneNumber: yield* Schema.decodeEffect(
      PhotonSharedUserPhoneNumber
    )(Redacted.make("+14155550199")),
    userId: yield* Schema.decodeEffect(PhotonUserId)(
      "60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"
    ),
    webhookId: yield* Schema.decodeEffect(PhotonWebhookId)(
      "5e53fe3d-0776-424d-9713-f76f28459d41"
    ),
    webhookSecret: yield* Schema.decodeEffect(PhotonWebhookSecret)(
      Redacted.make("synthetic-webhook-secret")
    ),
  };
});

it.effect("inspects the Free managed-shared topology without mutation", () =>
  Effect.gen(function* inspectPhotonResources() {
    const fixture = yield* fixtures;
    let writes = 0;
    const management = PhotonManagement.of({
      checkSharedAvailability: () => Effect.die("unexpected availability"),
      createSharedUser: () => {
        writes += 1;
        return Effect.die("unexpected create");
      },
      deleteSharedUser: () => Effect.die("unexpected delete"),
      deleteWebhook: () => Effect.die("unexpected delete"),
      getIMessagePlatform: () => Effect.succeed({ enabled: false }),
      getIMessageService: () => Effect.succeed({ type: "shared" }),
      listSharedUsers: () => Effect.succeed([]),
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
    assert.strictEqual(receipt.serviceType, "shared");
    assert.strictEqual(receipt.platformEnabled, false);
    assert.strictEqual(receipt.initialSharedUserCount, 0);
    assert.strictEqual(receipt.dedicatedLineCount, 0);
    assert.strictEqual(receipt.webhookCount, 1);
    assert.strictEqual(writes, 0);
  })
);

it.effect(
  "enables iMessage and creates one approved shared user exactly once",
  () =>
    Effect.gen(function* createPhotonSharedUser() {
      const fixture = yield* fixtures;
      let creates = 0;
      let enabled = false;
      const user = {
        id: fixture.userId,
        phoneNumber: fixture.phoneNumber,
        assignedPhoneNumber: fixture.assignedPhoneNumber,
      };
      const management = PhotonManagement.of({
        checkSharedAvailability: () => Effect.succeed(true),
        createSharedUser: () => {
          creates += 1;
          return Effect.succeed(user);
        },
        deleteSharedUser: () => Effect.die("unexpected delete"),
        deleteWebhook: () => Effect.die("unexpected delete"),
        getIMessagePlatform: () => Effect.succeed({ enabled }),
        getIMessageService: () => Effect.succeed({ type: "shared" }),
        listSharedUsers: () => Effect.succeed(creates === 0 ? [] : [user]),
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

      const receipt = yield* reconcilePhotonResources(
        "reconcile-shared-user",
        fixture.redactedPhoneNumber
      ).pipe(Effect.provide(Layer.succeed(PhotonManagement, management)));

      assert.strictEqual(receipt.status, "reconciled");
      assert.strictEqual(receipt.platformAction, "enabled");
      assert.strictEqual(receipt.sharedUserAction, "created");
      assert.strictEqual(receipt.assignmentPresent, true);
      assert.strictEqual(receipt.approvedSharedUserCount, 1);
      assert.strictEqual(creates, 1);
    })
);

it.effect(
  "adopts the exact existing shared user without availability or create",
  () =>
    Effect.gen(function* adoptPhotonSharedUser() {
      const fixture = yield* fixtures;
      const user = {
        id: fixture.userId,
        phoneNumber: fixture.phoneNumber,
        assignedPhoneNumber: fixture.assignedPhoneNumber,
      };
      const management = PhotonManagement.of({
        checkSharedAvailability: () => Effect.die("unexpected availability"),
        createSharedUser: () => Effect.die("unexpected create"),
        deleteSharedUser: () => Effect.die("unexpected delete"),
        deleteWebhook: () => Effect.die("unexpected delete"),
        getIMessagePlatform: () => Effect.succeed({ enabled: true }),
        getIMessageService: () => Effect.succeed({ type: "shared" }),
        listSharedUsers: () => Effect.succeed([user]),
        listWebhooks: () => Effect.succeed([]),
        registerWebhook: () => Effect.die("unexpected register"),
        setIMessagePlatformEnabled: () => Effect.die("unexpected update"),
      });

      const receipt = yield* reconcilePhotonResources(
        "reconcile-shared-user",
        fixture.redactedPhoneNumber
      ).pipe(Effect.provide(Layer.succeed(PhotonManagement, management)));

      assert.strictEqual(receipt.sharedUserAction, "adopted");
      assert.strictEqual(receipt.initialSharedUserCount, 1);
      assert.strictEqual(receipt.finalSharedUserCount, 1);
    })
);

it.effect("blocks a dedicated service or unavailable shared identity", () =>
  Effect.gen(function* rejectUnsafeTopology() {
    const fixture = yield* fixtures;
    const management = PhotonManagement.of({
      checkSharedAvailability: () => Effect.succeed(false),
      createSharedUser: () => Effect.die("unexpected create"),
      deleteSharedUser: () => Effect.die("unexpected delete"),
      deleteWebhook: () => Effect.die("unexpected delete"),
      getIMessagePlatform: () => Effect.succeed({ enabled: true }),
      getIMessageService: () => Effect.succeed({ type: "dedicated" }),
      listSharedUsers: () => Effect.succeed([]),
      listWebhooks: () => Effect.succeed([]),
      registerWebhook: () => Effect.die("unexpected register"),
      setIMessagePlatformEnabled: () => Effect.die("unexpected update"),
    });

    const error = yield* reconcilePhotonResources(
      "reconcile-shared-user",
      fixture.redactedPhoneNumber
    ).pipe(
      Effect.provide(Layer.succeed(PhotonManagement, management)),
      Effect.flip
    );

    assert.strictEqual(Schema.is(PhotonProviderProofError)(error), true);
    assert.strictEqual(error.reason, "resourceConflict");
  })
);

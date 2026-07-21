import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";

import { PhotonLifecycleProbe } from "../src/lifecycle-probe.js";
import { PhotonManagement } from "../src/management.js";
import { PhotonProviderProofError } from "../src/provider-proof.error.js";
import { provePhotonProvider } from "../src/provider-proof.js";
import { PhotonProjectId, PhotonWebhookId } from "../src/schemas.js";

const proofWebhookUrl = new URL(
  "/bundjil-photon-provider-proof",
  "https://example.invalid"
);

const fixtures = Effect.gen(function* decodeProviderProofFixtures() {
  return {
    projectId: yield* Schema.decodeEffect(PhotonProjectId)("test-project"),
    projectSecret: Redacted.make("test-project-secret"),
    webhookId: yield* Schema.decodeEffect(PhotonWebhookId)(
      "60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"
    ),
    webhookSecret: Redacted.make("test-webhook-secret"),
  };
});

it.effect(
  "proves create, read, SDK lifecycle, delete, and restored topology",
  () =>
    Effect.gen(function* proveRestoredTopology() {
      const fixture = yield* fixtures;
      let webhooks: {
        readonly id: typeof PhotonWebhookId.Type;
        readonly webhookUrl: URL;
      }[] = [];
      let lifecycleRuns = 0;
      const management = PhotonManagement.of({
        deleteWebhook: (webhookId) =>
          Effect.sync(() => {
            webhooks = webhooks.filter((webhook) => webhook.id !== webhookId);
          }),
        listWebhooks: () => Effect.sync(() => webhooks),
        registerWebhook: (webhookUrl) =>
          Effect.sync(() => {
            webhooks = [{ id: fixture.webhookId, webhookUrl }];
            return {
              id: fixture.webhookId,
              signingSecret: fixture.webhookSecret,
              webhookUrl,
            };
          }),
      });
      const lifecycle = PhotonLifecycleProbe.of({
        run: () =>
          Effect.sync(() => {
            lifecycleRuns += 1;
          }),
      });
      const receipt = yield* provePhotonProvider(
        fixture.projectId,
        fixture.projectSecret,
        proofWebhookUrl
      ).pipe(
        Effect.provide(
          Layer.merge(
            Layer.succeed(PhotonManagement, management),
            Layer.succeed(PhotonLifecycleProbe, lifecycle)
          )
        )
      );

      assert.strictEqual(receipt.status, "proved");
      assert.strictEqual(receipt.topologyRestored, true);
      assert.strictEqual(receipt.preexistingWebhookCount, 0);
      assert.strictEqual(receipt.finalWebhookCount, 0);
      assert.strictEqual(lifecycleRuns, 1);
      assert.deepStrictEqual(webhooks, []);
    })
);

it.effect("removes the exact proof webhook when SDK acquisition fails", () =>
  Effect.gen(function* cleanAfterLifecycleFailure() {
    const fixture = yield* fixtures;
    let webhooks: {
      readonly id: typeof PhotonWebhookId.Type;
      readonly webhookUrl: URL;
    }[] = [];
    const management = PhotonManagement.of({
      deleteWebhook: (webhookId) =>
        Effect.sync(() => {
          webhooks = webhooks.filter((webhook) => webhook.id !== webhookId);
        }),
      listWebhooks: () => Effect.sync(() => webhooks),
      registerWebhook: (webhookUrl) =>
        Effect.sync(() => {
          webhooks = [{ id: fixture.webhookId, webhookUrl }];
          return {
            id: fixture.webhookId,
            signingSecret: fixture.webhookSecret,
            webhookUrl,
          };
        }),
    });
    const lifecycle = PhotonLifecycleProbe.of({
      run: () =>
        Effect.fail(
          new PhotonProviderProofError({
            operation: "sdkLifecycle",
            reason: "lifecycleUnavailable",
          })
        ),
    });
    const failure = yield* provePhotonProvider(
      fixture.projectId,
      fixture.projectSecret,
      proofWebhookUrl
    ).pipe(
      Effect.provide(
        Layer.merge(
          Layer.succeed(PhotonManagement, management),
          Layer.succeed(PhotonLifecycleProbe, lifecycle)
        )
      ),
      Effect.flip
    );

    assert.strictEqual(Schema.is(PhotonProviderProofError)(failure), true);
    assert.deepStrictEqual(webhooks, []);
  })
);

it.effect(
  "recovers an ambiguous create by matching only the reserved proof URL",
  () =>
    Effect.gen(function* recoverAmbiguousCreate() {
      const fixture = yield* fixtures;
      const unrelatedId = yield* Schema.decodeEffect(PhotonWebhookId)(
        "00000000-0000-0000-0000-000000000000"
      );
      const unrelated = {
        id: unrelatedId,
        webhookUrl: new URL("https://unrelated.example.test/webhook"),
      };
      let webhooks = [unrelated];
      const management = PhotonManagement.of({
        deleteWebhook: (webhookId) =>
          Effect.sync(() => {
            webhooks = webhooks.filter((webhook) => webhook.id !== webhookId);
          }),
        listWebhooks: () => Effect.sync(() => webhooks),
        registerWebhook: (webhookUrl) =>
          Effect.gen(function* loseCreateResponse() {
            webhooks = [...webhooks, { id: fixture.webhookId, webhookUrl }];
            return yield* new PhotonProviderProofError({
              operation: "registerWebhook",
              reason: "requestFailed",
            });
          }),
      });
      const lifecycle = PhotonLifecycleProbe.of({ run: () => Effect.void });
      yield* provePhotonProvider(
        fixture.projectId,
        fixture.projectSecret,
        proofWebhookUrl
      ).pipe(
        Effect.provide(
          Layer.merge(
            Layer.succeed(PhotonManagement, management),
            Layer.succeed(PhotonLifecycleProbe, lifecycle)
          )
        ),
        Effect.flip
      );

      assert.deepStrictEqual(webhooks, [unrelated]);
    })
);

it.effect("rejects unrelated same-count topology drift", () =>
  Effect.gen(function* rejectSameCountDrift() {
    const fixture = yield* fixtures;
    const originalId = yield* Schema.decodeEffect(PhotonWebhookId)(
      "11111111-1111-4111-8111-111111111111"
    );
    const replacementId = yield* Schema.decodeEffect(PhotonWebhookId)(
      "22222222-2222-4222-8222-222222222222"
    );
    const original = {
      id: originalId,
      webhookUrl: new URL("https://original.example.test/webhook"),
    };
    const replacement = {
      id: replacementId,
      webhookUrl: new URL("https://replacement.example.test/webhook"),
    };
    let webhooks = [original];
    const management = PhotonManagement.of({
      deleteWebhook: (webhookId) =>
        Effect.sync(() => {
          webhooks =
            webhookId === fixture.webhookId
              ? [replacement]
              : webhooks.filter((webhook) => webhook.id !== webhookId);
        }),
      listWebhooks: () => Effect.sync(() => webhooks),
      registerWebhook: (webhookUrl) =>
        Effect.sync(() => {
          webhooks = [...webhooks, { id: fixture.webhookId, webhookUrl }];
          return {
            id: fixture.webhookId,
            signingSecret: fixture.webhookSecret,
            webhookUrl,
          };
        }),
    });
    const lifecycle = PhotonLifecycleProbe.of({ run: () => Effect.void });
    const failure = yield* provePhotonProvider(
      fixture.projectId,
      fixture.projectSecret,
      proofWebhookUrl
    ).pipe(
      Effect.provide(
        Layer.merge(
          Layer.succeed(PhotonManagement, management),
          Layer.succeed(PhotonLifecycleProbe, lifecycle)
        )
      ),
      Effect.flip
    );

    const providerFailure = yield* Schema.decodeUnknownEffect(
      PhotonProviderProofError
    )(failure);
    assert.strictEqual(providerFailure.reason, "topologyNotRestored");
    assert.deepStrictEqual(webhooks, [replacement]);
  })
);

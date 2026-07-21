import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import {
  layerPhotonManagementLive,
  PhotonManagement,
} from "../src/management.js";
import { PhotonProviderProofError } from "../src/provider-proof.error.js";
import {
  PhotonLineId,
  PhotonProjectId,
  PhotonProjectSecret,
  PhotonSubscriptionTier,
} from "../src/schemas.js";

const fixtures = Effect.gen(function* decodeManagementFixtures() {
  return {
    lineId: yield* Schema.decodeEffect(PhotonLineId)(
      "60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"
    ),
    projectId: yield* Schema.decodeEffect(PhotonProjectId)("test-project"),
    projectSecret: yield* Schema.decodeEffect(PhotonProjectSecret)(
      Redacted.make("test-project-secret")
    ),
    subscriptionTier: yield* Schema.decodeEffect(PhotonSubscriptionTier)(
      "business"
    ),
  };
});

const providerLine = (lineId: string) => ({
  platform: "imessage",
  id: lineId,
  phoneNumber: "+14155550177",
  profile: { firstName: null, lastName: null, avatarUrl: null },
  status: "available",
  createdAt: "2026-07-21T00:00:00.000Z",
});

const layer = (
  client: HttpClient.HttpClient,
  projectId: typeof PhotonProjectId.Type,
  projectSecret: typeof PhotonProjectSecret.Type
) =>
  layerPhotonManagementLive(projectId, projectSecret).pipe(
    Layer.provide(Layer.succeed(HttpClient.HttpClient, client))
  );

it.effect(
  "decodes platform and dedicated-line lifecycle without exposing phone or billing amounts",
  () =>
    Effect.gen(function* proveManagementContracts() {
      const fixture = yield* fixtures;
      const requests: {
        readonly method: string;
        readonly url: string;
        readonly urlParams: readonly (readonly [string, string])[];
      }[] = [];
      const client = HttpClient.make((request) => {
        requests.push({
          method: request.method,
          url: request.url,
          urlParams: [...request.urlParams],
        });
        const response = (() => {
          if (request.url.endsWith("platforms/") && request.method === "GET") {
            return { succeed: true, data: { imessage: { enabled: false } } };
          }
          if (
            request.url.endsWith("billing/subscription") &&
            request.method === "GET"
          ) {
            return {
              succeed: true,
              data: {
                tier: "business",
                status: "active",
                cancel_at_period_end: false,
                subscription_id: "subscription-secret",
                customer_id: "customer-secret",
              },
            };
          }
          if (
            request.url.endsWith("platforms/") &&
            request.method === "PATCH"
          ) {
            return { succeed: true, data: { imessage: { enabled: true } } };
          }
          if (request.method === "GET" && request.url.includes("/lines/")) {
            return {
              succeed: true,
              data: { lines: [providerLine(fixture.lineId)] },
            };
          }
          if (request.url.endsWith("lines/") && request.method === "POST") {
            return {
              succeed: true,
              data: {
                line: providerLine(fixture.lineId),
                billing: {
                  quantity: 1,
                  prorationAmount: 1.23,
                  syncStatus: "in_sync",
                },
              },
            };
          }
          return {
            succeed: true,
            data: {
              billing: {
                quantity: 0,
                prorationAmount: -1.23,
                syncStatus: "in_sync",
              },
            },
          };
        })();
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            Response.json(response, {
              status: 200,
              headers: { "content-type": "application/json" },
            })
          )
        );
      });

      const result = yield* Effect.gen(function* runManagementOperations() {
        const management = yield* PhotonManagement;
        const before = yield* management.getIMessagePlatform();
        const subscription = yield* management.getSubscription();
        const enabled = yield* management.setIMessagePlatformEnabled(true);
        const listed = yield* management.listDedicatedLines();
        const created = yield* management.createDedicatedLine();
        const deleted = yield* management.deleteDedicatedLine(fixture.lineId);
        return { before, created, deleted, enabled, listed, subscription };
      }).pipe(
        Effect.provide(layer(client, fixture.projectId, fixture.projectSecret))
      );

      assert.deepStrictEqual(result.before, { enabled: false });
      assert.deepStrictEqual(result.subscription, {
        status: "active",
        tier: fixture.subscriptionTier,
      });
      assert.deepStrictEqual(result.enabled, { enabled: true });
      assert.deepStrictEqual(result.listed, [
        { id: fixture.lineId, status: "available" },
      ]);
      assert.deepStrictEqual(result.created, {
        line: { id: fixture.lineId, status: "available" },
        billingSyncStatus: "in_sync",
      });
      assert.deepStrictEqual(result.deleted, {
        billingChanged: true,
        billingSyncStatus: "in_sync",
      });
      assert.deepStrictEqual(requests, [
        {
          method: "GET",
          url: "https://spectrum.photon.codes/projects/test-project/platforms/",
          urlParams: [],
        },
        {
          method: "GET",
          url: "https://spectrum.photon.codes/projects/test-project/billing/subscription",
          urlParams: [],
        },
        {
          method: "PATCH",
          url: "https://spectrum.photon.codes/projects/test-project/platforms/",
          urlParams: [],
        },
        {
          method: "GET",
          url: "https://spectrum.photon.codes/projects/test-project/lines/",
          urlParams: [["platform", "imessage"]],
        },
        {
          method: "POST",
          url: "https://spectrum.photon.codes/projects/test-project/lines/",
          urlParams: [],
        },
        {
          method: "DELETE",
          url: `https://spectrum.photon.codes/projects/test-project/lines/${fixture.lineId}`,
          urlParams: [],
        },
      ]);
    })
);

it.effect("fails safely when the platform response omits iMessage", () =>
  Effect.gen(function* rejectIncompletePlatformResponse() {
    const fixture = yield* fixtures;
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          Response.json(
            { succeed: true, data: {} },
            {
              status: 200,
              headers: { "content-type": "application/json" },
            }
          )
        )
      )
    );
    const failure = yield* Effect.gen(function* getMissingPlatform() {
      const management = yield* PhotonManagement;
      return yield* management.getIMessagePlatform();
    }).pipe(
      Effect.provide(layer(client, fixture.projectId, fixture.projectSecret)),
      Effect.flip
    );

    assert.strictEqual(Schema.is(PhotonProviderProofError)(failure), true);
    assert.strictEqual(failure.operation, "getPlatforms");
    assert.strictEqual(failure.reason, "invalidResponse");
  })
);

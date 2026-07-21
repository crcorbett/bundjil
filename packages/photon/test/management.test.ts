import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import {
  layerPhotonManagementLive,
  PhotonManagement,
} from "../src/management.js";
import { PhotonProviderProofError } from "../src/provider-proof.error.js";
import {
  PhotonE164PhoneNumber,
  PhotonProjectId,
  PhotonProjectSecret,
  PhotonUserId,
} from "../src/schemas.js";

const fixtures = Effect.gen(function* decodeManagementFixtures() {
  return {
    assignedPhoneNumber: yield* Schema.decodeEffect(PhotonE164PhoneNumber)(
      "+14155550177"
    ),
    phoneNumber: yield* Schema.decodeEffect(PhotonE164PhoneNumber)(
      "+14155550199"
    ),
    projectId: yield* Schema.decodeEffect(PhotonProjectId)(
      "ab96fc27-475d-4a52-a52e-bef2d4c66dde"
    ),
    projectSecret: yield* Schema.decodeEffect(PhotonProjectSecret)(
      Redacted.make("test-project-secret")
    ),
    userId: yield* Schema.decodeEffect(PhotonUserId)(
      "60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"
    ),
  };
});

const providerUser = (fixture: {
  readonly assignedPhoneNumber: string;
  readonly phoneNumber: string;
  readonly projectId: string;
  readonly userId: string;
}) => ({
  id: fixture.userId,
  projectId: fixture.projectId,
  type: "shared",
  firstName: null,
  lastName: null,
  email: null,
  phoneNumber: fixture.phoneNumber,
  assignedPhoneNumber: fixture.assignedPhoneNumber,
  meta: null,
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
  "decodes the managed-shared lifecycle through exact provider endpoints",
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
          if (request.url.endsWith("imessage/") && request.method === "GET") {
            return { succeed: true, data: { type: "shared" } };
          }
          if (request.url.endsWith("platforms/") && request.method === "GET") {
            return { succeed: true, data: { imessage: { enabled: false } } };
          }
          if (
            request.url.endsWith("platforms/") &&
            request.method === "PATCH"
          ) {
            return { succeed: true, data: { imessage: { enabled: true } } };
          }
          if (
            request.url.endsWith("availability") &&
            request.method === "GET"
          ) {
            return { succeed: true, data: { available: true } };
          }
          if (request.url.endsWith("users/") && request.method === "GET") {
            return {
              succeed: true,
              data: { users: [providerUser(fixture)], total: 1 },
            };
          }
          if (request.url.endsWith("users/") && request.method === "POST") {
            return { succeed: true, data: providerUser(fixture) };
          }
          return { succeed: true, data: { userId: fixture.userId } };
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
        const service = yield* management.getIMessageService();
        const before = yield* management.getIMessagePlatform();
        const enabled = yield* management.setIMessagePlatformEnabled(true);
        const available = yield* management.checkSharedAvailability(
          fixture.phoneNumber
        );
        const listed = yield* management.listSharedUsers();
        const created = yield* management.createSharedUser(fixture.phoneNumber);
        yield* management.deleteSharedUser(fixture.userId);
        return { available, before, created, enabled, listed, service };
      }).pipe(
        Effect.provide(layer(client, fixture.projectId, fixture.projectSecret))
      );

      const managedUser = {
        id: fixture.userId,
        phoneNumber: fixture.phoneNumber,
        assignedPhoneNumber: fixture.assignedPhoneNumber,
      };
      assert.deepStrictEqual(result, {
        available: true,
        before: { enabled: false },
        created: managedUser,
        enabled: { enabled: true },
        listed: [managedUser],
        service: { type: "shared" },
      });
      const base = `https://spectrum.photon.codes/projects/${fixture.projectId}`;
      assert.deepStrictEqual(requests, [
        { method: "GET", url: `${base}/imessage/`, urlParams: [] },
        { method: "GET", url: `${base}/platforms/`, urlParams: [] },
        { method: "PATCH", url: `${base}/platforms/`, urlParams: [] },
        {
          method: "GET",
          url: `${base}/imessage/shared/availability`,
          urlParams: [["phoneNumber", fixture.phoneNumber]],
        },
        {
          method: "GET",
          url: `${base}/users/`,
          urlParams: [
            ["type", "shared"],
            ["limit", "500"],
          ],
        },
        { method: "POST", url: `${base}/users/`, urlParams: [] },
        {
          method: "DELETE",
          url: `${base}/users/${fixture.userId}/`,
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

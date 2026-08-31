import { assert, it } from "@effect/vitest";
import { Effect, Fiber, Layer, Redacted, Schema } from "effect";
import * as TestClock from "effect/testing/TestClock";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import {
  DiscoverPhotonSharedUser,
  DiscoverPhotonWebhook,
  layerPhotonManagementMemory,
  ListedPhotonLines,
  ListedPhotonSharedUsers,
  ListedPhotonWebhooks,
  ListPhotonLines,
  ListPhotonSharedUsers,
  ListPhotonWebhooks,
  ObservePhotonBilling,
  ObservePhotonLine,
  ObservePhotonPlatform,
  ObservePhotonProject,
  ObservePhotonSharedUser,
  ObservePhotonWebhook,
  PhotonBilling,
  PhotonBillingAttributes,
  PhotonBillingObservation,
  PhotonCallbackOrigin,
  PhotonCallbackPath,
  PhotonLineId,
  PhotonLines,
  PhotonManagementCredentials,
  PhotonManagementCredentialsValue,
  PhotonManagementLive,
  PhotonManagementMemoryInventory,
  PhotonPaginationLimit,
  PhotonPaginationOffset,
  PhotonPlatformAttributes,
  PhotonPlatforms,
  PhotonProjectAttributes,
  PhotonProjectId,
  PhotonProjectName,
  PhotonProjects,
  PhotonProjectSecret,
  PhotonProjectSlug,
  PhotonSharedUserAttributes,
  PhotonSharedUserPhoneNumber,
  PhotonSharedUsers,
  PhotonSubscriptionTier,
  PhotonUserId,
  PhotonWebhookAttributes,
  PhotonWebhookCallbackUrl,
  PhotonWebhookId,
  PhotonWebhooks,
  PhotonWebhooksReadError,
} from "../src/management/index.js";
import { PhotonE164PhoneNumber } from "../src/schemas.js";

const fixture = {
  projectId: PhotonProjectId.make("ab96fc27-475d-4a52-a52e-bef2d4c66dde"),
  projectSecret: Schema.decodeSync(PhotonProjectSecret)(
    Redacted.make("test-project-secret-sentinel")
  ),
  userId: PhotonUserId.make("60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"),
  secondUserId: PhotonUserId.make("22d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"),
  webhookId: PhotonWebhookId.make("70d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"),
  lineId: PhotonLineId.make("80d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"),
  phone: PhotonE164PhoneNumber.make("+14155550199"),
  assigned: PhotonE164PhoneNumber.make("+14155550177"),
  callback: "https://preview.example.test/eve/v1/photon/webhook?token=private",
};

const providerUser = (id: string) => ({
  id,
  projectId: fixture.projectId,
  type: "shared",
  firstName: null,
  lastName: null,
  email: null,
  phoneNumber: fixture.phone,
  assignedPhoneNumber: fixture.assigned,
  meta: null,
  createdAt: "2026-07-24T00:00:00.000Z",
});

const liveLayer = (client: HttpClient.HttpClient) =>
  PhotonManagementLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(
          PhotonManagementCredentials,
          Effect.succeed(
            PhotonManagementCredentialsValue.make({
              projectId: fixture.projectId,
              projectSecret: fixture.projectSecret,
            })
          )
        ),
        Layer.succeed(HttpClient.HttpClient, client)
      )
    )
  );

const photonFailureResponse = (
  status: number,
  body: unknown,
  onRequest: () => void = () => {}
) =>
  HttpClient.make((request) =>
    Effect.sync(() => {
      onRequest();
      return HttpClientResponse.fromWeb(
        request,
        Response.json(body, {
          status,
          headers: {
            "content-type": "application/json",
            "retry-after": "1",
          },
        })
      );
    })
  );

it.effect(
  "observes the complete Photon topology with paged users and no writes",
  () =>
    Effect.gen(function* () {
      const requests: {
        readonly method: string;
        readonly url: string;
        readonly params: readonly (readonly [string, string])[];
      }[] = [];
      const client = HttpClient.make((request) => {
        const params = [...request.urlParams];
        requests.push({
          method: request.method,
          url: request.url,
          params,
        });
        const offset = params.find(([key]) => key === "offset")?.[1] ?? "0";
        const body = (() => {
          if (request.url.endsWith(`/projects/${fixture.projectId}/`)) {
            return {
              succeed: true,
              data: {
                name: "Bundjil",
                slug: "bundjil",
                profile: null,
              },
            };
          }
          if (request.url.endsWith("/platforms/")) {
            return {
              succeed: true,
              data: { imessage: { enabled: true, autoScale: false } },
            };
          }
          if (request.url.endsWith("/imessage/")) {
            return { succeed: true, data: { type: "shared" } };
          }
          if (request.url.endsWith("/users/")) {
            return {
              succeed: true,
              data: {
                users:
                  offset === "0"
                    ? [providerUser(fixture.userId)]
                    : [providerUser(fixture.secondUserId)],
                total: 2,
              },
            };
          }
          if (request.url.endsWith("/webhooks/")) {
            return {
              succeed: true,
              data: [
                {
                  id: fixture.webhookId,
                  webhookUrl: fixture.callback,
                  createdAt: "2026-07-24T00:00:00.000Z",
                  updatedAt: "2026-07-24T00:00:00.000Z",
                },
              ],
            };
          }
          if (request.url.endsWith("/lines/")) {
            return {
              succeed: true,
              data: {
                lines: [
                  {
                    platform: "imessage",
                    id: fixture.lineId,
                    phoneNumber: fixture.assigned,
                    profile: {
                      firstName: null,
                      lastName: null,
                      avatarUrl: null,
                    },
                    status: "available",
                    createdAt: "2026-07-24T00:00:00.000Z",
                  },
                ],
              },
            };
          }
          return {
            succeed: true,
            data: {
              tier: "free",
              status: null,
              cancel_at_period_end: false,
              subscription_id: null,
              customer_id: null,
            },
          };
        })();
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            Response.json(body, {
              status: 200,
              headers: {
                "content-type": "application/json",
                "x-ratelimit-remaining": "4",
              },
            })
          )
        );
      });

      const observations = yield* Effect.gen(function* () {
        const projects = yield* PhotonProjects;
        const platforms = yield* PhotonPlatforms;
        const users = yield* PhotonSharedUsers;
        const webhooks = yield* PhotonWebhooks;
        const lines = yield* PhotonLines;
        const billing = yield* PhotonBilling;
        return {
          project: yield* projects.observeProject(
            ObservePhotonProject.make({ projectId: fixture.projectId })
          ),
          platform: yield* platforms.observePlatform(
            ObservePhotonPlatform.make({
              projectId: fixture.projectId,
              platform: "imessage",
            })
          ),
          users: yield* users.listSharedUsers(
            ListPhotonSharedUsers.make({
              projectId: fixture.projectId,
              limit: PhotonPaginationLimit.make(1),
              offset: PhotonPaginationOffset.make(0),
            })
          ),
          user: yield* users.observeSharedUser(
            ObservePhotonSharedUser.make({
              projectId: fixture.projectId,
              userId: fixture.userId,
            })
          ),
          webhook: yield* webhooks.observeWebhook(
            ObservePhotonWebhook.make({
              projectId: fixture.projectId,
              webhookId: fixture.webhookId,
            })
          ),
          lines: yield* lines.listLines(
            ListPhotonLines.make({
              projectId: fixture.projectId,
              platform: "imessage",
            })
          ),
          line: yield* lines.observeLine(
            ObservePhotonLine.make({
              projectId: fixture.projectId,
              lineId: fixture.lineId,
              platform: "imessage",
            })
          ),
          billing: yield* billing.observeBilling(
            ObservePhotonBilling.make({ projectId: fixture.projectId })
          ),
        };
      }).pipe(Effect.provide(liveLayer(client)));

      assert.strictEqual(observations.project._tag, "Found");
      assert.strictEqual(observations.platform._tag, "Found");
      assert.strictEqual(observations.users.users.length, 2);
      assert.strictEqual(observations.users.total, 2);
      assert.strictEqual(observations.user._tag, "Found");
      assert.strictEqual(observations.webhook._tag, "Found");
      assert.strictEqual(observations.lines.lines.length, 1);
      assert.strictEqual(observations.line._tag, "Found");
      assert.strictEqual(observations.billing._tag, "Found");
      assert.strictEqual(
        requests.every((request) => request.method === "GET"),
        true
      );
      assert.strictEqual(
        requests.filter((request) => request.url.endsWith("/users/")).length,
        4
      );
      assert.strictEqual(
        requests.some((request) =>
          request.params.some(
            ([key, value]) => key === "offset" && value === "1"
          )
        ),
        true
      );
      const encoded = Schema.encodeSync(Schema.UnknownFromJsonString)(
        observations
      );
      for (const sentinel of [
        "test-project-secret-sentinel",
        fixture.phone,
        fixture.assigned,
        "token=private",
      ]) {
        assert.strictEqual(encoded.includes(sentinel), false);
      }
    })
);

it.effect(
  "fails safely for malformed, conflict, rate-limited, transient and unavailable responses",
  () =>
    Effect.gen(function* () {
      const malformed = yield* Effect.gen(function* () {
        const projects = yield* PhotonProjects;
        return yield* projects.observeProject(
          ObservePhotonProject.make({ projectId: fixture.projectId })
        );
      }).pipe(
        Effect.provide(
          liveLayer(
            photonFailureResponse(200, {
              succeed: true,
              data: { slug: 1 },
            })
          )
        ),
        Effect.flip
      );
      assert.strictEqual(malformed.reason, "invalidResponse");

      for (const [status, expected] of [
        [409, "conflict"],
        [429, "rateLimited"],
        [503, "transient"],
      ] as const) {
        let requestCount = 0;
        const program = Effect.gen(function* () {
          const webhooks = yield* PhotonWebhooks;
          return yield* webhooks.listWebhooks(
            ListPhotonWebhooks.make({ projectId: fixture.projectId })
          );
        }).pipe(
          Effect.provide(
            liveLayer(
              photonFailureResponse(
                status,
                {
                  succeed: false,
                  data: null,
                  code: "safe-code",
                  message: "raw-provider-sentinel",
                },
                () => {
                  requestCount += 1;
                }
              )
            )
          ),
          Effect.flip
        );
        let failure;
        if (status === 409) {
          failure = yield* program;
        } else {
          const fiber = yield* Effect.forkChild(program);
          yield* TestClock.adjust("1 second");
          failure = yield* Fiber.join(fiber);
        }
        assert.strictEqual(failure.reason, expected);
        assert.strictEqual(requestCount, status === 409 ? 1 : 3);
        assert.strictEqual(
          Schema.encodeSync(Schema.UnknownFromJsonString)(failure).includes(
            "sentinel"
          ),
          false
        );
      }

      const unavailable = yield* Effect.gen(function* () {
        const billing = yield* PhotonBilling;
        return yield* billing.observeBilling(
          ObservePhotonBilling.make({ projectId: fixture.projectId })
        );
      }).pipe(
        Effect.provide(
          liveLayer(
            photonFailureResponse(404, {
              succeed: false,
              data: null,
              code: "not-found",
              message: "not found",
            })
          )
        )
      );
      assert.deepStrictEqual(
        unavailable,
        PhotonBillingObservation.make({
          _tag: "Unavailable",
          projectId: fixture.projectId,
        })
      );
    })
);

it.effect(
  "rejects ambiguous semantic users and exact callback URLs in memory",
  () =>
    Effect.gen(function* () {
      const phone = Schema.decodeSync(PhotonSharedUserPhoneNumber)(
        Redacted.make(fixture.phone)
      );
      const callback = Schema.decodeSync(PhotonWebhookCallbackUrl)(
        Redacted.make(fixture.callback)
      );
      const userAttributes = PhotonSharedUserAttributes.make({
        projectId: fixture.projectId,
        userId: fixture.userId,
        serviceType: "shared",
        assignmentPresent: true,
      });
      const webhookAttributes = PhotonWebhookAttributes.make({
        projectId: fixture.projectId,
        webhookId: fixture.webhookId,
        callbackOrigin: PhotonCallbackOrigin.make(
          "https://preview.example.test"
        ),
        callbackPath: PhotonCallbackPath.make("/eve/v1/photon/webhook"),
        queryPresent: true,
        signingSecret: { _tag: "ObservedUnknown", configured: true },
      });
      const inventory = PhotonManagementMemoryInventory.make({
        project: PhotonProjectAttributes.make({
          projectId: fixture.projectId,
          name: PhotonProjectName.make("Bundjil"),
          slug: PhotonProjectSlug.make("bundjil"),
          profileConfigured: false,
        }),
        platform: PhotonPlatformAttributes.make({
          projectId: fixture.projectId,
          platform: "imessage",
          enabled: true,
          autoScale: false,
          serviceType: "shared",
        }),
        sharedUsers: [
          { attributes: userAttributes, phoneNumber: phone },
          {
            attributes: PhotonSharedUserAttributes.make({
              ...userAttributes,
              userId: fixture.secondUserId,
            }),
            phoneNumber: phone,
          },
        ],
        webhooks: [
          { attributes: webhookAttributes, callbackUrl: callback },
          {
            attributes: PhotonWebhookAttributes.make({
              ...webhookAttributes,
              webhookId: PhotonWebhookId.make(
                "90d6d04f-f9fa-4a7b-9c97-37c9c90ce91c"
              ),
            }),
            callbackUrl: callback,
          },
        ],
        lines: [],
        billing: PhotonBillingAttributes.make({
          projectId: fixture.projectId,
          tier: PhotonSubscriptionTier.make("free"),
          status: null,
          cancelAtPeriodEnd: false,
        }),
      });
      const results = yield* Effect.gen(function* () {
        const users = yield* PhotonSharedUsers;
        const webhooks = yield* PhotonWebhooks;
        return {
          user: yield* users
            .discoverSharedUser(
              DiscoverPhotonSharedUser.make({
                projectId: fixture.projectId,
                phoneNumber: phone,
              })
            )
            .pipe(Effect.flip),
          webhook: yield* webhooks
            .discoverWebhook(
              DiscoverPhotonWebhook.make({
                projectId: fixture.projectId,
                callbackUrl: callback,
              })
            )
            .pipe(Effect.flip),
        };
      }).pipe(Effect.provide(layerPhotonManagementMemory(inventory)));
      assert.strictEqual(results.user.reason, "ambiguous");
      assert.strictEqual(
        Schema.is(PhotonWebhooksReadError)(results.webhook),
        true
      );
      assert.strictEqual(results.webhook.reason, "ambiguous");
    })
);

it.effect("round-trips every public management request and state result", () =>
  Effect.all([
    Schema.encodeEffect(ObservePhotonProject)(
      ObservePhotonProject.make({ projectId: fixture.projectId })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ObservePhotonProject))),
    Schema.encodeEffect(ObservePhotonPlatform)(
      ObservePhotonPlatform.make({
        projectId: fixture.projectId,
        platform: "imessage",
      })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ObservePhotonPlatform))),
    Schema.encodeEffect(ListPhotonSharedUsers)(
      ListPhotonSharedUsers.make({
        projectId: fixture.projectId,
        limit: PhotonPaginationLimit.make(500),
        offset: PhotonPaginationOffset.make(0),
      })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ListPhotonSharedUsers))),
    Schema.encodeEffect(ObservePhotonSharedUser)(
      ObservePhotonSharedUser.make({
        projectId: fixture.projectId,
        userId: fixture.userId,
      })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ObservePhotonSharedUser))),
    Schema.encodeEffect(ListPhotonWebhooks)(
      ListPhotonWebhooks.make({ projectId: fixture.projectId })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ListPhotonWebhooks))),
    Schema.encodeEffect(ObservePhotonWebhook)(
      ObservePhotonWebhook.make({
        projectId: fixture.projectId,
        webhookId: fixture.webhookId,
      })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ObservePhotonWebhook))),
    Schema.encodeEffect(ListPhotonLines)(
      ListPhotonLines.make({
        projectId: fixture.projectId,
        platform: "imessage",
      })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ListPhotonLines))),
    Schema.encodeEffect(ObservePhotonLine)(
      ObservePhotonLine.make({
        projectId: fixture.projectId,
        lineId: fixture.lineId,
        platform: "imessage",
      })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ObservePhotonLine))),
    Schema.encodeEffect(ObservePhotonBilling)(
      ObservePhotonBilling.make({ projectId: fixture.projectId })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ObservePhotonBilling))),
    Schema.encodeEffect(ListedPhotonSharedUsers)(
      ListedPhotonSharedUsers.make({
        users: [],
        total: 0,
        nextOffset: null,
      })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ListedPhotonSharedUsers))),
    Schema.encodeEffect(ListedPhotonWebhooks)(
      ListedPhotonWebhooks.make({ webhooks: [] })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ListedPhotonWebhooks))),
    Schema.encodeEffect(ListedPhotonLines)(
      ListedPhotonLines.make({ lines: [] })
    ).pipe(Effect.flatMap(Schema.decodeEffect(ListedPhotonLines))),
  ]).pipe(Effect.asVoid)
);

it.effect("rejects cross-owner identities at compile time", () =>
  Effect.sync(() => {
    const { projectId } = fixture;
    const { userId } = fixture;
    const { lineId } = fixture;
    // @ts-expect-error Photon user identities cannot be used as project IDs.
    const invalidProject: typeof projectId = userId;
    // @ts-expect-error Photon line identities cannot be used as user IDs.
    const invalidUser: typeof userId = lineId;
    assert.notStrictEqual(invalidProject, projectId);
    assert.notStrictEqual(invalidUser, userId);
  })
);

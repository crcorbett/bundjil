import { Context, Effect, Layer, Schema } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import type { PhotonProviderProofOperation } from "./provider-proof.error.js";
import { PhotonProviderProofError } from "./provider-proof.error.js";
import {
  PhotonLineId,
  PhotonSubscriptionTier,
  PhotonWebhookId,
  PhotonWebhookSecret,
} from "./schemas.js";
import type { PhotonProjectId, PhotonProjectSecret } from "./schemas.js";

const PhotonManagedWebhook = Schema.Struct({
  id: PhotonWebhookId,
  webhookUrl: Schema.URLFromString,
});

const PhotonCreatedWebhook = Schema.Struct({
  id: PhotonWebhookId,
  signingSecret: PhotonWebhookSecret,
  webhookUrl: Schema.URLFromString,
});

const PhotonWebhookRegistration = Schema.Struct({
  webhookUrl: Schema.URLFromString,
});

const PhotonDedicatedLineStatus = Schema.Literals([
  "available",
  "unavailable",
  "unknown",
]);

const PhotonManagedDedicatedLine = Schema.Struct({
  id: PhotonLineId,
  status: PhotonDedicatedLineStatus,
});

const PhotonProviderDedicatedLine = Schema.Struct({
  platform: Schema.Literal("imessage"),
  id: PhotonLineId,
  phoneNumber: Schema.String,
  profile: Schema.Struct({
    firstName: Schema.NullOr(Schema.String),
    lastName: Schema.NullOr(Schema.String),
    avatarUrl: Schema.NullOr(Schema.String),
  }),
  status: PhotonDedicatedLineStatus,
  createdAt: Schema.String,
});

const PhotonBilling = Schema.Struct({
  quantity: Schema.NullOr(Schema.Number),
  prorationAmount: Schema.NullOr(Schema.Number),
  syncStatus: Schema.Literals(["in_sync", "syncing", "failed"]),
});

const PhotonPlatformToggle = Schema.Struct({
  platform: Schema.Literal("imessage"),
  enabled: Schema.Boolean,
});

const PhotonDedicatedLineRegistration = Schema.Struct({
  platform: Schema.Literal("imessage"),
});

const PhotonPlatformsResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({
      imessage: Schema.optional(
        Schema.Struct({
          autoScale: Schema.optional(Schema.Boolean),
          enabled: Schema.Boolean,
        })
      ),
      whatsapp_business: Schema.optional(
        Schema.Struct({ enabled: Schema.Boolean })
      ),
      voice: Schema.optional(
        Schema.Struct({
          imessage_enabled: Schema.optional(Schema.Boolean),
          enabled: Schema.Boolean,
        })
      ),
      slack: Schema.optional(Schema.Struct({ enabled: Schema.Boolean })),
    }),
  }),
});

const PhotonSubscriptionStatus = Schema.NullOr(
  Schema.Literals(["active", "canceled", "past_due"])
);

const PhotonSubscriptionResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({
      tier: PhotonSubscriptionTier,
      status: PhotonSubscriptionStatus,
      cancel_at_period_end: Schema.Boolean,
      subscription_id: Schema.NullOr(Schema.String),
      customer_id: Schema.NullOr(Schema.String),
    }),
  }),
});

const PhotonListDedicatedLinesResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({ lines: Schema.Array(PhotonProviderDedicatedLine) }),
  }),
});

const PhotonCreateDedicatedLineResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({
      line: PhotonProviderDedicatedLine,
      billing: PhotonBilling,
    }),
  }),
});

const PhotonDeleteDedicatedLineResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({ billing: Schema.NullOr(PhotonBilling) }),
  }),
});

const PhotonListWebhooksResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Array(PhotonManagedWebhook),
  }),
});

const PhotonRegisterWebhookResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: PhotonCreatedWebhook,
  }),
});

const PhotonDeleteWebhookResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({ id: PhotonWebhookId }),
  }),
});

interface PhotonManagementShape {
  readonly createDedicatedLine: () => Effect.Effect<
    {
      readonly line: typeof PhotonManagedDedicatedLine.Type;
      readonly billingSyncStatus: typeof PhotonBilling.fields.syncStatus.Type;
    },
    PhotonProviderProofError
  >;
  readonly deleteDedicatedLine: (
    lineId: typeof PhotonLineId.Type
  ) => Effect.Effect<
    {
      readonly billingChanged: boolean;
      readonly billingSyncStatus:
        | typeof PhotonBilling.fields.syncStatus.Type
        | null;
    },
    PhotonProviderProofError
  >;
  readonly deleteWebhook: (
    webhookId: typeof PhotonWebhookId.Type
  ) => Effect.Effect<void, PhotonProviderProofError>;
  readonly listWebhooks: () => Effect.Effect<
    readonly (typeof PhotonManagedWebhook.Type)[],
    PhotonProviderProofError
  >;
  readonly getIMessagePlatform: () => Effect.Effect<
    { readonly enabled: boolean },
    PhotonProviderProofError
  >;
  readonly getSubscription: () => Effect.Effect<
    {
      readonly tier: typeof PhotonSubscriptionTier.Type;
      readonly status: typeof PhotonSubscriptionStatus.Type;
    },
    PhotonProviderProofError
  >;
  readonly listDedicatedLines: () => Effect.Effect<
    readonly (typeof PhotonManagedDedicatedLine.Type)[],
    PhotonProviderProofError
  >;
  readonly registerWebhook: (
    webhookUrl: URL
  ) => Effect.Effect<
    typeof PhotonCreatedWebhook.Type,
    PhotonProviderProofError
  >;
  readonly setIMessagePlatformEnabled: (
    enabled: boolean
  ) => Effect.Effect<{ readonly enabled: boolean }, PhotonProviderProofError>;
}

export class PhotonManagement extends Context.Service<
  PhotonManagement,
  PhotonManagementShape
>()("@bundjil/photon/PhotonManagement") {}

const managementUrl = (projectId: PhotonProjectId, path: string) =>
  new URL(`/projects/${projectId}/${path}`, "https://spectrum.photon.codes");

export const layerPhotonManagementLive = (
  projectId: PhotonProjectId,
  projectSecret: PhotonProjectSecret
) =>
  Layer.effect(
    PhotonManagement,
    Effect.gen(function* makePhotonManagement() {
      const client = yield* HttpClient.HttpClient;
      const execute = <A, I extends { readonly body?: unknown }>(
        operation: typeof PhotonProviderProofOperation.Type,
        request: HttpClientRequest.HttpClientRequest,
        responseSchema: Schema.Codec<A, I>
      ) =>
        client.execute(request).pipe(
          Effect.flatMap(HttpClientResponse.filterStatusOk),
          Effect.flatMap(HttpClientResponse.schemaJson(responseSchema)),
          Effect.timeoutOrElse({
            duration: "10 seconds",
            orElse: () =>
              Effect.fail(
                new PhotonProviderProofError({
                  operation,
                  reason: "requestFailed",
                })
              ),
          }),
          Effect.mapError(
            () =>
              new PhotonProviderProofError({
                operation,
                reason: "requestFailed",
              })
          )
        );

      return PhotonManagement.of({
        createDedicatedLine: Effect.fn("PhotonManagement.createDedicatedLine")(
          function* () {
            const request = yield* HttpClientRequest.post(
              managementUrl(projectId, "lines/")
            ).pipe(
              HttpClientRequest.basicAuth(projectId, projectSecret),
              HttpClientRequest.schemaBodyJson(PhotonDedicatedLineRegistration)(
                { platform: "imessage" }
              ),
              Effect.mapError(
                () =>
                  new PhotonProviderProofError({
                    operation: "createDedicatedLine",
                    reason: "requestFailed",
                  })
              )
            );
            const response = yield* execute(
              "createDedicatedLine",
              request,
              PhotonCreateDedicatedLineResponse
            );
            return {
              line: PhotonManagedDedicatedLine.make({
                id: response.body.data.line.id,
                status: response.body.data.line.status,
              }),
              billingSyncStatus: response.body.data.billing.syncStatus,
            };
          }
        ),
        deleteDedicatedLine: Effect.fn("PhotonManagement.deleteDedicatedLine")(
          function* (lineId) {
            const response = yield* execute(
              "deleteDedicatedLine",
              HttpClientRequest.make("DELETE")(
                managementUrl(projectId, `lines/${lineId}`)
              ).pipe(HttpClientRequest.basicAuth(projectId, projectSecret)),
              PhotonDeleteDedicatedLineResponse
            );
            return {
              billingChanged: response.body.data.billing !== null,
              billingSyncStatus: response.body.data.billing?.syncStatus ?? null,
            };
          }
        ),
        deleteWebhook: Effect.fn("PhotonManagement.deleteWebhook")(
          function* (webhookId) {
            const response = yield* execute(
              "deleteWebhook",
              HttpClientRequest.make("DELETE")(
                managementUrl(projectId, `webhooks/${webhookId}`)
              ).pipe(HttpClientRequest.basicAuth(projectId, projectSecret)),
              PhotonDeleteWebhookResponse
            );
            if (response.body.data.id !== webhookId) {
              return yield* new PhotonProviderProofError({
                operation: "deleteWebhook",
                reason: "invalidResponse",
              });
            }
            return yield* Effect.void;
          }
        ),
        getIMessagePlatform: Effect.fn("PhotonManagement.getIMessagePlatform")(
          function* () {
            const response = yield* execute(
              "getPlatforms",
              HttpClientRequest.get(
                managementUrl(projectId, "platforms/")
              ).pipe(HttpClientRequest.basicAuth(projectId, projectSecret)),
              PhotonPlatformsResponse
            );
            if (response.body.data.imessage === undefined) {
              return yield* new PhotonProviderProofError({
                operation: "getPlatforms",
                reason: "invalidResponse",
              });
            }
            return { enabled: response.body.data.imessage.enabled };
          }
        ),
        getSubscription: Effect.fn("PhotonManagement.getSubscription")(
          function* () {
            const response = yield* execute(
              "getSubscription",
              HttpClientRequest.get(
                managementUrl(projectId, "billing/subscription")
              ).pipe(HttpClientRequest.basicAuth(projectId, projectSecret)),
              PhotonSubscriptionResponse
            );
            return {
              status: response.body.data.status,
              tier: response.body.data.tier,
            };
          }
        ),
        listDedicatedLines: Effect.fn("PhotonManagement.listDedicatedLines")(
          function* () {
            const response = yield* execute(
              "listDedicatedLines",
              HttpClientRequest.get(managementUrl(projectId, "lines/")).pipe(
                HttpClientRequest.setUrlParam("platform", "imessage"),
                HttpClientRequest.basicAuth(projectId, projectSecret)
              ),
              PhotonListDedicatedLinesResponse
            );
            return response.body.data.lines.map((line) =>
              PhotonManagedDedicatedLine.make({
                id: line.id,
                status: line.status,
              })
            );
          }
        ),
        listWebhooks: Effect.fn("PhotonManagement.listWebhooks")(function* () {
          const response = yield* execute(
            "listWebhooks",
            HttpClientRequest.get(managementUrl(projectId, "webhooks/")).pipe(
              HttpClientRequest.basicAuth(projectId, projectSecret)
            ),
            PhotonListWebhooksResponse
          );
          return response.body.data;
        }),
        registerWebhook: Effect.fn("PhotonManagement.registerWebhook")(
          function* (webhookUrl) {
            const request = yield* HttpClientRequest.post(
              managementUrl(projectId, "webhooks/")
            ).pipe(
              HttpClientRequest.basicAuth(projectId, projectSecret),
              HttpClientRequest.schemaBodyJson(PhotonWebhookRegistration)({
                webhookUrl,
              }),
              Effect.mapError(
                () =>
                  new PhotonProviderProofError({
                    operation: "registerWebhook",
                    reason: "requestFailed",
                  })
              )
            );
            const response = yield* execute(
              "registerWebhook",
              request,
              PhotonRegisterWebhookResponse
            );
            if (response.body.data.webhookUrl.href !== webhookUrl.href) {
              return yield* new PhotonProviderProofError({
                operation: "registerWebhook",
                reason: "invalidResponse",
              });
            }
            return response.body.data;
          }
        ),
        setIMessagePlatformEnabled: Effect.fn(
          "PhotonManagement.setIMessagePlatformEnabled"
        )(function* (enabled) {
          const request = yield* HttpClientRequest.patch(
            managementUrl(projectId, "platforms/")
          ).pipe(
            HttpClientRequest.basicAuth(projectId, projectSecret),
            HttpClientRequest.schemaBodyJson(PhotonPlatformToggle)({
              enabled,
              platform: "imessage",
            }),
            Effect.mapError(
              () =>
                new PhotonProviderProofError({
                  operation: "setIMessagePlatformEnabled",
                  reason: "requestFailed",
                })
            )
          );
          const response = yield* execute(
            "setIMessagePlatformEnabled",
            request,
            PhotonPlatformsResponse
          );
          if (response.body.data.imessage === undefined) {
            return yield* new PhotonProviderProofError({
              operation: "setIMessagePlatformEnabled",
              reason: "invalidResponse",
            });
          }
          return { enabled: response.body.data.imessage.enabled };
        }),
      });
    })
  );

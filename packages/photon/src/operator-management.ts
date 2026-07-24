import { Context, Effect, Layer, Schema } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import type { PhotonProviderProofOperation } from "./provider-proof.error.js";
import { PhotonProviderProofError } from "./provider-proof.error.js";
import {
  PhotonE164PhoneNumber,
  PhotonProjectId,
  PhotonUserId,
  PhotonWebhookId,
  PhotonWebhookSecret,
} from "./schemas.js";
import type { PhotonProjectSecret } from "./schemas.js";

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

const PhotonPlatformToggle = Schema.Struct({
  platform: Schema.Literal("imessage"),
  enabled: Schema.Boolean,
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

const PhotonIMessageServiceType = Schema.Literals(["shared", "dedicated"]);

const PhotonIMessageServiceResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({ type: PhotonIMessageServiceType }),
  }),
});

const PhotonSharedAvailabilityResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({ available: Schema.Boolean }),
  }),
});

const PhotonProviderUser = Schema.Struct({
  id: PhotonUserId,
  projectId: PhotonProjectId,
  type: PhotonIMessageServiceType,
  firstName: Schema.NullOr(Schema.String),
  lastName: Schema.NullOr(Schema.String),
  email: Schema.NullOr(Schema.String),
  phoneNumber: PhotonE164PhoneNumber,
  assignedPhoneNumber: PhotonE164PhoneNumber,
  meta: Schema.NullOr(Schema.Record(Schema.String, Schema.Unknown)),
  createdAt: Schema.String,
});

const PhotonManagedSharedUser = Schema.Struct({
  id: PhotonUserId,
  phoneNumber: PhotonE164PhoneNumber,
  assignedPhoneNumber: PhotonE164PhoneNumber,
});

const PhotonSharedUserRegistration = Schema.Struct({
  type: Schema.Literal("shared"),
  phoneNumber: PhotonE164PhoneNumber,
});

const PhotonListSharedUsersResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({
      users: Schema.Array(PhotonProviderUser),
      total: Schema.Int,
    }),
  }),
});

const PhotonCreateSharedUserResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: PhotonProviderUser,
  }),
});

const PhotonDeleteSharedUserResponse = Schema.Struct({
  status: Schema.Literal(200),
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({ userId: PhotonUserId }),
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
  readonly checkSharedAvailability: (
    phoneNumber: typeof PhotonE164PhoneNumber.Type
  ) => Effect.Effect<boolean, PhotonProviderProofError>;
  readonly createSharedUser: (
    phoneNumber: typeof PhotonE164PhoneNumber.Type
  ) => Effect.Effect<
    typeof PhotonManagedSharedUser.Type,
    PhotonProviderProofError
  >;
  readonly deleteSharedUser: (
    userId: typeof PhotonUserId.Type
  ) => Effect.Effect<void, PhotonProviderProofError>;
  readonly deleteWebhook: (
    webhookId: typeof PhotonWebhookId.Type
  ) => Effect.Effect<void, PhotonProviderProofError>;
  readonly getIMessagePlatform: () => Effect.Effect<
    { readonly enabled: boolean },
    PhotonProviderProofError
  >;
  readonly getIMessageService: () => Effect.Effect<
    { readonly type: typeof PhotonIMessageServiceType.Type },
    PhotonProviderProofError
  >;
  readonly listSharedUsers: () => Effect.Effect<
    readonly (typeof PhotonManagedSharedUser.Type)[],
    PhotonProviderProofError
  >;
  readonly listWebhooks: () => Effect.Effect<
    readonly (typeof PhotonManagedWebhook.Type)[],
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
        checkSharedAvailability: Effect.fn(
          "PhotonManagement.checkSharedAvailability"
        )(function* (phoneNumber) {
          const response = yield* execute(
            "checkSharedAvailability",
            HttpClientRequest.get(
              managementUrl(projectId, "imessage/shared/availability")
            ).pipe(
              HttpClientRequest.setUrlParam("phoneNumber", phoneNumber),
              HttpClientRequest.basicAuth(projectId, projectSecret)
            ),
            PhotonSharedAvailabilityResponse
          );
          return response.body.data.available;
        }),
        createSharedUser: Effect.fn("PhotonManagement.createSharedUser")(
          function* (phoneNumber) {
            const request = yield* HttpClientRequest.post(
              managementUrl(projectId, "users/")
            ).pipe(
              HttpClientRequest.basicAuth(projectId, projectSecret),
              HttpClientRequest.schemaBodyJson(PhotonSharedUserRegistration)({
                type: "shared",
                phoneNumber,
              }),
              Effect.mapError(
                () =>
                  new PhotonProviderProofError({
                    operation: "createSharedUser",
                    reason: "requestFailed",
                  })
              )
            );
            const response = yield* execute(
              "createSharedUser",
              request,
              PhotonCreateSharedUserResponse
            );
            if (
              response.body.data.type !== "shared" ||
              response.body.data.phoneNumber !== phoneNumber
            ) {
              return yield* new PhotonProviderProofError({
                operation: "createSharedUser",
                reason: "invalidResponse",
              });
            }
            return PhotonManagedSharedUser.make(response.body.data);
          }
        ),
        deleteSharedUser: Effect.fn("PhotonManagement.deleteSharedUser")(
          function* (userId) {
            const response = yield* execute(
              "deleteSharedUser",
              HttpClientRequest.make("DELETE")(
                managementUrl(projectId, `users/${userId}/`)
              ).pipe(HttpClientRequest.basicAuth(projectId, projectSecret)),
              PhotonDeleteSharedUserResponse
            );
            if (response.body.data.userId !== userId) {
              return yield* new PhotonProviderProofError({
                operation: "deleteSharedUser",
                reason: "invalidResponse",
              });
            }
            return yield* Effect.void;
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
        getIMessageService: Effect.fn("PhotonManagement.getIMessageService")(
          function* () {
            const response = yield* execute(
              "getIMessageService",
              HttpClientRequest.get(managementUrl(projectId, "imessage/")).pipe(
                HttpClientRequest.basicAuth(projectId, projectSecret)
              ),
              PhotonIMessageServiceResponse
            );
            return response.body.data;
          }
        ),
        listSharedUsers: Effect.fn("PhotonManagement.listSharedUsers")(
          function* () {
            const response = yield* execute(
              "listSharedUsers",
              HttpClientRequest.get(managementUrl(projectId, "users/")).pipe(
                HttpClientRequest.setUrlParam("type", "shared"),
                HttpClientRequest.setUrlParam("limit", "500"),
                HttpClientRequest.basicAuth(projectId, projectSecret)
              ),
              PhotonListSharedUsersResponse
            );
            if (
              response.body.data.total !== response.body.data.users.length ||
              response.body.data.users.some((user) => user.type !== "shared")
            ) {
              return yield* new PhotonProviderProofError({
                operation: "listSharedUsers",
                reason: "invalidResponse",
              });
            }
            return response.body.data.users.map((user) =>
              PhotonManagedSharedUser.make(user)
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

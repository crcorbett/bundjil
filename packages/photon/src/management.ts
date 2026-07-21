import { Context, Effect, Layer, Schema } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import type { PhotonProviderProofOperation } from "./provider-proof.error.js";
import { PhotonProviderProofError } from "./provider-proof.error.js";
import { PhotonWebhookId, PhotonWebhookSecret } from "./schemas.js";
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
  readonly deleteWebhook: (
    webhookId: typeof PhotonWebhookId.Type
  ) => Effect.Effect<void, PhotonProviderProofError>;
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
}

export class PhotonManagement extends Context.Service<
  PhotonManagement,
  PhotonManagementShape
>()("@bundjil/photon/PhotonManagement") {}

const managementUrl = (projectId: PhotonProjectId, suffix = "") =>
  new URL(
    `/projects/${projectId}/webhooks/${suffix}`,
    "https://spectrum.photon.codes"
  );

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
        deleteWebhook: Effect.fn("PhotonManagement.deleteWebhook")(
          function* (webhookId) {
            const response = yield* execute(
              "deleteWebhook",
              HttpClientRequest.make("DELETE")(
                managementUrl(projectId, `${webhookId}/`)
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
        listWebhooks: Effect.fn("PhotonManagement.listWebhooks")(function* () {
          const response = yield* execute(
            "listWebhooks",
            HttpClientRequest.get(managementUrl(projectId)).pipe(
              HttpClientRequest.basicAuth(projectId, projectSecret)
            ),
            PhotonListWebhooksResponse
          );
          return response.body.data;
        }),
        registerWebhook: Effect.fn("PhotonManagement.registerWebhook")(
          function* (webhookUrl) {
            const request = yield* HttpClientRequest.post(
              managementUrl(projectId)
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
      });
    })
  );

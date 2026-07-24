import type { Effect as EffectType } from "effect";
import {
  Config,
  Context,
  Effect,
  Layer,
  Redacted,
  Schedule,
  Schema,
} from "effect";
import type { ConfigError } from "effect/Config";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import {
  PhotonE164PhoneNumber,
  PhotonLineId,
  PhotonProjectId,
  PhotonProjectSecret,
  PhotonSubscriptionTier,
  PhotonUserId,
  PhotonWebhookId,
} from "../schemas.js";
import {
  PhotonBillingReadError,
  PhotonLinesReadError,
  PhotonPlatformsReadError,
  PhotonProjectsReadError,
  PhotonSharedUsersReadError,
  PhotonWebhooksReadError,
} from "./errors.js";
import type {
  DiscoverPhotonWebhook,
  ObservePhotonLine,
  ObservePhotonSharedUser,
  ObservePhotonWebhook,
} from "./schemas.js";
import {
  DiscoverPhotonSharedUser,
  ListedPhotonLines,
  ListedPhotonSharedUsers,
  ListedPhotonWebhooks,
  ListPhotonLines,
  ListPhotonSharedUsers,
  ListPhotonWebhooks,
  ObservePhotonBilling,
  ObservePhotonPlatform,
  ObservePhotonProject,
  PhotonBillingAttributes,
  PhotonBillingObservation,
  PhotonCallbackOrigin,
  PhotonCallbackPath,
  PhotonLineAttributes,
  PhotonLineObservation,
  PhotonLineStatus,
  PhotonPaginationLimit,
  PhotonPaginationOffset,
  PhotonPlatformAttributes,
  PhotonPlatformObservation,
  PhotonProjectAttributes,
  PhotonProjectName,
  PhotonProjectObservation,
  PhotonProjectSlug,
  PhotonSharedUserAttributes,
  PhotonSharedUserDiscovery,
  PhotonSharedUserObservation,
  PhotonSigningSecretObservation,
  PhotonSubscriptionStatus,
  PhotonWebhookAttributes,
  PhotonWebhookDiscovery,
  PhotonWebhookObservation,
} from "./schemas.js";
import {
  PhotonBilling,
  PhotonLines,
  PhotonPlatforms,
  PhotonProjects,
  PhotonSharedUsers,
  PhotonWebhooks,
} from "./services.js";

export const PhotonManagementCredentialsValue = Schema.Struct({
  projectId: PhotonProjectId,
  projectSecret: PhotonProjectSecret,
});
export type PhotonManagementCredentialsValue =
  typeof PhotonManagementCredentialsValue.Type;
export type PhotonManagementCredentialsValueEncoded =
  typeof PhotonManagementCredentialsValue.Encoded;

const photonProjectIdConfig = Config.schema(
  PhotonProjectId,
  "BUNDJIL_PHOTON_MANAGEMENT_PROJECT_ID"
);
const photonProjectSecretConfig = Config.schema(
  PhotonProjectSecret,
  "BUNDJIL_PHOTON_MANAGEMENT_PROJECT_SECRET"
);

export class PhotonManagementCredentials extends Context.Service<
  PhotonManagementCredentials,
  EffectType.Effect<PhotonManagementCredentialsValue, ConfigError>
>()("@bundjil/photon/management/PhotonManagementCredentials") {}

export const PhotonManagementCredentialsLive = Layer.succeed(
  PhotonManagementCredentials,
  Config.all({
    projectId: photonProjectIdConfig,
    projectSecret: photonProjectSecretConfig,
  })
);

const PhotonResponseHeaders = Schema.Struct({
  "retry-after": Schema.optional(Schema.String),
  "x-ratelimit-limit": Schema.optional(Schema.String),
  "x-ratelimit-remaining": Schema.optional(Schema.String),
  "x-ratelimit-reset": Schema.optional(Schema.String),
});

const PhotonFailureBody = Schema.Struct({
  succeed: Schema.Literal(false),
  data: Schema.optional(Schema.Unknown),
  code: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
});

const PhotonFailureEnvelope = Schema.Union([
  Schema.Struct({
    status: Schema.Literals([401, 404, 409, 422, 429]),
    headers: PhotonResponseHeaders,
    body: PhotonFailureBody,
  }),
  Schema.Struct({
    status: Schema.Literals([500, 502, 503, 504]),
    headers: PhotonResponseHeaders,
    body: PhotonFailureBody,
  }),
]);

const PhotonProviderProject = Schema.Struct({
  name: PhotonProjectName,
  slug: PhotonProjectSlug,
  profile: Schema.NullOr(
    Schema.Struct({
      firstName: Schema.String,
      lastName: Schema.String,
      avatarUrl: Schema.NullOr(Schema.String),
      imessageSynced: Schema.Boolean,
    })
  ),
});

const PhotonProjectSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: PhotonResponseHeaders,
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: PhotonProviderProject,
  }),
});
const PhotonProjectEnvelope = Schema.Union([
  PhotonProjectSuccessEnvelope,
  PhotonFailureEnvelope,
]);

const PhotonPlatformsSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: PhotonResponseHeaders,
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
const PhotonPlatformsEnvelope = Schema.Union([
  PhotonPlatformsSuccessEnvelope,
  PhotonFailureEnvelope,
]);

const PhotonIMessageServiceSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: PhotonResponseHeaders,
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({
      type: Schema.Literals(["shared", "dedicated"]),
    }),
  }),
});
const PhotonIMessageServiceEnvelope = Schema.Union([
  PhotonIMessageServiceSuccessEnvelope,
  PhotonFailureEnvelope,
]);

const PhotonProviderUser = Schema.Struct({
  id: PhotonUserId,
  projectId: PhotonProjectId,
  type: Schema.Literals(["shared", "dedicated"]),
  firstName: Schema.NullOr(Schema.String),
  lastName: Schema.NullOr(Schema.String),
  email: Schema.NullOr(Schema.String),
  phoneNumber: PhotonE164PhoneNumber,
  assignedPhoneNumber: PhotonE164PhoneNumber,
  meta: Schema.NullOr(Schema.Record(Schema.String, Schema.Unknown)),
  createdAt: Schema.String,
});

const PhotonSharedUsersSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: PhotonResponseHeaders,
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({
      users: Schema.Array(PhotonProviderUser),
      total: Schema.Int,
    }),
  }),
});
const PhotonSharedUsersEnvelope = Schema.Union([
  PhotonSharedUsersSuccessEnvelope,
  PhotonFailureEnvelope,
]);

const PhotonProviderWebhook = Schema.Struct({
  id: PhotonWebhookId,
  webhookUrl: Schema.URLFromString,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

const PhotonWebhooksSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: PhotonResponseHeaders,
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Array(PhotonProviderWebhook),
  }),
});
const PhotonWebhooksEnvelope = Schema.Union([
  PhotonWebhooksSuccessEnvelope,
  PhotonFailureEnvelope,
]);

const PhotonProviderLine = Schema.Struct({
  platform: Schema.Literal("imessage"),
  id: PhotonLineId,
  phoneNumber: Schema.String,
  profile: Schema.Struct({
    firstName: Schema.NullOr(Schema.String),
    lastName: Schema.NullOr(Schema.String),
    avatarUrl: Schema.NullOr(Schema.String),
  }),
  status: PhotonLineStatus,
  createdAt: Schema.String,
});

const PhotonLinesSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: PhotonResponseHeaders,
  body: Schema.Struct({
    succeed: Schema.Literal(true),
    data: Schema.Struct({ lines: Schema.Array(PhotonProviderLine) }),
  }),
});
const PhotonLinesEnvelope = Schema.Union([
  PhotonLinesSuccessEnvelope,
  PhotonFailureEnvelope,
]);

const PhotonBillingSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: PhotonResponseHeaders,
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
const PhotonBillingEnvelope = Schema.Union([
  PhotonBillingSuccessEnvelope,
  PhotonFailureEnvelope,
]);

const retrySchedule = Schedule.exponential("10 millis");

const retryTransientPhotonRead = <A, E extends { readonly retry: string }, R>(
  effect: EffectType.Effect<A, E, R>
) =>
  effect.pipe(
    Effect.retry({
      schedule: retrySchedule,
      times: 2,
      while: (failure) => failure.retry === "backoff",
    })
  );

const photonUrl = (projectId: string, path: string) =>
  new URL(`/projects/${projectId}/${path}`, "https://spectrum.photon.codes");

const failureReason = (status: number) => {
  if (status === 404) {
    return "notFound" as const;
  }
  if (status === 409) {
    return "conflict" as const;
  }
  if (status === 429) {
    return "rateLimited" as const;
  }
  return "transient" as const;
};

const retryPolicy = (status: number) =>
  status === 429 || status >= 500 ? ("backoff" as const) : ("never" as const);

export const PhotonManagementLive = Layer.effectContext(
  Effect.gen(function* makePhotonManagementLive() {
    const client = yield* HttpClient.HttpClient;
    const credentials = yield* PhotonManagementCredentials;

    const observeProject = Effect.fn("PhotonProjectsLive.observeProject")(
      function* (input: ObservePhotonProject) {
        const encoded = yield* Schema.encodeEffect(ObservePhotonProject)(
          input
        ).pipe(
          Effect.mapError(
            () =>
              new PhotonProjectsReadError({
                operation: "observeProject",
                reason: "requestFailed",
                retry: "never",
                message: "The Photon project request could not be encoded.",
              })
          )
        );
        const credential = yield* credentials.pipe(
          Effect.mapError(
            () =>
              new PhotonProjectsReadError({
                operation: "observeProject",
                reason: "requestFailed",
                retry: "never",
                message: "Photon management credentials are unavailable.",
              })
          )
        );
        if (credential.projectId !== input.projectId) {
          return yield* new PhotonProjectsReadError({
            operation: "observeProject",
            reason: "notFound",
            retry: "never",
            message:
              "The requested Photon project does not match the credential scope.",
          });
        }
        const response = yield* retryTransientPhotonRead(
          client
            .execute(
              HttpClientRequest.get(photonUrl(encoded.projectId, "")).pipe(
                HttpClientRequest.basicAuth(
                  credential.projectId,
                  credential.projectSecret
                )
              )
            )
            .pipe(
              Effect.flatMap(
                HttpClientResponse.schemaJson(PhotonProjectEnvelope)
              ),
              Effect.mapError(
                () =>
                  new PhotonProjectsReadError({
                    operation: "observeProject",
                    reason: "invalidResponse",
                    retry: "never",
                    message:
                      "Photon returned an invalid project response envelope.",
                  })
              ),
              Effect.flatMap((envelope) =>
                envelope.status === 429 || envelope.status >= 500
                  ? Effect.fail(
                      new PhotonProjectsReadError({
                        operation: "observeProject",
                        reason: failureReason(envelope.status),
                        retry: "backoff",
                        message: "Photon could not observe the scoped project.",
                      })
                    )
                  : Effect.succeed(envelope)
              )
            )
        );
        if (response.status === 404) {
          return PhotonProjectObservation.make({
            _tag: "Missing",
            projectId: input.projectId,
          });
        }
        if (response.status !== 200) {
          return yield* new PhotonProjectsReadError({
            operation: "observeProject",
            reason: failureReason(response.status),
            retry: retryPolicy(response.status),
            message: "Photon could not observe the scoped project.",
          });
        }
        return PhotonProjectObservation.make({
          _tag: "Found",
          attributes: PhotonProjectAttributes.make({
            projectId: input.projectId,
            name: response.body.data.name,
            slug: response.body.data.slug,
            profileConfigured: response.body.data.profile !== null,
          }),
        });
      }
    );

    const observePlatform = Effect.fn("PhotonPlatformsLive.observePlatform")(
      function* (input: ObservePhotonPlatform) {
        const encoded = yield* Schema.encodeEffect(ObservePhotonPlatform)(
          input
        ).pipe(
          Effect.mapError(
            () =>
              new PhotonPlatformsReadError({
                operation: "observePlatform",
                reason: "requestFailed",
                retry: "never",
                message: "The Photon platform request could not be encoded.",
              })
          )
        );
        const credential = yield* credentials.pipe(
          Effect.mapError(
            () =>
              new PhotonPlatformsReadError({
                operation: "observePlatform",
                reason: "requestFailed",
                retry: "never",
                message: "Photon management credentials are unavailable.",
              })
          )
        );
        if (credential.projectId !== input.projectId) {
          return yield* new PhotonPlatformsReadError({
            operation: "observePlatform",
            reason: "notFound",
            retry: "never",
            message:
              "The requested Photon project does not match the credential scope.",
          });
        }
        const platformResponse = yield* retryTransientPhotonRead(
          client
            .execute(
              HttpClientRequest.get(
                photonUrl(encoded.projectId, "platforms/")
              ).pipe(
                HttpClientRequest.basicAuth(
                  credential.projectId,
                  credential.projectSecret
                )
              )
            )
            .pipe(
              Effect.flatMap(
                HttpClientResponse.schemaJson(PhotonPlatformsEnvelope)
              ),
              Effect.mapError(
                () =>
                  new PhotonPlatformsReadError({
                    operation: "observePlatform",
                    reason: "invalidResponse",
                    retry: "never",
                    message:
                      "Photon returned an invalid platforms response envelope.",
                  })
              ),
              Effect.flatMap((envelope) =>
                envelope.status === 429 || envelope.status >= 500
                  ? Effect.fail(
                      new PhotonPlatformsReadError({
                        operation: "observePlatform",
                        reason: failureReason(envelope.status),
                        retry: "backoff",
                        message:
                          "Photon could not observe the iMessage platform.",
                      })
                    )
                  : Effect.succeed(envelope)
              )
            )
        );
        if (platformResponse.status === 404) {
          return PhotonPlatformObservation.make({
            _tag: "Missing",
            projectId: input.projectId,
            platform: input.platform,
          });
        }
        if (platformResponse.status !== 200) {
          return yield* new PhotonPlatformsReadError({
            operation: "observePlatform",
            reason: failureReason(platformResponse.status),
            retry: retryPolicy(platformResponse.status),
            message: "Photon could not observe the iMessage platform.",
          });
        }
        const { imessage } = platformResponse.body.data;
        if (imessage === undefined) {
          return PhotonPlatformObservation.make({
            _tag: "Missing",
            projectId: input.projectId,
            platform: input.platform,
          });
        }
        const serviceResponse = yield* retryTransientPhotonRead(
          client
            .execute(
              HttpClientRequest.get(
                photonUrl(encoded.projectId, "imessage/")
              ).pipe(
                HttpClientRequest.basicAuth(
                  credential.projectId,
                  credential.projectSecret
                )
              )
            )
            .pipe(
              Effect.flatMap(
                HttpClientResponse.schemaJson(PhotonIMessageServiceEnvelope)
              ),
              Effect.mapError(
                () =>
                  new PhotonPlatformsReadError({
                    operation: "observePlatform",
                    reason: "invalidResponse",
                    retry: "never",
                    message:
                      "Photon returned an invalid iMessage response envelope.",
                  })
              ),
              Effect.flatMap((envelope) =>
                envelope.status === 429 || envelope.status >= 500
                  ? Effect.fail(
                      new PhotonPlatformsReadError({
                        operation: "observePlatform",
                        reason: failureReason(envelope.status),
                        retry: "backoff",
                        message:
                          "Photon could not observe the iMessage service type.",
                      })
                    )
                  : Effect.succeed(envelope)
              )
            )
        );
        if (serviceResponse.status !== 200) {
          return yield* new PhotonPlatformsReadError({
            operation: "observePlatform",
            reason: failureReason(serviceResponse.status),
            retry: retryPolicy(serviceResponse.status),
            message: "Photon could not observe the iMessage service type.",
          });
        }
        return PhotonPlatformObservation.make({
          _tag: "Found",
          attributes: PhotonPlatformAttributes.make({
            projectId: input.projectId,
            platform: input.platform,
            enabled: imessage.enabled,
            autoScale: imessage.autoScale ?? null,
            serviceType: serviceResponse.body.data.type,
          }),
        });
      }
    );

    const listSharedUsers = Effect.fn("PhotonSharedUsersLive.listSharedUsers")(
      function* (input: ListPhotonSharedUsers) {
        const encoded = yield* Schema.encodeEffect(ListPhotonSharedUsers)(
          input
        ).pipe(
          Effect.mapError(
            () =>
              new PhotonSharedUsersReadError({
                operation: "listSharedUsers",
                reason: "requestFailed",
                retry: "never",
                message:
                  "The Photon shared-users request could not be encoded.",
              })
          )
        );
        const credential = yield* credentials.pipe(
          Effect.mapError(
            () =>
              new PhotonSharedUsersReadError({
                operation: "listSharedUsers",
                reason: "requestFailed",
                retry: "never",
                message: "Photon management credentials are unavailable.",
              })
          )
        );
        if (credential.projectId !== input.projectId) {
          return yield* new PhotonSharedUsersReadError({
            operation: "listSharedUsers",
            reason: "notFound",
            retry: "never",
            message:
              "The requested Photon project does not match the credential scope.",
          });
        }
        const users: (typeof PhotonSharedUserAttributes.Type)[] = [];
        let { offset } = encoded;
        let total = 0;
        do {
          const response = yield* retryTransientPhotonRead(
            client
              .execute(
                HttpClientRequest.get(
                  photonUrl(encoded.projectId, "users/")
                ).pipe(
                  HttpClientRequest.setUrlParam("type", "shared"),
                  HttpClientRequest.setUrlParam(
                    "limit",
                    encoded.limit.toString()
                  ),
                  HttpClientRequest.setUrlParam("offset", offset.toString()),
                  HttpClientRequest.basicAuth(
                    credential.projectId,
                    credential.projectSecret
                  )
                )
              )
              .pipe(
                Effect.flatMap(
                  HttpClientResponse.schemaJson(PhotonSharedUsersEnvelope)
                ),
                Effect.mapError(
                  () =>
                    new PhotonSharedUsersReadError({
                      operation: "listSharedUsers",
                      reason: "invalidResponse",
                      retry: "never",
                      message:
                        "Photon returned an invalid shared-users response envelope.",
                    })
                ),
                Effect.flatMap((envelope) =>
                  envelope.status === 429 || envelope.status >= 500
                    ? Effect.fail(
                        new PhotonSharedUsersReadError({
                          operation: "listSharedUsers",
                          reason: failureReason(envelope.status),
                          retry: "backoff",
                          message: "Photon could not list shared users.",
                        })
                      )
                    : Effect.succeed(envelope)
                )
              )
          );
          if (response.status !== 200) {
            return yield* new PhotonSharedUsersReadError({
              operation: "listSharedUsers",
              reason: failureReason(response.status),
              retry: retryPolicy(response.status),
              message: "Photon could not list shared users.",
            });
          }
          if (
            response.body.data.users.some(
              (user) =>
                user.projectId !== input.projectId || user.type !== "shared"
            )
          ) {
            return yield* new PhotonSharedUsersReadError({
              operation: "listSharedUsers",
              reason: "invalidResponse",
              retry: "never",
              message:
                "Photon returned a user outside the requested shared-project scope.",
            });
          }
          users.push(
            ...response.body.data.users.map((user) =>
              PhotonSharedUserAttributes.make({
                projectId: user.projectId,
                userId: user.id,
                serviceType: "shared",
                assignmentPresent: user.assignedPhoneNumber.length > 0,
              })
            )
          );
          ({ total } = response.body.data);
          offset += response.body.data.users.length;
        } while (offset < total);
        return ListedPhotonSharedUsers.make({
          users,
          total,
          nextOffset: null,
        });
      }
    );

    const observeSharedUser = Effect.fn(
      "PhotonSharedUsersLive.observeSharedUser"
    )(function* (input: ObservePhotonSharedUser) {
      const listed = yield* listSharedUsers({
        projectId: input.projectId,
        limit: PhotonPaginationLimit.make(500),
        offset: PhotonPaginationOffset.make(0),
      });
      const matches = listed.users.filter(
        (user) => user.userId === input.userId
      );
      if (matches.length > 1) {
        return yield* new PhotonSharedUsersReadError({
          operation: "observeSharedUser",
          reason: "ambiguous",
          retry: "never",
          message: "Photon returned duplicate records for one shared-user ID.",
        });
      }
      return matches[0] === undefined
        ? PhotonSharedUserObservation.make({
            _tag: "Missing",
            projectId: input.projectId,
            userId: input.userId,
          })
        : PhotonSharedUserObservation.make({
            _tag: "Found",
            attributes: matches[0],
          });
    });

    const discoverSharedUser = Effect.fn(
      "PhotonSharedUsersLive.discoverSharedUser"
    )(function* (input: DiscoverPhotonSharedUser) {
      const encoded = yield* Schema.encodeEffect(DiscoverPhotonSharedUser)(
        input
      ).pipe(
        Effect.mapError(
          () =>
            new PhotonSharedUsersReadError({
              operation: "discoverSharedUser",
              reason: "requestFailed",
              retry: "never",
              message:
                "The Photon shared-user discovery request could not be encoded.",
            })
        )
      );
      const credential = yield* credentials.pipe(
        Effect.mapError(
          () =>
            new PhotonSharedUsersReadError({
              operation: "discoverSharedUser",
              reason: "requestFailed",
              retry: "never",
              message: "Photon management credentials are unavailable.",
            })
        )
      );
      if (credential.projectId !== input.projectId) {
        return yield* new PhotonSharedUsersReadError({
          operation: "discoverSharedUser",
          reason: "notFound",
          retry: "never",
          message:
            "The requested Photon project does not match the credential scope.",
        });
      }
      const response = yield* retryTransientPhotonRead(
        client
          .execute(
            HttpClientRequest.get(photonUrl(encoded.projectId, "users/")).pipe(
              HttpClientRequest.setUrlParam("type", "shared"),
              HttpClientRequest.setUrlParam(
                "search",
                Redacted.value(encoded.phoneNumber)
              ),
              HttpClientRequest.basicAuth(
                credential.projectId,
                credential.projectSecret
              )
            )
          )
          .pipe(
            Effect.flatMap(
              HttpClientResponse.schemaJson(PhotonSharedUsersEnvelope)
            ),
            Effect.mapError(
              () =>
                new PhotonSharedUsersReadError({
                  operation: "discoverSharedUser",
                  reason: "invalidResponse",
                  retry: "never",
                  message:
                    "Photon returned an invalid shared-user discovery envelope.",
                })
            ),
            Effect.flatMap((envelope) =>
              envelope.status === 429 || envelope.status >= 500
                ? Effect.fail(
                    new PhotonSharedUsersReadError({
                      operation: "discoverSharedUser",
                      reason: failureReason(envelope.status),
                      retry: "backoff",
                      message:
                        "Photon could not discover the exact shared user.",
                    })
                  )
                : Effect.succeed(envelope)
            )
          )
      );
      if (response.status !== 200) {
        return yield* new PhotonSharedUsersReadError({
          operation: "discoverSharedUser",
          reason: failureReason(response.status),
          retry: retryPolicy(response.status),
          message: "Photon could not discover the exact shared user.",
        });
      }
      const phoneNumber = Redacted.value(input.phoneNumber);
      const matches = response.body.data.users.filter(
        (user) =>
          user.projectId === input.projectId &&
          user.type === "shared" &&
          user.phoneNumber === phoneNumber
      );
      if (matches.length > 1) {
        return yield* new PhotonSharedUsersReadError({
          operation: "discoverSharedUser",
          reason: "ambiguous",
          retry: "never",
          message:
            "More than one Photon shared user matched the exact semantic identity.",
        });
      }
      return matches[0] === undefined
        ? PhotonSharedUserDiscovery.make({
            _tag: "Missing",
            projectId: input.projectId,
          })
        : PhotonSharedUserDiscovery.make({
            _tag: "Found",
            attributes: PhotonSharedUserAttributes.make({
              projectId: matches[0].projectId,
              userId: matches[0].id,
              serviceType: "shared",
              assignmentPresent: matches[0].assignedPhoneNumber.length > 0,
            }),
          });
    });

    const listWebhooks = Effect.fn("PhotonWebhooksLive.listWebhooks")(
      function* (input: ListPhotonWebhooks) {
        const encoded = yield* Schema.encodeEffect(ListPhotonWebhooks)(
          input
        ).pipe(
          Effect.mapError(
            () =>
              new PhotonWebhooksReadError({
                operation: "listWebhooks",
                reason: "requestFailed",
                retry: "never",
                message: "The Photon webhooks request could not be encoded.",
              })
          )
        );
        const credential = yield* credentials.pipe(
          Effect.mapError(
            () =>
              new PhotonWebhooksReadError({
                operation: "listWebhooks",
                reason: "requestFailed",
                retry: "never",
                message: "Photon management credentials are unavailable.",
              })
          )
        );
        if (credential.projectId !== input.projectId) {
          return yield* new PhotonWebhooksReadError({
            operation: "listWebhooks",
            reason: "notFound",
            retry: "never",
            message:
              "The requested Photon project does not match the credential scope.",
          });
        }
        const response = yield* retryTransientPhotonRead(
          client
            .execute(
              HttpClientRequest.get(
                photonUrl(encoded.projectId, "webhooks/")
              ).pipe(
                HttpClientRequest.basicAuth(
                  credential.projectId,
                  credential.projectSecret
                )
              )
            )
            .pipe(
              Effect.flatMap(
                HttpClientResponse.schemaJson(PhotonWebhooksEnvelope)
              ),
              Effect.mapError(
                () =>
                  new PhotonWebhooksReadError({
                    operation: "listWebhooks",
                    reason: "invalidResponse",
                    retry: "never",
                    message:
                      "Photon returned an invalid webhooks response envelope.",
                  })
              ),
              Effect.flatMap((envelope) =>
                envelope.status === 429 || envelope.status >= 500
                  ? Effect.fail(
                      new PhotonWebhooksReadError({
                        operation: "listWebhooks",
                        reason: failureReason(envelope.status),
                        retry: "backoff",
                        message: "Photon could not list webhooks.",
                      })
                    )
                  : Effect.succeed(envelope)
              )
            )
        );
        if (response.status !== 200) {
          return yield* new PhotonWebhooksReadError({
            operation: "listWebhooks",
            reason: failureReason(response.status),
            retry: retryPolicy(response.status),
            message: "Photon could not list webhooks.",
          });
        }
        return ListedPhotonWebhooks.make({
          webhooks: response.body.data.map((webhook) =>
            PhotonWebhookAttributes.make({
              projectId: input.projectId,
              webhookId: webhook.id,
              callbackOrigin: PhotonCallbackOrigin.make(
                webhook.webhookUrl.origin
              ),
              callbackPath: PhotonCallbackPath.make(
                webhook.webhookUrl.pathname
              ),
              queryPresent: webhook.webhookUrl.search.length > 0,
              signingSecret: PhotonSigningSecretObservation.make({
                _tag: "ObservedUnknown",
                configured: true,
              }),
            })
          ),
        });
      }
    );

    const observeWebhook = Effect.fn("PhotonWebhooksLive.observeWebhook")(
      function* (input: ObservePhotonWebhook) {
        const listed = yield* listWebhooks({ projectId: input.projectId });
        const matches = listed.webhooks.filter(
          (webhook) => webhook.webhookId === input.webhookId
        );
        if (matches.length > 1) {
          return yield* new PhotonWebhooksReadError({
            operation: "observeWebhook",
            reason: "ambiguous",
            retry: "never",
            message: "Photon returned duplicate records for one webhook ID.",
          });
        }
        return matches[0] === undefined
          ? PhotonWebhookObservation.make({
              _tag: "Missing",
              projectId: input.projectId,
              webhookId: input.webhookId,
            })
          : PhotonWebhookObservation.make({
              _tag: "Found",
              attributes: matches[0],
            });
      }
    );

    const discoverWebhook = Effect.fn("PhotonWebhooksLive.discoverWebhook")(
      function* (input: DiscoverPhotonWebhook) {
        const listed = yield* listWebhooks({ projectId: input.projectId });
        const callbackUrl = new URL(Redacted.value(input.callbackUrl));
        const matches = listed.webhooks.filter(
          (webhook) =>
            webhook.callbackOrigin === callbackUrl.origin &&
            webhook.callbackPath === callbackUrl.pathname &&
            webhook.queryPresent === callbackUrl.search.length > 0
        );
        if (matches.length > 1) {
          return yield* new PhotonWebhooksReadError({
            operation: "discoverWebhook",
            reason: "ambiguous",
            retry: "never",
            message:
              "More than one Photon webhook matched the safe callback projection.",
          });
        }
        return matches[0] === undefined
          ? PhotonWebhookDiscovery.make({
              _tag: "Missing",
              projectId: input.projectId,
            })
          : PhotonWebhookDiscovery.make({
              _tag: "Found",
              attributes: matches[0],
            });
      }
    );

    const listLines = Effect.fn("PhotonLinesLive.listLines")(function* (
      input: ListPhotonLines
    ) {
      const encoded = yield* Schema.encodeEffect(ListPhotonLines)(input).pipe(
        Effect.mapError(
          () =>
            new PhotonLinesReadError({
              operation: "listLines",
              reason: "requestFailed",
              retry: "never",
              message: "The Photon lines request could not be encoded.",
            })
        )
      );
      const credential = yield* credentials.pipe(
        Effect.mapError(
          () =>
            new PhotonLinesReadError({
              operation: "listLines",
              reason: "requestFailed",
              retry: "never",
              message: "Photon management credentials are unavailable.",
            })
        )
      );
      if (credential.projectId !== input.projectId) {
        return yield* new PhotonLinesReadError({
          operation: "listLines",
          reason: "notFound",
          retry: "never",
          message:
            "The requested Photon project does not match the credential scope.",
        });
      }
      const response = yield* retryTransientPhotonRead(
        client
          .execute(
            HttpClientRequest.get(photonUrl(encoded.projectId, "lines/")).pipe(
              HttpClientRequest.setUrlParam("platform", encoded.platform),
              HttpClientRequest.basicAuth(
                credential.projectId,
                credential.projectSecret
              )
            )
          )
          .pipe(
            Effect.flatMap(HttpClientResponse.schemaJson(PhotonLinesEnvelope)),
            Effect.mapError(
              () =>
                new PhotonLinesReadError({
                  operation: "listLines",
                  reason: "invalidResponse",
                  retry: "never",
                  message:
                    "Photon returned an invalid lines response envelope.",
                })
            ),
            Effect.flatMap((envelope) =>
              envelope.status === 429 || envelope.status >= 500
                ? Effect.fail(
                    new PhotonLinesReadError({
                      operation: "listLines",
                      reason: failureReason(envelope.status),
                      retry: "backoff",
                      message: "Photon could not list dedicated lines.",
                    })
                  )
                : Effect.succeed(envelope)
            )
          )
      );
      if (response.status !== 200) {
        return yield* new PhotonLinesReadError({
          operation: "listLines",
          reason: failureReason(response.status),
          retry: retryPolicy(response.status),
          message: "Photon could not list dedicated lines.",
        });
      }
      return ListedPhotonLines.make({
        lines: response.body.data.lines.map((line) =>
          PhotonLineAttributes.make({
            projectId: input.projectId,
            lineId: line.id,
            platform: "imessage",
            status: line.status,
            assignmentPresent: line.phoneNumber.length > 0,
            profileConfigured:
              line.profile.firstName !== null ||
              line.profile.lastName !== null ||
              line.profile.avatarUrl !== null,
          })
        ),
      });
    });

    const observeLine = Effect.fn("PhotonLinesLive.observeLine")(function* (
      input: ObservePhotonLine
    ) {
      const listed = yield* listLines({
        projectId: input.projectId,
        platform: input.platform,
      });
      const matches = listed.lines.filter(
        (line) => line.lineId === input.lineId
      );
      if (matches.length > 1) {
        return yield* new PhotonLinesReadError({
          operation: "observeLine",
          reason: "ambiguous",
          retry: "never",
          message: "Photon returned duplicate records for one line ID.",
        });
      }
      return matches[0] === undefined
        ? PhotonLineObservation.make({
            _tag: "Missing",
            projectId: input.projectId,
            lineId: input.lineId,
            platform: input.platform,
          })
        : PhotonLineObservation.make({
            _tag: "Found",
            attributes: matches[0],
          });
    });

    const observeBilling = Effect.fn("PhotonBillingLive.observeBilling")(
      function* (input: ObservePhotonBilling) {
        const encoded = yield* Schema.encodeEffect(ObservePhotonBilling)(
          input
        ).pipe(
          Effect.mapError(
            () =>
              new PhotonBillingReadError({
                operation: "observeBilling",
                reason: "requestFailed",
                retry: "never",
                message: "The Photon billing request could not be encoded.",
              })
          )
        );
        const credential = yield* credentials.pipe(
          Effect.mapError(
            () =>
              new PhotonBillingReadError({
                operation: "observeBilling",
                reason: "requestFailed",
                retry: "never",
                message: "Photon management credentials are unavailable.",
              })
          )
        );
        if (credential.projectId !== input.projectId) {
          return yield* new PhotonBillingReadError({
            operation: "observeBilling",
            reason: "notFound",
            retry: "never",
            message:
              "The requested Photon project does not match the credential scope.",
          });
        }
        const response = yield* retryTransientPhotonRead(
          client
            .execute(
              HttpClientRequest.get(
                photonUrl(encoded.projectId, "billing/subscription")
              ).pipe(
                HttpClientRequest.basicAuth(
                  credential.projectId,
                  credential.projectSecret
                )
              )
            )
            .pipe(
              Effect.flatMap(
                HttpClientResponse.schemaJson(PhotonBillingEnvelope)
              ),
              Effect.mapError(
                () =>
                  new PhotonBillingReadError({
                    operation: "observeBilling",
                    reason: "invalidResponse",
                    retry: "never",
                    message:
                      "Photon returned an invalid billing response envelope.",
                  })
              ),
              Effect.flatMap((envelope) =>
                envelope.status === 429 || envelope.status >= 500
                  ? Effect.fail(
                      new PhotonBillingReadError({
                        operation: "observeBilling",
                        reason: failureReason(envelope.status),
                        retry: "backoff",
                        message: "Photon could not observe billing status.",
                      })
                    )
                  : Effect.succeed(envelope)
              )
            )
        );
        if (response.status === 404 || response.status === 409) {
          return PhotonBillingObservation.make({
            _tag: "Unavailable",
            projectId: input.projectId,
          });
        }
        if (response.status !== 200) {
          return yield* new PhotonBillingReadError({
            operation: "observeBilling",
            reason: failureReason(response.status),
            retry: retryPolicy(response.status),
            message: "Photon could not observe billing status.",
          });
        }
        return PhotonBillingObservation.make({
          _tag: "Found",
          attributes: PhotonBillingAttributes.make({
            projectId: input.projectId,
            tier: response.body.data.tier,
            status: response.body.data.status,
            cancelAtPeriodEnd: response.body.data.cancel_at_period_end,
          }),
        });
      }
    );

    return Context.make(PhotonProjects, { observeProject }).pipe(
      Context.add(PhotonPlatforms, { observePlatform }),
      Context.add(PhotonSharedUsers, {
        listSharedUsers,
        observeSharedUser,
        discoverSharedUser,
      }),
      Context.add(PhotonWebhooks, {
        listWebhooks,
        observeWebhook,
        discoverWebhook,
      }),
      Context.add(PhotonLines, { listLines, observeLine }),
      Context.add(PhotonBilling, { observeBilling })
    );
  })
);

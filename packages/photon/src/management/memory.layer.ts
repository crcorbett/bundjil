import type { Effect as EffectType } from "effect";
import { Context, Effect, Layer, Redacted, Schema } from "effect";

import type { PhotonProjectId } from "../schemas.js";
import {
  PhotonE164PhoneNumber,
  PhotonSharedUserPhoneNumber,
  PhotonSubscriptionTier,
} from "../schemas.js";
import {
  PhotonLinesReadError,
  PhotonSharedUsersReadError,
  PhotonWebhooksReadError,
} from "./errors.js";
import {
  ListedPhotonLines,
  ListedPhotonSharedUsers,
  ListedPhotonWebhooks,
  PhotonBillingAttributes,
  PhotonBillingObservation,
  PhotonLineAttributes,
  PhotonLineObservation,
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
  PhotonWebhookAttributes,
  PhotonWebhookCallbackUrl,
  PhotonWebhookDiscovery,
  PhotonWebhookObservation,
} from "./schemas.js";
import type {
  DiscoverPhotonSharedUser,
  DiscoverPhotonWebhook,
  ListPhotonLines,
  ListPhotonSharedUsers,
  ListPhotonWebhooks,
  ObservePhotonBilling,
  ObservePhotonLine,
  ObservePhotonPlatform,
  ObservePhotonProject,
  ObservePhotonSharedUser,
  ObservePhotonWebhook,
} from "./schemas.js";
import {
  PhotonBilling,
  PhotonLines,
  PhotonPlatforms,
  PhotonProjects,
  PhotonSharedUsers,
  PhotonWebhooks,
} from "./services.js";

const PhotonMemorySharedUser = Schema.Struct({
  attributes: PhotonSharedUserAttributes,
  phoneNumber: PhotonSharedUserPhoneNumber,
});

const PhotonMemoryWebhook = Schema.Struct({
  attributes: PhotonWebhookAttributes,
  callbackUrl: PhotonWebhookCallbackUrl,
});

const PhotonMemoryLine = Schema.Struct({
  attributes: PhotonLineAttributes,
  phoneNumber: Schema.Redacted(PhotonE164PhoneNumber),
});

export const PhotonManagementMemoryInventory = Schema.Struct({
  project: PhotonProjectAttributes,
  platform: PhotonPlatformAttributes,
  sharedUsers: Schema.Array(PhotonMemorySharedUser),
  webhooks: Schema.Array(PhotonMemoryWebhook),
  lines: Schema.Array(PhotonMemoryLine),
  billing: PhotonBillingAttributes,
});
export type PhotonManagementMemoryInventory =
  typeof PhotonManagementMemoryInventory.Type;
export type PhotonManagementMemoryInventoryEncoded =
  typeof PhotonManagementMemoryInventory.Encoded;

export interface PhotonManagementMemoryControlContract {
  readonly snapshot: EffectType.Effect<PhotonManagementMemoryInventory>;
  readonly providerWriteCount: EffectType.Effect<number>;
}

export class PhotonManagementMemoryControl extends Context.Service<
  PhotonManagementMemoryControl,
  PhotonManagementMemoryControlContract
>()("@bundjil/photon/management/PhotonManagementMemoryControl") {}

export const layerPhotonManagementMemory = (
  inventory: PhotonManagementMemoryInventory
) =>
  Layer.mergeAll(
    Layer.succeed(PhotonManagementMemoryControl, {
      snapshot: Effect.succeed(inventory),
      providerWriteCount: Effect.succeed(0),
    }),
    Layer.succeed(PhotonProjects, {
      observeProject: Effect.fn("PhotonProjectsMemory.observeProject")(
        (input: ObservePhotonProject) =>
          Effect.succeed(
            input.projectId === inventory.project.projectId
              ? PhotonProjectObservation.make({
                  _tag: "Found",
                  attributes: inventory.project,
                })
              : PhotonProjectObservation.make({
                  _tag: "Missing",
                  projectId: input.projectId,
                })
          )
      ),
    }),
    Layer.succeed(PhotonPlatforms, {
      observePlatform: Effect.fn("PhotonPlatformsMemory.observePlatform")(
        (input: ObservePhotonPlatform) =>
          Effect.succeed(
            input.projectId === inventory.platform.projectId &&
              input.platform === inventory.platform.platform
              ? PhotonPlatformObservation.make({
                  _tag: "Found",
                  attributes: inventory.platform,
                })
              : PhotonPlatformObservation.make({
                  _tag: "Missing",
                  projectId: input.projectId,
                  platform: input.platform,
                })
          )
      ),
    }),
    Layer.succeed(PhotonSharedUsers, {
      listSharedUsers: Effect.fn("PhotonSharedUsersMemory.listSharedUsers")(
        (input: ListPhotonSharedUsers) => {
          const matches = inventory.sharedUsers.filter(
            (user) => user.attributes.projectId === input.projectId
          );
          const page = matches.slice(input.offset, input.offset + input.limit);
          const next = input.offset + page.length;
          return Effect.succeed(
            ListedPhotonSharedUsers.make({
              users: page.map((user) => user.attributes),
              total: matches.length,
              nextOffset:
                next < matches.length
                  ? PhotonPaginationOffset.make(next)
                  : null,
            })
          );
        }
      ),
      observeSharedUser: Effect.fn("PhotonSharedUsersMemory.observeSharedUser")(
        function* (input: ObservePhotonSharedUser) {
          const matches = inventory.sharedUsers.filter(
            (user) =>
              user.attributes.projectId === input.projectId &&
              user.attributes.userId === input.userId
          );
          if (matches.length > 1) {
            return yield* new PhotonSharedUsersReadError({
              operation: "observeSharedUser",
              reason: "ambiguous",
              retry: "never",
              message:
                "The memory inventory contains duplicate shared-user identities.",
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
                attributes: matches[0].attributes,
              });
        }
      ),
      discoverSharedUser: Effect.fn(
        "PhotonSharedUsersMemory.discoverSharedUser"
      )(function* (input: DiscoverPhotonSharedUser) {
        const target = Redacted.value(input.phoneNumber);
        const matches = inventory.sharedUsers.filter(
          (user) =>
            user.attributes.projectId === input.projectId &&
            Redacted.value(user.phoneNumber) === target
        );
        if (matches.length > 1) {
          return yield* new PhotonSharedUsersReadError({
            operation: "discoverSharedUser",
            reason: "ambiguous",
            retry: "never",
            message:
              "The memory inventory contains an ambiguous shared-user semantic identity.",
          });
        }
        return matches[0] === undefined
          ? PhotonSharedUserDiscovery.make({
              _tag: "Missing",
              projectId: input.projectId,
            })
          : PhotonSharedUserDiscovery.make({
              _tag: "Found",
              attributes: matches[0].attributes,
            });
      }),
    }),
    Layer.succeed(PhotonWebhooks, {
      listWebhooks: Effect.fn("PhotonWebhooksMemory.listWebhooks")(
        (input: ListPhotonWebhooks) =>
          Effect.succeed(
            ListedPhotonWebhooks.make({
              webhooks: inventory.webhooks
                .filter(
                  (webhook) => webhook.attributes.projectId === input.projectId
                )
                .map((webhook) => webhook.attributes),
            })
          )
      ),
      observeWebhook: Effect.fn("PhotonWebhooksMemory.observeWebhook")(
        function* (input: ObservePhotonWebhook) {
          const matches = inventory.webhooks.filter(
            (webhook) =>
              webhook.attributes.projectId === input.projectId &&
              webhook.attributes.webhookId === input.webhookId
          );
          if (matches.length > 1) {
            return yield* new PhotonWebhooksReadError({
              operation: "observeWebhook",
              reason: "ambiguous",
              retry: "never",
              message:
                "The memory inventory contains duplicate webhook identities.",
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
                attributes: matches[0].attributes,
              });
        }
      ),
      discoverWebhook: Effect.fn("PhotonWebhooksMemory.discoverWebhook")(
        function* (input: DiscoverPhotonWebhook) {
          const target = Redacted.value(input.callbackUrl);
          const matches = inventory.webhooks.filter(
            (webhook) =>
              webhook.attributes.projectId === input.projectId &&
              Redacted.value(webhook.callbackUrl) === target
          );
          if (matches.length > 1) {
            return yield* new PhotonWebhooksReadError({
              operation: "discoverWebhook",
              reason: "ambiguous",
              retry: "never",
              message:
                "The memory inventory contains an ambiguous exact callback URL.",
            });
          }
          return matches[0] === undefined
            ? PhotonWebhookDiscovery.make({
                _tag: "Missing",
                projectId: input.projectId,
              })
            : PhotonWebhookDiscovery.make({
                _tag: "Found",
                attributes: matches[0].attributes,
              });
        }
      ),
    }),
    Layer.succeed(PhotonLines, {
      listLines: Effect.fn("PhotonLinesMemory.listLines")(
        (input: ListPhotonLines) =>
          Effect.succeed(
            ListedPhotonLines.make({
              lines: inventory.lines
                .filter(
                  (line) =>
                    line.attributes.projectId === input.projectId &&
                    line.attributes.platform === input.platform
                )
                .map((line) => line.attributes),
            })
          )
      ),
      observeLine: Effect.fn("PhotonLinesMemory.observeLine")(function* (
        input: ObservePhotonLine
      ) {
        const matches = inventory.lines.filter(
          (line) =>
            line.attributes.projectId === input.projectId &&
            line.attributes.lineId === input.lineId &&
            line.attributes.platform === input.platform
        );
        if (matches.length > 1) {
          return yield* new PhotonLinesReadError({
            operation: "observeLine",
            reason: "ambiguous",
            retry: "never",
            message: "The memory inventory contains duplicate line identities.",
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
              attributes: matches[0].attributes,
            });
      }),
    }),
    Layer.succeed(PhotonBilling, {
      observeBilling: Effect.fn("PhotonBillingMemory.observeBilling")(
        (input: ObservePhotonBilling) =>
          Effect.succeed(
            input.projectId === inventory.billing.projectId
              ? PhotonBillingObservation.make({
                  _tag: "Found",
                  attributes: inventory.billing,
                })
              : PhotonBillingObservation.make({
                  _tag: "Unavailable",
                  projectId: input.projectId,
                })
          )
      ),
    })
  );

export const emptyPhotonManagementMemoryInventory = (
  projectId: typeof PhotonProjectId.Type
) =>
  PhotonManagementMemoryInventory.make({
    project: PhotonProjectAttributes.make({
      projectId,
      name: PhotonProjectName.make("unconfigured"),
      slug: PhotonProjectSlug.make("unconfigured"),
      profileConfigured: false,
    }),
    platform: PhotonPlatformAttributes.make({
      projectId,
      platform: "imessage",
      enabled: false,
      autoScale: null,
      serviceType: "shared",
    }),
    sharedUsers: [],
    webhooks: [],
    lines: [],
    billing: PhotonBillingAttributes.make({
      projectId,
      tier: PhotonSubscriptionTier.make("free"),
      status: null,
      cancelAtPeriodEnd: false,
    }),
  });

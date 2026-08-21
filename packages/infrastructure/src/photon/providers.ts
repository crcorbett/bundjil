import {
  ObservePhotonBilling,
  ObservePhotonLine,
  ObservePhotonPlatform,
  ObservePhotonProject,
  ObservePhotonSharedUser,
  ObservePhotonWebhook,
  PhotonBilling,
  PhotonBillingReadError,
  PhotonLines,
  PhotonLinesReadError,
  PhotonPlatforms,
  PhotonPlatformsReadError,
  PhotonProjects,
  PhotonProjectsReadError,
  PhotonSharedUsers,
  PhotonSharedUsersReadError,
  PhotonWebhooks,
  PhotonWebhooksReadError,
} from "@bundjil/photon/management";
import type { PhotonProjectObservation } from "@bundjil/photon/management";
import type { Resource } from "alchemy";
import { Unowned } from "alchemy/AdoptPolicy";
import { isResolved } from "alchemy/Diff";
import * as Provider from "alchemy/Provider";
import { Resource as makeResource } from "alchemy/Resource";
import { Console, Effect, Layer, Match, Schema } from "effect";

import type {
  PhotonBillingObservationAttributes,
  PhotonBillingObservationProps,
  PhotonInventoryScope,
  PhotonLineObservationAttributes,
  PhotonLineObservationProps,
  PhotonPlatformConfigurationAttributes,
  PhotonPlatformConfigurationProps,
  PhotonProjectObservationAttributes,
  PhotonProjectObservationProps,
  PhotonSharedUserAttributes,
  PhotonSharedUserProps,
  PhotonWebhookObservationAttributes,
  PhotonWebhookObservationProps,
} from "./schemas.js";
/* oxlint-disable unicorn/no-array-method-this-argument -- Effect.forEach is a data-first Effect combinator, not Array.prototype.forEach. */
import {
  PhotonBillingObservationAttributes as PhotonBillingAttributesSchema,
  PhotonLineObservationAttributes as PhotonLineAttributesSchema,
  PhotonPlatformConfigurationAttributes as PhotonPlatformAttributesSchema,
  PhotonProjectObservationAttributes as PhotonProjectAttributesSchema,
  PhotonSharedUserAttributes as PhotonSharedUserAttributesSchema,
  PhotonWebhookObservationAttributes as PhotonWebhookAttributesSchema,
} from "./schemas.js";

const missingPhotonResource = undefined;
const PhotonReadOnlyNoopDiff = Schema.Struct({
  action: Schema.Literal("noop"),
});

export type PhotonProjectObservationResource = Resource<
  "Bundjil.Infrastructure.PhotonProjectObservation",
  PhotonProjectObservationProps,
  PhotonProjectObservationAttributes
>;
export const PhotonProjectObservationResource =
  makeResource<PhotonProjectObservationResource>(
    "Bundjil.Infrastructure.PhotonProjectObservation",
    { defaultRemovalPolicy: "retain" }
  );

export type PhotonPlatformConfigurationResource = Resource<
  "Bundjil.Infrastructure.PhotonPlatformConfiguration",
  PhotonPlatformConfigurationProps,
  PhotonPlatformConfigurationAttributes
>;
export const PhotonPlatformConfigurationResource =
  makeResource<PhotonPlatformConfigurationResource>(
    "Bundjil.Infrastructure.PhotonPlatformConfiguration",
    { defaultRemovalPolicy: "retain" }
  );

export type PhotonSharedUserResource = Resource<
  "Bundjil.Infrastructure.PhotonSharedUser",
  PhotonSharedUserProps,
  PhotonSharedUserAttributes
>;
export const PhotonSharedUserResource = makeResource<PhotonSharedUserResource>(
  "Bundjil.Infrastructure.PhotonSharedUser",
  { defaultRemovalPolicy: "retain" }
);

export type PhotonWebhookObservationResource = Resource<
  "Bundjil.Infrastructure.PhotonWebhookObservation",
  PhotonWebhookObservationProps,
  PhotonWebhookObservationAttributes
>;
export const PhotonWebhookObservationResource =
  makeResource<PhotonWebhookObservationResource>(
    "Bundjil.Infrastructure.PhotonWebhookObservation",
    { defaultRemovalPolicy: "retain" }
  );

export type PhotonLineObservationResource = Resource<
  "Bundjil.Infrastructure.PhotonLineObservation",
  PhotonLineObservationProps,
  PhotonLineObservationAttributes
>;
export const PhotonLineObservationResource =
  makeResource<PhotonLineObservationResource>(
    "Bundjil.Infrastructure.PhotonLineObservation",
    { defaultRemovalPolicy: "retain" }
  );

export type PhotonBillingObservationResource = Resource<
  "Bundjil.Infrastructure.PhotonBillingObservation",
  PhotonBillingObservationProps,
  PhotonBillingObservationAttributes
>;
export const PhotonBillingObservationResource =
  makeResource<PhotonBillingObservationResource>(
    "Bundjil.Infrastructure.PhotonBillingObservation",
    { defaultRemovalPolicy: "retain" }
  );

const requireFoundProject = Effect.fn("requireFoundPhotonProject")(
  (
    stage: PhotonProjectObservationProps["stage"],
    observation: PhotonProjectObservation
  ) =>
    Match.value(observation).pipe(
      Match.tag("Missing", () =>
        Effect.fail(
          new PhotonProjectsReadError({
            operation: "observeProject",
            reason: "notFound",
            retry: "never",
            message: "The retained Photon project was not found.",
          })
        )
      ),
      Match.tag("Found", ({ attributes }) =>
        Effect.succeed(
          PhotonProjectAttributesSchema.make({
            stage,
            ...attributes,
            ownership: "Unowned",
          })
        )
      ),
      Match.exhaustive
    )
);

export const layerPhotonReadOnlyProviders = (scope: PhotonInventoryScope) => {
  const projectProvider = Provider.succeed(PhotonProjectObservationResource, {
    read: Effect.fn("PhotonProjectObservationProvider.read")(function* ({
      olds,
      output,
    }) {
      const projects = yield* PhotonProjects;
      const observed = yield* projects.observeProject(
        ObservePhotonProject.make({
          projectId: output?.projectId ?? olds.projectId,
        })
      );
      const attributes = yield* Match.value(observed).pipe(
        Match.tag("Missing", () => Effect.succeed(missingPhotonResource)),
        Match.tag("Found", ({ attributes }) =>
          Effect.gen(function* diagnosePhotonProjectObservation() {
            const current = PhotonProjectAttributesSchema.make({
              stage: olds.stage,
              ...attributes,
              ownership: "Unowned",
            });
            if (output !== undefined) {
              const changedFields = {
                name: output.name !== current.name,
                ownership: output.ownership !== current.ownership,
                profileConfigured:
                  output.profileConfigured !== current.profileConfigured,
                projectId: output.projectId !== current.projectId,
                slug: output.slug !== current.slug,
                stage: output.stage !== current.stage,
              };
              if (Object.values(changedFields).some(Boolean)) {
                yield* Console.info({
                  changedFields,
                  diagnostic: "photonProjectObservationDrift",
                });
              }
            }
            return current;
          })
        ),
        Match.exhaustive
      );
      return output === undefined && attributes !== undefined
        ? Unowned(attributes)
        : attributes;
    }),
    diff: Effect.fn("PhotonProjectObservationProvider.diff")(({ news }) =>
      Effect.sync(() =>
        isResolved(news)
          ? PhotonReadOnlyNoopDiff.make({ action: "noop" })
          : missingPhotonResource
      )
    ),
    reconcile: Effect.fn("PhotonProjectObservationProvider.reconcile")(
      function* ({ news }) {
        const projects = yield* PhotonProjects;
        const observed = yield* projects.observeProject(
          ObservePhotonProject.make({ projectId: news.projectId })
        );
        return yield* requireFoundProject(news.stage, observed);
      }
    ),
    delete: Effect.fn("PhotonProjectObservationProvider.delete")(() =>
      Effect.fail(
        new PhotonProjectsReadError({
          operation: "observeProject",
          reason: "writeForbidden",
          retry: "never",
          message: "Photon project deletion and secret rotation are disabled.",
        })
      )
    ),
    list: Effect.fn("PhotonProjectObservationProvider.list")(function* () {
      const projects = yield* PhotonProjects;
      const observed = yield* projects.observeProject(
        ObservePhotonProject.make({ projectId: scope.projectId })
      );
      const attributes = yield* requireFoundProject(scope.stage, observed);
      return [attributes];
    }),
    stables: ["projectId"],
  });

  const platformProvider = Provider.succeed(
    PhotonPlatformConfigurationResource,
    {
      read: Effect.fn("PhotonPlatformConfigurationProvider.read")(function* ({
        olds,
        output,
      }) {
        const platforms = yield* PhotonPlatforms;
        const observed = yield* platforms.observePlatform(
          ObservePhotonPlatform.make({
            projectId: output?.projectId ?? olds.projectId,
            platform: olds.platform,
          })
        );
        const attributes = yield* Match.value(observed).pipe(
          Match.tag("Missing", () => Effect.succeed(missingPhotonResource)),
          Match.tag("Found", ({ attributes }) =>
            Effect.succeed(
              PhotonPlatformAttributesSchema.make({
                stage: olds.stage,
                ...attributes,
                ownership: "Unowned",
              })
            )
          ),
          Match.exhaustive
        );
        return output === undefined && attributes !== undefined
          ? Unowned(attributes)
          : attributes;
      }),
      diff: Effect.fn("PhotonPlatformConfigurationProvider.diff")(({ news }) =>
        Effect.sync(() =>
          isResolved(news)
            ? PhotonReadOnlyNoopDiff.make({ action: "noop" })
            : missingPhotonResource
        )
      ),
      reconcile: Effect.fn("PhotonPlatformConfigurationProvider.reconcile")(
        function* ({ news }) {
          const platforms = yield* PhotonPlatforms;
          const observed = yield* platforms.observePlatform(
            ObservePhotonPlatform.make({
              projectId: news.projectId,
              platform: news.platform,
            })
          );
          return yield* Match.value(observed).pipe(
            Match.tag("Missing", () =>
              Effect.fail(
                new PhotonPlatformsReadError({
                  operation: "observePlatform",
                  reason: "notFound",
                  retry: "never",
                  message: "The retained Photon platform was not found.",
                })
              )
            ),
            Match.tag("Found", ({ attributes }) =>
              Effect.succeed(
                PhotonPlatformAttributesSchema.make({
                  stage: news.stage,
                  ...attributes,
                  ownership: "Unowned",
                })
              )
            ),
            Match.exhaustive
          );
        }
      ),
      delete: Effect.fn("PhotonPlatformConfigurationProvider.delete")(() =>
        Effect.fail(
          new PhotonPlatformsReadError({
            operation: "observePlatform",
            reason: "writeForbidden",
            retry: "never",
            message:
              "Photon platform mutation is disabled in read/import mode.",
          })
        )
      ),
      list: Effect.fn("PhotonPlatformConfigurationProvider.list")(function* () {
        const platforms = yield* PhotonPlatforms;
        const observed = yield* platforms.observePlatform(
          ObservePhotonPlatform.make({
            projectId: scope.projectId,
            platform: "imessage",
          })
        );
        return yield* Match.value(observed).pipe(
          Match.tag("Missing", () => Effect.succeed([])),
          Match.tag("Found", ({ attributes }) =>
            Effect.succeed([
              PhotonPlatformAttributesSchema.make({
                stage: scope.stage,
                ...attributes,
                ownership: "Unowned",
              }),
            ])
          ),
          Match.exhaustive
        );
      }),
      stables: ["projectId", "platform"],
    }
  );

  const sharedUserProvider = Provider.succeed(PhotonSharedUserResource, {
    read: Effect.fn("PhotonSharedUserProvider.read")(function* ({
      olds,
      output,
    }) {
      const users = yield* PhotonSharedUsers;
      const observed = yield* users.observeSharedUser(
        ObservePhotonSharedUser.make({
          projectId: output?.projectId ?? olds.projectId,
          userId: output?.userId ?? olds.userId,
        })
      );
      const attributes = yield* Match.value(observed).pipe(
        Match.tag("Missing", () => Effect.succeed(missingPhotonResource)),
        Match.tag("Found", ({ attributes }) =>
          Effect.succeed(
            PhotonSharedUserAttributesSchema.make({
              stage: olds.stage,
              ...attributes,
              ownership: "Unowned",
            })
          )
        ),
        Match.exhaustive
      );
      return output === undefined && attributes !== undefined
        ? Unowned(attributes)
        : attributes;
    }),
    diff: Effect.fn("PhotonSharedUserProvider.diff")(({ news }) =>
      Effect.sync(() =>
        isResolved(news)
          ? PhotonReadOnlyNoopDiff.make({ action: "noop" })
          : missingPhotonResource
      )
    ),
    reconcile: Effect.fn("PhotonSharedUserProvider.reconcile")(function* ({
      news,
    }) {
      const users = yield* PhotonSharedUsers;
      const observed = yield* users.observeSharedUser(
        ObservePhotonSharedUser.make({
          projectId: news.projectId,
          userId: news.userId,
        })
      );
      return yield* Match.value(observed).pipe(
        Match.tag("Missing", () =>
          Effect.fail(
            new PhotonSharedUsersReadError({
              operation: "observeSharedUser",
              reason: "notFound",
              retry: "never",
              message: "The retained Photon shared user was not found.",
            })
          )
        ),
        Match.tag("Found", ({ attributes }) =>
          Effect.succeed(
            PhotonSharedUserAttributesSchema.make({
              stage: news.stage,
              ...attributes,
              ownership: "Unowned",
            })
          )
        ),
        Match.exhaustive
      );
    }),
    delete: Effect.fn("PhotonSharedUserProvider.delete")(() =>
      Effect.fail(
        new PhotonSharedUsersReadError({
          operation: "observeSharedUser",
          reason: "writeForbidden",
          retry: "never",
          message:
            "Photon shared-user mutation is disabled in read/import mode.",
        })
      )
    ),
    list: Effect.fn("PhotonSharedUserProvider.list")(function* () {
      const users = yield* PhotonSharedUsers;
      return yield* Effect.forEach(scope.sharedUserIds, (userId) =>
        Effect.gen(function* observeInventorySharedUser() {
          const observed = yield* users.observeSharedUser(
            ObservePhotonSharedUser.make({
              projectId: scope.projectId,
              userId,
            })
          );
          return yield* Match.value(observed).pipe(
            Match.tag("Missing", () =>
              Effect.fail(
                new PhotonSharedUsersReadError({
                  operation: "observeSharedUser",
                  reason: "notFound",
                  retry: "never",
                  message:
                    "A reviewed Photon shared-user inventory identity was not found.",
                })
              )
            ),
            Match.tag("Found", ({ attributes }) =>
              Effect.succeed(
                PhotonSharedUserAttributesSchema.make({
                  stage: scope.stage,
                  ...attributes,
                  ownership: "Unowned",
                })
              )
            ),
            Match.exhaustive
          );
        })
      );
    }),
    stables: ["projectId", "userId"],
  });

  const webhookProvider = Provider.succeed(PhotonWebhookObservationResource, {
    read: Effect.fn("PhotonWebhookObservationProvider.read")(function* ({
      olds,
      output,
    }) {
      const webhooks = yield* PhotonWebhooks;
      const observed = yield* webhooks.observeWebhook(
        ObservePhotonWebhook.make({
          projectId: output?.projectId ?? olds.projectId,
          webhookId: output?.webhookId ?? olds.webhookId,
        })
      );
      const attributes = yield* Match.value(observed).pipe(
        Match.tag("Missing", () => Effect.succeed(missingPhotonResource)),
        Match.tag("Found", ({ attributes }) =>
          Effect.succeed(
            PhotonWebhookAttributesSchema.make({
              stage: olds.stage,
              ...attributes,
              ownership: "Unowned",
            })
          )
        ),
        Match.exhaustive
      );
      return output === undefined && attributes !== undefined
        ? Unowned(attributes)
        : attributes;
    }),
    diff: Effect.fn("PhotonWebhookObservationProvider.diff")(({ news }) =>
      Effect.sync(() =>
        isResolved(news)
          ? PhotonReadOnlyNoopDiff.make({ action: "noop" })
          : missingPhotonResource
      )
    ),
    reconcile: Effect.fn("PhotonWebhookObservationProvider.reconcile")(
      function* ({ news }) {
        const webhooks = yield* PhotonWebhooks;
        const observed = yield* webhooks.observeWebhook(
          ObservePhotonWebhook.make({
            projectId: news.projectId,
            webhookId: news.webhookId,
          })
        );
        return yield* Match.value(observed).pipe(
          Match.tag("Missing", () =>
            Effect.fail(
              new PhotonWebhooksReadError({
                operation: "observeWebhook",
                reason: "notFound",
                retry: "never",
                message: "The retained Photon webhook was not found.",
              })
            )
          ),
          Match.tag("Found", ({ attributes }) =>
            Effect.succeed(
              PhotonWebhookAttributesSchema.make({
                stage: news.stage,
                ...attributes,
                ownership: "Unowned",
              })
            )
          ),
          Match.exhaustive
        );
      }
    ),
    delete: Effect.fn("PhotonWebhookObservationProvider.delete")(() =>
      Effect.fail(
        new PhotonWebhooksReadError({
          operation: "observeWebhook",
          reason: "writeForbidden",
          retry: "never",
          message: "Photon webhook mutation and secret rotation are disabled.",
        })
      )
    ),
    list: Effect.fn("PhotonWebhookObservationProvider.list")(function* () {
      const webhooks = yield* PhotonWebhooks;
      return yield* Effect.forEach(scope.webhookIds, (webhookId) =>
        Effect.gen(function* observeInventoryWebhook() {
          const observed = yield* webhooks.observeWebhook(
            ObservePhotonWebhook.make({
              projectId: scope.projectId,
              webhookId,
            })
          );
          return yield* Match.value(observed).pipe(
            Match.tag("Missing", () =>
              Effect.fail(
                new PhotonWebhooksReadError({
                  operation: "observeWebhook",
                  reason: "notFound",
                  retry: "never",
                  message:
                    "A reviewed Photon webhook inventory identity was not found.",
                })
              )
            ),
            Match.tag("Found", ({ attributes }) =>
              Effect.succeed(
                PhotonWebhookAttributesSchema.make({
                  stage: scope.stage,
                  ...attributes,
                  ownership: "Unowned",
                })
              )
            ),
            Match.exhaustive
          );
        })
      );
    }),
    stables: ["projectId", "webhookId"],
  });

  const lineProvider = Provider.succeed(PhotonLineObservationResource, {
    read: Effect.fn("PhotonLineObservationProvider.read")(function* ({
      olds,
      output,
    }) {
      const lines = yield* PhotonLines;
      const observed = yield* lines.observeLine(
        ObservePhotonLine.make({
          projectId: output?.projectId ?? olds.projectId,
          lineId: output?.lineId ?? olds.lineId,
          platform: olds.platform,
        })
      );
      const attributes = yield* Match.value(observed).pipe(
        Match.tag("Missing", () => Effect.succeed(missingPhotonResource)),
        Match.tag("Found", ({ attributes }) =>
          Effect.succeed(
            PhotonLineAttributesSchema.make({
              stage: olds.stage,
              ...attributes,
              ownership: "Unowned",
            })
          )
        ),
        Match.exhaustive
      );
      return output === undefined && attributes !== undefined
        ? Unowned(attributes)
        : attributes;
    }),
    diff: Effect.fn("PhotonLineObservationProvider.diff")(({ news }) =>
      Effect.sync(() =>
        isResolved(news)
          ? PhotonReadOnlyNoopDiff.make({ action: "noop" })
          : missingPhotonResource
      )
    ),
    reconcile: Effect.fn("PhotonLineObservationProvider.reconcile")(function* ({
      news,
    }) {
      const lines = yield* PhotonLines;
      const observed = yield* lines.observeLine(
        ObservePhotonLine.make({
          projectId: news.projectId,
          lineId: news.lineId,
          platform: news.platform,
        })
      );
      return yield* Match.value(observed).pipe(
        Match.tag("Missing", () =>
          Effect.fail(
            new PhotonLinesReadError({
              operation: "observeLine",
              reason: "notFound",
              retry: "never",
              message: "The retained Photon line was not found.",
            })
          )
        ),
        Match.tag("Found", ({ attributes }) =>
          Effect.succeed(
            PhotonLineAttributesSchema.make({
              stage: news.stage,
              ...attributes,
              ownership: "Unowned",
            })
          )
        ),
        Match.exhaustive
      );
    }),
    delete: Effect.fn("PhotonLineObservationProvider.delete")(() =>
      Effect.fail(
        new PhotonLinesReadError({
          operation: "observeLine",
          reason: "writeForbidden",
          retry: "never",
          message: "Photon dedicated-line mutation is disabled.",
        })
      )
    ),
    list: Effect.fn("PhotonLineObservationProvider.list")(function* () {
      const lines = yield* PhotonLines;
      return yield* Effect.forEach(scope.lineIds, (lineId) =>
        Effect.gen(function* observeInventoryLine() {
          const observed = yield* lines.observeLine(
            ObservePhotonLine.make({
              projectId: scope.projectId,
              lineId,
              platform: "imessage",
            })
          );
          return yield* Match.value(observed).pipe(
            Match.tag("Missing", () =>
              Effect.fail(
                new PhotonLinesReadError({
                  operation: "observeLine",
                  reason: "notFound",
                  retry: "never",
                  message:
                    "A reviewed Photon line inventory identity was not found.",
                })
              )
            ),
            Match.tag("Found", ({ attributes }) =>
              Effect.succeed(
                PhotonLineAttributesSchema.make({
                  stage: scope.stage,
                  ...attributes,
                  ownership: "Unowned",
                })
              )
            ),
            Match.exhaustive
          );
        })
      );
    }),
    stables: ["projectId", "lineId", "platform"],
  });

  const billingProvider = Provider.succeed(PhotonBillingObservationResource, {
    read: Effect.fn("PhotonBillingObservationProvider.read")(function* ({
      olds,
      output,
    }) {
      const billing = yield* PhotonBilling;
      const observed = yield* billing.observeBilling(
        ObservePhotonBilling.make({
          projectId: output?.projectId ?? olds.projectId,
        })
      );
      const attributes = yield* Match.value(observed).pipe(
        Match.tag("Unavailable", () => Effect.succeed(missingPhotonResource)),
        Match.tag("Found", ({ attributes }) =>
          Effect.succeed(
            PhotonBillingAttributesSchema.make({
              stage: olds.stage,
              ...attributes,
              ownership: "Unowned",
            })
          )
        ),
        Match.exhaustive
      );
      return output === undefined && attributes !== undefined
        ? Unowned(attributes)
        : attributes;
    }),
    diff: Effect.fn("PhotonBillingObservationProvider.diff")(({ news }) =>
      Effect.sync(() =>
        isResolved(news)
          ? PhotonReadOnlyNoopDiff.make({ action: "noop" })
          : missingPhotonResource
      )
    ),
    reconcile: Effect.fn("PhotonBillingObservationProvider.reconcile")(
      function* ({ news }) {
        const billing = yield* PhotonBilling;
        const observed = yield* billing.observeBilling(
          ObservePhotonBilling.make({ projectId: news.projectId })
        );
        return yield* Match.value(observed).pipe(
          Match.tag("Unavailable", () =>
            Effect.fail(
              new PhotonBillingReadError({
                operation: "observeBilling",
                reason: "unavailable",
                retry: "never",
                message: "Photon billing readback is unavailable.",
              })
            )
          ),
          Match.tag("Found", ({ attributes }) =>
            Effect.succeed(
              PhotonBillingAttributesSchema.make({
                stage: news.stage,
                ...attributes,
                ownership: "Unowned",
              })
            )
          ),
          Match.exhaustive
        );
      }
    ),
    delete: Effect.fn("PhotonBillingObservationProvider.delete")(() =>
      Effect.fail(
        new PhotonBillingReadError({
          operation: "observeBilling",
          reason: "writeForbidden",
          retry: "never",
          message: "Photon billing mutation is disabled.",
        })
      )
    ),
    list: Effect.fn("PhotonBillingObservationProvider.list")(function* () {
      const billing = yield* PhotonBilling;
      const observed = yield* billing.observeBilling(
        ObservePhotonBilling.make({ projectId: scope.projectId })
      );
      return yield* Match.value(observed).pipe(
        Match.tag("Unavailable", () => Effect.succeed([])),
        Match.tag("Found", ({ attributes }) =>
          Effect.succeed([
            PhotonBillingAttributesSchema.make({
              stage: scope.stage,
              ...attributes,
              ownership: "Unowned",
            }),
          ])
        ),
        Match.exhaustive
      );
    }),
    stables: ["projectId"],
  });

  return Layer.mergeAll(
    projectProvider,
    platformProvider,
    sharedUserProvider,
    webhookProvider,
    lineProvider,
    billingProvider
  );
};

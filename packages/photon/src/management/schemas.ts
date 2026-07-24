import { Schema } from "effect";

import {
  PhotonLineId,
  PhotonProjectId,
  PhotonSharedUserPhoneNumber,
  PhotonSubscriptionTier,
  PhotonUserId,
  PhotonWebhookId,
} from "../schemas.js";

export const PhotonManagementRetry = Schema.Literals(["never", "backoff"]);
export type PhotonManagementRetry = typeof PhotonManagementRetry.Type;
export type PhotonManagementRetryEncoded = typeof PhotonManagementRetry.Encoded;

export const PhotonManagementReadOperation = Schema.Literals([
  "observeProject",
  "observePlatform",
  "listSharedUsers",
  "observeSharedUser",
  "discoverSharedUser",
  "listWebhooks",
  "observeWebhook",
  "discoverWebhook",
  "listLines",
  "observeLine",
  "observeBilling",
]);
export type PhotonManagementReadOperation =
  typeof PhotonManagementReadOperation.Type;
export type PhotonManagementReadOperationEncoded =
  typeof PhotonManagementReadOperation.Encoded;

export const PhotonManagementReadFailureReason = Schema.Literals([
  "notFound",
  "ambiguous",
  "conflict",
  "rateLimited",
  "transient",
  "invalidResponse",
  "requestFailed",
  "unavailable",
  "writeForbidden",
]);
export type PhotonManagementReadFailureReason =
  typeof PhotonManagementReadFailureReason.Type;
export type PhotonManagementReadFailureReasonEncoded =
  typeof PhotonManagementReadFailureReason.Encoded;

export const PhotonProjectName = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/photon/management/PhotonProjectName")
);
export type PhotonProjectName = typeof PhotonProjectName.Type;
export type PhotonProjectNameEncoded = typeof PhotonProjectName.Encoded;

export const PhotonProjectSlug = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/photon/management/PhotonProjectSlug")
);
export type PhotonProjectSlug = typeof PhotonProjectSlug.Type;
export type PhotonProjectSlugEncoded = typeof PhotonProjectSlug.Encoded;

export const PhotonPlatform = Schema.Literal("imessage");
export type PhotonPlatform = typeof PhotonPlatform.Type;
export type PhotonPlatformEncoded = typeof PhotonPlatform.Encoded;

export const PhotonIMessageServiceType = Schema.Literals([
  "shared",
  "dedicated",
]);
export type PhotonIMessageServiceType = typeof PhotonIMessageServiceType.Type;
export type PhotonIMessageServiceTypeEncoded =
  typeof PhotonIMessageServiceType.Encoded;

export const PhotonLineStatus = Schema.Literals([
  "available",
  "unavailable",
  "unknown",
]);
export type PhotonLineStatus = typeof PhotonLineStatus.Type;
export type PhotonLineStatusEncoded = typeof PhotonLineStatus.Encoded;

export const PhotonSubscriptionStatus = Schema.NullOr(
  Schema.Literals(["active", "canceled", "past_due"])
);
export type PhotonSubscriptionStatus = typeof PhotonSubscriptionStatus.Type;
export type PhotonSubscriptionStatusEncoded =
  typeof PhotonSubscriptionStatus.Encoded;

export const PhotonPaginationLimit = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 500 })),
  Schema.brand("@bundjil/photon/management/PhotonPaginationLimit")
);
export type PhotonPaginationLimit = typeof PhotonPaginationLimit.Type;
export type PhotonPaginationLimitEncoded = typeof PhotonPaginationLimit.Encoded;

export const PhotonPaginationOffset = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 0, maximum: 1_000_000 })),
  Schema.brand("@bundjil/photon/management/PhotonPaginationOffset")
);
export type PhotonPaginationOffset = typeof PhotonPaginationOffset.Type;
export type PhotonPaginationOffsetEncoded =
  typeof PhotonPaginationOffset.Encoded;

export const PhotonWebhookCallbackUrl = Schema.Redacted(
  Schema.NonEmptyString.pipe(
    Schema.check(Schema.isPattern(/^https:\/\/[^\s]+$/))
  )
);
export type PhotonWebhookCallbackUrl = typeof PhotonWebhookCallbackUrl.Type;
export type PhotonWebhookCallbackUrlEncoded =
  typeof PhotonWebhookCallbackUrl.Encoded;

export const PhotonCallbackOrigin = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/photon/management/PhotonCallbackOrigin")
);
export type PhotonCallbackOrigin = typeof PhotonCallbackOrigin.Type;
export type PhotonCallbackOriginEncoded = typeof PhotonCallbackOrigin.Encoded;

export const PhotonCallbackPath = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/photon/management/PhotonCallbackPath")
);
export type PhotonCallbackPath = typeof PhotonCallbackPath.Type;
export type PhotonCallbackPathEncoded = typeof PhotonCallbackPath.Encoded;

export const PhotonSigningSecretObservation = Schema.Union([
  Schema.TaggedStruct("ObservedUnknown", {
    configured: Schema.Literal(true),
  }),
  Schema.TaggedStruct("Absent", {}),
]);
export type PhotonSigningSecretObservation =
  typeof PhotonSigningSecretObservation.Type;
export type PhotonSigningSecretObservationEncoded =
  typeof PhotonSigningSecretObservation.Encoded;

export const ObservePhotonProject = Schema.Struct({
  projectId: PhotonProjectId,
});
export type ObservePhotonProject = typeof ObservePhotonProject.Type;
export type ObservePhotonProjectEncoded = typeof ObservePhotonProject.Encoded;

export const PhotonProjectAttributes = Schema.Struct({
  projectId: PhotonProjectId,
  name: PhotonProjectName,
  slug: PhotonProjectSlug,
  profileConfigured: Schema.Boolean,
});
export type PhotonProjectAttributes = typeof PhotonProjectAttributes.Type;
export type PhotonProjectAttributesEncoded =
  typeof PhotonProjectAttributes.Encoded;

export const PhotonProjectObservation = Schema.Union([
  Schema.TaggedStruct("Missing", { projectId: PhotonProjectId }),
  Schema.TaggedStruct("Found", { attributes: PhotonProjectAttributes }),
]);
export type PhotonProjectObservation = typeof PhotonProjectObservation.Type;
export type PhotonProjectObservationEncoded =
  typeof PhotonProjectObservation.Encoded;

export const ObservePhotonPlatform = Schema.Struct({
  projectId: PhotonProjectId,
  platform: PhotonPlatform,
});
export type ObservePhotonPlatform = typeof ObservePhotonPlatform.Type;
export type ObservePhotonPlatformEncoded = typeof ObservePhotonPlatform.Encoded;

export const PhotonPlatformAttributes = Schema.Struct({
  projectId: PhotonProjectId,
  platform: PhotonPlatform,
  enabled: Schema.Boolean,
  autoScale: Schema.NullOr(Schema.Boolean),
  serviceType: PhotonIMessageServiceType,
});
export type PhotonPlatformAttributes = typeof PhotonPlatformAttributes.Type;
export type PhotonPlatformAttributesEncoded =
  typeof PhotonPlatformAttributes.Encoded;

export const PhotonPlatformObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    projectId: PhotonProjectId,
    platform: PhotonPlatform,
  }),
  Schema.TaggedStruct("Found", { attributes: PhotonPlatformAttributes }),
]);
export type PhotonPlatformObservation = typeof PhotonPlatformObservation.Type;
export type PhotonPlatformObservationEncoded =
  typeof PhotonPlatformObservation.Encoded;

export const ListPhotonSharedUsers = Schema.Struct({
  projectId: PhotonProjectId,
  limit: PhotonPaginationLimit,
  offset: PhotonPaginationOffset,
});
export type ListPhotonSharedUsers = typeof ListPhotonSharedUsers.Type;
export type ListPhotonSharedUsersEncoded = typeof ListPhotonSharedUsers.Encoded;

export const ObservePhotonSharedUser = Schema.Struct({
  projectId: PhotonProjectId,
  userId: PhotonUserId,
});
export type ObservePhotonSharedUser = typeof ObservePhotonSharedUser.Type;
export type ObservePhotonSharedUserEncoded =
  typeof ObservePhotonSharedUser.Encoded;

export const DiscoverPhotonSharedUser = Schema.Struct({
  projectId: PhotonProjectId,
  phoneNumber: PhotonSharedUserPhoneNumber,
});
export type DiscoverPhotonSharedUser = typeof DiscoverPhotonSharedUser.Type;
export type DiscoverPhotonSharedUserEncoded =
  typeof DiscoverPhotonSharedUser.Encoded;

export const PhotonSharedUserAttributes = Schema.Struct({
  projectId: PhotonProjectId,
  userId: PhotonUserId,
  serviceType: Schema.Literal("shared"),
  assignmentPresent: Schema.Boolean,
});
export type PhotonSharedUserAttributes = typeof PhotonSharedUserAttributes.Type;
export type PhotonSharedUserAttributesEncoded =
  typeof PhotonSharedUserAttributes.Encoded;

export const ListedPhotonSharedUsers = Schema.Struct({
  users: Schema.Array(PhotonSharedUserAttributes),
  total: Schema.Int,
  nextOffset: Schema.NullOr(PhotonPaginationOffset),
});
export type ListedPhotonSharedUsers = typeof ListedPhotonSharedUsers.Type;
export type ListedPhotonSharedUsersEncoded =
  typeof ListedPhotonSharedUsers.Encoded;

export const PhotonSharedUserObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    projectId: PhotonProjectId,
    userId: PhotonUserId,
  }),
  Schema.TaggedStruct("Found", { attributes: PhotonSharedUserAttributes }),
]);
export type PhotonSharedUserObservation =
  typeof PhotonSharedUserObservation.Type;
export type PhotonSharedUserObservationEncoded =
  typeof PhotonSharedUserObservation.Encoded;

export const PhotonSharedUserDiscovery = Schema.Union([
  Schema.TaggedStruct("Missing", { projectId: PhotonProjectId }),
  Schema.TaggedStruct("Found", { attributes: PhotonSharedUserAttributes }),
]);
export type PhotonSharedUserDiscovery = typeof PhotonSharedUserDiscovery.Type;
export type PhotonSharedUserDiscoveryEncoded =
  typeof PhotonSharedUserDiscovery.Encoded;

export const ListPhotonWebhooks = Schema.Struct({
  projectId: PhotonProjectId,
});
export type ListPhotonWebhooks = typeof ListPhotonWebhooks.Type;
export type ListPhotonWebhooksEncoded = typeof ListPhotonWebhooks.Encoded;

export const ObservePhotonWebhook = Schema.Struct({
  projectId: PhotonProjectId,
  webhookId: PhotonWebhookId,
});
export type ObservePhotonWebhook = typeof ObservePhotonWebhook.Type;
export type ObservePhotonWebhookEncoded = typeof ObservePhotonWebhook.Encoded;

export const DiscoverPhotonWebhook = Schema.Struct({
  projectId: PhotonProjectId,
  callbackUrl: PhotonWebhookCallbackUrl,
});
export type DiscoverPhotonWebhook = typeof DiscoverPhotonWebhook.Type;
export type DiscoverPhotonWebhookEncoded = typeof DiscoverPhotonWebhook.Encoded;

export const PhotonWebhookAttributes = Schema.Struct({
  projectId: PhotonProjectId,
  webhookId: PhotonWebhookId,
  callbackOrigin: PhotonCallbackOrigin,
  callbackPath: PhotonCallbackPath,
  queryPresent: Schema.Boolean,
  signingSecret: PhotonSigningSecretObservation,
});
export type PhotonWebhookAttributes = typeof PhotonWebhookAttributes.Type;
export type PhotonWebhookAttributesEncoded =
  typeof PhotonWebhookAttributes.Encoded;

export const ListedPhotonWebhooks = Schema.Struct({
  webhooks: Schema.Array(PhotonWebhookAttributes),
});
export type ListedPhotonWebhooks = typeof ListedPhotonWebhooks.Type;
export type ListedPhotonWebhooksEncoded = typeof ListedPhotonWebhooks.Encoded;

export const PhotonWebhookObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    projectId: PhotonProjectId,
    webhookId: PhotonWebhookId,
  }),
  Schema.TaggedStruct("Found", { attributes: PhotonWebhookAttributes }),
]);
export type PhotonWebhookObservation = typeof PhotonWebhookObservation.Type;
export type PhotonWebhookObservationEncoded =
  typeof PhotonWebhookObservation.Encoded;

export const PhotonWebhookDiscovery = Schema.Union([
  Schema.TaggedStruct("Missing", { projectId: PhotonProjectId }),
  Schema.TaggedStruct("Found", { attributes: PhotonWebhookAttributes }),
]);
export type PhotonWebhookDiscovery = typeof PhotonWebhookDiscovery.Type;
export type PhotonWebhookDiscoveryEncoded =
  typeof PhotonWebhookDiscovery.Encoded;

export const ListPhotonLines = Schema.Struct({
  projectId: PhotonProjectId,
  platform: PhotonPlatform,
});
export type ListPhotonLines = typeof ListPhotonLines.Type;
export type ListPhotonLinesEncoded = typeof ListPhotonLines.Encoded;

export const ObservePhotonLine = Schema.Struct({
  projectId: PhotonProjectId,
  lineId: PhotonLineId,
  platform: PhotonPlatform,
});
export type ObservePhotonLine = typeof ObservePhotonLine.Type;
export type ObservePhotonLineEncoded = typeof ObservePhotonLine.Encoded;

export const PhotonLineAttributes = Schema.Struct({
  projectId: PhotonProjectId,
  lineId: PhotonLineId,
  platform: PhotonPlatform,
  status: PhotonLineStatus,
  assignmentPresent: Schema.Boolean,
  profileConfigured: Schema.Boolean,
});
export type PhotonLineAttributes = typeof PhotonLineAttributes.Type;
export type PhotonLineAttributesEncoded = typeof PhotonLineAttributes.Encoded;

export const ListedPhotonLines = Schema.Struct({
  lines: Schema.Array(PhotonLineAttributes),
});
export type ListedPhotonLines = typeof ListedPhotonLines.Type;
export type ListedPhotonLinesEncoded = typeof ListedPhotonLines.Encoded;

export const PhotonLineObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    projectId: PhotonProjectId,
    lineId: PhotonLineId,
    platform: PhotonPlatform,
  }),
  Schema.TaggedStruct("Found", { attributes: PhotonLineAttributes }),
]);
export type PhotonLineObservation = typeof PhotonLineObservation.Type;
export type PhotonLineObservationEncoded = typeof PhotonLineObservation.Encoded;

export const ObservePhotonBilling = Schema.Struct({
  projectId: PhotonProjectId,
});
export type ObservePhotonBilling = typeof ObservePhotonBilling.Type;
export type ObservePhotonBillingEncoded = typeof ObservePhotonBilling.Encoded;

export const PhotonBillingAttributes = Schema.Struct({
  projectId: PhotonProjectId,
  tier: PhotonSubscriptionTier,
  status: PhotonSubscriptionStatus,
  cancelAtPeriodEnd: Schema.Boolean,
});
export type PhotonBillingAttributes = typeof PhotonBillingAttributes.Type;
export type PhotonBillingAttributesEncoded =
  typeof PhotonBillingAttributes.Encoded;

export const PhotonBillingObservation = Schema.Union([
  Schema.TaggedStruct("Unavailable", { projectId: PhotonProjectId }),
  Schema.TaggedStruct("Found", { attributes: PhotonBillingAttributes }),
]);
export type PhotonBillingObservation = typeof PhotonBillingObservation.Type;
export type PhotonBillingObservationEncoded =
  typeof PhotonBillingObservation.Encoded;

/* oxlint-disable max-classes-per-file -- Six read-only capabilities form one bounded Photon management subpath. */

import type { Effect } from "effect";
import { Context } from "effect";

import type {
  PhotonBillingReadError,
  PhotonLinesReadError,
  PhotonPlatformsReadError,
  PhotonProjectsReadError,
  PhotonSharedUsersReadError,
  PhotonWebhooksReadError,
} from "./errors.js";
import type {
  DiscoverPhotonSharedUser,
  DiscoverPhotonWebhook,
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
  PhotonBillingObservation,
  PhotonLineObservation,
  PhotonPlatformObservation,
  PhotonProjectObservation,
  PhotonSharedUserDiscovery,
  PhotonSharedUserObservation,
  PhotonWebhookDiscovery,
  PhotonWebhookObservation,
} from "./schemas.js";

export interface PhotonProjectsShape {
  readonly observeProject: (
    input: ObservePhotonProject
  ) => Effect.Effect<PhotonProjectObservation, PhotonProjectsReadError>;
}

export class PhotonProjects extends Context.Service<
  PhotonProjects,
  PhotonProjectsShape
>()("@bundjil/photon/management/PhotonProjects") {}

export interface PhotonPlatformsShape {
  readonly observePlatform: (
    input: ObservePhotonPlatform
  ) => Effect.Effect<PhotonPlatformObservation, PhotonPlatformsReadError>;
}

export class PhotonPlatforms extends Context.Service<
  PhotonPlatforms,
  PhotonPlatformsShape
>()("@bundjil/photon/management/PhotonPlatforms") {}

export interface PhotonSharedUsersShape {
  readonly listSharedUsers: (
    input: ListPhotonSharedUsers
  ) => Effect.Effect<ListedPhotonSharedUsers, PhotonSharedUsersReadError>;
  readonly observeSharedUser: (
    input: ObservePhotonSharedUser
  ) => Effect.Effect<PhotonSharedUserObservation, PhotonSharedUsersReadError>;
  readonly discoverSharedUser: (
    input: DiscoverPhotonSharedUser
  ) => Effect.Effect<PhotonSharedUserDiscovery, PhotonSharedUsersReadError>;
}

export class PhotonSharedUsers extends Context.Service<
  PhotonSharedUsers,
  PhotonSharedUsersShape
>()("@bundjil/photon/management/PhotonSharedUsers") {}

export interface PhotonWebhooksShape {
  readonly listWebhooks: (
    input: ListPhotonWebhooks
  ) => Effect.Effect<ListedPhotonWebhooks, PhotonWebhooksReadError>;
  readonly observeWebhook: (
    input: ObservePhotonWebhook
  ) => Effect.Effect<PhotonWebhookObservation, PhotonWebhooksReadError>;
  readonly discoverWebhook: (
    input: DiscoverPhotonWebhook
  ) => Effect.Effect<PhotonWebhookDiscovery, PhotonWebhooksReadError>;
}

export class PhotonWebhooks extends Context.Service<
  PhotonWebhooks,
  PhotonWebhooksShape
>()("@bundjil/photon/management/PhotonWebhooks") {}

export interface PhotonLinesShape {
  readonly listLines: (
    input: ListPhotonLines
  ) => Effect.Effect<ListedPhotonLines, PhotonLinesReadError>;
  readonly observeLine: (
    input: ObservePhotonLine
  ) => Effect.Effect<PhotonLineObservation, PhotonLinesReadError>;
}

export class PhotonLines extends Context.Service<
  PhotonLines,
  PhotonLinesShape
>()("@bundjil/photon/management/PhotonLines") {}

export interface PhotonBillingShape {
  readonly observeBilling: (
    input: ObservePhotonBilling
  ) => Effect.Effect<PhotonBillingObservation, PhotonBillingReadError>;
}

export class PhotonBilling extends Context.Service<
  PhotonBilling,
  PhotonBillingShape
>()("@bundjil/photon/management/PhotonBilling") {}

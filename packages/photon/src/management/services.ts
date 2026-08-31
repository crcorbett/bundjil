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

export interface PhotonProjectsContract {
  readonly observeProject: (
    input: ObservePhotonProject
  ) => Effect.Effect<PhotonProjectObservation, PhotonProjectsReadError>;
}

export class PhotonProjects extends Context.Service<
  PhotonProjects,
  PhotonProjectsContract
>()("@bundjil/photon/management/PhotonProjects") {}

export interface PhotonPlatformsContract {
  readonly observePlatform: (
    input: ObservePhotonPlatform
  ) => Effect.Effect<PhotonPlatformObservation, PhotonPlatformsReadError>;
}

export class PhotonPlatforms extends Context.Service<
  PhotonPlatforms,
  PhotonPlatformsContract
>()("@bundjil/photon/management/PhotonPlatforms") {}

export interface PhotonSharedUsersContract {
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
  PhotonSharedUsersContract
>()("@bundjil/photon/management/PhotonSharedUsers") {}

export interface PhotonWebhooksContract {
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
  PhotonWebhooksContract
>()("@bundjil/photon/management/PhotonWebhooks") {}

export interface PhotonLinesContract {
  readonly listLines: (
    input: ListPhotonLines
  ) => Effect.Effect<ListedPhotonLines, PhotonLinesReadError>;
  readonly observeLine: (
    input: ObservePhotonLine
  ) => Effect.Effect<PhotonLineObservation, PhotonLinesReadError>;
}

export class PhotonLines extends Context.Service<
  PhotonLines,
  PhotonLinesContract
>()("@bundjil/photon/management/PhotonLines") {}

export interface PhotonBillingContract {
  readonly observeBilling: (
    input: ObservePhotonBilling
  ) => Effect.Effect<PhotonBillingObservation, PhotonBillingReadError>;
}

export class PhotonBilling extends Context.Service<
  PhotonBilling,
  PhotonBillingContract
>()("@bundjil/photon/management/PhotonBilling") {}

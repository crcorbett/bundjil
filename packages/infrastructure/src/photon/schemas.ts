import {
  PhotonBillingAttributes as ManagementPhotonBillingAttributes,
  PhotonLineAttributes as ManagementPhotonLineAttributes,
  PhotonLineId,
  PhotonPlatform,
  PhotonPlatformAttributes as ManagementPhotonPlatformAttributes,
  PhotonProjectAttributes as ManagementPhotonProjectAttributes,
  PhotonProjectId,
  PhotonSharedUserAttributes as ManagementPhotonSharedUserAttributes,
  PhotonUserId,
  PhotonWebhookAttributes as ManagementPhotonWebhookAttributes,
  PhotonWebhookId,
} from "@bundjil/photon/management";
import { Schema } from "effect";

import {
  InfrastructureOwnershipState,
  InfrastructureStage,
} from "../schemas.js";

export const PhotonProjectObservationProps = Schema.Struct({
  stage: InfrastructureStage,
  projectId: PhotonProjectId,
});
export type PhotonProjectObservationProps =
  typeof PhotonProjectObservationProps.Type;
export type PhotonProjectObservationPropsEncoded =
  typeof PhotonProjectObservationProps.Encoded;

export const PhotonProjectObservationAttributes = Schema.Struct({
  stage: InfrastructureStage,
  ...ManagementPhotonProjectAttributes.fields,
  ownership: InfrastructureOwnershipState,
});
export type PhotonProjectObservationAttributes =
  typeof PhotonProjectObservationAttributes.Type;
export type PhotonProjectObservationAttributesEncoded =
  typeof PhotonProjectObservationAttributes.Encoded;

export const PhotonPlatformConfigurationProps = Schema.Struct({
  stage: InfrastructureStage,
  projectId: PhotonProjectId,
  platform: PhotonPlatform,
});
export type PhotonPlatformConfigurationProps =
  typeof PhotonPlatformConfigurationProps.Type;
export type PhotonPlatformConfigurationPropsEncoded =
  typeof PhotonPlatformConfigurationProps.Encoded;

export const PhotonPlatformConfigurationAttributes = Schema.Struct({
  stage: InfrastructureStage,
  ...ManagementPhotonPlatformAttributes.fields,
  ownership: InfrastructureOwnershipState,
});
export type PhotonPlatformConfigurationAttributes =
  typeof PhotonPlatformConfigurationAttributes.Type;
export type PhotonPlatformConfigurationAttributesEncoded =
  typeof PhotonPlatformConfigurationAttributes.Encoded;

export const PhotonSharedUserProps = Schema.Struct({
  stage: InfrastructureStage,
  projectId: PhotonProjectId,
  userId: PhotonUserId,
});
export type PhotonSharedUserProps = typeof PhotonSharedUserProps.Type;
export type PhotonSharedUserPropsEncoded = typeof PhotonSharedUserProps.Encoded;

export const PhotonSharedUserAttributes = Schema.Struct({
  stage: InfrastructureStage,
  ...ManagementPhotonSharedUserAttributes.fields,
  ownership: InfrastructureOwnershipState,
});
export type PhotonSharedUserAttributes = typeof PhotonSharedUserAttributes.Type;
export type PhotonSharedUserAttributesEncoded =
  typeof PhotonSharedUserAttributes.Encoded;

export const PhotonWebhookObservationProps = Schema.Struct({
  stage: InfrastructureStage,
  projectId: PhotonProjectId,
  webhookId: PhotonWebhookId,
});
export type PhotonWebhookObservationProps =
  typeof PhotonWebhookObservationProps.Type;
export type PhotonWebhookObservationPropsEncoded =
  typeof PhotonWebhookObservationProps.Encoded;

export const PhotonWebhookObservationAttributes = Schema.Struct({
  stage: InfrastructureStage,
  ...ManagementPhotonWebhookAttributes.fields,
  ownership: InfrastructureOwnershipState,
});
export type PhotonWebhookObservationAttributes =
  typeof PhotonWebhookObservationAttributes.Type;
export type PhotonWebhookObservationAttributesEncoded =
  typeof PhotonWebhookObservationAttributes.Encoded;

export const PhotonLineObservationProps = Schema.Struct({
  stage: InfrastructureStage,
  projectId: PhotonProjectId,
  lineId: PhotonLineId,
  platform: PhotonPlatform,
});
export type PhotonLineObservationProps = typeof PhotonLineObservationProps.Type;
export type PhotonLineObservationPropsEncoded =
  typeof PhotonLineObservationProps.Encoded;

export const PhotonLineObservationAttributes = Schema.Struct({
  stage: InfrastructureStage,
  ...ManagementPhotonLineAttributes.fields,
  ownership: InfrastructureOwnershipState,
});
export type PhotonLineObservationAttributes =
  typeof PhotonLineObservationAttributes.Type;
export type PhotonLineObservationAttributesEncoded =
  typeof PhotonLineObservationAttributes.Encoded;

export const PhotonBillingObservationProps = Schema.Struct({
  stage: InfrastructureStage,
  projectId: PhotonProjectId,
});
export type PhotonBillingObservationProps =
  typeof PhotonBillingObservationProps.Type;
export type PhotonBillingObservationPropsEncoded =
  typeof PhotonBillingObservationProps.Encoded;

export const PhotonBillingObservationAttributes = Schema.Struct({
  stage: InfrastructureStage,
  ...ManagementPhotonBillingAttributes.fields,
  ownership: InfrastructureOwnershipState,
});
export type PhotonBillingObservationAttributes =
  typeof PhotonBillingObservationAttributes.Type;
export type PhotonBillingObservationAttributesEncoded =
  typeof PhotonBillingObservationAttributes.Encoded;

export const PhotonInventoryScope = Schema.Struct({
  stage: InfrastructureStage,
  projectId: PhotonProjectId,
  sharedUserIds: Schema.Array(PhotonUserId),
  webhookIds: Schema.Array(PhotonWebhookId),
  lineIds: Schema.Array(PhotonLineId),
});
export type PhotonInventoryScope = typeof PhotonInventoryScope.Type;
export type PhotonInventoryScopeEncoded = typeof PhotonInventoryScope.Encoded;

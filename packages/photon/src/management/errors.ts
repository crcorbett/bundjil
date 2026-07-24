/* oxlint-disable max-classes-per-file -- Six operation-specific read capabilities share one bounded safe field contract. */

import { Schema } from "effect";

import {
  PhotonManagementReadFailureReason,
  PhotonManagementReadOperation,
  PhotonManagementRetry,
} from "./schemas.js";

const PhotonManagementReadErrorFields = {
  operation: PhotonManagementReadOperation,
  reason: PhotonManagementReadFailureReason,
  retry: PhotonManagementRetry,
  message: Schema.NonEmptyString,
};

export class PhotonProjectsReadError extends Schema.TaggedErrorClass<PhotonProjectsReadError>()(
  "PhotonProjectsReadError",
  PhotonManagementReadErrorFields
) {}

export class PhotonPlatformsReadError extends Schema.TaggedErrorClass<PhotonPlatformsReadError>()(
  "PhotonPlatformsReadError",
  PhotonManagementReadErrorFields
) {}

export class PhotonSharedUsersReadError extends Schema.TaggedErrorClass<PhotonSharedUsersReadError>()(
  "PhotonSharedUsersReadError",
  PhotonManagementReadErrorFields
) {}

export class PhotonWebhooksReadError extends Schema.TaggedErrorClass<PhotonWebhooksReadError>()(
  "PhotonWebhooksReadError",
  PhotonManagementReadErrorFields
) {}

export class PhotonLinesReadError extends Schema.TaggedErrorClass<PhotonLinesReadError>()(
  "PhotonLinesReadError",
  PhotonManagementReadErrorFields
) {}

export class PhotonBillingReadError extends Schema.TaggedErrorClass<PhotonBillingReadError>()(
  "PhotonBillingReadError",
  PhotonManagementReadErrorFields
) {}

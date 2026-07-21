import { Schema } from "effect";

export const PhotonProviderProofOperation = Schema.Literals([
  "assert",
  "checkSharedAvailability",
  "createSharedUser",
  "deleteSharedUser",
  "deleteWebhook",
  "getIMessageService",
  "getPlatforms",
  "listSharedUsers",
  "listWebhooks",
  "registerWebhook",
  "sdkLifecycle",
  "setIMessagePlatformEnabled",
  "writeWebhookBinding",
]);

const PhotonProviderProofReason = Schema.Literals([
  "invalidResponse",
  "lifecycleUnavailable",
  "requestFailed",
  "resourceConflict",
  "topologyNotRestored",
]);

export class PhotonProviderProofError extends Schema.TaggedErrorClass<PhotonProviderProofError>()(
  "PhotonProviderProofError",
  {
    operation: PhotonProviderProofOperation,
    reason: PhotonProviderProofReason,
  }
) {}

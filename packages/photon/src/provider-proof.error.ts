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

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class PhotonProviderProofError extends Schema.TaggedError<PhotonProviderProofError>()(
  "PhotonProviderProofError",
  {
    operation: PhotonProviderProofOperation,
    reason: PhotonProviderProofReason,
  }
) {}

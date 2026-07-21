import { Schema } from "effect";

export const PhotonProviderProofOperation = Schema.Literals([
  "assert",
  "createDedicatedLine",
  "deleteDedicatedLine",
  "deleteWebhook",
  "getPlatforms",
  "listDedicatedLines",
  "listWebhooks",
  "registerWebhook",
  "sdkLifecycle",
  "setIMessagePlatformEnabled",
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

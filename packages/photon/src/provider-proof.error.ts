import { Schema } from "effect";

export const PhotonProviderProofOperation = Schema.Literals([
  "assert",
  "deleteWebhook",
  "listWebhooks",
  "registerWebhook",
  "sdkLifecycle",
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

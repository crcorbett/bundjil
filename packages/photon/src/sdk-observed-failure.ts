import { Schema } from "effect";

export const PhotonSdkOperation = Schema.Literals([
  "sendMessage",
  "setPresence",
]);
export type PhotonSdkOperation = typeof PhotonSdkOperation.Type;

export const PhotonSdkPhase = Schema.Literals([
  "acquire",
  "release",
  "resolveDirectSpace",
  "send",
  "startTyping",
  "stopTyping",
]);
export type PhotonSdkPhase = typeof PhotonSdkPhase.Type;

export const PhotonSdkErrorName = Schema.String;
export const PhotonSdkProviderCode = Schema.String;

export class PhotonSdkObservedFailure extends Schema.TaggedErrorClass<PhotonSdkObservedFailure>()(
  "PhotonSdkObservedFailure",
  {
    operation: PhotonSdkOperation,
    phase: PhotonSdkPhase,
    errorName: PhotonSdkErrorName,
    providerCode: PhotonSdkProviderCode,
    transportStatus: Schema.Union([Schema.Int, Schema.Literal("unknown")]),
    retryable: Schema.Union([Schema.Boolean, Schema.Literal("unknown")]),
  }
) {}

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

export const PhotonSdkTransportStatus = Schema.Int.check(
  Schema.isBetween({ minimum: 100, maximum: 599 })
);
export type PhotonSdkTransportStatus = typeof PhotonSdkTransportStatus.Type;

export class PhotonSdkObservedFailure extends Schema.TaggedErrorClass<PhotonSdkObservedFailure>()(
  "PhotonSdkObservedFailure",
  {
    operation: PhotonSdkOperation,
    phase: PhotonSdkPhase,
    transportStatus: Schema.Union([
      PhotonSdkTransportStatus,
      Schema.Literal("unknown"),
    ]),
    retryable: Schema.Union([Schema.Boolean, Schema.Literal("unknown")]),
  }
) {}

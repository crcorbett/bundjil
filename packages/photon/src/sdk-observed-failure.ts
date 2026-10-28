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

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class PhotonSdkObservedFailure extends Schema.TaggedError<PhotonSdkObservedFailure>()(
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

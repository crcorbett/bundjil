import { Schema } from "effect";

export const PhotonLifecycleOperation = Schema.Literals(["acquire", "release"]);
export type PhotonLifecycleOperation = typeof PhotonLifecycleOperation.Type;

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class PhotonLifecycleError extends Schema.TaggedError<PhotonLifecycleError>()(
  "PhotonLifecycleError",
  { operation: PhotonLifecycleOperation, reason: Schema.Literal("unavailable") }
) {}

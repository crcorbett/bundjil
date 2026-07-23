import { Schema } from "effect";

export const PhotonLifecycleOperation = Schema.Literals(["acquire", "release"]);
export type PhotonLifecycleOperation = typeof PhotonLifecycleOperation.Type;

export class PhotonLifecycleError extends Schema.TaggedErrorClass<PhotonLifecycleError>()(
  "PhotonLifecycleError",
  { operation: PhotonLifecycleOperation, reason: Schema.Literal("unavailable") }
) {}

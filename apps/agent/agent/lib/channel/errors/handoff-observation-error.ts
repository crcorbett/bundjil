import { Schema } from "effect";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class ChannelHandoffObservationError extends Schema.TaggedError<ChannelHandoffObservationError>()(
  "ChannelHandoffObservationError",
  {
    operation: Schema.Literals(["initialize", "fingerprint", "observe"]),
    reason: Schema.Literal("unavailable"),
  }
) {}

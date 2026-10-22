import { Schema } from "effect";

export class ChannelHandoffObservationError extends Schema.TaggedError<ChannelHandoffObservationError>()(
  "ChannelHandoffObservationError",
  {
    operation: Schema.Literals(["initialize", "fingerprint", "observe"]),
    reason: Schema.Literal("unavailable"),
  }
) {}

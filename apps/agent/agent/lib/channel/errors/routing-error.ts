import { Schema } from "effect";

export class ChannelRoutingError extends Schema.TaggedError<ChannelRoutingError>()(
  "ChannelRoutingError",
  { reason: Schema.Literal("unavailable") }
) {}

import { Schema } from "effect";

export class ChannelRoutingError extends Schema.TaggedErrorClass<ChannelRoutingError>()(
  "ChannelRoutingError",
  { reason: Schema.Literal("unavailable") }
) {}

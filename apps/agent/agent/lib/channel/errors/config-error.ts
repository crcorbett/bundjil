import { Schema } from "effect";

export class ChannelConfigError extends Schema.TaggedErrorClass<ChannelConfigError>()(
  "ChannelConfigError",
  { reason: Schema.Literal("invalid") }
) {}

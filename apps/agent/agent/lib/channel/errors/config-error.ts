import { Schema } from "effect";

export class ChannelConfigError extends Schema.TaggedError<ChannelConfigError>()(
  "ChannelConfigError",
  { reason: Schema.Literal("invalid") }
) {}

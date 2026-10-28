import { Schema } from "effect";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class ChannelConfigError extends Schema.TaggedError<ChannelConfigError>()(
  "ChannelConfigError",
  { reason: Schema.Literal("invalid") }
) {}

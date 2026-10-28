import { Schema } from "effect";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class ChannelRoutingError extends Schema.TaggedError<ChannelRoutingError>()(
  "ChannelRoutingError",
  { reason: Schema.Literal("unavailable") }
) {}

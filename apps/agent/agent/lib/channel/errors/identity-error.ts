import { Schema } from "effect";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class ChannelIdentityError extends Schema.TaggedError<ChannelIdentityError>()(
  "ChannelIdentityError",
  { reason: Schema.Literal("notAllowed") }
) {}

import { Schema } from "effect";

export class ChannelIdentityError extends Schema.TaggedError<ChannelIdentityError>()(
  "ChannelIdentityError",
  { reason: Schema.Literal("notAllowed") }
) {}

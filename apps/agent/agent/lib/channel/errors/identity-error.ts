import { Schema } from "effect";

export class ChannelIdentityError extends Schema.TaggedErrorClass<ChannelIdentityError>()(
  "ChannelIdentityError",
  { reason: Schema.Literal("notAllowed") }
) {}

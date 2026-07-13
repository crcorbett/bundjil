import { Schema } from "effect";

export class SendblueRoutingError extends Schema.TaggedErrorClass<SendblueRoutingError>()(
  "SendblueRoutingError",
  { message: Schema.NonEmptyString }
) {}

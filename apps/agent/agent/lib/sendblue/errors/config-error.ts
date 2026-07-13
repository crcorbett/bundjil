import { Schema } from "effect";

export class SendblueConfigError extends Schema.TaggedErrorClass<SendblueConfigError>()(
  "SendblueConfigError",
  { message: Schema.NonEmptyString }
) {}

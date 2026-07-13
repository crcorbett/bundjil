import { Schema } from "effect";

export class SendblueSenderNotAllowedError extends Schema.TaggedErrorClass<SendblueSenderNotAllowedError>()(
  "SendblueSenderNotAllowedError",
  { message: Schema.NonEmptyString }
) {}

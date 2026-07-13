import { Schema } from "effect";

export class SendblueRequestError extends Schema.TaggedErrorClass<SendblueRequestError>()(
  "SendblueRequestError",
  {
    message: Schema.NonEmptyString,
    operation: Schema.Literal("sendMessage"),
    reason: Schema.Literal("requestEncoding"),
  }
) {}

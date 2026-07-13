import { Schema } from "effect";

export class SendblueWebhookSchemaError extends Schema.TaggedErrorClass<SendblueWebhookSchemaError>()(
  "SendblueWebhookSchemaError",
  { boundary: Schema.NonEmptyString, message: Schema.NonEmptyString }
) {}

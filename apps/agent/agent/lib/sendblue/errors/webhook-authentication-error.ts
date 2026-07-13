import { Schema } from "effect";

export class SendblueWebhookAuthenticationError extends Schema.TaggedErrorClass<SendblueWebhookAuthenticationError>()(
  "SendblueWebhookAuthenticationError",
  { message: Schema.NonEmptyString }
) {}

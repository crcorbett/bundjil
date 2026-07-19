import { Schema } from "effect";

import { SendblueDiagnosticMessage } from "../schemas.js";

export class SendblueWebhookAuthenticationError extends Schema.TaggedErrorClass<SendblueWebhookAuthenticationError>()(
  "SendblueWebhookAuthenticationError",
  { message: SendblueDiagnosticMessage }
) {}

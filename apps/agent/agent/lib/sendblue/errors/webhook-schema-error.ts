import { Schema } from "effect";

import {
  SendblueDiagnosticMessage,
  SendblueWebhookSchemaBoundary,
} from "../schemas.js";

export class SendblueWebhookSchemaError extends Schema.TaggedErrorClass<SendblueWebhookSchemaError>()(
  "SendblueWebhookSchemaError",
  {
    boundary: SendblueWebhookSchemaBoundary,
    message: SendblueDiagnosticMessage,
  }
) {}

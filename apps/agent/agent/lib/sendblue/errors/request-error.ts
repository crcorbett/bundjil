import { Schema } from "effect";

import {
  SendblueClientOperation,
  SendblueDiagnosticMessage,
  SendblueRequestErrorReason,
} from "../schemas.js";

export class SendblueRequestError extends Schema.TaggedErrorClass<SendblueRequestError>()(
  "SendblueRequestError",
  {
    message: SendblueDiagnosticMessage,
    operation: SendblueClientOperation,
    reason: SendblueRequestErrorReason,
  }
) {}

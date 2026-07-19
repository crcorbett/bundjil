import { Schema } from "effect";

import {
  SendblueClientOperation,
  SendblueDiagnosticMessage,
  SendblueResponseErrorReason,
} from "../schemas.js";

export class SendblueResponseError extends Schema.TaggedErrorClass<SendblueResponseError>()(
  "SendblueResponseError",
  {
    message: SendblueDiagnosticMessage,
    operation: SendblueClientOperation,
    reason: SendblueResponseErrorReason,
    status: Schema.Int.check(Schema.isBetween({ maximum: 599, minimum: 100 })),
  }
) {}

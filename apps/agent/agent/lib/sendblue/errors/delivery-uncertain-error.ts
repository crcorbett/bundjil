import { Schema } from "effect";

import {
  SendblueClientOperation,
  SendblueDiagnosticMessage,
  SendblueDeliveryUncertainReason,
} from "../schemas.js";

export class SendblueDeliveryUncertainError extends Schema.TaggedErrorClass<SendblueDeliveryUncertainError>()(
  "SendblueDeliveryUncertainError",
  {
    message: SendblueDiagnosticMessage,
    operation: SendblueClientOperation,
    reason: SendblueDeliveryUncertainReason,
  }
) {}

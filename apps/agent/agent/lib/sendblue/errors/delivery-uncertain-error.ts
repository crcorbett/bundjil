import { Schema } from "effect";

import {
  SendblueClientOperation,
  SendblueDeliveryUncertainReason,
} from "../schemas.js";

export class SendblueDeliveryUncertainError extends Schema.TaggedErrorClass<SendblueDeliveryUncertainError>()(
  "SendblueDeliveryUncertainError",
  {
    message: Schema.NonEmptyString,
    operation: SendblueClientOperation,
    reason: SendblueDeliveryUncertainReason,
  }
) {}

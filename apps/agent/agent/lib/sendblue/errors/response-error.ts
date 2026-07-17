import { Schema } from "effect";

import {
  SendblueClientOperation,
  SendblueResponseErrorReason,
} from "../schemas.js";

export class SendblueResponseError extends Schema.TaggedErrorClass<SendblueResponseError>()(
  "SendblueResponseError",
  {
    message: Schema.NonEmptyString,
    operation: SendblueClientOperation,
    reason: SendblueResponseErrorReason,
    status: Schema.Int.check(Schema.isBetween({ maximum: 599, minimum: 100 })),
  }
) {}

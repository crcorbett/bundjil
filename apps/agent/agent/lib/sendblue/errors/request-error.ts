import { Schema } from "effect";

import {
  SendblueClientOperation,
  SendblueRequestErrorReason,
} from "../schemas.js";

export class SendblueRequestError extends Schema.TaggedErrorClass<SendblueRequestError>()(
  "SendblueRequestError",
  {
    message: Schema.NonEmptyString,
    operation: SendblueClientOperation,
    reason: SendblueRequestErrorReason,
  }
) {}

import { Schema } from "effect";

import { SendblueDiagnosticMessage } from "../schemas.js";

export class SendblueRoutingError extends Schema.TaggedErrorClass<SendblueRoutingError>()(
  "SendblueRoutingError",
  { message: SendblueDiagnosticMessage }
) {}

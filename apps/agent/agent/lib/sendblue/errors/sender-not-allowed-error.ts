import { Schema } from "effect";

import { SendblueDiagnosticMessage } from "../schemas.js";

export class SendblueSenderNotAllowedError extends Schema.TaggedErrorClass<SendblueSenderNotAllowedError>()(
  "SendblueSenderNotAllowedError",
  { message: SendblueDiagnosticMessage }
) {}

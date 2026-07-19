import { Schema } from "effect";

import { SendblueDiagnosticMessage } from "../schemas.js";

export class SendblueConfigError extends Schema.TaggedErrorClass<SendblueConfigError>()(
  "SendblueConfigError",
  { message: SendblueDiagnosticMessage }
) {}

import { Schema } from "effect";

import { SendblueDiagnosticMessage } from "../schemas.js";

export class SendblueReplayStoreError extends Schema.TaggedErrorClass<SendblueReplayStoreError>()(
  "SendblueReplayStoreError",
  { message: SendblueDiagnosticMessage }
) {}

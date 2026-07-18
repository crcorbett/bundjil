import { Schema } from "effect";

import {
  CodexErrorMessage,
  CodexHttpClientOperation,
  CodexHttpContentType,
  CodexHttpStatusText,
} from "./contracts.js";

export class CodexHttpStatusError extends Schema.TaggedErrorClass<CodexHttpStatusError>()(
  "CodexHttpStatusError",
  {
    operation: CodexHttpClientOperation,
    status: Schema.Number.check(Schema.isFinite()),
    statusText: CodexHttpStatusText,
    contentType: CodexHttpContentType,
    message: CodexErrorMessage,
  }
) {}

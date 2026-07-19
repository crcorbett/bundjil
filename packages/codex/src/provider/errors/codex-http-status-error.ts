import { Schema } from "effect";

import {
  CodexHttpClientOperation,
  CodexHttpContentType,
  CodexHttpStatus,
  CodexHttpStatusText,
  CodexProviderErrorMessage,
} from "../error-contracts.js";

export class CodexHttpStatusError extends Schema.TaggedErrorClass<CodexHttpStatusError>()(
  "CodexHttpStatusError",
  {
    operation: CodexHttpClientOperation,
    status: CodexHttpStatus,
    statusText: CodexHttpStatusText,
    contentType: CodexHttpContentType,
    message: CodexProviderErrorMessage,
  }
) {}

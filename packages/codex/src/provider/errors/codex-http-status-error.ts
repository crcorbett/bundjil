import { Schema } from "effect";

import {
  CodexHttpClientOperation,
  CodexHttpStatus,
  CodexProviderErrorMessage,
} from "../error-contracts.js";

export class CodexHttpStatusError extends Schema.TaggedErrorClass<CodexHttpStatusError>()(
  "CodexHttpStatusError",
  {
    operation: CodexHttpClientOperation,
    status: CodexHttpStatus,
    message: CodexProviderErrorMessage,
  }
) {}

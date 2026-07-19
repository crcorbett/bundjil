import { Schema } from "effect";

import {
  CodexHttpClientOperation,
  CodexProviderErrorMessage,
} from "../error-contracts.js";

export class CodexHttpNetworkError extends Schema.TaggedErrorClass<CodexHttpNetworkError>()(
  "CodexHttpNetworkError",
  {
    operation: CodexHttpClientOperation,
    message: CodexProviderErrorMessage,
    cause: Schema.Defect,
  }
) {}

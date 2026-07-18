import { Schema } from "effect";

import { CodexErrorMessage, CodexHttpClientOperation } from "./contracts.js";

export class CodexHttpNetworkError extends Schema.TaggedErrorClass<CodexHttpNetworkError>()(
  "CodexHttpNetworkError",
  {
    operation: CodexHttpClientOperation,
    message: CodexErrorMessage,
    cause: Schema.Defect,
  }
) {}

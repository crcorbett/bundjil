import { Schema } from "effect";

import { CodexHttpClientOperation } from "./contracts.js";

export class CodexHttpNetworkError extends Schema.TaggedErrorClass<CodexHttpNetworkError>()(
  "CodexHttpNetworkError",
  {
    operation: CodexHttpClientOperation,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

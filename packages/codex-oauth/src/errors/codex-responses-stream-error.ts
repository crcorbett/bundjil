import { Schema } from "effect";

import { CodexHttpClientOperation } from "./contracts.js";

export class CodexResponsesStreamError extends Schema.TaggedErrorClass<CodexResponsesStreamError>()(
  "CodexResponsesStreamError",
  {
    operation: CodexHttpClientOperation,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

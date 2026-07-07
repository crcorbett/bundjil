import { Schema } from "effect";

import { CodexResponsesStreamOperation } from "./contracts.js";

export class CodexResponsesStreamError extends Schema.TaggedErrorClass<CodexResponsesStreamError>()(
  "CodexResponsesStreamError",
  {
    operation: CodexResponsesStreamOperation,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

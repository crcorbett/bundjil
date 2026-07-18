import { Schema } from "effect";

import {
  CodexErrorMessage,
  CodexResponsesStreamOperation,
} from "./contracts.js";

export class CodexResponsesStreamError extends Schema.TaggedErrorClass<CodexResponsesStreamError>()(
  "CodexResponsesStreamError",
  {
    operation: CodexResponsesStreamOperation,
    message: CodexErrorMessage,
    cause: Schema.Defect,
  }
) {}

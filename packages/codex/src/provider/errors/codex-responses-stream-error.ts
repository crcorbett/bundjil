import { Schema } from "effect";

import {
  CodexProviderErrorMessage,
  CodexResponsesStreamOperation,
} from "../error-contracts.js";

export class CodexResponsesStreamError extends Schema.TaggedError<CodexResponsesStreamError>()(
  "CodexResponsesStreamError",
  {
    operation: CodexResponsesStreamOperation,
    message: CodexProviderErrorMessage,
  }
) {}

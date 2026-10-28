import { Schema } from "effect";

import {
  CodexProviderErrorMessage,
  CodexResponsesStreamOperation,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexResponsesStreamError extends Schema.TaggedError<CodexResponsesStreamError>()(
  "CodexResponsesStreamError",
  {
    operation: CodexResponsesStreamOperation,
    message: CodexProviderErrorMessage,
  }
) {}

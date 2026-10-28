import { Schema } from "effect";

import {
  CodexHttpClientOperation,
  CodexHttpStatus,
  CodexProviderErrorMessage,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexHttpStatusError extends Schema.TaggedError<CodexHttpStatusError>()(
  "CodexHttpStatusError",
  {
    operation: CodexHttpClientOperation,
    status: CodexHttpStatus,
    message: CodexProviderErrorMessage,
  }
) {}

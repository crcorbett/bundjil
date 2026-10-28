import { Schema } from "effect";

import {
  CodexHttpClientOperation,
  CodexProviderErrorMessage,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexHttpNetworkError extends Schema.TaggedError<CodexHttpNetworkError>()(
  "CodexHttpNetworkError",
  {
    operation: CodexHttpClientOperation,
    message: CodexProviderErrorMessage,
  }
) {}

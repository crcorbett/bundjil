import { Schema } from "effect";

import {
  CodexAuthErrorMessage,
  CodexOAuthClientOperation,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexOAuthOperationError extends Schema.TaggedError<CodexOAuthOperationError>()(
  "CodexOAuthOperationError",
  {
    operation: CodexOAuthClientOperation,
    message: CodexAuthErrorMessage,
  }
) {}

import { Schema } from "effect";

import {
  CodexAuthErrorMessage,
  CodexOAuthClientOperation,
} from "../error-contracts.js";

export class CodexOAuthOperationError extends Schema.TaggedError<CodexOAuthOperationError>()(
  "CodexOAuthOperationError",
  {
    operation: CodexOAuthClientOperation,
    message: CodexAuthErrorMessage,
  }
) {}

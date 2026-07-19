import { Schema } from "effect";

import {
  CodexAuthErrorMessage,
  CodexOAuthClientOperation,
} from "../error-contracts.js";

export class CodexOAuthOperationError extends Schema.TaggedErrorClass<CodexOAuthOperationError>()(
  "CodexOAuthOperationError",
  {
    operation: CodexOAuthClientOperation,
    message: CodexAuthErrorMessage,
    cause: Schema.Defect,
  }
) {}

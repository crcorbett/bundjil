import { Schema } from "effect";

import {
  CodexAuthErrorMessage,
  CodexOAuthClientOperation,
} from "../error-contracts.js";

export class CodexOAuthUnsupportedRuntimePath extends Schema.TaggedError<CodexOAuthUnsupportedRuntimePath>()(
  "CodexOAuthUnsupportedRuntimePath",
  {
    operation: CodexOAuthClientOperation,
    message: CodexAuthErrorMessage,
  }
) {}

import { Schema } from "effect";

import {
  CodexAuthErrorMessage,
  CodexOAuthClientOperation,
} from "../error-contracts.js";

export class CodexOAuthUnsupportedRuntimePath extends Schema.TaggedErrorClass<CodexOAuthUnsupportedRuntimePath>()(
  "CodexOAuthUnsupportedRuntimePath",
  {
    operation: CodexOAuthClientOperation,
    message: CodexAuthErrorMessage,
  }
) {}

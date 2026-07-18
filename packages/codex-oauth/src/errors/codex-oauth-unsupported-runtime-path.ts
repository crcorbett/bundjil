import { Schema } from "effect";

import { CodexErrorMessage, CodexOAuthClientOperation } from "./contracts.js";

export class CodexOAuthUnsupportedRuntimePath extends Schema.TaggedErrorClass<CodexOAuthUnsupportedRuntimePath>()(
  "CodexOAuthUnsupportedRuntimePath",
  {
    operation: CodexOAuthClientOperation,
    message: CodexErrorMessage,
  }
) {}

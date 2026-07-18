import { Schema } from "effect";

import { CodexOAuthClientOperation } from "../error-contracts.js";

export class CodexOAuthUnsupportedRuntimePath extends Schema.TaggedErrorClass<CodexOAuthUnsupportedRuntimePath>()(
  "CodexOAuthUnsupportedRuntimePath",
  {
    operation: CodexOAuthClientOperation,
    message: Schema.NonEmptyString,
  }
) {}

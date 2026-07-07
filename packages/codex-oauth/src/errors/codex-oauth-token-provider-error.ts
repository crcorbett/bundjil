import { Schema } from "effect";

import { CodexOAuthClientOperation } from "./contracts.js";

export class CodexOAuthTokenProviderError extends Schema.TaggedErrorClass<CodexOAuthTokenProviderError>()(
  "CodexOAuthTokenProviderError",
  {
    operation: CodexOAuthClientOperation,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

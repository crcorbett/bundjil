import { Schema } from "effect";

import { CodexErrorMessage, CodexOAuthClientOperation } from "./contracts.js";

export class CodexOAuthTokenProviderError extends Schema.TaggedErrorClass<CodexOAuthTokenProviderError>()(
  "CodexOAuthTokenProviderError",
  {
    operation: CodexOAuthClientOperation,
    message: CodexErrorMessage,
    cause: Schema.Defect,
  }
) {}

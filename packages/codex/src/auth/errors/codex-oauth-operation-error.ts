import { Schema } from "effect";

import { CodexOAuthClientOperation } from "../error-contracts.js";

export class CodexOAuthOperationError extends Schema.TaggedErrorClass<CodexOAuthOperationError>()(
  "CodexOAuthOperationError",
  {
    operation: CodexOAuthClientOperation,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

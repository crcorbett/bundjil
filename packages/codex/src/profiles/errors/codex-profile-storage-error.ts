import { Schema } from "effect";

import { CodexProfileStorageOperation } from "../error-contracts.js";

export class CodexProfileStorageError extends Schema.TaggedErrorClass<CodexProfileStorageError>()(
  "CodexProfileStorageError",
  {
    operation: CodexProfileStorageOperation,
    key: Schema.optional(Schema.NonEmptyString),
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

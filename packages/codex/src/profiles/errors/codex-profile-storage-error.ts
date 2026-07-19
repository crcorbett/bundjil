import { Schema } from "effect";

import {
  CodexProfileErrorKey,
  CodexProfileErrorMessage,
  CodexProfileStorageOperation,
} from "../error-contracts.js";

export class CodexProfileStorageError extends Schema.TaggedErrorClass<CodexProfileStorageError>()(
  "CodexProfileStorageError",
  {
    operation: CodexProfileStorageOperation,
    key: Schema.optional(CodexProfileErrorKey),
    message: CodexProfileErrorMessage,
    cause: Schema.Defect,
  }
) {}

import { Schema } from "effect";

import {
  CodexProfileErrorKey,
  CodexProfileErrorMessage,
  CodexProfileStorageOperation,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexProfileStorageError extends Schema.TaggedError<CodexProfileStorageError>()(
  "CodexProfileStorageError",
  {
    operation: CodexProfileStorageOperation,
    key: Schema.optional(CodexProfileErrorKey),
    message: CodexProfileErrorMessage,
  }
) {}

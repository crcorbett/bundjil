import { Schema } from "effect";

import {
  CodexAuthErrorMessage,
  CodexLocalProfileImportOperation,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexLocalProfileImportError extends Schema.TaggedError<CodexLocalProfileImportError>()(
  "CodexLocalProfileImportError",
  {
    operation: CodexLocalProfileImportOperation,
    message: CodexAuthErrorMessage,
  }
) {}

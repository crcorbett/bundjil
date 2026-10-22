import { Schema } from "effect";

import {
  CodexAuthErrorMessage,
  CodexLocalProfileImportOperation,
} from "../error-contracts.js";

export class CodexLocalProfileImportError extends Schema.TaggedError<CodexLocalProfileImportError>()(
  "CodexLocalProfileImportError",
  {
    operation: CodexLocalProfileImportOperation,
    message: CodexAuthErrorMessage,
  }
) {}

import { Schema } from "effect";

import {
  CodexErrorMessage,
  CodexLocalProfileImportOperation,
} from "./contracts.js";

export class CodexLocalProfileImportError extends Schema.TaggedErrorClass<CodexLocalProfileImportError>()(
  "CodexLocalProfileImportError",
  {
    operation: CodexLocalProfileImportOperation,
    message: CodexErrorMessage,
  }
) {}

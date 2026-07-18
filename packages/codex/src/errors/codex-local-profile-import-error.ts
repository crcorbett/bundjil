import { Schema } from "effect";

import { CodexLocalProfileImportOperation } from "./contracts.js";

export class CodexLocalProfileImportError extends Schema.TaggedErrorClass<CodexLocalProfileImportError>()(
  "CodexLocalProfileImportError",
  {
    operation: CodexLocalProfileImportOperation,
    message: Schema.NonEmptyString,
  }
) {}

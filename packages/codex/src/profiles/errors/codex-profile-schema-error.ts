import { Schema } from "effect";

import {
  CodexProfileErrorMessage,
  CodexProfileSchemaBoundary,
} from "../error-contracts.js";

export class CodexProfileSchemaError extends Schema.TaggedErrorClass<CodexProfileSchemaError>()(
  "CodexProfileSchemaError",
  {
    boundary: CodexProfileSchemaBoundary,
    message: CodexProfileErrorMessage,
    cause: Schema.Defect,
  }
) {}

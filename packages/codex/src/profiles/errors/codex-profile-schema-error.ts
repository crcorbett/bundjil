import { Schema } from "effect";

import { CodexProfileSchemaBoundary } from "../error-contracts.js";

export class CodexProfileSchemaError extends Schema.TaggedErrorClass<CodexProfileSchemaError>()(
  "CodexProfileSchemaError",
  {
    boundary: CodexProfileSchemaBoundary,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

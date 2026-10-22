import { Schema } from "effect";

import {
  CodexProfileErrorMessage,
  CodexProfileSchemaBoundary,
} from "../error-contracts.js";

export class CodexProfileSchemaError extends Schema.TaggedError<CodexProfileSchemaError>()(
  "CodexProfileSchemaError",
  {
    boundary: CodexProfileSchemaBoundary,
    message: CodexProfileErrorMessage,
  }
) {}

import { Schema } from "effect";

import {
  CodexProfileErrorMessage,
  CodexProfileSchemaBoundary,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexProfileSchemaError extends Schema.TaggedError<CodexProfileSchemaError>()(
  "CodexProfileSchemaError",
  {
    boundary: CodexProfileSchemaBoundary,
    message: CodexProfileErrorMessage,
  }
) {}

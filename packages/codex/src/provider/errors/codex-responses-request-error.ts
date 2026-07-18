import { Schema } from "effect";

import { CodexResponsesSchemaBoundary } from "../error-contracts.js";

export class CodexResponsesRequestError extends Schema.TaggedErrorClass<CodexResponsesRequestError>()(
  "CodexResponsesRequestError",
  {
    boundary: CodexResponsesSchemaBoundary,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

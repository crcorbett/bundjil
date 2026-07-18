import { Schema } from "effect";

import {
  CodexErrorMessage,
  CodexResponsesSchemaBoundary,
} from "./contracts.js";

export class CodexResponsesRequestError extends Schema.TaggedErrorClass<CodexResponsesRequestError>()(
  "CodexResponsesRequestError",
  {
    boundary: CodexResponsesSchemaBoundary,
    message: CodexErrorMessage,
    cause: Schema.Defect,
  }
) {}

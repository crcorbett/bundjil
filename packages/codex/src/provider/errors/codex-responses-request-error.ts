import { Schema } from "effect";

import {
  CodexProviderErrorMessage,
  CodexResponsesSchemaBoundary,
} from "../error-contracts.js";

export class CodexResponsesRequestError extends Schema.TaggedErrorClass<CodexResponsesRequestError>()(
  "CodexResponsesRequestError",
  {
    boundary: CodexResponsesSchemaBoundary,
    message: CodexProviderErrorMessage,
    cause: Schema.Defect,
  }
) {}

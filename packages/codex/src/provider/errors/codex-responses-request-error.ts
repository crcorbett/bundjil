import { Schema } from "effect";

import {
  CodexProviderErrorMessage,
  CodexResponsesSchemaBoundary,
} from "../error-contracts.js";

export class CodexResponsesRequestError extends Schema.TaggedError<CodexResponsesRequestError>()(
  "CodexResponsesRequestError",
  {
    boundary: CodexResponsesSchemaBoundary,
    message: CodexProviderErrorMessage,
  }
) {}

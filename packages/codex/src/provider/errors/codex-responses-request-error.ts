import { Schema } from "effect";

import {
  CodexProviderErrorMessage,
  CodexResponsesSchemaBoundary,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexResponsesRequestError extends Schema.TaggedError<CodexResponsesRequestError>()(
  "CodexResponsesRequestError",
  {
    boundary: CodexResponsesSchemaBoundary,
    message: CodexProviderErrorMessage,
  }
) {}

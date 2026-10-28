import { Schema } from "effect";

import {
  CodexAuthErrorMessage,
  CodexOAuthClientOperation,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexOAuthUnsupportedRuntimePath extends Schema.TaggedError<CodexOAuthUnsupportedRuntimePath>()(
  "CodexOAuthUnsupportedRuntimePath",
  {
    operation: CodexOAuthClientOperation,
    message: CodexAuthErrorMessage,
  }
) {}

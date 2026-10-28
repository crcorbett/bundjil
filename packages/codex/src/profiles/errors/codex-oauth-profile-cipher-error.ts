import { Schema } from "effect";

import { CodexOAuthProfileCipherKeyId } from "../contracts.js";
import {
  CodexOAuthProfileCipherOperation,
  CodexProfileCipherVersion,
  CodexProfileErrorMessage,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexOAuthProfileCipherError extends Schema.TaggedError<CodexOAuthProfileCipherError>()(
  "CodexOAuthProfileCipherError",
  {
    operation: CodexOAuthProfileCipherOperation,
    keyId: Schema.optional(CodexOAuthProfileCipherKeyId),
    version: Schema.optional(CodexProfileCipherVersion),
    message: CodexProfileErrorMessage,
  }
) {}

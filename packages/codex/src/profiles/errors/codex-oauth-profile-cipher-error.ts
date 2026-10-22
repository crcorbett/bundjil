import { Schema } from "effect";

import { CodexOAuthProfileCipherKeyId } from "../contracts.js";
import {
  CodexOAuthProfileCipherOperation,
  CodexProfileCipherVersion,
  CodexProfileErrorMessage,
} from "../error-contracts.js";

export class CodexOAuthProfileCipherError extends Schema.TaggedError<CodexOAuthProfileCipherError>()(
  "CodexOAuthProfileCipherError",
  {
    operation: CodexOAuthProfileCipherOperation,
    keyId: Schema.optional(CodexOAuthProfileCipherKeyId),
    version: Schema.optional(CodexProfileCipherVersion),
    message: CodexProfileErrorMessage,
  }
) {}

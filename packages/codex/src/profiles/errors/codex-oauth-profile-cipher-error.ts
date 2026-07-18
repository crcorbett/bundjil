import { Schema } from "effect";

import { CodexOAuthProfileCipherKeyId } from "../contracts.js";
import { CodexOAuthProfileCipherOperation } from "../error-contracts.js";

export class CodexOAuthProfileCipherError extends Schema.TaggedErrorClass<CodexOAuthProfileCipherError>()(
  "CodexOAuthProfileCipherError",
  {
    operation: CodexOAuthProfileCipherOperation,
    keyId: Schema.optional(CodexOAuthProfileCipherKeyId),
    version: Schema.optional(Schema.Number.check(Schema.isFinite())),
    message: Schema.NonEmptyString,
  }
) {}

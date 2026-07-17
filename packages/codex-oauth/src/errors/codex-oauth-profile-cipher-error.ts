import { Schema } from "effect";

import { CodexOAuthProfileCipherKeyId } from "../schemas.js";
import { CodexOAuthProfileCipherOperation } from "./contracts.js";

export class CodexOAuthProfileCipherError extends Schema.TaggedErrorClass<CodexOAuthProfileCipherError>()(
  "CodexOAuthProfileCipherError",
  {
    operation: CodexOAuthProfileCipherOperation,
    keyId: Schema.optional(CodexOAuthProfileCipherKeyId),
    version: Schema.optional(Schema.Number.check(Schema.isFinite())),
    message: Schema.NonEmptyString,
  }
) {}

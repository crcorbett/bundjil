import { Schema } from "effect";

import { CodexOAuthProfileCipherOperation } from "./contracts.js";

export class CodexOAuthProfileCipherError extends Schema.TaggedErrorClass<CodexOAuthProfileCipherError>()(
  "CodexOAuthProfileCipherError",
  {
    operation: CodexOAuthProfileCipherOperation,
    keyId: Schema.optional(Schema.NonEmptyString),
    version: Schema.optional(Schema.Number.check(Schema.isFinite())),
    message: Schema.NonEmptyString,
  }
) {}

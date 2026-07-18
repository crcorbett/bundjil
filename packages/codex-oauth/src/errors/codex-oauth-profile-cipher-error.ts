import { Schema } from "effect";

import { CodexOAuthProfileCipherKeyId } from "../schemas.js";
import {
  CodexErrorMessage,
  CodexOAuthProfileCipherOperation,
} from "./contracts.js";

export class CodexOAuthProfileCipherError extends Schema.TaggedErrorClass<CodexOAuthProfileCipherError>()(
  "CodexOAuthProfileCipherError",
  {
    operation: CodexOAuthProfileCipherOperation,
    keyId: Schema.optional(CodexOAuthProfileCipherKeyId),
    version: Schema.optional(Schema.Number.check(Schema.isFinite())),
    message: CodexErrorMessage,
  }
) {}

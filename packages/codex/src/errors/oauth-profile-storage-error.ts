import { Schema } from "effect";

import { CodexOAuthProfileStorageOperation } from "./contracts.js";

export class OAuthProfileStorageError extends Schema.TaggedErrorClass<OAuthProfileStorageError>()(
  "OAuthProfileStorageError",
  {
    operation: CodexOAuthProfileStorageOperation,
    key: Schema.optional(Schema.NonEmptyString),
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

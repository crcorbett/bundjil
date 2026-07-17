import { AtomicKeyValueStoreKey } from "@bundjil/effect-persistence";
import { Schema } from "effect";

import { CodexOAuthProfileStorageOperation } from "./contracts.js";

export class OAuthProfileStorageError extends Schema.TaggedErrorClass<OAuthProfileStorageError>()(
  "OAuthProfileStorageError",
  {
    operation: CodexOAuthProfileStorageOperation,
    key: Schema.optional(AtomicKeyValueStoreKey),
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

import { AtomicKeyValueStoreKey } from "@bundjil/effect-persistence";
import { Schema } from "effect";

import {
  CodexErrorMessage,
  CodexOAuthProfileStorageOperation,
} from "./contracts.js";

export class OAuthProfileStorageError extends Schema.TaggedErrorClass<OAuthProfileStorageError>()(
  "OAuthProfileStorageError",
  {
    operation: CodexOAuthProfileStorageOperation,
    key: Schema.optional(AtomicKeyValueStoreKey),
    message: CodexErrorMessage,
    cause: Schema.Defect,
  }
) {}

import { Schema } from "effect";

import { AtomicKeyValueStoreOperation } from "./schemas.js";

export class AtomicKeyValueStoreError extends Schema.TaggedErrorClass<AtomicKeyValueStoreError>()(
  "AtomicKeyValueStoreError",
  {
    operation: AtomicKeyValueStoreOperation,
    message: Schema.NonEmptyString,
  }
) {}

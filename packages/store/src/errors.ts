import { Schema } from "effect";

import {
  AtomicKeyValueStoreDiagnosticMessage,
  AtomicKeyValueStoreOperation,
} from "./schemas.js";

export class AtomicKeyValueStoreError extends Schema.TaggedError<AtomicKeyValueStoreError>()(
  "AtomicKeyValueStoreError",
  {
    operation: AtomicKeyValueStoreOperation,
    message: AtomicKeyValueStoreDiagnosticMessage,
  }
) {}

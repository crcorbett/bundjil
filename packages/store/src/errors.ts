import { Schema } from "effect";

import {
  AtomicKeyValueStoreDiagnosticMessage,
  AtomicKeyValueStoreOperation,
} from "./schemas.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class AtomicKeyValueStoreError extends Schema.TaggedError<AtomicKeyValueStoreError>()(
  "AtomicKeyValueStoreError",
  {
    operation: AtomicKeyValueStoreOperation,
    message: AtomicKeyValueStoreDiagnosticMessage,
  }
) {}

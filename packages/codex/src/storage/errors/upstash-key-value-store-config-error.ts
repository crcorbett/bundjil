import { Schema } from "effect";

import {
  UpstashKeyValueStoreConfigBoundary,
  UpstashKeyValueStoreErrorMessage,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class UpstashKeyValueStoreConfigError extends Schema.TaggedError<UpstashKeyValueStoreConfigError>()(
  "UpstashKeyValueStoreConfigError",
  {
    boundary: UpstashKeyValueStoreConfigBoundary,
    message: UpstashKeyValueStoreErrorMessage,
  }
) {}

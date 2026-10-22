import { Schema } from "effect";

import {
  UpstashKeyValueStoreConfigBoundary,
  UpstashKeyValueStoreErrorMessage,
} from "../error-contracts.js";

export class UpstashKeyValueStoreConfigError extends Schema.TaggedError<UpstashKeyValueStoreConfigError>()(
  "UpstashKeyValueStoreConfigError",
  {
    boundary: UpstashKeyValueStoreConfigBoundary,
    message: UpstashKeyValueStoreErrorMessage,
  }
) {}

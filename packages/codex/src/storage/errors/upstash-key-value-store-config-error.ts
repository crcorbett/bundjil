import { Schema } from "effect";

import {
  UpstashKeyValueStoreConfigBoundary,
  UpstashKeyValueStoreErrorMessage,
} from "../error-contracts.js";

export class UpstashKeyValueStoreConfigError extends Schema.TaggedErrorClass<UpstashKeyValueStoreConfigError>()(
  "UpstashKeyValueStoreConfigError",
  {
    boundary: UpstashKeyValueStoreConfigBoundary,
    message: UpstashKeyValueStoreErrorMessage,
    cause: Schema.Defect,
  }
) {}

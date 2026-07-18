import { Schema } from "effect";

import { UpstashKeyValueStoreConfigBoundary } from "../error-contracts.js";

export class UpstashKeyValueStoreConfigError extends Schema.TaggedErrorClass<UpstashKeyValueStoreConfigError>()(
  "UpstashKeyValueStoreConfigError",
  {
    boundary: UpstashKeyValueStoreConfigBoundary,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

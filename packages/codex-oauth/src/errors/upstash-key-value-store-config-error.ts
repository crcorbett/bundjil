import { Schema } from "effect";

import {
  CodexErrorMessage,
  UpstashKeyValueStoreConfigBoundary,
} from "./contracts.js";

export class UpstashKeyValueStoreConfigError extends Schema.TaggedErrorClass<UpstashKeyValueStoreConfigError>()(
  "UpstashKeyValueStoreConfigError",
  {
    boundary: UpstashKeyValueStoreConfigBoundary,
    message: CodexErrorMessage,
    cause: Schema.Defect,
  }
) {}

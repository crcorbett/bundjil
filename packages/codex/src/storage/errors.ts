import { Schema } from "effect";

import { UpstashKeyValueStoreConfigError } from "./errors/upstash-key-value-store-config-error.js";

export { UpstashKeyValueStoreConfigBoundary } from "./error-contracts.js";
export type { UpstashKeyValueStoreConfigBoundary as UpstashKeyValueStoreConfigBoundaryType } from "./error-contracts.js";
export { UpstashKeyValueStoreConfigError } from "./errors/upstash-key-value-store-config-error.js";

export const UpstashKeyValueStoreFailure = Schema.Union([
  UpstashKeyValueStoreConfigError,
]);

export type UpstashKeyValueStoreFailure =
  typeof UpstashKeyValueStoreFailure.Type;

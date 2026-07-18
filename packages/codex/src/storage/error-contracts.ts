import { Schema } from "effect";

export const UpstashKeyValueStoreConfigBoundary = Schema.Literals([
  "UpstashRedisConfig",
]);

export type UpstashKeyValueStoreConfigBoundary =
  typeof UpstashKeyValueStoreConfigBoundary.Type;

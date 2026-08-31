import { Redis } from "@upstash/redis";
import { Redacted } from "effect";

import { buildUpstashPersistenceLayer } from "./upstash-layer.internal.js";
import type { UpstashPersistenceOptions as UpstashPersistenceOptionsType } from "./upstash-options.js";

export {
  UpstashPersistenceKeyPrefix,
  UpstashPersistenceOptions,
} from "./upstash-options.js";

export const UpstashPersistenceLive = (
  options: UpstashPersistenceOptionsType
) =>
  buildUpstashPersistenceLayer(
    options,
    () =>
      new Redis({
        url: Redacted.value(options.restUrl),
        token: Redacted.value(options.restToken),
        enableTelemetry: false,
        automaticDeserialization: false,
      })
  );

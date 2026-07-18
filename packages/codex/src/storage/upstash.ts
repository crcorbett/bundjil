import {
  UpstashPersistenceLive,
  UpstashPersistenceOptions,
} from "@bundjil/store/upstash";
import {
  Config,
  ConfigProvider,
  Effect,
  Layer,
  Redacted,
  Schema,
} from "effect";

import {
  UpstashRedisConfig,
  UpstashRedisKeyPrefix,
  UpstashRedisRestUrl,
} from "../provider/contracts.js";
import { UpstashKeyValueStoreConfigError } from "./errors.js";

export const defaultUpstashRedisKeyPrefix = "bundjil:codex-oauth:";

const upstashRestUrlConfig = Config.schema(
  UpstashRedisRestUrl,
  "UPSTASH_REDIS_REST_URL"
).pipe(
  Config.orElse(() => Config.schema(UpstashRedisRestUrl, "KV_REST_API_URL"))
);
const upstashRestTokenConfig = Config.redacted("UPSTASH_REDIS_REST_TOKEN").pipe(
  Config.orElse(() => Config.redacted("KV_REST_API_TOKEN"))
);
const upstashKeyPrefixConfig = Config.schema(
  UpstashRedisKeyPrefix,
  "BUNDJIL_UPSTASH_REDIS_KEY_PREFIX"
).pipe(Config.withDefault(defaultUpstashRedisKeyPrefix));

export const loadUpstashRedisConfig = Effect.gen(
  function* loadUpstashRedisConfigFromConfig() {
    const keyPrefix = yield* upstashKeyPrefixConfig;
    const restUrl = yield* upstashRestUrlConfig;
    const restToken = yield* upstashRestTokenConfig;

    return yield* Schema.decodeUnknownEffect(UpstashRedisConfig)({
      keyPrefix,
      restUrl,
      restToken: Redacted.value(restToken),
    });
  }
).pipe(
  Effect.mapError(
    (cause) =>
      new UpstashKeyValueStoreConfigError({
        boundary: "UpstashRedisConfig",
        message: "Unable to load Upstash Redis KeyValueStore config.",
        cause,
      })
  ),
  Effect.withSpan("loadUpstashRedisConfig")
);

export const CodexUpstashPersistenceLive = Layer.unwrap(
  loadUpstashRedisConfig.pipe(
    Effect.flatMap((config) =>
      Schema.decodeUnknownEffect(UpstashPersistenceOptions)({
        keyPrefix: config.keyPrefix,
        restUrl: Redacted.make(config.restUrl.href),
        restToken: config.restToken,
      })
    ),
    Effect.map(UpstashPersistenceLive),
    Effect.mapError(
      (cause) =>
        new UpstashKeyValueStoreConfigError({
          boundary: "UpstashRedisConfig",
          message: "Unable to load Upstash Redis KeyValueStore config.",
          cause,
        })
    )
  )
).pipe(Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv())));

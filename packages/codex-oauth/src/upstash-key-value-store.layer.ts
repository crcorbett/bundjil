import { Redis } from "@upstash/redis";
import {
  Config,
  ConfigProvider,
  Data,
  Effect,
  Layer,
  Redacted,
  Schema,
} from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexOAuthRefreshLockError,
  UpstashKeyValueStoreConfigError,
} from "./errors.js";
import {
  CodexOAuthRefreshLock,
  makeCodexOAuthRefreshLock,
} from "./refresh-lock.service.js";
import {
  UpstashRedisConfig,
  UpstashRedisKeyPrefix,
  UpstashRedisRestUrl,
} from "./schemas.js";
import type {
  CodexOAuthRefreshLockLease,
  UpstashRedisConfig as UpstashRedisConfigType,
  UpstashRedisKeyPrefix as UpstashRedisKeyPrefixType,
} from "./schemas.js";
import { codexOAuthRefreshLockStorageKey } from "./storage-keys.js";

export interface UpstashRedisKeyValueClient {
  readonly get: (key: string) => Promise<string | null>;
  readonly set: (key: string, value: string) => Promise<unknown>;
  readonly del: (...keys: string[]) => Promise<number>;
  readonly scan: (
    cursor: string | number,
    options: UpstashRedisScanOptions
  ) => Promise<readonly [string, readonly string[]]>;
}

export type UpstashRedisScanOptions = Readonly<{
  count: number;
  match: string;
}>;

export type UpstashRedisRefreshLockSetOptions = Readonly<{
  nx: true;
  px: number;
}>;

export interface UpstashRedisRefreshLockClient {
  readonly set: (
    key: string,
    value: string,
    options: UpstashRedisRefreshLockSetOptions
  ) => Promise<unknown>;
  readonly eval: (
    script: string,
    keys: string[],
    args: string[]
  ) => Promise<unknown>;
}

class UpstashRedisSdkError extends Data.TaggedError("UpstashRedisSdkError")<{
  readonly cause: unknown;
}> {}

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

export const loadUpstashRedisConfigFromEnv = loadUpstashRedisConfig.pipe(
  Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
);

const toUpstashRedisKey = (keyPrefix: UpstashRedisKeyPrefixType, key: string) =>
  `${keyPrefix}${key}`;

const releaseIfOwnerScript =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

const scanUpstashKeys = (
  client: UpstashRedisKeyValueClient,
  keyPrefix: UpstashRedisKeyPrefixType
) =>
  Effect.gen(function* scanUpstashKeysWithPrefix() {
    const keys: string[] = [];
    let cursor = "0";

    while (true) {
      const scanCursor = cursor;
      const [nextCursor, scannedKeys] = yield* Effect.tryPromise({
        try: () =>
          client.scan(scanCursor, {
            count: 100,
            match: `${keyPrefix}*`,
          }),
        catch: (cause) => new UpstashRedisSdkError({ cause }),
      }).pipe(
        Effect.mapError(
          (providerError) =>
            new KeyValueStore.KeyValueStoreError({
              method: "scan",
              message: "Unable to scan Upstash Redis keys.",
              cause: providerError.cause,
            })
        )
      );

      for (const key of scannedKeys) {
        keys.push(key);
      }

      if (nextCursor === "0") {
        return keys;
      }

      cursor = nextCursor;
    }
  });

export const makeUpstashKeyValueStore = (
  client: UpstashRedisKeyValueClient,
  config: Pick<UpstashRedisConfigType, "keyPrefix">
) =>
  KeyValueStore.makeStringOnly({
    get: Effect.fn("UpstashKeyValueStore.get")(function* (key: string) {
      const redisKey = toUpstashRedisKey(config.keyPrefix, key);
      const value = yield* Effect.tryPromise({
        try: () => client.get(redisKey),
        catch: (cause) => new UpstashRedisSdkError({ cause }),
      }).pipe(
        Effect.mapError(
          (providerError) =>
            new KeyValueStore.KeyValueStoreError({
              method: "get",
              key: redisKey,
              message: "Unable to read Upstash Redis key.",
              cause: providerError.cause,
            })
        )
      );

      return value ?? undefined;
    }),
    set: Effect.fn("UpstashKeyValueStore.set")(function* (
      key: string,
      value: string
    ) {
      const redisKey = toUpstashRedisKey(config.keyPrefix, key);

      yield* Effect.tryPromise({
        try: () => client.set(redisKey, value),
        catch: (cause) => new UpstashRedisSdkError({ cause }),
      }).pipe(
        Effect.mapError(
          (providerError) =>
            new KeyValueStore.KeyValueStoreError({
              method: "set",
              key: redisKey,
              message: "Unable to write Upstash Redis key.",
              cause: providerError.cause,
            })
        ),
        Effect.asVoid
      );
    }),
    remove: Effect.fn("UpstashKeyValueStore.remove")(function* (key: string) {
      const redisKey = toUpstashRedisKey(config.keyPrefix, key);

      yield* Effect.tryPromise({
        try: () => client.del(redisKey),
        catch: (cause) => new UpstashRedisSdkError({ cause }),
      }).pipe(
        Effect.mapError(
          (providerError) =>
            new KeyValueStore.KeyValueStoreError({
              method: "remove",
              key: redisKey,
              message: "Unable to remove Upstash Redis key.",
              cause: providerError.cause,
            })
        ),
        Effect.asVoid
      );
    }),
    clear: scanUpstashKeys(client, config.keyPrefix).pipe(
      Effect.flatMap((keys) =>
        keys.length === 0
          ? Effect.void
          : Effect.tryPromise({
              try: () => client.del(...keys),
              catch: (cause) => new UpstashRedisSdkError({ cause }),
            }).pipe(
              Effect.mapError(
                (providerError) =>
                  new KeyValueStore.KeyValueStoreError({
                    method: "clear",
                    message: "Unable to clear Upstash Redis keys.",
                    cause: providerError.cause,
                  })
              ),
              Effect.asVoid
            )
      ),
      Effect.withSpan("UpstashKeyValueStore.clear")
    ),
    size: scanUpstashKeys(client, config.keyPrefix).pipe(
      Effect.map((keys) => keys.length),
      Effect.withSpan("UpstashKeyValueStore.size")
    ),
  });

export const makeUpstashCodexOAuthRefreshLock = (
  client: UpstashRedisRefreshLockClient,
  config: Pick<UpstashRedisConfigType, "keyPrefix">
) =>
  makeCodexOAuthRefreshLock({
    acquire: Effect.fn("UpstashCodexOAuthRefreshLock.acquire")(function* (
      lease: CodexOAuthRefreshLockLease,
      nowEpochMillis: number
    ) {
      const key = yield* codexOAuthRefreshLockStorageKey(lease.subject).pipe(
        Effect.mapError(
          (cause) =>
            new CodexOAuthRefreshLockError({
              operation: "acquire",
              reason: "acquisition",
              subjectHash: lease.subjectHash,
              message:
                "Unable to derive the Upstash Codex OAuth refresh-lock key.",
              cause,
            })
        )
      );
      const redisKey = toUpstashRedisKey(config.keyPrefix, key);
      const result = yield* Effect.tryPromise({
        try: () =>
          client.set(redisKey, Redacted.value(lease.owner), {
            nx: true,
            px: lease.expiresAtEpochMillis - nowEpochMillis,
          }),
        catch: (cause) => new UpstashRedisSdkError({ cause }),
      }).pipe(
        Effect.flatMap(
          Schema.decodeUnknownEffect(
            Schema.Union([Schema.Literal("OK"), Schema.Null])
          )
        ),
        Effect.mapError(
          (cause) =>
            new CodexOAuthRefreshLockError({
              operation: "acquire",
              reason: "acquisition",
              subjectHash: lease.subjectHash,
              message:
                "Unable to acquire the Upstash Codex OAuth refresh lock.",
              cause,
            })
        )
      );

      return result === "OK";
    }),
    release: Effect.fn("UpstashCodexOAuthRefreshLock.release")(function* (
      lease: CodexOAuthRefreshLockLease
    ) {
      const key = yield* codexOAuthRefreshLockStorageKey(lease.subject).pipe(
        Effect.mapError(
          (cause) =>
            new CodexOAuthRefreshLockError({
              operation: "release",
              reason: "release",
              subjectHash: lease.subjectHash,
              message:
                "Unable to derive the Upstash Codex OAuth refresh-lock key.",
              cause,
            })
        )
      );
      const redisKey = toUpstashRedisKey(config.keyPrefix, key);
      const result = yield* Effect.tryPromise({
        try: () =>
          client.eval(
            releaseIfOwnerScript,
            [redisKey],
            [Redacted.value(lease.owner)]
          ),
        catch: (cause) => new UpstashRedisSdkError({ cause }),
      }).pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Literals([0, 1]))),
        Effect.mapError(
          (cause) =>
            new CodexOAuthRefreshLockError({
              operation: "release",
              reason: "release",
              subjectHash: lease.subjectHash,
              message:
                "Unable to release the Upstash Codex OAuth refresh lock.",
              cause,
            })
        )
      );

      return result === 1;
    }),
  });

export const UpstashKeyValueStoreLive = Layer.effect(
  KeyValueStore.KeyValueStore,
  Effect.gen(function* makeUpstashKeyValueStoreLive() {
    const config = yield* loadUpstashRedisConfig;

    return makeUpstashKeyValueStore(
      new Redis({
        url: config.restUrl.href,
        token: Redacted.value(config.restToken),
        automaticDeserialization: false,
        enableTelemetry: false,
      }),
      config
    );
  }).pipe(Effect.withSpan("UpstashKeyValueStoreLive"))
).pipe(Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv())));

export const UpstashCodexOAuthRefreshLockLive = Layer.effect(
  CodexOAuthRefreshLock,
  Effect.gen(function* makeUpstashCodexOAuthRefreshLockLive() {
    const config = yield* loadUpstashRedisConfig;

    return yield* makeUpstashCodexOAuthRefreshLock(
      new Redis({
        url: config.restUrl.href,
        token: Redacted.value(config.restToken),
        automaticDeserialization: false,
        enableTelemetry: false,
      }),
      config
    );
  }).pipe(Effect.withSpan("UpstashCodexOAuthRefreshLockLive"))
).pipe(Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv())));

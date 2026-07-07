import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Redacted, Schema } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexOAuthProfile,
  CodexOAuthSubject,
  getProfile,
  putProfile,
  UpstashRedisKeyPrefix,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import { CodexProfileStoreKeyValueLive } from "../src/live.layer.js";
import {
  loadUpstashRedisConfig,
  makeUpstashKeyValueStore,
} from "../src/upstash-key-value-store.layer.js";
import type { UpstashRedisKeyValueClient } from "../src/upstash-key-value-store.layer.js";

const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);

const renderForLeakCheck = (value: unknown) =>
  `${String(value)} ${encodeUnknownJson(value)}`;

const fixtureSubject = Schema.decodeUnknownEffect(CodexOAuthSubject)({
  provider: "codex",
  principal: {
    type: "chatgpt-user",
    id: "acct_upstash",
    issuer: "https://auth.openai.com",
  },
  connectorId: "bundjil-local",
  installationId: "agent-dev",
  profileId: "default",
});

const makeProfile = (
  subject: CodexOAuthSubjectType,
  expiresAtEpochMillis: number
) =>
  Schema.decodeUnknownEffect(CodexOAuthProfile)({
    subject,
    accessToken: "access-token-secret",
    refreshToken: "refresh-token-secret",
    expiresAtEpochMillis,
    scopes: ["openid", "profile", "email", "offline_access"],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    requiresReauthentication: false,
  });

const makeKeyPrefix = (value: string) =>
  Schema.decodeUnknownEffect(UpstashRedisKeyPrefix)(value);

const makeMockUpstashClient = () => {
  const values = new Map<string, string>();
  const client = {
    get: (key) => Promise.resolve(values.get(key) ?? null),
    set: (key, value) => {
      values.set(key, value);
      return Promise.resolve("OK");
    },
    del: (...keys) => {
      let deletedCount = 0;

      for (const key of keys) {
        if (values.delete(key)) {
          deletedCount += 1;
        }
      }

      return Promise.resolve(deletedCount);
    },
    scan: (cursor, options) => {
      const scannedKeys: string[] = [];

      for (const key of values.keys()) {
        if (key.startsWith(options.match.slice(0, -1))) {
          scannedKeys.push(key);
        }
      }

      const start = Number(cursor);
      const end = start + options.count;
      const page = scannedKeys.slice(start, end);
      const nextCursor = end >= scannedKeys.length ? "0" : String(end);
      const scanResult: readonly [string, readonly string[]] = [
        nextCursor,
        page,
      ];

      return Promise.resolve(scanResult);
    },
  } satisfies UpstashRedisKeyValueClient;

  return { client, values };
};

const failingUpstashClient = {
  get: () => Promise.reject(new Error("forced Upstash read failure")),
  set: () => Promise.reject(new Error("forced Upstash write failure")),
  del: () => Promise.reject(new Error("forced Upstash remove failure")),
  scan: () => Promise.reject(new Error("forced Upstash scan failure")),
} satisfies UpstashRedisKeyValueClient;

it.effect("loads Upstash Redis config with redacted secrets", () =>
  Effect.gen(function* testUpstashConfig() {
    const config = yield* loadUpstashRedisConfig.pipe(
      Effect.provide(
        ConfigProvider.layer(
          ConfigProvider.fromEnv({
            env: {
              BUNDJIL_UPSTASH_REDIS_KEY_PREFIX: "test:",
              UPSTASH_REDIS_REST_URL: "https://steady-redfish.upstash.io",
              UPSTASH_REDIS_REST_TOKEN: "upstash-rest-token-secret",
            },
          })
        )
      )
    );
    const rendered = renderForLeakCheck(config);

    assert.strictEqual(
      config.restUrl.href,
      "https://steady-redfish.upstash.io/"
    );
    assert.strictEqual(config.keyPrefix, "test:");
    assert.strictEqual(
      Redacted.value(config.restToken),
      "upstash-rest-token-secret"
    );
    assert.strictEqual(rendered.includes("upstash-rest-token-secret"), false);
  })
);

it.effect("loads Vercel KV-compatible env aliases for Upstash Redis", () =>
  Effect.gen(function* testVercelAliasConfig() {
    const config = yield* loadUpstashRedisConfig.pipe(
      Effect.provide(
        ConfigProvider.layer(
          ConfigProvider.fromEnv({
            env: {
              KV_REST_API_URL: "https://legacy-vercel-alias.upstash.io",
              KV_REST_API_TOKEN: "vercel-alias-token-secret",
            },
          })
        )
      )
    );

    assert.strictEqual(
      config.restUrl.href,
      "https://legacy-vercel-alias.upstash.io/"
    );
    assert.strictEqual(config.keyPrefix, "bundjil:codex-oauth:");
    assert.strictEqual(
      Redacted.value(config.restToken),
      "vercel-alias-token-secret"
    );
  })
);

it.effect("maps missing Upstash Redis config to a tagged config error", () =>
  Effect.gen(function* testMissingUpstashConfig() {
    const error = yield* loadUpstashRedisConfig.pipe(
      Effect.provide(
        ConfigProvider.layer(
          ConfigProvider.fromEnv({
            env: {},
          })
        )
      ),
      Effect.flip
    );

    assert.strictEqual(error._tag, "UpstashKeyValueStoreConfigError");
    assert.strictEqual(error.boundary, "UpstashRedisConfig");
  })
);

it.effect("adapts mocked Upstash Redis operations to KeyValueStore", () =>
  Effect.gen(function* testUpstashKeyValueStoreOperations() {
    const { client, values } = makeMockUpstashClient();
    const keyPrefix = yield* makeKeyPrefix("test:");
    const keyValueStore = makeUpstashKeyValueStore(client, {
      keyPrefix,
    });

    values.set("outside:kept", "gamma");
    yield* keyValueStore.set("one", "alpha");
    yield* keyValueStore.set("two", "beta");

    assert.strictEqual(values.get("test:one"), "alpha");
    assert.strictEqual(yield* keyValueStore.get("one"), "alpha");
    assert.strictEqual(yield* keyValueStore.has("two"), true);
    assert.strictEqual(yield* keyValueStore.size, 2);

    yield* keyValueStore.remove("one");
    assert.strictEqual(yield* keyValueStore.get("one"), undefined);
    assert.strictEqual(yield* keyValueStore.size, 1);

    yield* keyValueStore.clear;
    assert.strictEqual(yield* keyValueStore.isEmpty, true);
    assert.strictEqual(values.get("outside:kept"), "gamma");
  })
);

it.effect("works behind the existing schema-backed Codex profile store", () =>
  Effect.gen(function* testProfileStoreAdapterBoundary() {
    const { client } = makeMockUpstashClient();
    const keyPrefix = yield* makeKeyPrefix("test:");
    const keyValueStoreLayer = Layer.succeed(
      KeyValueStore.KeyValueStore,
      makeUpstashKeyValueStore(client, {
        keyPrefix,
      })
    );
    const subject = yield* fixtureSubject;
    const profile = yield* makeProfile(subject, Date.now() + 60_000);

    yield* Effect.gen(function* storeAndReadProfile() {
      yield* putProfile(profile);

      const stored = yield* getProfile(subject);

      assert.strictEqual(
        Redacted.value(stored.accessToken),
        "access-token-secret"
      );
    }).pipe(
      Effect.provide(
        CodexProfileStoreKeyValueLive.pipe(Layer.provide(keyValueStoreLayer))
      )
    );
  })
);

it.effect("maps Upstash provider failures to KeyValueStore errors", () =>
  Effect.gen(function* testProviderFailureMapping() {
    const keyPrefix = yield* makeKeyPrefix("test:");
    const error = yield* makeUpstashKeyValueStore(failingUpstashClient, {
      keyPrefix,
    })
      .get("failing")
      .pipe(Effect.flip);

    assert.strictEqual(error._tag, "KeyValueStoreError");
    assert.strictEqual(error.method, "get");
    assert.strictEqual(error.key, "test:failing");
  })
);

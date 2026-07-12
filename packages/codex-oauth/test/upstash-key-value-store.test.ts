import { assert, it } from "@effect/vitest";
import {
  ConfigProvider,
  Effect,
  Layer,
  Redacted,
  Result,
  Schema,
} from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexAccessTokenImportProfile,
  CodexOAuthProfileCipherConfig,
  CodexOAuthProfileCommit,
  CodexOAuthSubject,
  CodexSubscriptionProfile,
  getProfile,
  putProfile,
  UpstashRedisKeyPrefix,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import {
  CodexProfileStoreEncryptedKeyValueLive,
  CodexProfileStoreKeyValueLive,
} from "../src/live.layer.js";
import { CodexOAuthProfileCipherTest } from "../src/mock.layer.js";
import {
  codexOAuthProfileRevisionStorageKey,
  codexOAuthProfileStorageKey,
} from "../src/storage-keys.js";
import {
  loadUpstashRedisConfig,
  makeUpstashCodexOAuthProfileCommit,
  makeUpstashKeyValueStore,
} from "../src/upstash-key-value-store.layer.js";
import type {
  UpstashRedisKeyValueClient,
  UpstashRedisProfileCommitClient,
} from "../src/upstash-key-value-store.layer.js";

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
  Schema.decodeUnknownEffect(CodexAccessTokenImportProfile)({
    profileVersion: 2,
    profileKind: "access-token-import",
    subject,
    accessToken: "access-token-secret",
    expiresAtEpochMillis,
    scopes: [],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    requiresReauthentication: true,
  });

const makeSubscriptionProfile = (
  subject: CodexOAuthSubjectType,
  credentialRevision: string,
  accessToken: string
) =>
  Schema.decodeUnknownEffect(CodexSubscriptionProfile)({
    profileVersion: 2,
    profileKind: "subscription",
    subject,
    accessToken,
    refreshToken: "refresh-token-secret",
    accountId: "acct_upstash",
    protocolScopeVersion: "codex-cli-v1",
    expiresAtEpochMillis: Date.now() + 60_000,
    scopes: ["offline_access"],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    lastRefreshedAtEpochMillis: 1_700_000_000_000,
    credentialRevision,
    requiresReauthentication: false,
  });

const makeCipherConfig = () =>
  Schema.decodeUnknownEffect(CodexOAuthProfileCipherConfig)({
    algorithm: "AES-GCM",
    keyId: "test-key-v1",
    keyMaterial: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
  });

const makeKeyPrefix = (value: string) =>
  Schema.decodeUnknownEffect(UpstashRedisKeyPrefix)(value);

const makeMockUpstashClient = () => {
  const values = new Map<string, string>();
  const evalCalls: {
    script: string;
    keys: string[];
    args: string[];
  }[] = [];
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
    eval: (script, keys, args) => {
      evalCalls.push({
        script,
        keys,
        args,
      });

      const [profileKey = "", revisionKey = ""] = keys;
      const [
        operation = "",
        expectedRevision = "",
        encodedProfile = "",
        nextRevision = "",
      ] = args;
      const currentProfile = values.get(profileKey) ?? null;
      const currentRevision = values.get(revisionKey) ?? null;
      const createConflict =
        operation === "initialWrite" &&
        (currentProfile !== null || currentRevision !== null);
      const legacyReplacementConflict =
        operation === "replaceLegacy" &&
        (currentProfile === null ||
          currentRevision !== null ||
          currentProfile !== expectedRevision);
      const casConflict =
        operation !== "initialWrite" &&
        operation !== "replaceLegacy" &&
        (currentRevision === null || currentRevision !== expectedRevision);

      if (createConflict || legacyReplacementConflict || casConflict) {
        return Promise.resolve(0);
      }

      values.set(profileKey, encodedProfile);
      values.set(revisionKey, nextRevision);

      return Promise.resolve(1);
    },
  } satisfies UpstashRedisKeyValueClient & UpstashRedisProfileCommitClient;

  return { client, values, evalCalls };
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

it.effect(
  "uses create-only and fenced CAS Lua arguments for Upstash profile commits",
  () =>
    Effect.gen(function* testUpstashCommitArguments() {
      const { client, values, evalCalls } = makeMockUpstashClient();
      const keyPrefix = yield* makeKeyPrefix("test:");
      const cipherConfig = yield* makeCipherConfig();
      const subject = yield* fixtureSubject;
      const profile = yield* makeSubscriptionProfile(
        subject,
        "rev-upstash-initial-secret",
        "upstash-access-token-secret"
      );
      const commit = yield* makeUpstashCodexOAuthProfileCommit(client, {
        keyPrefix,
      }).pipe(Effect.provide(CodexOAuthProfileCipherTest(cipherConfig)));
      const profileKey = yield* codexOAuthProfileStorageKey(subject);
      const revisionKey = yield* codexOAuthProfileRevisionStorageKey(subject);

      yield* commit.initialWrite(profile);

      assert.strictEqual(evalCalls.length, 1);
      const [evalCall] = evalCalls;

      assert.isDefined(evalCall);
      if (evalCall === undefined) {
        return;
      }

      assert.include(evalCall.script, "initialWrite");
      assert.deepStrictEqual(evalCall.keys, [
        `test:${profileKey}`,
        `test:${revisionKey}`,
      ]);
      assert.strictEqual(evalCall.args[0], "initialWrite");
      assert.strictEqual(evalCall.args[1], "");
      assert.strictEqual(evalCall.args[3], "rev-upstash-initial-secret");
      assert.isDefined(values.get(`test:${profileKey}`));
      assert.strictEqual(
        values.get(`test:${revisionKey}`),
        "rev-upstash-initial-secret"
      );
    })
);

it.effect(
  "preserves Upstash winners across duplicate create and stale CAS attempts",
  () =>
    Effect.gen(function* testUpstashCommitConflicts() {
      const { client, values } = makeMockUpstashClient();
      const keyPrefix = yield* makeKeyPrefix("test:");
      const cipherConfig = yield* makeCipherConfig();
      const subject = yield* fixtureSubject;
      const initialProfile = yield* makeSubscriptionProfile(
        subject,
        "rev-upstash-start-secret",
        "upstash-start-token-secret"
      );
      const replacementProfile = yield* makeSubscriptionProfile(
        subject,
        "rev-upstash-winner-secret",
        "upstash-winner-token-secret"
      );
      const staleProfile = yield* makeSubscriptionProfile(
        subject,
        "rev-upstash-stale-secret",
        "upstash-stale-token-secret"
      );
      const keyValueStoreLayer = Layer.succeed(
        KeyValueStore.KeyValueStore,
        makeUpstashKeyValueStore(client, {
          keyPrefix,
        })
      );
      const cipherLayer = CodexOAuthProfileCipherTest(cipherConfig);
      const profileStoreLayer = CodexProfileStoreEncryptedKeyValueLive.pipe(
        Layer.provideMerge(keyValueStoreLayer),
        Layer.provideMerge(cipherLayer)
      );
      const commitLayer = Layer.effect(
        CodexOAuthProfileCommit,
        makeUpstashCodexOAuthProfileCommit(client, {
          keyPrefix,
        })
      ).pipe(Layer.provide(cipherLayer));

      return yield* Effect.gen(function* commitAgainstSharedMockRedis() {
        const commit = yield* CodexOAuthProfileCommit;

        yield* commit.initialWrite(initialProfile);

        const duplicateConflict = yield* commit
          .initialWrite(replacementProfile)
          .pipe(Effect.flip);

        yield* commit.replace({
          profile: replacementProfile,
          expectedRevision: initialProfile.credentialRevision,
        });

        const staleConflict = yield* commit
          .replace({
            profile: staleProfile,
            expectedRevision: initialProfile.credentialRevision,
          })
          .pipe(Effect.flip);
        const storedProfile = yield* getProfile(subject);
        const profileKey = yield* codexOAuthProfileStorageKey(subject);
        const revisionKey = yield* codexOAuthProfileRevisionStorageKey(subject);

        assert.strictEqual(
          duplicateConflict._tag,
          "CodexOAuthProfileCommitConflict"
        );
        assert.strictEqual(
          staleConflict._tag,
          "CodexOAuthProfileCommitConflict"
        );
        assert.strictEqual(storedProfile.profileKind, "subscription");
        if (storedProfile.profileKind !== "subscription") {
          return;
        }
        assert.strictEqual(
          storedProfile.credentialRevision,
          "rev-upstash-winner-secret"
        );
        assert.strictEqual(
          Redacted.value(storedProfile.accessToken),
          "upstash-winner-token-secret"
        );
        assert.isDefined(values.get(`test:${profileKey}`));
        assert.strictEqual(
          values.get(`test:${revisionKey}`),
          "rev-upstash-winner-secret"
        );
      }).pipe(Effect.provide(Layer.merge(profileStoreLayer, commitLayer)));
    })
);

it.effect(
  "atomically migrates a legacy Upstash profile and preserves the first winner",
  () =>
    Effect.gen(function* testUpstashLegacyMigration() {
      const { client } = makeMockUpstashClient();
      const keyPrefix = yield* makeKeyPrefix("test:");
      const cipherConfig = yield* makeCipherConfig();
      const subject = yield* fixtureSubject;
      const legacyProfile = yield* makeProfile(subject, 1_900_000_000_000);
      const first = yield* makeSubscriptionProfile(
        subject,
        "rev-upstash-legacy-first-secret",
        "upstash-legacy-first-token-secret"
      );
      const second = yield* makeSubscriptionProfile(
        subject,
        "rev-upstash-legacy-second-secret",
        "upstash-legacy-second-token-secret"
      );
      const keyValueStoreLayer = Layer.succeed(
        KeyValueStore.KeyValueStore,
        makeUpstashKeyValueStore(client, { keyPrefix })
      );
      const cipherLayer = CodexOAuthProfileCipherTest(cipherConfig);
      const storeLayer = CodexProfileStoreEncryptedKeyValueLive.pipe(
        Layer.provideMerge(keyValueStoreLayer),
        Layer.provideMerge(cipherLayer)
      );
      const commitLayer = Layer.effect(
        CodexOAuthProfileCommit,
        makeUpstashCodexOAuthProfileCommit(client, { keyPrefix })
      ).pipe(Layer.provide(cipherLayer));

      return yield* Effect.gen(function* migrateSharedUpstashProfile() {
        const commit = yield* CodexOAuthProfileCommit;
        yield* putProfile(legacyProfile);
        const results = yield* Effect.all(
          [
            Effect.result(
              commit.replaceLegacy({
                expectedLegacyProfile: legacyProfile,
                profile: first,
              })
            ),
            Effect.result(
              commit.replaceLegacy({
                expectedLegacyProfile: legacyProfile,
                profile: second,
              })
            ),
          ],
          { concurrency: "unbounded" }
        );
        const successes = results.filter(Result.isSuccess);
        const failures = results.filter(Result.isFailure);
        const storedProfile = yield* getProfile(subject);

        assert.strictEqual(successes.length, 1);
        assert.strictEqual(failures.length, 1);
        assert.strictEqual(
          failures[0]?.failure._tag,
          "CodexOAuthProfileCommitConflict"
        );
        assert.strictEqual(storedProfile.profileKind, "subscription");
        if (storedProfile.profileKind === "subscription") {
          assert.strictEqual(
            [first.credentialRevision, second.credentialRevision].includes(
              storedProfile.credentialRevision
            ),
            true
          );
        }
      }).pipe(Effect.provide(Layer.merge(storeLayer, commitLayer)));
    })
);

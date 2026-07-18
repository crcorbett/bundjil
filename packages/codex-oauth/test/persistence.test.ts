import { PersistenceMemory } from "@bundjil/store/memory";
import { assert, it } from "@effect/vitest";
import {
  Array,
  ConfigProvider,
  Effect,
  Layer,
  Redacted,
  Result,
  Schema,
  pipe,
} from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexAccessTokenImportProfile,
  CodexOAuthProfileCipherConfig,
  CodexOAuthProfileCommit,
  CodexOAuthCredentialRevision,
  CodexOAuthRefreshLock,
  CodexOAuthRefreshLockTtlMillis,
  CodexOAuthSubject,
  CodexSubscriptionProfile,
  getProfile,
  putProfile,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import {
  CodexOAuthProfileCommitAtomicLive,
  CodexOAuthRefreshLockAtomicLive,
  CodexProfileStoreEncryptedKeyValueLive,
} from "../src/live.layer.js";
import { CodexOAuthProfileCipherTest } from "../src/mock.layer.js";
import {
  codexOAuthProfileRevisionStorageKey,
  codexOAuthProfileStorageKey,
} from "../src/storage-keys.js";
import { loadUpstashRedisConfig } from "../src/upstash-persistence.layer.js";

const fixtureSubject = Schema.decodeUnknownEffect(CodexOAuthSubject)({
  provider: "codex",
  principal: {
    type: "chatgpt-user",
    id: "acct_persistence",
    issuer: "https://auth.openai.com",
  },
  connectorId: "bundjil-local",
  installationId: "agent-dev",
  profileId: "default",
});

const makeLegacyProfile = (subject: CodexOAuthSubjectType) =>
  Schema.decodeUnknownEffect(CodexAccessTokenImportProfile)({
    profileVersion: 2,
    profileKind: "access-token-import",
    subject,
    accessToken: "access-token-secret",
    expiresAtEpochMillis: 1_900_000_000_000,
    scopes: [],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    requiresReauthentication: true,
  });

const makeSubscriptionProfile = (
  subject: CodexOAuthSubjectType,
  credentialRevision: string
) =>
  Schema.decodeUnknownEffect(CodexSubscriptionProfile)({
    profileVersion: 2,
    profileKind: "subscription",
    subject,
    accessToken: "subscription-access-token-secret",
    refreshToken: "refresh-token-secret",
    accountId: "account-secret",
    protocolScopeVersion: "codex-cli-v1",
    expiresAtEpochMillis: 1_900_000_000_000,
    scopes: ["offline_access"],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    lastRefreshedAtEpochMillis: 1_700_000_000_000,
    credentialRevision,
    requiresReauthentication: false,
  });

const cipherConfig = Schema.decodeUnknownEffect(CodexOAuthProfileCipherConfig)({
  algorithm: "AES-GCM",
  keyId: "test-key-v1",
  keyMaterial: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
});

const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);

it.effect("preserves Codex Upstash config names, aliases, and redaction", () =>
  Effect.gen(function* testCodexUpstashConfig() {
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
    assert.strictEqual(config.keyPrefix, "bundjil:codex-oauth:");
    assert.strictEqual(
      Redacted.value(config.restToken),
      "vercel-alias-token-secret"
    );
    assert.strictEqual(
      encodeUnknownJson(config).includes("vercel-alias-token-secret"),
      false
    );
  })
);

it.effect("maps missing Codex Upstash config to a safe tagged error", () =>
  Effect.gen(function* testMissingCodexUpstashConfig() {
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

it.effect(
  "shares encrypted profile storage and revision-fenced atomic commits",
  () =>
    Effect.gen(function* testAtomicProfileCommit() {
      const subject = yield* fixtureSubject;
      const legacy = yield* makeLegacyProfile(subject);
      const first = yield* makeSubscriptionProfile(
        subject,
        "revision-first-secret"
      );
      const stale = yield* makeSubscriptionProfile(
        subject,
        "revision-stale-secret"
      );
      const cipher = CodexOAuthProfileCipherTest(yield* cipherConfig);
      const store = CodexProfileStoreEncryptedKeyValueLive.pipe(
        Layer.provideMerge(Layer.merge(PersistenceMemory, cipher))
      );
      const commit = CodexOAuthProfileCommitAtomicLive.pipe(
        Layer.provideMerge(Layer.merge(PersistenceMemory, cipher))
      );

      return yield* Effect.gen(function* commitAndRead() {
        const keyValueStore = yield* KeyValueStore.KeyValueStore;
        const profileKey = yield* codexOAuthProfileStorageKey(subject);
        const revisionKey = yield* codexOAuthProfileRevisionStorageKey(subject);
        yield* putProfile(legacy);
        const before = yield* keyValueStore.get(profileKey);
        const profileCommit = yield* CodexOAuthProfileCommit;
        yield* profileCommit.replaceLegacy({
          expectedLegacyProfile: legacy,
          profile: first,
        });
        const staleError = yield* profileCommit
          .replace({
            profile: stale,
            expectedRevision: yield* Schema.decodeUnknownEffect(
              CodexOAuthCredentialRevision
            )("revision-old-secret"),
          })
          .pipe(Effect.flip);
        const after = yield* keyValueStore.get(profileKey);
        const stored = yield* getProfile(subject);

        assert.isDefined(before);
        assert.isDefined(after);
        assert.notStrictEqual(before, after);
        assert.strictEqual(
          yield* keyValueStore.get(revisionKey),
          "revision-first-secret"
        );
        assert.strictEqual(staleError._tag, "CodexOAuthProfileCommitConflict");
        assert.strictEqual(stored.profileKind, "subscription");
      }).pipe(Effect.provide(Layer.mergeAll(PersistenceMemory, store, commit)));
    })
);

it.effect("allows exactly one concurrent revision-fenced replacement", () =>
  Effect.gen(function* testConcurrentAtomicReplacement() {
    const subject = yield* fixtureSubject;
    const initial = yield* makeSubscriptionProfile(
      subject,
      "revision-concurrent-initial-secret"
    );
    const first = yield* makeSubscriptionProfile(
      subject,
      "revision-concurrent-first-secret"
    );
    const second = yield* makeSubscriptionProfile(
      subject,
      "revision-concurrent-second-secret"
    );
    const cipher = CodexOAuthProfileCipherTest(yield* cipherConfig);
    const store = CodexProfileStoreEncryptedKeyValueLive.pipe(
      Layer.provideMerge(Layer.merge(PersistenceMemory, cipher))
    );
    const commit = CodexOAuthProfileCommitAtomicLive.pipe(
      Layer.provideMerge(Layer.merge(PersistenceMemory, cipher))
    );

    return yield* Effect.gen(function* replaceConcurrently() {
      const profileCommit = yield* CodexOAuthProfileCommit;
      yield* profileCommit.initialWrite(initial);
      const results = yield* Effect.all(
        [
          Effect.result(
            profileCommit.replace({
              profile: first,
              expectedRevision: initial.credentialRevision,
            })
          ),
          Effect.result(
            profileCommit.replace({
              profile: second,
              expectedRevision: initial.credentialRevision,
            })
          ),
        ],
        { concurrency: "unbounded" }
      );
      const successes = pipe(
        results,
        Array.filter((result) => Result.isSuccess(result))
      );
      const failures = pipe(
        results,
        Array.filter((result) => Result.isFailure(result))
      );
      const stored = yield* getProfile(subject);

      assert.strictEqual(successes.length, 1);
      assert.strictEqual(failures.length, 1);
      assert.strictEqual(
        failures[0]?.failure._tag,
        "CodexOAuthProfileCommitConflict"
      );
      assert.strictEqual(stored.profileKind, "subscription");
      if (stored.profileKind === "subscription") {
        assert.strictEqual(
          stored.credentialRevision,
          successes[0]?.success.credentialRevision
        );
      }
    }).pipe(Effect.provide(Layer.mergeAll(PersistenceMemory, store, commit)));
  })
);

it.effect(
  "applies one initial write and rejects stale revision replacements",
  () =>
    Effect.gen(function* testInitialAndRevisionFences() {
      const subject = yield* fixtureSubject;
      const initial = yield* makeSubscriptionProfile(
        subject,
        "revision-initial-secret"
      );
      const winner = yield* makeSubscriptionProfile(
        subject,
        "revision-winner-secret"
      );
      const duplicate = yield* makeSubscriptionProfile(
        subject,
        "revision-duplicate-secret"
      );
      const cipher = CodexOAuthProfileCipherTest(yield* cipherConfig);
      const commit = CodexOAuthProfileCommitAtomicLive.pipe(
        Layer.provideMerge(Layer.merge(PersistenceMemory, cipher))
      );

      return yield* Effect.gen(function* applyFences() {
        const profileCommit = yield* CodexOAuthProfileCommit;
        yield* profileCommit.initialWrite(initial);
        const duplicateError = yield* profileCommit
          .initialWrite(duplicate)
          .pipe(Effect.flip);
        yield* profileCommit.replace({
          profile: winner,
          expectedRevision: initial.credentialRevision,
        });
        const staleError = yield* profileCommit
          .refresh({
            profile: duplicate,
            expectedRevision: initial.credentialRevision,
          })
          .pipe(Effect.flip);

        assert.strictEqual(
          duplicateError._tag,
          "CodexOAuthProfileCommitConflict"
        );
        assert.strictEqual(staleError._tag, "CodexOAuthProfileCommitConflict");
      }).pipe(Effect.provide(Layer.merge(PersistenceMemory, commit)));
    })
);

it.effect("uses atomic ownership fencing for refresh locks", () =>
  Effect.gen(function* testRefreshLockAtomicity() {
    const subject = yield* fixtureSubject;
    const ttl = yield* Schema.decodeUnknownEffect(
      CodexOAuthRefreshLockTtlMillis
    )(5000);

    return yield* Effect.gen(function* acquireAndRelease() {
      const lock = yield* CodexOAuthRefreshLock;
      const lease = yield* lock.acquire({ subject, ttlMillis: ttl });
      const contention = yield* lock
        .acquire({ subject, ttlMillis: ttl })
        .pipe(Effect.flip);
      yield* lock.release(lease);
      const nextLease = yield* lock.acquire({ subject, ttlMillis: ttl });

      assert.strictEqual(contention._tag, "CodexOAuthRefreshLockError");
      assert.notStrictEqual(
        Redacted.value(lease.owner),
        Redacted.value(nextLease.owner)
      );
    }).pipe(
      Effect.provide(
        CodexOAuthRefreshLockAtomicLive.pipe(Layer.provide(PersistenceMemory))
      )
    );
  })
);

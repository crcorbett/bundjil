import { assert, it } from "@effect/vitest";
import {
  ConfigProvider,
  Deferred,
  Effect,
  Fiber,
  Layer,
  Redacted,
  Schema,
} from "effect";
import { TestClock } from "effect/testing";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexAccessTokenImportProfile,
  CodexOAuthProfileCipherConfig,
  CodexOAuthRefreshLock,
  CodexOAuthRefreshLockAcquireInput,
  CodexOAuthRefreshLockLease,
  CodexSubscriptionProfile,
  CodexOAuthSubject,
  CodexOAuthTokenRefreshResult,
  EncryptedCodexOAuthProfile,
  EncryptedCodexOAuthProfileV2,
  codexOAuthProfileStorageKey,
  decryptCodexOAuthProfile,
  encryptCodexOAuthProfile,
  getProfile,
  getValidToken,
  hasProfile,
  putProfile,
  removeProfile,
  refreshAccessToken,
  revokeToken,
  loadCodexOAuthProfileCipherConfig,
  withCodexOAuthRefreshLock,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import {
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexProfileStoreEncryptedKeyValueLive,
  CodexProfileStoreKeyValueLive,
} from "../src/runtime.js";
import {
  CodexOAuthMemory,
  CodexOAuthProfileCipherTest,
  CodexOAuthRefreshLockMemory,
  CodexProfileStoreMemory,
} from "../src/testing.js";

const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);

const renderForLeakCheck = (value: unknown) =>
  `${String(value)} ${encodeUnknownJson(value)}`;

const fixtureSubject = Schema.decodeUnknownEffect(CodexOAuthSubject)({
  provider: "codex",
  principal: {
    type: "chatgpt-user",
    id: "acct_123",
    issuer: "https://auth.openai.com",
  },
  connectorId: "bundjil-local",
  installationId: "agent-dev",
  profileId: "default",
});

const makeSubscriptionProfile = (
  subject: CodexOAuthSubjectType,
  expiresAtEpochMillis: number
) =>
  Schema.decodeUnknownEffect(CodexSubscriptionProfile)({
    profileVersion: 2,
    profileKind: "subscription",
    subject,
    accessToken: "access-token-secret",
    refreshToken: "refresh-token-secret",
    accountId: "acct_123",
    protocolScopeVersion: "codex-cli-v1",
    expiresAtEpochMillis,
    scopes: ["openid", "profile", "email", "offline_access"],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    lastRefreshedAtEpochMillis: 1_700_000_000_000,
    credentialRevision: "rev-initial",
    requiresReauthentication: false,
  });

const makeImportProfile = (
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

const testCipherKeyMaterial = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

const alternateTestCipherKeyMaterial =
  "ZmVkY2JhOTg3NjU0MzIxMGZlZGNiYTk4NzY1NDMyMTA=";

const makeCipherConfig = (
  keyId = "test-key-v1",
  keyMaterial = testCipherKeyMaterial
) =>
  Schema.decodeUnknownEffect(CodexOAuthProfileCipherConfig)({
    algorithm: "AES-GCM",
    keyId,
    keyMaterial,
  });

const makeRefreshLockInput = (
  subject: CodexOAuthSubjectType,
  ttlMillis = 1000
) =>
  Schema.decodeUnknownEffect(CodexOAuthRefreshLockAcquireInput)({
    subject,
    ttlMillis,
  });

const failingKeyValueStore = Layer.succeed(
  KeyValueStore.KeyValueStore,
  KeyValueStore.make({
    get: (key) =>
      Effect.fail(
        new KeyValueStore.KeyValueStoreError({
          method: "get",
          key,
          message: "forced storage failure",
        })
      ),
    getUint8Array: (key) =>
      Effect.fail(
        new KeyValueStore.KeyValueStoreError({
          method: "getUint8Array",
          key,
          message: "forced storage failure",
        })
      ),
    set: (key) =>
      Effect.fail(
        new KeyValueStore.KeyValueStoreError({
          method: "set",
          key,
          message: "forced storage failure",
        })
      ),
    remove: (key) =>
      Effect.fail(
        new KeyValueStore.KeyValueStoreError({
          method: "remove",
          key,
          message: "forced storage failure",
        })
      ),
    clear: Effect.fail(
      new KeyValueStore.KeyValueStoreError({
        method: "clear",
        message: "forced storage failure",
      })
    ),
    size: Effect.fail(
      new KeyValueStore.KeyValueStoreError({
        method: "size",
        message: "forced storage failure",
      })
    ),
  })
);

it.effect("decodes and encodes profiles with redacted runtime tokens", () =>
  Effect.gen(function* testProfileSchemaCodec() {
    const subject = yield* fixtureSubject;
    const profile = yield* makeSubscriptionProfile(
      subject,
      Date.now() + 60_000
    );
    const encoded = yield* Schema.encodeEffect(CodexSubscriptionProfile)(
      profile
    );

    assert.strictEqual(encodeUnknownJson(profile.accessToken), '"<redacted>"');
    assert.strictEqual(
      Redacted.value(profile.accessToken),
      "access-token-secret"
    );
    assert.strictEqual(encoded.accessToken, "access-token-secret");
    assert.strictEqual(encoded.refreshToken, "refresh-token-secret");
  })
);

it.effect("derives stable hashed profile storage keys", () =>
  Effect.gen(function* testProfileStorageKey() {
    const subject = yield* fixtureSubject;
    const firstKey = yield* codexOAuthProfileStorageKey(subject);
    const secondKey = yield* codexOAuthProfileStorageKey(subject);

    assert.strictEqual(firstKey, secondKey);
    assert.match(
      firstKey,
      /^bundjil\/oauth\/v1\/provider\/codex\/profile\/[a-f0-9]{64}$/
    );
    assert.notInclude(firstKey, subject.principal.id);
    assert.notInclude(firstKey, "access-token-secret");
  })
);

it.effect("returns a tagged missing-profile error", () =>
  Effect.gen(function* testMissingProfile() {
    const subject = yield* fixtureSubject;
    const error = yield* getProfile(subject).pipe(
      Effect.provide(CodexProfileStoreMemory()),
      Effect.flip
    );

    assert.strictEqual(error._tag, "OAuthProfileNotFound");
    if (error._tag !== "OAuthProfileNotFound") {
      return;
    }
    assert.strictEqual(error.profileId, subject.profileId);
  })
);

it.effect(
  "stores, reads, checks, and removes profiles through KeyValueStore",
  () =>
    Effect.gen(function* testProfileStoreRoundTrip() {
      const subject = yield* fixtureSubject;
      const profile = yield* makeImportProfile(subject, Date.now() + 60_000);

      yield* putProfile(profile);
      assert.strictEqual(yield* hasProfile(subject), true);

      const stored = yield* getProfile(subject);
      assert.strictEqual(
        Redacted.value(stored.accessToken),
        "access-token-secret"
      );

      yield* removeProfile(subject);
      assert.strictEqual(yield* hasProfile(subject), false);
    }).pipe(Effect.provide(CodexProfileStoreMemory()))
);

it.effect(
  "stores encrypted profile envelopes through KeyValueStore without token leaks",
  () =>
    Effect.gen(function* testEncryptedProfileStoreRoundTrip() {
      const subject = yield* fixtureSubject;
      const profile = yield* makeImportProfile(subject, Date.now() + 60_000);
      const cipherConfig = yield* makeCipherConfig();
      const keyValueStoreLayer = KeyValueStore.layerMemory;
      const encryptedStoreLayer = CodexProfileStoreEncryptedKeyValueLive.pipe(
        Layer.provideMerge(CodexOAuthProfileCipherTest(cipherConfig)),
        Layer.provide(keyValueStoreLayer)
      );
      const testLayer = Layer.merge(encryptedStoreLayer, keyValueStoreLayer);

      return yield* Effect.gen(function* encryptedStoreOperations() {
        yield* putProfile(profile);
        const keyValueStore = yield* KeyValueStore.KeyValueStore;
        const key = yield* codexOAuthProfileStorageKey(subject);
        const storedEnvelope = yield* keyValueStore.get(key);

        assert.isDefined(storedEnvelope);
        assert.notInclude(storedEnvelope, "access-token-secret");
        assert.notInclude(storedEnvelope, "refresh-token-secret");
        assert.notInclude(storedEnvelope, "offline_access");
        assert.strictEqual(yield* hasProfile(subject), true);
        assert.strictEqual(
          Redacted.value((yield* getProfile(subject)).accessToken),
          "access-token-secret"
        );

        yield* removeProfile(subject);
        assert.strictEqual(yield* hasProfile(subject), false);
        assert.strictEqual(yield* keyValueStore.get(key), undefined);
      }).pipe(Effect.provide(testLayer));
    })
);

it.effect(
  "rejects contended refresh locks and releases only the owner lease",
  () =>
    Effect.gen(function* testRefreshLockContentionAndOwnership() {
      const subject = yield* fixtureSubject;
      const input = yield* makeRefreshLockInput(subject);
      const lock = yield* CodexOAuthRefreshLock;
      const ownerLease = yield* lock.acquire(input);
      const contention = yield* lock.acquire(input).pipe(Effect.flip);
      const nonOwnerLease = yield* Schema.decodeUnknownEffect(
        CodexOAuthRefreshLockLease
      )({
        ...ownerLease,
        owner: "another-invocation",
      });
      const nonOwnerRelease = yield* lock
        .release(nonOwnerLease)
        .pipe(Effect.flip);

      assert.strictEqual(contention._tag, "CodexOAuthRefreshLockError");
      assert.strictEqual(contention.reason, "contended");
      assert.strictEqual(nonOwnerRelease._tag, "CodexOAuthRefreshLockError");
      assert.strictEqual(nonOwnerRelease.reason, "release");

      yield* lock.release(ownerLease);
      yield* lock.acquire(input).pipe(Effect.flatMap(lock.release));
    }).pipe(Effect.provide(CodexOAuthRefreshLockMemory))
);

it.effect("expires stale refresh locks before the next acquisition", () =>
  Effect.gen(function* testRefreshLockExpiry() {
    const subject = yield* fixtureSubject;
    const input = yield* makeRefreshLockInput(subject, 1);
    const lock = yield* CodexOAuthRefreshLock;
    const expiredLease = yield* lock.acquire(input);

    yield* TestClock.adjust("2 millis");

    const expiredRelease = yield* lock.release(expiredLease).pipe(Effect.flip);
    const nextLease = yield* lock.acquire(input);

    assert.strictEqual(expiredRelease._tag, "CodexOAuthRefreshLockError");
    assert.strictEqual(expiredRelease.reason, "expired");
    yield* lock.release(nextLease);
  }).pipe(Effect.provide(CodexOAuthRefreshLockMemory))
);

it.effect(
  "coordinates concurrent refresh programs so followers read the winner profile",
  () =>
    Effect.gen(function* testConcurrentRefreshCoordination() {
      const subject = yield* fixtureSubject;
      const expiredProfile = yield* makeImportProfile(subject, -1);
      const refreshedProfile = yield* makeImportProfile(
        subject,
        Date.now() + 60_000
      );
      const input = yield* makeRefreshLockInput(subject);
      const refreshStarted = yield* Deferred.make<null>();
      const allowRefresh = yield* Deferred.make<null>();
      let refreshCalls = 0;
      const coordinationLayer = Layer.merge(
        CodexProfileStoreMemory([expiredProfile]),
        CodexOAuthRefreshLockMemory
      );

      return yield* Effect.gen(function* coordinateRefreshes() {
        const winner = withCodexOAuthRefreshLock(
          input,
          Effect.gen(function* runSingleRefresh() {
            refreshCalls += 1;
            yield* Deferred.succeed(null)(refreshStarted);
            yield* Deferred.await(allowRefresh);
            yield* putProfile(refreshedProfile);

            return refreshedProfile.accessToken;
          })
        );
        const winnerFiber = yield* Effect.forkChild(winner);

        yield* Deferred.await(refreshStarted);

        const follower = yield* withCodexOAuthRefreshLock(
          input,
          Effect.void
        ).pipe(Effect.flip);

        assert.strictEqual(follower._tag, "CodexOAuthRefreshLockError");
        assert.strictEqual(follower.reason, "contended");

        yield* Deferred.succeed(null)(allowRefresh);
        yield* Fiber.join(winnerFiber);

        assert.strictEqual(refreshCalls, 1);
        assert.strictEqual(
          Redacted.value((yield* getProfile(subject)).accessToken),
          "access-token-secret"
        );
      }).pipe(Effect.provide(coordinationLayer));
    })
);

it.effect("uses memory layer seeding for profile reads", () =>
  Effect.gen(function* testMemorySeeding() {
    const subject = yield* fixtureSubject;
    const profile = yield* makeSubscriptionProfile(
      subject,
      Date.now() + 60_000
    );
    const stored = yield* getProfile(subject).pipe(
      Effect.provide(CodexProfileStoreMemory([profile]))
    );

    assert.strictEqual(
      Redacted.value(stored.accessToken),
      "access-token-secret"
    );
  })
);

it.effect(
  "fails getValidToken for expired profiles without leaking tokens",
  () =>
    Effect.gen(function* testExpiredToken() {
      const subject = yield* fixtureSubject;
      const profile = yield* makeSubscriptionProfile(subject, -1);
      const error = yield* getValidToken(subject).pipe(
        Effect.provide(CodexOAuthMemory([profile])),
        Effect.flip
      );
      const rendered = renderForLeakCheck(error);

      assert.strictEqual(error._tag, "CodexOAuthTokenExpired");
      assert.strictEqual(rendered.includes("access-token-secret"), false);
      assert.strictEqual(rendered.includes("refresh-token-secret"), false);
    })
);

it.effect(
  "removes a profile when revoke succeeds through the mock client",
  () =>
    Effect.gen(function* testRevokeRemovesProfile() {
      const subject = yield* fixtureSubject;
      const profile = yield* makeSubscriptionProfile(
        subject,
        Date.now() + 60_000
      );

      yield* Effect.gen(function* revokeAndReadBack() {
        yield* revokeToken(subject);

        const error = yield* getProfile(subject).pipe(Effect.flip);

        assert.strictEqual(error._tag, "OAuthProfileNotFound");
      }).pipe(Effect.provide(CodexOAuthMemory([profile])));
    })
);

it.effect("refreshes an access token through the mock client", () =>
  Effect.gen(function* testRefreshToken() {
    const subject = yield* fixtureSubject;
    const profile = yield* makeSubscriptionProfile(subject, -1);
    const refreshResult = yield* Schema.decodeUnknownEffect(
      CodexOAuthTokenRefreshResult
    )({
      subject,
      accessToken: "fresh-access-token-secret",
      refreshToken: "fresh-refresh-token-secret",
      expiresAtEpochMillis: Date.now() + 60_000,
      updatedAtEpochMillis: Date.now(),
    });

    const accessToken = yield* refreshAccessToken(subject).pipe(
      Effect.provide(CodexOAuthMemory([profile], { refreshResult }))
    );

    assert.strictEqual(
      Redacted.value(accessToken),
      "fresh-access-token-secret"
    );
  })
);

it.effect("maps KeyValueStore failures to safe storage errors", () =>
  Effect.gen(function* testStorageErrorMapping() {
    const subject = yield* fixtureSubject;
    const error = yield* getProfile(subject).pipe(
      Effect.provide(
        CodexProfileStoreKeyValueLive.pipe(Layer.provide(failingKeyValueStore))
      ),
      Effect.flip
    );

    assert.strictEqual(error._tag, "OAuthProfileStorageError");
    if (error._tag !== "OAuthProfileStorageError") {
      return;
    }
    assert.strictEqual(error.operation, "getProfile");
    assert.strictEqual(
      encodeUnknownJson(error).includes("access-token-secret"),
      false
    );
  })
);

it.effect(
  "encrypts and decrypts profiles through the versioned schema envelope without leaks",
  () =>
    Effect.gen(function* testEncryptedProfileRoundTrip() {
      const subject = yield* fixtureSubject;
      const profile = yield* makeSubscriptionProfile(
        subject,
        Date.now() + 60_000
      );
      const config = yield* makeCipherConfig();
      const encryptedProfile = yield* encryptCodexOAuthProfile(profile).pipe(
        Effect.provide(CodexOAuthProfileCipherTest(config))
      );
      const encodedEnvelope = yield* Schema.encodeEffect(
        Schema.fromJsonString(EncryptedCodexOAuthProfileV2)
      )(encryptedProfile);
      const decryptedProfile = yield* decryptCodexOAuthProfile(
        encryptedProfile
      ).pipe(Effect.provide(CodexOAuthProfileCipherTest(config)));

      assert.strictEqual(encryptedProfile.version, 2);
      assert.strictEqual(encryptedProfile.algorithm, "AES-GCM");
      assert.strictEqual(encryptedProfile.keyId, config.keyId);
      assert.notInclude(encodedEnvelope, "access-token-secret");
      assert.notInclude(encodedEnvelope, "refresh-token-secret");
      assert.notInclude(encodedEnvelope, "offline_access");
      assert.deepStrictEqual(decryptedProfile.subject, profile.subject);
      assert.deepStrictEqual(decryptedProfile.scopes, profile.scopes);
      assert.strictEqual(decryptedProfile.profileKind, "subscription");
      if (decryptedProfile.profileKind !== "subscription") {
        return;
      }
      assert.strictEqual(
        encodeUnknownJson(decryptedProfile.accessToken),
        '"<redacted>"'
      );
      assert.strictEqual(
        encodeUnknownJson(decryptedProfile.refreshToken),
        '"<redacted>"'
      );
    })
);

it.effect("fails decryption with a different encryption key", () =>
  Effect.gen(function* testWrongCipherKey() {
    const subject = yield* fixtureSubject;
    const profile = yield* makeSubscriptionProfile(
      subject,
      Date.now() + 60_000
    );
    const encryptingConfig = yield* makeCipherConfig();
    const decryptingConfig = yield* makeCipherConfig(
      "test-key-v1",
      alternateTestCipherKeyMaterial
    );
    const encryptedProfile = yield* encryptCodexOAuthProfile(profile).pipe(
      Effect.provide(CodexOAuthProfileCipherTest(encryptingConfig))
    );
    const error = yield* decryptCodexOAuthProfile(encryptedProfile).pipe(
      Effect.provide(CodexOAuthProfileCipherTest(decryptingConfig)),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexOAuthProfileCipherError");
    assert.strictEqual(error.operation, "decrypt");
    assert.notInclude(renderForLeakCheck(error), "access-token-secret");
    assert.notInclude(renderForLeakCheck(error), "refresh-token-secret");
  })
);

it.effect(
  "rejects encrypted profiles from another key id before decryption",
  () =>
    Effect.gen(function* testWrongCipherKeyId() {
      const subject = yield* fixtureSubject;
      const profile = yield* makeSubscriptionProfile(
        subject,
        Date.now() + 60_000
      );
      const encryptingConfig = yield* makeCipherConfig();
      const decryptingConfig = yield* makeCipherConfig("test-key-v2");
      const encryptedProfile = yield* encryptCodexOAuthProfile(profile).pipe(
        Effect.provide(CodexOAuthProfileCipherTest(encryptingConfig))
      );
      const error = yield* decryptCodexOAuthProfile(encryptedProfile).pipe(
        Effect.provide(CodexOAuthProfileCipherTest(decryptingConfig)),
        Effect.flip
      );

      assert.strictEqual(error._tag, "CodexOAuthProfileCipherError");
      assert.strictEqual(error.operation, "keyMismatch");
      assert.strictEqual(error.keyId, encryptingConfig.keyId);
    })
);

it.effect(
  "rejects malformed encrypted ciphertext without leaking profile payloads",
  () =>
    Effect.gen(function* testMalformedCiphertext() {
      const subject = yield* fixtureSubject;
      const profile = yield* makeSubscriptionProfile(
        subject,
        Date.now() + 60_000
      );
      const config = yield* makeCipherConfig();
      const encryptedProfile = yield* encryptCodexOAuthProfile(profile).pipe(
        Effect.provide(CodexOAuthProfileCipherTest(config))
      );
      const malformedProfile = yield* Schema.decodeUnknownEffect(
        EncryptedCodexOAuthProfile
      )({
        ...encryptedProfile,
        ciphertext: new Uint8Array([0]),
      });
      const error = yield* decryptCodexOAuthProfile(malformedProfile).pipe(
        Effect.provide(CodexOAuthProfileCipherTest(config)),
        Effect.flip
      );

      assert.strictEqual(error._tag, "CodexOAuthProfileCipherError");
      assert.strictEqual(error.operation, "decrypt");
      assert.notInclude(renderForLeakCheck(error), "access-token-secret");
      assert.notInclude(renderForLeakCheck(error), "refresh-token-secret");
    })
);

it.effect("rejects unsupported encrypted profile versions", () =>
  Effect.gen(function* testUnsupportedEncryptedProfileVersion() {
    const subject = yield* fixtureSubject;
    const profile = yield* makeSubscriptionProfile(
      subject,
      Date.now() + 60_000
    );
    const config = yield* makeCipherConfig();
    const encryptedProfile = yield* encryptCodexOAuthProfile(profile).pipe(
      Effect.provide(CodexOAuthProfileCipherTest(config))
    );
    const unsupportedProfile = yield* Schema.decodeUnknownEffect(
      EncryptedCodexOAuthProfile
    )({
      ...encryptedProfile,
      version: 3,
    });
    const error = yield* decryptCodexOAuthProfile(unsupportedProfile).pipe(
      Effect.provide(CodexOAuthProfileCipherTest(config)),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexOAuthProfileCipherError");
    assert.strictEqual(error.operation, "unsupportedVersion");
    assert.strictEqual(error.version, 3);
  })
);

it.effect("maps missing cipher config to a safe load-key error", () =>
  Effect.gen(function* testMissingCipherConfig() {
    const error = yield* loadCodexOAuthProfileCipherConfig.pipe(
      Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env: {} }))),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexOAuthProfileCipherError");
    assert.strictEqual(error.operation, "loadKey");
  })
);

it.effect(
  "uses the live config and WebCrypto layers with a schema-owned key",
  () =>
    Effect.gen(function* testLiveCipherLayer() {
      const subject = yield* fixtureSubject;
      const profile = yield* makeSubscriptionProfile(
        subject,
        Date.now() + 60_000
      );
      const encryptedProfile = yield* encryptCodexOAuthProfile(profile).pipe(
        Effect.provide(
          CodexOAuthProfileCipherLive.pipe(
            Layer.provide(
              CodexOAuthProfileCipherConfigLive.pipe(
                Layer.provide(
                  ConfigProvider.layer(
                    ConfigProvider.fromEnv({
                      env: {
                        BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY:
                          testCipherKeyMaterial,
                        BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID: "test-key-v1",
                      },
                    })
                  )
                )
              )
            )
          )
        )
      );

      assert.strictEqual(encryptedProfile.keyId, "test-key-v1");
    })
);

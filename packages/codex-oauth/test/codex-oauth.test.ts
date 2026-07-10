import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Redacted, Schema } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexOAuthProfile,
  CodexOAuthProfileCipherConfig,
  CodexOAuthSubject,
  CodexOAuthTokenRefreshResult,
  EncryptedCodexOAuthProfile,
  EncryptedCodexOAuthProfileV1,
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
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import {
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexProfileStoreKeyValueLive,
} from "../src/live.layer.js";
import {
  CodexOAuthMemory,
  CodexOAuthProfileCipherTest,
  CodexProfileStoreMemory,
} from "../src/mock.layer.js";

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
    const profile = yield* makeProfile(subject, Date.now() + 60_000);
    const encoded = yield* Schema.encodeEffect(CodexOAuthProfile)(profile);

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
      const profile = yield* makeProfile(subject, Date.now() + 60_000);

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

it.effect("uses memory layer seeding for profile reads", () =>
  Effect.gen(function* testMemorySeeding() {
    const subject = yield* fixtureSubject;
    const profile = yield* makeProfile(subject, Date.now() + 60_000);
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
      const profile = yield* makeProfile(subject, -1);
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
      const profile = yield* makeProfile(subject, Date.now() + 60_000);

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
    const profile = yield* makeProfile(subject, -1);
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
      const profile = yield* makeProfile(subject, Date.now() + 60_000);
      const config = yield* makeCipherConfig();
      const encryptedProfile = yield* encryptCodexOAuthProfile(profile).pipe(
        Effect.provide(CodexOAuthProfileCipherTest(config))
      );
      const encodedEnvelope = yield* Schema.encodeEffect(
        Schema.fromJsonString(EncryptedCodexOAuthProfileV1)
      )(encryptedProfile);
      const decryptedProfile = yield* decryptCodexOAuthProfile(
        encryptedProfile
      ).pipe(Effect.provide(CodexOAuthProfileCipherTest(config)));

      assert.strictEqual(encryptedProfile.version, 1);
      assert.strictEqual(encryptedProfile.algorithm, "AES-GCM");
      assert.strictEqual(encryptedProfile.keyId, config.keyId);
      assert.notInclude(encodedEnvelope, "access-token-secret");
      assert.notInclude(encodedEnvelope, "refresh-token-secret");
      assert.notInclude(encodedEnvelope, "offline_access");
      assert.deepStrictEqual(decryptedProfile.subject, profile.subject);
      assert.deepStrictEqual(decryptedProfile.scopes, profile.scopes);
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
    const profile = yield* makeProfile(subject, Date.now() + 60_000);
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
      const profile = yield* makeProfile(subject, Date.now() + 60_000);
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
      const profile = yield* makeProfile(subject, Date.now() + 60_000);
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
    const profile = yield* makeProfile(subject, Date.now() + 60_000);
    const config = yield* makeCipherConfig();
    const encryptedProfile = yield* encryptCodexOAuthProfile(profile).pipe(
      Effect.provide(CodexOAuthProfileCipherTest(config))
    );
    const unsupportedProfile = yield* Schema.decodeUnknownEffect(
      EncryptedCodexOAuthProfile
    )({
      ...encryptedProfile,
      version: 2,
    });
    const error = yield* decryptCodexOAuthProfile(unsupportedProfile).pipe(
      Effect.provide(CodexOAuthProfileCipherTest(config)),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexOAuthProfileCipherError");
    assert.strictEqual(error.operation, "unsupportedVersion");
    assert.strictEqual(error.version, 2);
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
      const profile = yield* makeProfile(subject, Date.now() + 60_000);
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

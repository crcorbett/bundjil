import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexLocalAuthCacheSource,
  CodexLocalAuthCacheSourceLive,
  CodexLocalAuthCacheSourceMemory,
} from "../src/local-auth-cache-source.service.js";
import { CodexLocalProfileImportConfigService } from "../src/local-profile-import.config.js";
import {
  CodexLocalProfileImportServiceLive,
  importCodexLocalProfile,
} from "../src/local-profile-import.service.js";
import { getProfile } from "../src/profile-store.service.js";
import { CodexProfileStoreEncryptedKeyValueLive } from "../src/runtime.js";
import {
  CodexLocalProfileImportConfig,
  CodexOAuthProfileCipherConfig,
} from "../src/schemas.js";
import { codexOAuthProfileStorageKey } from "../src/storage-keys.js";
import { CodexOAuthProfileCipherTest } from "../src/testing.js";

const fixtureAccessToken = "fixture-access-token";
const fixtureRefreshToken = "fixture-refresh-token";
const fixtureIdToken = "fixture-id-token";
const invalidLocalAuthFile = "/nonexistent/bundjil-codex-auth.json";

const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);

const renderForLeakCheck = (value: unknown) =>
  `${String(value)} ${encodeUnknownJson(value)}`;

const importConfig = Schema.decodeUnknownEffect(CodexLocalProfileImportConfig)({
  localAuthFile: "/fixture/codex-auth.json",
  subject: {
    provider: "codex",
    principal: {
      type: "chatgpt-user",
      id: "explicit-operator-subject",
      issuer: "https://auth.openai.com",
    },
    connectorId: "bundjil-local",
    installationId: "agent-preview",
    profileId: "default",
  },
  accessTokenTtlMillis: 60 * 60 * 1000,
});

const cipherConfig = Schema.decodeUnknownEffect(CodexOAuthProfileCipherConfig)({
  algorithm: "AES-GCM",
  keyId: "test-key-v1",
  keyMaterial: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
});

const validCache = {
  auth_mode: "chatgpt",
  last_refresh: "2099-01-01T00:00:00.000Z",
  tokens: {
    access_token: fixtureAccessToken,
    refresh_token: fixtureRefreshToken,
    id_token: fixtureIdToken,
    account_id: "cache-account-id-must-not-be-used",
  },
};

const importLayer = (cache: unknown) =>
  Effect.gen(function* makeImportLayer() {
    const config = yield* importConfig;
    const cipher = yield* cipherConfig;
    const encryptedStoreLayer = CodexProfileStoreEncryptedKeyValueLive.pipe(
      Layer.provideMerge(
        Layer.merge(
          CodexOAuthProfileCipherTest(cipher),
          KeyValueStore.layerMemory
        )
      )
    );

    return CodexLocalProfileImportServiceLive.pipe(
      Layer.provideMerge(
        Layer.mergeAll(
          Layer.succeed(
            CodexLocalProfileImportConfigService,
            CodexLocalProfileImportConfigService.of(config)
          ),
          CodexLocalAuthCacheSourceMemory(cache),
          encryptedStoreLayer
        )
      )
    );
  }).pipe(Effect.runSync);

it.effect(
  "imports an access-token-only profile through the encrypted store",
  () =>
    Effect.gen(function* testAccessTokenOnlyImport() {
      const config = yield* importConfig;
      const layer = importLayer(validCache);
      const { result, profile } = yield* Effect.gen(
        function* importAndReadProfile() {
          const result = yield* importCodexLocalProfile;
          const profile = yield* getProfile(config.subject);

          return { result, profile };
        }
      ).pipe(Effect.provide(layer));

      assert.deepStrictEqual(result, {
        profileId: "default",
        mode: "chatgpt",
        requiresReauthentication: true,
        expiryStatus: "valid",
        encryptedStore: "stored",
      });
      assert.strictEqual(
        Redacted.value(profile.accessToken),
        fixtureAccessToken
      );
      assert.strictEqual(profile.profileKind, "access-token-import");
      assert.strictEqual(profile.requiresReauthentication, true);
    })
);

it.effect(
  "does not persist refresh or ID tokens and returns sanitized metadata",
  () =>
    Effect.gen(function* testEncryptedProfileContent() {
      const config = yield* importConfig;
      const layer = importLayer(validCache);
      const encryptedValue = yield* Effect.gen(
        function* importAndReadCiphertext() {
          yield* importCodexLocalProfile;
          const keyValueStore = yield* KeyValueStore.KeyValueStore;
          const key = yield* codexOAuthProfileStorageKey(config.subject);

          return yield* keyValueStore.get(key);
        }
      ).pipe(Effect.provide(layer));

      if (encryptedValue === undefined) {
        assert.fail("Expected the encrypted profile to be stored.");
        return;
      }

      assert.notInclude(encryptedValue, fixtureAccessToken);
      assert.notInclude(encryptedValue, fixtureRefreshToken);
      assert.notInclude(encryptedValue, fixtureIdToken);
      assert.notInclude(
        encodeUnknownJson({
          profileId: "default",
          mode: "chatgpt",
          requiresReauthentication: true,
          expiryStatus: "valid",
          encryptedStore: "stored",
        }),
        fixtureAccessToken
      );
    })
);

it.effect(
  "rejects a cache without an access token without leaking cache values",
  () =>
    Effect.gen(function* testMissingAccessToken() {
      const error = yield* importCodexLocalProfile.pipe(
        Effect.provide(
          importLayer({
            ...validCache,
            tokens: {},
          })
        ),
        Effect.flip
      );

      assert.strictEqual(error._tag, "CodexLocalProfileImportError");
      if (error._tag !== "CodexLocalProfileImportError") {
        return;
      }
      assert.strictEqual(error.operation, "decodeCache");
      assert.notInclude(renderForLeakCheck(error), fixtureAccessToken);
    })
);

it.effect("rejects non-ChatGPT cache modes without leaking cache values", () =>
  Effect.gen(function* testWrongAuthMode() {
    const error = yield* importCodexLocalProfile.pipe(
      Effect.provide(
        importLayer({
          ...validCache,
          auth_mode: "api-key",
        })
      ),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexLocalProfileImportError");
    if (error._tag !== "CodexLocalProfileImportError") {
      return;
    }
    assert.strictEqual(error.operation, "decodeCache");
    assert.notInclude(renderForLeakCheck(error), fixtureAccessToken);
  })
);

it.effect("rejects malformed cache data without leaking cache values", () =>
  Effect.gen(function* testMalformedCache() {
    const error = yield* importCodexLocalProfile.pipe(
      Effect.provide(
        importLayer({
          ...validCache,
          last_refresh: "not-a-date",
        })
      ),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexLocalProfileImportError");
    if (error._tag !== "CodexLocalProfileImportError") {
      return;
    }
    assert.strictEqual(error.operation, "validateExpiry");
    assert.notInclude(renderForLeakCheck(error), fixtureAccessToken);
  })
);

it.effect("rejects an expired access token before storage", () =>
  Effect.gen(function* testExpiredCache() {
    const error = yield* importCodexLocalProfile.pipe(
      Effect.provide(
        importLayer({
          ...validCache,
          last_refresh: "1960-01-01T00:00:00.000Z",
        })
      ),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexLocalProfileImportError");
    if (error._tag !== "CodexLocalProfileImportError") {
      return;
    }
    assert.strictEqual(error.operation, "validateExpiry");
  })
);

it.effect("maps an invalid local cache path to a safe source error", () =>
  Effect.gen(function* testInvalidLocalCachePath() {
    const source = yield* CodexLocalAuthCacheSource;
    const error = yield* source.readCache().pipe(Effect.flip);

    assert.strictEqual(error._tag, "CodexLocalProfileImportError");
    assert.strictEqual(error.operation, "readCache");
    assert.notInclude(renderForLeakCheck(error), invalidLocalAuthFile);
  }).pipe(
    Effect.provide(
      CodexLocalAuthCacheSourceLive.pipe(
        Layer.provide(
          Layer.effect(
            CodexLocalProfileImportConfigService,
            importConfig.pipe(
              Effect.map((config) =>
                CodexLocalProfileImportConfigService.of({
                  ...config,
                  localAuthFile: invalidLocalAuthFile,
                })
              )
            )
          )
        )
      )
    )
  )
);

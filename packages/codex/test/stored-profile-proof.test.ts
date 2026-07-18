import { assert, it } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import { TestClock } from "effect/testing";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexOAuthProfileCipherConfig,
  CodexOAuthSubject,
  CodexStoredProfileProofResult,
  CodexSubscriptionProfile,
  EncryptedCodexOAuthProfile,
  codexOAuthProfileStorageKey,
  encryptCodexOAuthProfile,
  proveCodexStoredProfile,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import {
  CodexProfileStoreEncryptedKeyValueLive,
  CodexStoredProfileProofLive,
} from "../src/runtime.js";
import { CodexOAuthProfileCipherTest } from "../src/testing/index.js";

const fixtureSubject = Schema.decodeUnknownSync(CodexOAuthSubject)({
  provider: "codex",
  principal: {
    type: "chatgpt-user",
    id: "acct_proof_fixture",
    issuer: "https://auth.openai.com",
  },
  connectorId: "bundjil-local",
  installationId: "agent-dev",
  profileId: "default",
});

const fixtureCipherConfig = Schema.decodeUnknownSync(
  CodexOAuthProfileCipherConfig
)({
  algorithm: "AES-GCM",
  keyId: "proof-key-v1",
  keyMaterial: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
});

const makeSubscriptionProfile = (
  subject: CodexOAuthSubjectType,
  expiresAtEpochMillis = Date.now() + 60_000
) =>
  Schema.decodeUnknownEffect(CodexSubscriptionProfile)({
    profileVersion: 2,
    profileKind: "subscription",
    subject,
    accessToken: "proof-access-token-secret",
    refreshToken: "proof-refresh-token-secret",
    accountId: "acct_proof_fixture",
    protocolScopeVersion: "codex-cli-v1",
    expiresAtEpochMillis,
    scopes: ["openid", "offline_access"],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    lastRefreshedAtEpochMillis: 1_700_000_000_000,
    credentialRevision: "proof-revision",
    requiresReauthentication: false,
  });

const keyValueStoreLayer = KeyValueStore.layerMemory;
const cipherLayer = CodexOAuthProfileCipherTest(fixtureCipherConfig);
const profileStoreLayer = CodexProfileStoreEncryptedKeyValueLive.pipe(
  Layer.provideMerge(cipherLayer),
  Layer.provide(keyValueStoreLayer)
);
const proofLayer = CodexStoredProfileProofLive.pipe(
  Layer.provideMerge(profileStoreLayer),
  Layer.provide(keyValueStoreLayer)
);
const testLayer = Layer.mergeAll(proofLayer, cipherLayer, keyValueStoreLayer);

const encryptedProfileJson = Schema.fromJsonString(
  Schema.toCodecJson(EncryptedCodexOAuthProfile)
);
const leakedEncryptedProfileJson = Schema.fromJsonString(
  Schema.toCodecJson(
    EncryptedCodexOAuthProfile.mapFields((fields) => ({
      ...fields,
      accessToken: Schema.NonEmptyString,
    }))
  )
);

it.effect(
  "proves only sanitized properties of a stored subscription profile",
  () =>
    Effect.gen(function* testStoredSubscriptionProof() {
      const profile = yield* makeSubscriptionProfile(fixtureSubject);
      const encryptedProfile = yield* encryptCodexOAuthProfile(profile);
      const encodedEnvelope =
        yield* Schema.encodeEffect(encryptedProfileJson)(encryptedProfile);
      const key = yield* codexOAuthProfileStorageKey(fixtureSubject);
      const keyValueStore = yield* KeyValueStore.KeyValueStore;

      yield* keyValueStore.set(key, encodedEnvelope);

      const result = yield* proveCodexStoredProfile(fixtureSubject);
      const encodedResult = yield* Schema.encodeEffect(
        Schema.fromJsonString(CodexStoredProfileProofResult)
      )(result);

      assert.deepStrictEqual(result, {
        found: true,
        envelopeVersion2: true,
        ciphertextPresent: true,
        profileKindSubscription: true,
        refreshCapable: true,
        expiryValid: true,
        requiresReauthenticationFalse: true,
        markerLeakFalse: true,
      });
      assert.notInclude(encodedResult, "proof-access-token-secret");
      assert.notInclude(encodedResult, "proof-refresh-token-secret");
      assert.notInclude(encodedResult, "acct_proof_fixture");
      assert.notInclude(encodedResult, "subjectHash");
    }).pipe(Effect.provide(testLayer))
);

it.effect("detects a credential marker in the persisted encoded envelope", () =>
  Effect.gen(function* testPersistedMarkerLeak() {
    const profile = yield* makeSubscriptionProfile(fixtureSubject);
    const encryptedProfile = yield* encryptCodexOAuthProfile(profile);
    const encodedEnvelope = yield* Schema.encodeEffect(
      leakedEncryptedProfileJson
    )({
      ...encryptedProfile,
      accessToken: "persisted-marker-fixture",
    });
    const key = yield* codexOAuthProfileStorageKey(fixtureSubject);
    const keyValueStore = yield* KeyValueStore.KeyValueStore;

    yield* keyValueStore.set(key, encodedEnvelope);

    const result = yield* proveCodexStoredProfile(fixtureSubject);

    assert.strictEqual(result.found, true);
    assert.strictEqual(result.markerLeakFalse, false);
  }).pipe(Effect.provide(testLayer))
);

it.effect("returns a sanitized absent proof without deriving secret data", () =>
  Effect.gen(function* testMissingStoredProfileProof() {
    const result = yield* proveCodexStoredProfile(fixtureSubject);

    assert.deepStrictEqual(result, {
      found: false,
      envelopeVersion2: false,
      ciphertextPresent: false,
      profileKindSubscription: false,
      refreshCapable: false,
      expiryValid: false,
      requiresReauthenticationFalse: false,
      markerLeakFalse: true,
    });
  }).pipe(Effect.provide(testLayer))
);

it.effect(
  "reports expired subscription profiles without exposing metadata",
  () =>
    Effect.gen(function* testExpiredStoredProfileProof() {
      const profile = yield* makeSubscriptionProfile(fixtureSubject, 1);
      const encryptedProfile = yield* encryptCodexOAuthProfile(profile);
      const encodedEnvelope =
        yield* Schema.encodeEffect(encryptedProfileJson)(encryptedProfile);
      const key = yield* codexOAuthProfileStorageKey(fixtureSubject);
      const keyValueStore = yield* KeyValueStore.KeyValueStore;

      yield* keyValueStore.set(key, encodedEnvelope);
      yield* TestClock.adjust("2 millis");

      const result = yield* proveCodexStoredProfile(fixtureSubject);

      assert.strictEqual(result.found, true);
      assert.strictEqual(result.profileKindSubscription, true);
      assert.strictEqual(result.refreshCapable, true);
      assert.strictEqual(result.expiryValid, false);
      assert.strictEqual(result.markerLeakFalse, true);
    }).pipe(Effect.provide(testLayer))
);

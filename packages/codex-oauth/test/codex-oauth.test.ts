import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  CodexOAuthProfile,
  CodexOAuthSubject,
  CodexOAuthTokenRefreshResult,
  codexOAuthProfileStorageKey,
  getProfile,
  getValidToken,
  hasProfile,
  putProfile,
  removeProfile,
  refreshAccessToken,
  revokeToken,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import { CodexProfileStoreKeyValueLive } from "../src/live.layer.js";
import {
  CodexOAuthMemory,
  CodexProfileStoreMemory,
} from "../src/mock.layer.js";

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

    assert.strictEqual(JSON.stringify(profile.accessToken), '"<redacted>"');
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
      const rendered = `${String(error)} ${JSON.stringify(error)}`;

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
      JSON.stringify(error).includes("access-token-secret"),
      false
    );
  })
);

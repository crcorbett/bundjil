import { assert, it } from "@effect/vitest";
import { Data, Effect, Fiber, Redacted, Result, Schema } from "effect";

import {
  CodexOAuthObserverSnapshot,
  CodexAccessTokenImportProfile,
  CodexOAuthProfileCommit,
  CodexOAuthProfileCipherConfig,
  CodexOAuthSubject,
  CodexOAuthTokenRefreshResult,
  CodexSubscriptionProfile,
  EncryptedCodexOAuthProfile,
  completeLogin,
  decryptCodexOAuthProfile,
  encryptCodexOAuthProfile,
  getCodexOAuthObserverSnapshot,
  getProfile,
  putProfile,
  refreshAccessToken,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import {
  CodexOAuthMemory,
  CodexOAuthProfileCipherTest,
} from "../src/mock.layer.js";
import { codexOAuthProfileSubjectHash } from "../src/storage-keys.js";

const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);

const renderForLeakCheck = (value: unknown) =>
  `${String(value)} ${encodeUnknownJson(value)}`;

class TestCryptoError extends Data.TaggedError("TestCryptoError")<{
  readonly cause: unknown;
}> {}

const toArrayBuffer = (value: Uint8Array) => {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
};

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

const testCipherKeyMaterial = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

const makeCipherConfig = () =>
  Schema.decodeUnknownEffect(CodexOAuthProfileCipherConfig)({
    algorithm: "AES-GCM",
    keyId: "test-key-v1",
    keyMaterial: testCipherKeyMaterial,
  });

const makeSubscriptionProfile = (
  subject: CodexOAuthSubjectType,
  overrides: Partial<{
    accessToken: string;
    refreshToken: string;
    accountId: string;
    protocolScopeVersion: string;
    expiresAtEpochMillis: number;
    createdAtEpochMillis: number;
    updatedAtEpochMillis: number;
    lastRefreshedAtEpochMillis: number;
    credentialRevision: string;
    requiresReauthentication: boolean;
  }> = {}
) =>
  Schema.decodeUnknownEffect(CodexSubscriptionProfile)({
    profileVersion: 2,
    profileKind: "subscription",
    subject,
    accessToken: overrides.accessToken ?? "access-token-secret",
    refreshToken: overrides.refreshToken ?? "refresh-token-secret",
    accountId: overrides.accountId ?? "acct_123",
    protocolScopeVersion: overrides.protocolScopeVersion ?? "codex-cli-v1",
    expiresAtEpochMillis: overrides.expiresAtEpochMillis ?? 1_700_000_060_000,
    scopes: ["openid", "profile", "email", "offline_access"],
    createdAtEpochMillis: overrides.createdAtEpochMillis ?? 1_700_000_000_000,
    updatedAtEpochMillis: overrides.updatedAtEpochMillis ?? 1_700_000_000_000,
    lastRefreshedAtEpochMillis:
      overrides.lastRefreshedAtEpochMillis ?? 1_700_000_000_000,
    credentialRevision: overrides.credentialRevision ?? "rev-initial-secret",
    requiresReauthentication: overrides.requiresReauthentication ?? false,
  });

const makeAccessTokenImportProfile = (subject: CodexOAuthSubjectType) =>
  Schema.decodeUnknownEffect(CodexAccessTokenImportProfile)({
    profileVersion: 2,
    profileKind: "access-token-import",
    subject,
    accessToken: "legacy-access-token-secret",
    expiresAtEpochMillis: 1_700_000_060_000,
    scopes: [],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    requiresReauthentication: true,
  });

const makeLegacyEncryptedProfileV1 = (
  subject: CodexOAuthSubjectType,
  config: typeof CodexOAuthProfileCipherConfig.Type
) =>
  Effect.gen(function* makeLegacyEncryptedProfileV1Operation() {
    const plaintext = yield* Schema.encodeEffect(Schema.UnknownFromJsonString)({
      subject,
      accessToken: "legacy-access-token-secret",
      refreshToken: "legacy-refresh-token-secret",
      expiresAtEpochMillis: 1_700_000_060_000,
      scopes: ["offline_access"],
      createdAtEpochMillis: 1_700_000_000_000,
      updatedAtEpochMillis: 1_700_000_000_000,
      requiresReauthentication: true,
    });
    const nonce = new Uint8Array(12);
    const keyMaterial = yield* Schema.decodeUnknownEffect(
      Schema.Uint8ArrayFromBase64
    )(Redacted.value(config.keyMaterial));
    const key = yield* Effect.tryPromise({
      try: () =>
        globalThis.crypto.subtle.importKey(
          "raw",
          toArrayBuffer(keyMaterial),
          config.algorithm,
          false,
          ["encrypt"]
        ),
      catch: (cause) => new TestCryptoError({ cause }),
    });
    const ciphertext = yield* Effect.tryPromise({
      try: () =>
        globalThis.crypto.subtle.encrypt(
          {
            name: config.algorithm,
            iv: toArrayBuffer(nonce),
            tagLength: 128,
          },
          key,
          new TextEncoder().encode(plaintext)
        ),
      catch: (cause) => new TestCryptoError({ cause }),
    });
    const subjectHash = yield* codexOAuthProfileSubjectHash(subject);

    return yield* Schema.decodeUnknownEffect(EncryptedCodexOAuthProfile)({
      version: 1,
      algorithm: config.algorithm,
      keyId: config.keyId,
      nonce,
      ciphertext: new Uint8Array(ciphertext),
      subjectHash,
      createdAtEpochMillis: 1_700_000_000_000,
      updatedAtEpochMillis: 1_700_000_000_000,
    });
  });

const getCommit = CodexOAuthProfileCommit;

it.effect(
  "decodes encrypted V1 plaintext as legacy import and drops refresh token",
  () =>
    Effect.gen(function* testLegacyDecryptMigration() {
      const subject = yield* fixtureSubject;
      const config = yield* makeCipherConfig();
      const encryptedProfile = yield* makeLegacyEncryptedProfileV1(
        subject,
        config
      );
      const decryptedProfile = yield* decryptCodexOAuthProfile(
        encryptedProfile
      ).pipe(Effect.provide(CodexOAuthProfileCipherTest(config)));

      assert.strictEqual(decryptedProfile.profileKind, "access-token-import");
      assert.strictEqual(
        Redacted.value(decryptedProfile.accessToken),
        "legacy-access-token-secret"
      );
      assert.strictEqual("refreshToken" in decryptedProfile, false);
    })
);

it.effect(
  "rejects subscription profiles that omit required hosted fields",
  () =>
    Effect.gen(function* testSubscriptionRequiredFields() {
      const subject = yield* fixtureSubject;
      const error = yield* Schema.decodeUnknownEffect(CodexSubscriptionProfile)(
        {
          profileVersion: 2,
          profileKind: "subscription",
          subject,
          accessToken: "access-token-secret",
          expiresAtEpochMillis: 1_700_000_060_000,
          scopes: ["offline_access"],
          createdAtEpochMillis: 1_700_000_000_000,
          updatedAtEpochMillis: 1_700_000_000_000,
          requiresReauthentication: false,
        }
      ).pipe(Effect.flip);

      assert.strictEqual(error._tag, "SchemaError");
    })
);

it.effect("round-trips encrypted V2 subscription envelopes", () =>
  Effect.gen(function* testSubscriptionRoundTrip() {
    const subject = yield* fixtureSubject;
    const config = yield* makeCipherConfig();
    const profile = yield* makeSubscriptionProfile(subject, {
      accessToken: "roundtrip-access-token-secret",
      refreshToken: "roundtrip-refresh-token-secret",
      accountId: "acct-roundtrip-secret",
      credentialRevision: "rev-roundtrip-secret",
    });
    const encryptedProfile = yield* encryptCodexOAuthProfile(profile).pipe(
      Effect.provide(CodexOAuthProfileCipherTest(config))
    );
    const decryptedProfile = yield* decryptCodexOAuthProfile(
      encryptedProfile
    ).pipe(Effect.provide(CodexOAuthProfileCipherTest(config)));

    assert.strictEqual(decryptedProfile.profileKind, "subscription");
    if (decryptedProfile.profileKind !== "subscription") {
      return;
    }
    assert.strictEqual(
      Redacted.value(decryptedProfile.refreshToken),
      "roundtrip-refresh-token-secret"
    );
    assert.strictEqual(
      Redacted.value(decryptedProfile.accountId),
      "acct-roundtrip-secret"
    );
    assert.strictEqual(
      decryptedProfile.credentialRevision,
      "rev-roundtrip-secret"
    );
  })
);

it.effect("stores subscription logins through fenced initial write", () =>
  Effect.gen(function* testCompleteLoginUsesCommit() {
    const subject = yield* fixtureSubject;
    const loginProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-login-secret",
    });
    const layer = CodexOAuthMemory([], {
      loginProfile,
    });

    return yield* Effect.gen(function* completeAndReadBack() {
      yield* completeLogin({
        code: Redacted.make("code-secret"),
        state: Redacted.make("state-secret"),
        redirectUri: "http://localhost/callback",
      });

      const storedProfile = yield* getProfile(subject);

      assert.strictEqual(storedProfile.profileKind, "subscription");
    }).pipe(Effect.provide(layer));
  })
);

it.effect("rejects raw putProfile for subscription mutations", () =>
  Effect.gen(function* testRawPutRejected() {
    const subject = yield* fixtureSubject;
    const profile = yield* makeSubscriptionProfile(subject);
    const error = yield* putProfile(profile).pipe(
      Effect.provide(CodexOAuthMemory()),
      Effect.flip
    );

    assert.strictEqual(error._tag, "OAuthProfileStorageError");
    if (error._tag !== "OAuthProfileStorageError") {
      return;
    }
    assert.strictEqual(error.operation, "putLegacyProfile");
  })
);

it.effect("commits initial write only when the profile is absent", () =>
  Effect.gen(function* testInitialWriteOnlyAbsent() {
    const subject = yield* fixtureSubject;
    const initialProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-initial-write-secret",
    });
    const duplicateProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-duplicate-secret",
    });
    const commit = yield* getCommit;

    yield* commit.initialWrite(initialProfile);

    const conflict = yield* commit
      .initialWrite(duplicateProfile)
      .pipe(Effect.flip);
    const storedProfile = yield* getProfile(subject);
    const renderedConflict = renderForLeakCheck(conflict);

    assert.strictEqual(conflict._tag, "CodexOAuthProfileCommitConflict");
    assert.strictEqual(
      renderedConflict.includes("rev-initial-write-secret"),
      false
    );
    assert.strictEqual(
      renderedConflict.includes("rev-duplicate-secret"),
      false
    );
    assert.strictEqual(storedProfile.profileKind, "subscription");
    if (storedProfile.profileKind !== "subscription") {
      return;
    }
    assert.strictEqual(
      storedProfile.credentialRevision,
      "rev-initial-write-secret"
    );
  }).pipe(Effect.provide(CodexOAuthMemory()))
);

it.effect(
  "atomically migrates one legacy profile and preserves the concurrent winner",
  () =>
    Effect.gen(function* testLegacyReplacementFence() {
      const subject = yield* fixtureSubject;
      const legacyProfile = yield* makeAccessTokenImportProfile(subject);
      const first = yield* makeSubscriptionProfile(subject, {
        credentialRevision: "rev-legacy-first-secret",
      });
      const second = yield* makeSubscriptionProfile(subject, {
        credentialRevision: "rev-legacy-second-secret",
      });
      const layer = CodexOAuthMemory([legacyProfile]);

      return yield* Effect.gen(function* migrateLegacyProfile() {
        const commit = yield* CodexOAuthProfileCommit;
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
      }).pipe(Effect.provide(layer));
    })
);

it.effect("applies matching replacement and refresh commits", () =>
  Effect.gen(function* testReplacementAndRefresh() {
    const subject = yield* fixtureSubject;
    const initialProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-before-secret",
    });
    const replacementProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-replaced-secret",
      accessToken: "replaced-access-token-secret",
      refreshToken: "replaced-refresh-token-secret",
    });
    const refreshedProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-refreshed-secret",
      accessToken: "fresh-access-token-secret",
      refreshToken: "fresh-refresh-token-secret",
      updatedAtEpochMillis: 1_700_000_010_000,
      lastRefreshedAtEpochMillis: 1_700_000_010_000,
    });
    const commit = yield* getCommit;

    yield* commit.initialWrite(initialProfile);
    yield* commit.replace({
      profile: replacementProfile,
      expectedRevision: initialProfile.credentialRevision,
    });
    yield* commit.refresh({
      profile: refreshedProfile,
      expectedRevision: replacementProfile.credentialRevision,
    });

    const storedProfile = yield* getProfile(subject);

    assert.strictEqual(storedProfile.profileKind, "subscription");
    if (storedProfile.profileKind !== "subscription") {
      return;
    }
    assert.strictEqual(
      storedProfile.credentialRevision,
      "rev-refreshed-secret"
    );
    assert.strictEqual(
      Redacted.value(storedProfile.accessToken),
      "fresh-access-token-secret"
    );
  }).pipe(Effect.provide(CodexOAuthMemory()))
);

it.effect(
  "rejects stale refresh commits and preserves the winner profile",
  () =>
    Effect.gen(function* testStaleRefreshRejected() {
      const subject = yield* fixtureSubject;
      const initialProfile = yield* makeSubscriptionProfile(subject, {
        credentialRevision: "rev-start-secret",
      });
      const winnerProfile = yield* makeSubscriptionProfile(subject, {
        credentialRevision: "rev-winner-secret",
        accessToken: "winner-access-token-secret",
      });
      const staleRefreshProfile = yield* makeSubscriptionProfile(subject, {
        credentialRevision: "rev-stale-refresh-secret",
        accessToken: "stale-access-token-secret",
      });
      const commit = yield* getCommit;

      yield* commit.initialWrite(initialProfile);
      yield* commit.replace({
        profile: winnerProfile,
        expectedRevision: initialProfile.credentialRevision,
      });

      const conflict = yield* commit
        .refresh({
          profile: staleRefreshProfile,
          expectedRevision: initialProfile.credentialRevision,
        })
        .pipe(Effect.flip);
      const storedProfile = yield* getProfile(subject);

      assert.strictEqual(conflict._tag, "CodexOAuthProfileCommitConflict");
      assert.strictEqual(storedProfile.profileKind, "subscription");
      if (storedProfile.profileKind !== "subscription") {
        return;
      }
      assert.strictEqual(storedProfile.credentialRevision, "rev-winner-secret");
      assert.strictEqual(
        Redacted.value(storedProfile.accessToken),
        "winner-access-token-secret"
      );
    }).pipe(Effect.provide(CodexOAuthMemory()))
);

it.effect("rejects delayed stale workers after a newer revision wins", () =>
  Effect.gen(function* testDelayedStaleWorkerConflict() {
    const subject = yield* fixtureSubject;
    const initialProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-delay-start-secret",
    });
    const winnerProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-delay-winner-secret",
    });
    const delayedWorkerProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-delay-stale-secret",
    });
    const commit = yield* getCommit;

    yield* commit.initialWrite(initialProfile);
    yield* commit.replace({
      profile: winnerProfile,
      expectedRevision: initialProfile.credentialRevision,
    });

    const conflict = yield* commit
      .replace({
        profile: delayedWorkerProfile,
        expectedRevision: initialProfile.credentialRevision,
      })
      .pipe(Effect.flip);

    assert.strictEqual(conflict._tag, "CodexOAuthProfileCommitConflict");
  }).pipe(Effect.provide(CodexOAuthMemory()))
);

it.effect("allows only one concurrent replacement winner", () =>
  Effect.gen(function* testConcurrentReplacementWinner() {
    const subject = yield* fixtureSubject;
    const initialProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-race-start-secret",
    });
    const leftProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-race-left-secret",
      accessToken: "left-access-token-secret",
    });
    const rightProfile = yield* makeSubscriptionProfile(subject, {
      credentialRevision: "rev-race-right-secret",
      accessToken: "right-access-token-secret",
    });
    const commit = yield* getCommit;

    yield* commit.initialWrite(initialProfile);

    const leftFiber = yield* Effect.forkChild(
      commit
        .replace({
          profile: leftProfile,
          expectedRevision: initialProfile.credentialRevision,
        })
        .pipe(Effect.exit)
    );
    const rightFiber = yield* Effect.forkChild(
      commit
        .replace({
          profile: rightProfile,
          expectedRevision: initialProfile.credentialRevision,
        })
        .pipe(Effect.exit)
    );
    const leftResult = yield* Fiber.join(leftFiber);
    const rightResult = yield* Fiber.join(rightFiber);
    const storedProfile = yield* getProfile(subject);

    assert.notStrictEqual(leftResult._tag, rightResult._tag);
    assert.strictEqual(storedProfile.profileKind, "subscription");
    if (storedProfile.profileKind !== "subscription") {
      return;
    }
    assert.include(
      ["rev-race-left-secret", "rev-race-right-secret"],
      storedProfile.credentialRevision
    );
  }).pipe(Effect.provide(CodexOAuthMemory()))
);

it.effect(
  "rejects stale reauthentication marking and keeps the winner revision",
  () =>
    Effect.gen(function* testStaleReauthenticationRejected() {
      const subject = yield* fixtureSubject;
      const initialProfile = yield* makeSubscriptionProfile(subject, {
        credentialRevision: "rev-reauth-start-secret",
      });
      const winnerProfile = yield* makeSubscriptionProfile(subject, {
        credentialRevision: "rev-reauth-winner-secret",
        requiresReauthentication: false,
      });
      const staleReauthenticationProfile = yield* makeSubscriptionProfile(
        subject,
        {
          credentialRevision: "rev-reauth-stale-secret",
          requiresReauthentication: true,
        }
      );
      const commit = yield* getCommit;

      yield* commit.initialWrite(initialProfile);
      yield* commit.replace({
        profile: winnerProfile,
        expectedRevision: initialProfile.credentialRevision,
      });

      const conflict = yield* commit
        .markReauthenticationRequired({
          profile: staleReauthenticationProfile,
          expectedRevision: initialProfile.credentialRevision,
        })
        .pipe(Effect.flip);
      const storedProfile = yield* getProfile(subject);

      assert.strictEqual(conflict._tag, "CodexOAuthProfileCommitConflict");
      assert.strictEqual(storedProfile.profileKind, "subscription");
      if (storedProfile.profileKind !== "subscription") {
        return;
      }
      assert.strictEqual(
        storedProfile.credentialRevision,
        "rev-reauth-winner-secret"
      );
      assert.strictEqual(storedProfile.requiresReauthentication, false);
    }).pipe(Effect.provide(CodexOAuthMemory()))
);

it.effect(
  "records sanitized observer counters and events without leaking credentials",
  () =>
    Effect.gen(function* testObserverRedaction() {
      const subject = yield* fixtureSubject;
      const profile = yield* makeSubscriptionProfile(subject, {
        accessToken: "observer-access-token-secret",
        refreshToken: "observer-refresh-token-secret",
        accountId: "acct-observer-secret",
        credentialRevision: "rev-observer-secret",
        expiresAtEpochMillis: -1,
      });
      const refreshResult = yield* Schema.decodeUnknownEffect(
        CodexOAuthTokenRefreshResult
      )({
        subject,
        accessToken: "observer-fresh-access-token-secret",
        refreshToken: "observer-fresh-refresh-token-secret",
        accountId: "acct-observer-secret",
        expiresAtEpochMillis: Date.now() + 60_000,
        updatedAtEpochMillis: 1_700_000_020_000,
      });
      const layer = CodexOAuthMemory([profile], { refreshResult });

      return yield* Effect.gen(function* observeRefreshAndCommit() {
        yield* refreshAccessToken(subject);

        const commit = yield* getCommit;
        const refreshedProfile = yield* getProfile(subject);

        if (refreshedProfile.profileKind !== "subscription") {
          return;
        }

        const reauthenticationProfile = yield* makeSubscriptionProfile(
          subject,
          {
            accessToken: "reauth-access-token-secret",
            refreshToken: "reauth-refresh-token-secret",
            accountId: "acct-reauth-secret",
            credentialRevision: "rev-reauth-success-secret",
            requiresReauthentication: true,
            updatedAtEpochMillis: refreshedProfile.updatedAtEpochMillis + 1,
            lastRefreshedAtEpochMillis:
              refreshedProfile.lastRefreshedAtEpochMillis,
          }
        );

        yield* commit.markReauthenticationRequired({
          profile: reauthenticationProfile,
          expectedRevision: refreshedProfile.credentialRevision,
        });

        const snapshot = yield* getCodexOAuthObserverSnapshot;
        const encodedSnapshot = renderForLeakCheck(
          Schema.encodeUnknownSync(CodexOAuthObserverSnapshot)(snapshot)
        );

        assert.strictEqual(snapshot.counters.refreshStarted, 1);
        assert.strictEqual(snapshot.counters.refreshSucceeded, 1);
        assert.strictEqual(snapshot.counters.reauthenticationMarked, 1);
        assert.strictEqual(encodedSnapshot.includes("accessToken"), false);
        assert.strictEqual(encodedSnapshot.includes("refreshToken"), false);
        assert.strictEqual(encodedSnapshot.includes("accountId"), false);
        assert.strictEqual(
          encodedSnapshot.includes("credentialRevision"),
          false
        );
        assert.strictEqual(
          encodedSnapshot.includes("observer-access-token-secret"),
          false
        );
        assert.strictEqual(
          encodedSnapshot.includes("acct-observer-secret"),
          false
        );
        assert.strictEqual(
          encodedSnapshot.includes("rev-observer-secret"),
          false
        );
      }).pipe(Effect.provide(layer));
    })
);

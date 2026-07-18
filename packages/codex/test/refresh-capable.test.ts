import { assert, it } from "@effect/vitest";
import { Deferred, Effect, Fiber, Layer, Redacted, Schema } from "effect";
import { TestClock } from "effect/testing";

import {
  CodexDirectProviderInput,
  CodexHttpStatusError,
  CodexOAuthClient,
  CodexOAuthCredentialRevision,
  CodexOAuthRefreshLockTtlMillis,
  CodexOAuthRefreshPolicyService,
  CodexOAuthSubject,
  CodexOAuthTokenRefreshResult,
  CodexResponsesStreamResult,
  CodexSubscriptionAuthError,
  CodexSubscriptionProfile,
  CodexAccessTokenImportProfile,
  getProfile,
  getCodexOAuthObserverSnapshot,
  getValidCredential,
  recoverAfterUnauthorized,
  streamChatCompletion,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import {
  CodexDirectProviderLive,
  CodexOAuthRefreshClientLive,
} from "../src/runtime.js";
import {
  CodexHttpClientMock,
  CodexOAuthHttpClientMock,
  CodexOAuthMemory,
} from "../src/testing.js";

const subject = Schema.decodeUnknownEffect(CodexOAuthSubject)({
  provider: "codex",
  principal: {
    type: "chatgpt-user",
    id: "personal",
    issuer: "https://auth.openai.com",
  },
  connectorId: "bundjil-codex-proxy",
  installationId: "preview",
  profileId: "default",
});

const makeProfile = (
  value: CodexOAuthSubjectType,
  overrides: Partial<{
    accessToken: string;
    refreshToken: string;
    accountId: string;
    expiresAtEpochMillis: number;
    credentialRevision: string;
    requiresReauthentication: boolean;
  }> = {}
) =>
  Schema.decodeUnknownEffect(CodexSubscriptionProfile)({
    profileVersion: 2,
    profileKind: "subscription",
    subject: value,
    accessToken: overrides.accessToken ?? "access-token-old-secret",
    refreshToken: overrides.refreshToken ?? "refresh-token-old-secret",
    expiresAtEpochMillis:
      overrides.expiresAtEpochMillis ?? Date.now() + 3_600_000,
    accountId: overrides.accountId ?? "account-personal-secret",
    protocolScopeVersion: "codex-cli-rs-v1",
    scopes: ["openid", "offline_access"],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    lastRefreshedAtEpochMillis: 1_700_000_000_000,
    credentialRevision: overrides.credentialRevision ?? "revision-old-secret",
    requiresReauthentication: overrides.requiresReauthentication ?? false,
  });

const makeRefreshResult = (
  value: CodexOAuthSubjectType,
  overrides: Partial<{
    accessToken: string;
    refreshToken: string;
    accountId: string;
    expiresAtEpochMillis: number;
  }> = {}
) =>
  Schema.decodeUnknownEffect(CodexOAuthTokenRefreshResult)({
    subject: value,
    accessToken: overrides.accessToken ?? "access-token-new-secret",
    ...(overrides.refreshToken === undefined
      ? {}
      : { refreshToken: overrides.refreshToken }),
    ...(overrides.accountId === undefined
      ? {}
      : { accountId: overrides.accountId }),
    expiresAtEpochMillis:
      overrides.expiresAtEpochMillis ?? Date.now() + 3_600_000,
    updatedAtEpochMillis: Date.now(),
  });

it.effect(
  "returns one atomic credential without refreshing a valid profile",
  () =>
    Effect.gen(function* testValidCredentialBypass() {
      const value = yield* subject;
      const profile = yield* makeProfile(value);
      let refreshCalls = 0;
      const credential = yield* getValidCredential(value).pipe(
        Effect.provide(
          CodexOAuthMemory([profile], {
            refresh: () => {
              refreshCalls += 1;
              return makeRefreshResult(value).pipe(Effect.orDie);
            },
          })
        )
      );

      assert.strictEqual(refreshCalls, 0);
      assert.strictEqual(
        Redacted.value(credential.accessToken),
        "access-token-old-secret"
      );
      assert.strictEqual(
        Redacted.value(credential.accountId),
        "account-personal-secret"
      );
      assert.strictEqual(credential.credentialRevision, "revision-old-secret");
    })
);

it.effect("proactively refreshes inside skew and commits rotated fields", () =>
  Effect.gen(function* testProactiveRefresh() {
    const value = yield* subject;
    const profile = yield* makeProfile(value, {
      expiresAtEpochMillis: 60_000,
    });
    const refreshResult = yield* makeRefreshResult(value, {
      refreshToken: "refresh-token-rotated-secret",
      accountId: "account-personal-secret",
    });
    const layer = CodexOAuthMemory(
      [profile],
      { refreshResult },
      {
        refreshSkewMillis: 300_000,
        lockTtlMillis: Schema.decodeUnknownSync(CodexOAuthRefreshLockTtlMillis)(
          5000
        ),
      }
    );

    return yield* Effect.gen(function* refreshAndReadBack() {
      const policy = yield* CodexOAuthRefreshPolicyService;
      const credential = yield* getValidCredential(value);
      const stored = yield* getProfile(value);
      const observer = yield* getCodexOAuthObserverSnapshot;

      assert.strictEqual(policy.refreshSkewMillis, 300_000);
      assert.strictEqual(observer.counters.refreshConflict, 0);
      assert.strictEqual(
        Redacted.value(credential.accessToken),
        "access-token-new-secret"
      );
      assert.notStrictEqual(
        credential.credentialRevision,
        "revision-old-secret"
      );
      assert.strictEqual(stored.profileKind, "subscription");
      if (stored.profileKind === "subscription") {
        assert.strictEqual(
          Redacted.value(stored.refreshToken),
          "refresh-token-rotated-secret"
        );
      }
    }).pipe(Effect.provide(layer));
  })
);

it.effect(
  "waits for a contended refresh winner before returning a credential",
  () =>
    Effect.gen(function* testContendedRefreshWinnerWait() {
      const value = yield* subject;
      const profile = yield* makeProfile(value, {
        expiresAtEpochMillis: 0,
      });
      const refreshResult = yield* makeRefreshResult(value);
      const refreshStarted = yield* Deferred.make<null>();
      let refreshCalls = 0;
      const layer = CodexOAuthMemory(
        [profile],
        {
          refresh: () => {
            refreshCalls += 1;

            return Deferred.succeed(refreshStarted, null).pipe(
              Effect.andThen(Effect.sleep("10 millis")),
              Effect.as(refreshResult)
            );
          },
        },
        {
          refreshSkewMillis: 300_000,
          lockTtlMillis: Schema.decodeUnknownSync(
            CodexOAuthRefreshLockTtlMillis
          )(5000),
        }
      );

      return yield* Effect.gen(function* readWinnerAndFollower() {
        const fiber = yield* Effect.forkChild(
          Effect.all([getValidCredential(value), getValidCredential(value)], {
            concurrency: "unbounded",
          })
        );
        yield* Deferred.await(refreshStarted);
        yield* Effect.yieldNow;
        yield* TestClock.adjust("1 second");
        const [winner, follower] = yield* Fiber.join(fiber);
        const observer = yield* getCodexOAuthObserverSnapshot;

        assert.strictEqual(refreshCalls, 1);
        assert.strictEqual(
          winner.credentialRevision,
          follower.credentialRevision
        );
        assert.strictEqual(observer.counters.refreshSucceeded, 1);
        assert.strictEqual(observer.counters.refreshWinnerUsed, 1);
      }).pipe(Effect.provide(layer));
    })
);

it.effect(
  "retains refresh token and account when optional fields are omitted",
  () =>
    Effect.gen(function* testOptionalRefreshFields() {
      const value = yield* subject;
      const profile = yield* makeProfile(value, { expiresAtEpochMillis: -1 });
      const refreshResult = yield* makeRefreshResult(value);
      const layer = CodexOAuthMemory([profile], { refreshResult });

      return yield* Effect.gen(function* refreshAndReadBack() {
        const credential = yield* getValidCredential(value);
        const stored = yield* getProfile(value);

        assert.strictEqual(
          Redacted.value(credential.accountId),
          "account-personal-secret"
        );
        assert.strictEqual(stored.profileKind, "subscription");
        if (stored.profileKind === "subscription") {
          assert.strictEqual(
            Redacted.value(stored.refreshToken),
            "refresh-token-old-secret"
          );
        }
      }).pipe(Effect.provide(layer));
    })
);

it.effect(
  "rejects cross-account refresh metadata without mutating the profile",
  () =>
    Effect.gen(function* testCrossAccountRefresh() {
      const value = yield* subject;
      const profile = yield* makeProfile(value, { expiresAtEpochMillis: -1 });
      const refreshResult = yield* makeRefreshResult(value, {
        accountId: "account-other-secret",
      });
      const layer = CodexOAuthMemory([profile], { refreshResult });

      return yield* Effect.gen(function* rejectAndReadBack() {
        const error = yield* getValidCredential(value).pipe(Effect.flip);
        const stored = yield* getProfile(value);

        assert.strictEqual(error._tag, "CodexOAuthReauthenticationRequired");
        assert.strictEqual(stored.profileKind, "subscription");
        if (stored.profileKind === "subscription") {
          assert.strictEqual(stored.credentialRevision, "revision-old-secret");
          assert.strictEqual(stored.requiresReauthentication, false);
        }
      }).pipe(Effect.provide(layer));
    })
);

it.effect(
  "leaves the profile unchanged after a transient refresh failure",
  () =>
    Effect.gen(function* testTransientRefreshFailure() {
      const value = yield* subject;
      const profile = yield* makeProfile(value, { expiresAtEpochMillis: -1 });
      const layer = CodexOAuthMemory([profile], {
        refresh: () =>
          Effect.fail(
            new CodexSubscriptionAuthError({
              operation: "refreshToken",
              reason: "transportFailure",
              message: "Sanitized transport failure.",
            })
          ),
      });

      return yield* Effect.gen(function* rejectAndReadBack() {
        const error = yield* getValidCredential(value).pipe(Effect.flip);
        const stored = yield* getProfile(value);

        assert.strictEqual(error._tag, "CodexOAuthAuthTemporarilyUnavailable");
        assert.strictEqual(stored.profileKind, "subscription");
        if (stored.profileKind === "subscription") {
          assert.strictEqual(stored.credentialRevision, "revision-old-secret");
          assert.strictEqual(stored.requiresReauthentication, false);
        }
      }).pipe(Effect.provide(layer));
    })
);

it.effect(
  "classifies timeout, rate-limit, and provider 5xx without mutation",
  () =>
    Effect.gen(function* testTransientClassifications() {
      const value = yield* subject;
      const profile = yield* makeProfile(value, { expiresAtEpochMillis: -1 });
      const failures = [
        new CodexSubscriptionAuthError({
          operation: "refreshToken",
          reason: "timeout",
          message: "Sanitized timeout.",
        }),
        new CodexSubscriptionAuthError({
          operation: "refreshToken",
          reason: "providerRejected",
          status: 429,
          message: "Sanitized rate limit.",
        }),
        new CodexSubscriptionAuthError({
          operation: "refreshToken",
          reason: "providerRejected",
          status: 503,
          message: "Sanitized provider failure.",
        }),
      ];

      yield* Effect.forEach((failure: CodexSubscriptionAuthError) =>
        Effect.gen(function* classifyAndReadBack() {
          const layer = CodexOAuthMemory([profile], {
            refresh: () => Effect.fail(failure),
          });

          return yield* Effect.gen(function* runClassification() {
            const error = yield* getValidCredential(value).pipe(Effect.flip);
            const stored = yield* getProfile(value);

            assert.strictEqual(
              error._tag,
              "CodexOAuthAuthTemporarilyUnavailable"
            );
            assert.strictEqual(stored.profileKind, "subscription");
            if (stored.profileKind === "subscription") {
              assert.strictEqual(
                stored.credentialRevision,
                "revision-old-secret"
              );
              assert.strictEqual(stored.requiresReauthentication, false);
            }
          }).pipe(Effect.provide(layer));
        })
      )(failures);
    })
);

it.effect("fenced-marks reauthentication after a permanent invalid grant", () =>
  Effect.gen(function* testPermanentRefreshFailure() {
    const value = yield* subject;
    const profile = yield* makeProfile(value, { expiresAtEpochMillis: -1 });
    const layer = CodexOAuthMemory([profile], {
      refresh: () =>
        Effect.fail(
          new CodexSubscriptionAuthError({
            operation: "refreshToken",
            reason: "providerRejected",
            providerCode: "invalid_grant",
            status: 400,
            message: "Sanitized provider rejection.",
          })
        ),
    });

    return yield* Effect.gen(function* markAndReadBack() {
      const error = yield* getValidCredential(value).pipe(Effect.flip);
      const stored = yield* getProfile(value);

      assert.strictEqual(error._tag, "CodexOAuthReauthenticationRequired");
      assert.strictEqual(stored.profileKind, "subscription");
      if (stored.profileKind === "subscription") {
        assert.notStrictEqual(stored.credentialRevision, "revision-old-secret");
        assert.strictEqual(stored.requiresReauthentication, true);
      }
    }).pipe(Effect.provide(layer));
  })
);

it.effect("rejects an expired refreshed access token without mutation", () =>
  Effect.gen(function* testExpiredRefreshResult() {
    const value = yield* subject;
    const profile = yield* makeProfile(value, { expiresAtEpochMillis: -1 });
    const refreshResult = yield* makeRefreshResult(value, {
      expiresAtEpochMillis: -1,
    });
    const layer = CodexOAuthMemory([profile], { refreshResult });

    return yield* Effect.gen(function* rejectAndReadBack() {
      const error = yield* getValidCredential(value).pipe(Effect.flip);
      const stored = yield* getProfile(value);

      assert.strictEqual(error._tag, "CodexOAuthReauthenticationRequired");
      assert.strictEqual(stored.profileKind, "subscription");
      if (stored.profileKind === "subscription") {
        assert.strictEqual(stored.credentialRevision, "revision-old-secret");
      }
    }).pipe(Effect.provide(layer));
  })
);

it.effect("rejects malformed refreshed token metadata without mutation", () =>
  Effect.gen(function* testMalformedRefreshMetadata() {
    const value = yield* subject;
    const profile = yield* makeProfile(value, { expiresAtEpochMillis: -1 });
    const layer = CodexOAuthMemory([profile], {
      refresh: () =>
        Effect.fail(
          new CodexSubscriptionAuthError({
            operation: "decodeTokenMetadata",
            reason: "tokenMetadataInvalid",
            message: "Sanitized token metadata failure.",
          })
        ),
    });

    return yield* Effect.gen(function* rejectAndReadBack() {
      const error = yield* getValidCredential(value).pipe(Effect.flip);
      const stored = yield* getProfile(value);

      assert.strictEqual(error._tag, "CodexOAuthReauthenticationRequired");
      assert.strictEqual(stored.profileKind, "subscription");
      if (stored.profileKind === "subscription") {
        assert.strictEqual(stored.credentialRevision, "revision-old-secret");
        assert.strictEqual(stored.requiresReauthentication, false);
      }
    }).pipe(Effect.provide(layer));
  })
);

it.effect("refuses legacy access-import profiles in refresh-capable mode", () =>
  Effect.gen(function* testLegacyRefusal() {
    const value = yield* subject;
    const legacy = yield* Schema.decodeUnknownEffect(
      CodexAccessTokenImportProfile
    )({
      profileVersion: 2,
      profileKind: "access-token-import",
      subject: value,
      accessToken: "legacy-access-token-secret",
      expiresAtEpochMillis: Date.now() + 60_000,
      scopes: [],
      createdAtEpochMillis: 1,
      updatedAtEpochMillis: 1,
      requiresReauthentication: true,
    });
    const error = yield* getValidCredential(value).pipe(
      Effect.provide(CodexOAuthMemory([legacy])),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexOAuthReauthenticationRequired");
  })
);

it.effect("uses a newer stored winner for a rejected older revision", () =>
  Effect.gen(function* testUnauthorizedWinner() {
    const value = yield* subject;
    const profile = yield* makeProfile(value, {
      credentialRevision: "revision-winner-secret",
    });
    let refreshCalls = 0;
    const credential = yield* recoverAfterUnauthorized({
      subject: value,
      observedCredentialRevision: Schema.decodeUnknownSync(
        CodexOAuthCredentialRevision
      )("revision-rejected-secret"),
    }).pipe(
      Effect.provide(
        CodexOAuthMemory([profile], {
          refresh: () => {
            refreshCalls += 1;
            return makeRefreshResult(value).pipe(Effect.orDie);
          },
        })
      )
    );

    assert.strictEqual(refreshCalls, 0);
    assert.strictEqual(credential.credentialRevision, "revision-winner-secret");
  })
);

it.effect("forces one refresh for the exact rejected revision", () =>
  Effect.gen(function* testForcedUnauthorizedRefresh() {
    const value = yield* subject;
    const profile = yield* makeProfile(value);
    const refreshResult = yield* makeRefreshResult(value);
    const credential = yield* recoverAfterUnauthorized({
      subject: value,
      observedCredentialRevision: profile.credentialRevision,
    }).pipe(Effect.provide(CodexOAuthMemory([profile], { refreshResult })));

    assert.strictEqual(
      Redacted.value(credential.accessToken),
      "access-token-new-secret"
    );
    assert.notStrictEqual(
      credential.credentialRevision,
      profile.credentialRevision
    );
  })
);

it.effect("rejects omitted and malformed refreshed access tokens", () =>
  Effect.gen(function* testRefreshTransportValidation() {
    const value = yield* subject;
    const omittedLayer = CodexOAuthRefreshClientLive.pipe(
      Layer.provide(
        CodexOAuthHttpClientMock({
          refresh: () => Effect.succeed({}),
        })
      )
    );
    const omitted = yield* Effect.gen(function* runOmittedRefresh() {
      const client = yield* CodexOAuthClient;
      return yield* client
        .refresh({ subject: value, refreshToken: Redacted.make("refresh") })
        .pipe(Effect.flip);
    }).pipe(Effect.provide(omittedLayer));
    const malformedLayer = CodexOAuthRefreshClientLive.pipe(
      Layer.provide(
        CodexOAuthHttpClientMock({
          refresh: () =>
            Effect.succeed({ access_token: Redacted.make("not-a-jwt") }),
        })
      )
    );
    const malformed = yield* Effect.gen(function* runMalformedRefresh() {
      const client = yield* CodexOAuthClient;
      return yield* client
        .refresh({ subject: value, refreshToken: Redacted.make("refresh") })
        .pipe(Effect.flip);
    }).pipe(Effect.provide(malformedLayer));

    assert.strictEqual(omitted._tag, "CodexSubscriptionAuthError");
    assert.strictEqual(malformed._tag, "CodexSubscriptionAuthError");
  })
);

const makeProviderInput = (value: CodexOAuthSubjectType) =>
  Schema.decodeUnknownEffect(CodexDirectProviderInput)({
    subject: value,
    request: {
      model: "gpt-5.5",
      messages: [{ role: "user", content: "Say OK." }],
      stream: true,
    },
  });

const successfulStream = Schema.decodeUnknownEffect(CodexResponsesStreamResult)(
  {
    status: 200,
    contentType: "text/event-stream",
    body: 'data: {"type":"response.completed"}\n',
  }
);

it.effect("replays exactly once after a 401 and succeeds", () =>
  Effect.gen(function* testSingleReplay() {
    const value = yield* subject;
    const profile = yield* makeProfile(value);
    const refreshResult = yield* makeRefreshResult(value);
    const input = yield* makeProviderInput(value);
    const success = yield* successfulStream;
    let requests = 0;
    const provider = CodexDirectProviderLive.pipe(
      Layer.provide(CodexOAuthMemory([profile], { refreshResult })),
      Layer.provide(
        CodexHttpClientMock({
          postResponsesStreamEffect: () => {
            requests += 1;
            return requests === 1
              ? Effect.fail(
                  new CodexHttpStatusError({
                    operation: "postResponsesStream",
                    status: 401,
                    statusText: "Unauthorized",
                    contentType: "application/json",
                    message: "Sanitized provider rejection.",
                  })
                )
              : Effect.succeed(success);
          },
        })
      )
    );

    yield* streamChatCompletion(input).pipe(Effect.provide(provider));
    assert.strictEqual(requests, 2);
  })
);

it.effect("stops after the second 401", () =>
  Effect.gen(function* testSecondUnauthorizedStop() {
    const value = yield* subject;
    const profile = yield* makeProfile(value);
    const refreshResult = yield* makeRefreshResult(value);
    const input = yield* makeProviderInput(value);
    let requests = 0;
    const provider = CodexDirectProviderLive.pipe(
      Layer.provide(CodexOAuthMemory([profile], { refreshResult })),
      Layer.provide(
        CodexHttpClientMock({
          postResponsesStreamEffect: () => {
            requests += 1;
            return Effect.fail(
              new CodexHttpStatusError({
                operation: "postResponsesStream",
                status: 401,
                statusText: "Unauthorized",
                contentType: "application/json",
                message: "Sanitized provider rejection.",
              })
            );
          },
        })
      )
    );
    const error = yield* streamChatCompletion(input).pipe(
      Effect.provide(provider),
      Effect.flip
    );

    assert.strictEqual(requests, 2);
    assert.strictEqual(error._tag, "CodexOAuthReauthenticationRequired");
  })
);

it.effect("does not replay unrelated upstream failures", () =>
  Effect.gen(function* testNoUnrelatedReplay() {
    const value = yield* subject;
    const profile = yield* makeProfile(value);
    const input = yield* makeProviderInput(value);
    let requests = 0;
    const provider = CodexDirectProviderLive.pipe(
      Layer.provide(CodexOAuthMemory([profile])),
      Layer.provide(
        CodexHttpClientMock({
          postResponsesStreamEffect: () => {
            requests += 1;
            return Effect.fail(
              new CodexHttpStatusError({
                operation: "postResponsesStream",
                status: 500,
                statusText: "Unavailable",
                contentType: "application/json",
                message: "Sanitized provider failure.",
              })
            );
          },
        })
      )
    );
    const error = yield* streamChatCompletion(input).pipe(
      Effect.provide(provider),
      Effect.flip
    );

    assert.strictEqual(requests, 1);
    assert.strictEqual(error._tag, "CodexHttpStatusError");
  })
);

import { assert, it } from "@effect/vitest";
import {
  Deferred,
  Effect,
  Fiber,
  Layer,
  Redacted,
  Ref,
  Result,
  Schema,
} from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  HttpServer,
} from "effect/unstable/http";

import {
  CodexAccessTokenImportProfile,
  CodexLoopbackCallback,
  CodexOAuthHttpClient,
  CodexOAuthProviderErrorResponse,
  CodexOAuthSubject,
  CodexSubscriptionAuthError,
  CodexSubscriptionProfile,
  buildCodexOAuthAuthorizationSession,
  bindFirstAvailableCodexCallbackPort,
  CodexSubscriptionAuthProtocolConfigService,
  createCodexOAuthAuthorizationMaterial,
  decodeCodexAccessTokenExpiry,
  decodeCodexAccountMetadata,
  decodeCodexOAuthCallbackRequest,
  ensureCodexRefreshAccount,
  getProfile,
  runCodexSubscriptionLogin,
} from "../src/index.js";
import type {
  CodexOAuthAccountMetadataType,
  CodexOAuthAuthorizationCallbackType,
  CodexOAuthAuthorizationUrlType,
  CodexOAuthHttpClientShape,
  CodexOAuthProfileType,
  CodexOAuthSubjectType,
} from "../src/index.js";
import {
  CodexOAuthHttpClientLive,
  CodexSubscriptionAuthProtocolConfigLive,
  CodexSubscriptionLoginLive,
} from "../src/live.layer.js";
import {
  CodexBrowserLauncherMemory,
  CodexLoopbackCallbackMemory,
  CodexOAuthHttpClientMock,
  CodexOAuthMemory,
} from "../src/mock.layer.js";

const fixtureSubject = Schema.decodeUnknownEffect(CodexOAuthSubject)({
  provider: "codex",
  principal: {
    type: "chatgpt-user",
    id: "personal-owner",
    issuer: "https://auth.openai.com",
  },
  connectorId: "bundjil-local",
  installationId: "agent-dev",
  profileId: "default",
});

const encodeJwt = (claims: unknown) =>
  Effect.gen(function* encodeTestJwt() {
    const json = yield* Schema.encodeEffect(Schema.UnknownFromJsonString)(
      claims
    );
    const payload = yield* Schema.encodeEffect(Schema.Uint8ArrayFromBase64Url)(
      new TextEncoder().encode(json)
    );

    return `header.${payload}.signature`;
  });

const makeTokens = Effect.gen(function* makeTestTokens() {
  const accessToken = yield* encodeJwt({ exp: 2_000_000_000 });
  const idToken = yield* encodeJwt({
    "https://api.openai.com/auth": {
      chatgpt_account_id: "account-personal",
    },
  });

  return { accessToken, idToken };
});

const makeExistingProfile = (
  subject: CodexOAuthSubjectType,
  credentialRevision: string
) =>
  Schema.decodeUnknownEffect(CodexSubscriptionProfile)({
    profileVersion: 2,
    profileKind: "subscription",
    subject,
    accessToken: "old-access-token",
    refreshToken: "old-refresh-token",
    expiresAtEpochMillis: 1_900_000_000_000,
    accountId: "account-personal",
    protocolScopeVersion: "codex-cli-rs-v1",
    scopes: ["openid", "offline_access"],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    lastRefreshedAtEpochMillis: 1_700_000_000_000,
    credentialRevision,
    requiresReauthentication: false,
  });

const makeLegacyProfile = (subject: CodexOAuthSubjectType) =>
  Schema.decodeUnknownEffect(CodexAccessTokenImportProfile)({
    profileVersion: 2,
    profileKind: "access-token-import",
    subject,
    accessToken: "legacy-access-token-secret",
    expiresAtEpochMillis: 1_900_000_000_000,
    scopes: [],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    requiresReauthentication: true,
  });

const makeLoginLayer = (
  options: {
    readonly profiles?: readonly CodexOAuthProfileType[];
    readonly callback?: Effect.Effect<
      CodexOAuthAuthorizationCallbackType,
      CodexSubscriptionAuthError
    >;
    readonly browser?: (
      url: CodexOAuthAuthorizationUrlType
    ) => Effect.Effect<void, CodexSubscriptionAuthError>;
    readonly exchangeAuthorizationCode?: CodexOAuthHttpClientShape["exchangeAuthorizationCode"];
    readonly onAcquire?: Effect.Effect<void>;
    readonly onRelease?: Effect.Effect<void>;
  } = {}
) =>
  Effect.gen(function* makeTestLoginLayer() {
    const tokens = yield* makeTokens;
    const material = yield* createCodexOAuthAuthorizationMaterial();
    const callback =
      options.callback ??
      Effect.succeed({
        code: Redacted.make("authorization-code-secret"),
        state: material.state,
        redirectUri: "http://localhost:1455/auth/callback",
      });
    const dependencies = Layer.mergeAll(
      CodexOAuthMemory(options.profiles ?? []),
      CodexSubscriptionAuthProtocolConfigLive,
      CodexLoopbackCallbackMemory({
        callback,
        ...(options.onAcquire === undefined
          ? {}
          : { onAcquire: options.onAcquire }),
        ...(options.onRelease === undefined
          ? {}
          : { onRelease: options.onRelease }),
      }),
      CodexBrowserLauncherMemory(options.browser),
      CodexOAuthHttpClientMock({
        exchangeAuthorizationCode:
          options.exchangeAuthorizationCode ??
          (() =>
            Effect.succeed({
              access_token: Redacted.make(tokens.accessToken),
              id_token: Redacted.make(tokens.idToken),
              refresh_token: Redacted.make("refresh-token-secret"),
            })),
      })
    );

    return CodexSubscriptionLoginLive.pipe(Layer.provideMerge(dependencies));
  });

it.effect(
  "builds the official authorization URL with PKCE and fresh state",
  () =>
    Effect.gen(function* testAuthorizationSession() {
      const first = yield* createCodexOAuthAuthorizationMaterial();
      const second = yield* createCodexOAuthAuthorizationMaterial();
      const session = yield* buildCodexOAuthAuthorizationSession(
        first,
        "http://localhost:1455/auth/callback"
      );
      const url = new URL(Redacted.value(session.authorizationUrl));

      assert.strictEqual(url.origin, "https://auth.openai.com");
      assert.strictEqual(url.pathname, "/oauth/authorize");
      assert.strictEqual(url.searchParams.get("response_type"), "code");
      assert.strictEqual(
        url.searchParams.get("client_id"),
        "app_EMoamEEZ73f0CkXaXp7hrann"
      );
      assert.strictEqual(url.searchParams.get("code_challenge_method"), "S256");
      assert.strictEqual(
        url.searchParams.get("code_challenge"),
        first.codeChallenge
      );
      const independentDigest = yield* Effect.promise(() =>
        globalThis.crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(Redacted.value(first.codeVerifier))
        )
      );
      const independentChallenge = yield* Schema.encodeEffect(
        Schema.Uint8ArrayFromBase64Url
      )(new Uint8Array(independentDigest));
      assert.strictEqual(first.codeChallenge, independentChallenge);
      assert.strictEqual(url.searchParams.get("originator"), "codex_cli_rs");
      assert.strictEqual(
        url.searchParams.get("scope"),
        "openid profile email offline_access api.connectors.read api.connectors.invoke"
      );
      assert.notStrictEqual(
        Redacted.value(first.state),
        Redacted.value(second.state)
      );
      assert.strictEqual(Redacted.value(first.state).length >= 43, true);
      const protocol = yield* CodexSubscriptionAuthProtocolConfigService;
      assert.deepStrictEqual(protocol.config.callbackPorts, [1455, 1457]);
    }).pipe(Effect.provide(CodexSubscriptionAuthProtocolConfigLive))
);

it.effect(
  "validates callback method, path, denial, missing code, and state",
  () =>
    Effect.gen(function* testCallbackValidation() {
      const expected = Redacted.make("expected-state");
      const cases = [
        [new Request("http://localhost:1455/wrong"), "invalidCallback"],
        [
          new Request(
            "http://localhost:1455/auth/callback?code=secret&state=expected-state",
            { method: "POST" }
          ),
          "invalidCallback",
        ],
        [
          new Request(
            "http://localhost:1455/auth/callback?error=access_denied"
          ),
          "authorizationDenied",
        ],
        [
          new Request(
            "http://localhost:1455/auth/callback?state=expected-state"
          ),
          "missingCode",
        ],
        [
          new Request(
            "http://localhost:1455/auth/callback?code=secret&state=wrong"
          ),
          "stateMismatch",
        ],
      ] as const;

      for (const [request, reason] of cases) {
        const error = yield* decodeCodexOAuthCallbackRequest(
          request.method,
          request.url,
          expected,
          "http://localhost:1455/auth/callback"
        ).pipe(Effect.flip);
        assert.strictEqual(error.reason, reason);
        assert.strictEqual(String(error).includes(request.url), false);
      }

      const callback = yield* decodeCodexOAuthCallbackRequest(
        "GET",
        "http://localhost:1455/auth/callback?code=authorization-code&state=expected-state",
        expected,
        "http://localhost:1455/auth/callback"
      );
      assert.strictEqual(Redacted.value(callback.code), "authorization-code");
      assert.strictEqual(Redacted.value(callback.state), "expected-state");
    })
);

it.effect(
  "selects 1457 after a 1455 conflict and reports total port conflict",
  () =>
    Effect.gen(function* testPortSelection() {
      const attempts = yield* Ref.make<readonly number[]>([]);
      const selected = yield* bindFirstAvailableCodexCallbackPort(
        [1455, 1457],
        (port) =>
          Ref.update(attempts, (values) => [...values, port]).pipe(
            Effect.flatMap(() =>
              port === 1455
                ? Effect.fail(
                    new CodexSubscriptionAuthError({
                      operation: "bindCallback",
                      reason: "portConflict",
                      message: "Test preferred-port conflict.",
                    })
                  )
                : Effect.succeed({
                    port,
                    server: HttpServer.make({
                      address: {
                        _tag: "TcpAddress",
                        hostname: "127.0.0.1",
                        port,
                      },
                      serve: () => Effect.void,
                    }),
                  })
            )
          )
      );
      assert.strictEqual(selected.port, 1457);
      assert.deepStrictEqual(yield* Ref.get(attempts), [1455, 1457]);

      const conflict = yield* bindFirstAvailableCodexCallbackPort(
        [1455, 1457],
        () =>
          Effect.fail(
            new CodexSubscriptionAuthError({
              operation: "bindCallback",
              reason: "portConflict",
              message: "Test port conflict.",
            })
          )
      ).pipe(Effect.flip);
      assert.strictEqual(conflict.reason, "portConflict");

      const unexpectedAttempts = yield* Ref.make(0);
      const unexpected = yield* bindFirstAvailableCodexCallbackPort(
        [1455, 1457],
        () =>
          Ref.update(unexpectedAttempts, (count) => count + 1).pipe(
            Effect.flatMap(() =>
              Effect.fail(
                new CodexSubscriptionAuthError({
                  operation: "bindCallback",
                  reason: "cryptoFailure",
                  message: "Test unexpected bind failure.",
                })
              )
            )
          )
      ).pipe(Effect.flip);
      assert.strictEqual(unexpected.reason, "cryptoFailure");
      assert.strictEqual(yield* Ref.get(unexpectedAttempts), 1);
    })
);

it.effect("decodes JWT expiry and canonical account metadata", () =>
  Effect.gen(function* testJwtMetadata() {
    const tokens = yield* makeTokens;
    const expiry = yield* decodeCodexAccessTokenExpiry(
      Redacted.make(tokens.accessToken)
    );
    const account = yield* decodeCodexAccountMetadata(
      Redacted.make(tokens.idToken)
    );

    assert.strictEqual(expiry.expiresAtEpochMillis, 2_000_000_000_000);
    assert.strictEqual(Redacted.value(account.accountId), "account-personal");

    const malformed = yield* decodeCodexAccessTokenExpiry(
      Redacted.make("not-a-jwt")
    ).pipe(Effect.flip);
    assert.strictEqual(malformed.reason, "tokenMetadataInvalid");
    const malformedIdToken = yield* decodeCodexAccountMetadata(
      Redacted.make(yield* encodeJwt({ email: "owner@example.test" }))
    ).pipe(Effect.flip);
    assert.strictEqual(malformedIdToken.reason, "tokenMetadataInvalid");
  })
);

it.effect("rejects cross-account refresh metadata", () =>
  Effect.gen(function* testCrossAccount() {
    const expected = yield* Schema.decodeUnknownEffect(
      Schema.Struct({
        accountId: Schema.RedactedFromValue(Schema.NonEmptyString),
      })
    )({ accountId: "account-a" });
    const received = yield* Schema.decodeUnknownEffect(
      Schema.Struct({
        accountId: Schema.RedactedFromValue(Schema.NonEmptyString),
      })
    )({ accountId: "account-b" });
    const error = yield* ensureCodexRefreshAccount(
      expected satisfies CodexOAuthAccountMetadataType,
      received satisfies CodexOAuthAccountMetadataType
    ).pipe(Effect.flip);

    assert.strictEqual(error.reason, "crossAccountRefresh");
  })
);

it.effect("uses form encoding for exchange and JSON for refresh", () =>
  Effect.gen(function* testHttpTransports() {
    const bodies = yield* Ref.make<readonly string[]>([]);
    const contentTypes = yield* Ref.make<readonly string[]>([]);
    const testClient = HttpClient.make((request) =>
      Effect.gen(function* captureRequest() {
        const webRequest = yield* HttpClientRequest.toWeb(request).pipe(
          Effect.orDie
        );
        const body = yield* Effect.promise(() => webRequest.text());
        yield* Ref.update(bodies, (values) => [...values, body]);
        yield* Ref.update(contentTypes, (values) => [
          ...values,
          webRequest.headers.get("content-type") ?? "",
        ]);
        const responseBody = body.includes("authorization_code")
          ? '{"id_token":"id","access_token":"access","refresh_token":"refresh"}'
          : '{"access_token":"rotated"}';

        return HttpClientResponse.fromWeb(
          request,
          new Response(responseBody, {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        );
      })
    );
    const layer = CodexOAuthHttpClientLive.pipe(
      Layer.provideMerge(
        Layer.merge(
          Layer.succeed(HttpClient.HttpClient, testClient),
          CodexSubscriptionAuthProtocolConfigLive
        )
      )
    );
    return yield* Effect.gen(function* executeHttpOperations() {
      const client = yield* CodexOAuthHttpClient;

      yield* client.exchangeAuthorizationCode({
        code: Redacted.make("code secret"),
        codeVerifier: Redacted.make("verifier secret"),
        redirectUri: "http://localhost:1455/auth/callback",
      });
      yield* client.refresh({ refreshToken: Redacted.make("refresh secret") });

      const capturedBodies = yield* Ref.get(bodies);
      const capturedTypes = yield* Ref.get(contentTypes);
      assert.strictEqual(
        capturedTypes[0]?.startsWith("application/x-www-form-urlencoded"),
        true
      );
      assert.strictEqual(
        capturedBodies[0]?.includes("grant_type=authorization_code"),
        true
      );
      assert.strictEqual(capturedBodies[0]?.includes("code=code+secret"), true);
      assert.strictEqual(capturedTypes[1], "application/json");
      assert.strictEqual(
        capturedBodies[1]?.includes('"grant_type":"refresh_token"'),
        true
      );
    }).pipe(Effect.provide(layer));
  })
);

it.effect(
  "decodes and sanitizes schema-valid and malformed provider errors",
  () =>
    Effect.gen(function* testProviderErrorResponses() {
      const validProviderError = Schema.encodeSync(
        Schema.fromJsonString(CodexOAuthProviderErrorResponse)
      )({
        error: "invalid_grant",
        error_description: "provider-secret-description",
      });
      const makeErrorLayer = (body: string) => {
        const client = HttpClient.make((request) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              request,
              new Response(body, {
                status: 400,
                headers: { "content-type": "application/json" },
              })
            )
          )
        );

        return CodexOAuthHttpClientLive.pipe(
          Layer.provideMerge(
            Layer.merge(
              Layer.succeed(HttpClient.HttpClient, client),
              CodexSubscriptionAuthProtocolConfigLive
            )
          )
        );
      };
      const exchangeError = yield* Effect.gen(function* rejectExchange() {
        const client = yield* CodexOAuthHttpClient;

        return yield* client
          .exchangeAuthorizationCode({
            code: Redacted.make("code-secret"),
            codeVerifier: Redacted.make("verifier-secret"),
            redirectUri: "http://localhost:1455/auth/callback",
          })
          .pipe(Effect.flip);
      }).pipe(Effect.provide(makeErrorLayer(validProviderError)));
      const refreshError = yield* Effect.gen(function* rejectRefresh() {
        const client = yield* CodexOAuthHttpClient;

        return yield* client
          .refresh({ refreshToken: Redacted.make("refresh-secret") })
          .pipe(Effect.flip);
      }).pipe(Effect.provide(makeErrorLayer("not-json")));

      assert.strictEqual(exchangeError.reason, "providerRejected");
      assert.strictEqual(refreshError.reason, "tokenResponseInvalid");
      assert.strictEqual(
        String(exchangeError).includes("provider-secret-description"),
        false
      );
    })
);

it.effect(
  "performs an initial fenced save without persisting the ID token",
  () =>
    Effect.gen(function* testInitialLogin() {
      const subject = yield* fixtureSubject;
      const layer = yield* makeLoginLayer();

      return yield* Effect.gen(function* executeInitialLogin() {
        const result = yield* runCodexSubscriptionLogin({
          subject,
          callbackTimeoutMillis: 100,
        });
        const profile = yield* getProfile(subject);
        const encodedResult = Schema.encodeSync(
          Schema.fromJsonString(Schema.Unknown)
        )(result);

        assert.strictEqual(result.refreshCapable, true);
        assert.strictEqual(profile.profileKind, "subscription");
        assert.strictEqual("idToken" in profile, false);
        assert.strictEqual(encodedResult.includes("account-personal"), false);
        assert.strictEqual(
          encodedResult.includes("refresh-token-secret"),
          false
        );
        assert.strictEqual(
          encodedResult.includes("authorization-code-secret"),
          false
        );
      }).pipe(Effect.provide(layer));
    })
);

it.effect("rejects an already expired exchanged access token", () =>
  Effect.gen(function* testExpiredExchange() {
    const subject = yield* fixtureSubject;
    const expiredAccessToken = yield* encodeJwt({ exp: 0 });
    const idToken = yield* encodeJwt({
      "https://api.openai.com/auth": {
        chatgpt_account_id: "account-personal",
      },
    });
    const layer = yield* makeLoginLayer({
      exchangeAuthorizationCode: () =>
        Effect.succeed({
          access_token: Redacted.make(expiredAccessToken),
          id_token: Redacted.make(idToken),
          refresh_token: Redacted.make("refresh-token-secret"),
        }),
    });
    const error = yield* runCodexSubscriptionLogin({
      subject,
      callbackTimeoutMillis: 100,
    }).pipe(Effect.provide(layer), Effect.flip);

    assert.strictEqual(error._tag, "CodexSubscriptionAuthError");
    if (error._tag === "CodexSubscriptionAuthError") {
      assert.strictEqual(error.reason, "tokenExpired");
    }
  })
);

it.effect("replaces the observed revision and rejects a stale login", () =>
  Effect.gen(function* testReplacement() {
    const subject = yield* fixtureSubject;
    const existing = yield* makeExistingProfile(subject, "revision-existing");
    const layer = yield* makeLoginLayer({ profiles: [existing] });

    return yield* Effect.gen(function* executeReplacementLogin() {
      yield* runCodexSubscriptionLogin({
        subject,
        callbackTimeoutMillis: 100,
      });
      const profile = yield* getProfile(subject);

      assert.strictEqual(profile.profileKind, "subscription");
      if (profile.profileKind === "subscription") {
        assert.notStrictEqual(profile.credentialRevision, "revision-existing");
      }
    }).pipe(Effect.provide(layer));
  })
);

it.effect(
  "migrates an access-token import to a fenced subscription profile",
  () =>
    Effect.gen(function* testLegacyLoginMigration() {
      const subject = yield* fixtureSubject;
      const legacy = yield* makeLegacyProfile(subject);
      const layer = yield* makeLoginLayer({ profiles: [legacy] });

      return yield* Effect.gen(function* executeLegacyLoginMigration() {
        yield* runCodexSubscriptionLogin({
          subject,
          callbackTimeoutMillis: 100,
        });
        const profile = yield* getProfile(subject);

        assert.strictEqual(profile.profileKind, "subscription");
        if (profile.profileKind === "subscription") {
          assert.strictEqual(profile.requiresReauthentication, false);
        }
      }).pipe(Effect.provide(layer));
    })
);

it.effect("allows one concurrent replacement and rejects the stale login", () =>
  Effect.gen(function* testStaleConcurrentLogin() {
    const subject = yield* fixtureSubject;
    const existing = yield* makeExistingProfile(subject, "revision-shared");
    const arrived = yield* Ref.make(0);
    const gate = yield* Deferred.make<null>();
    const layer = yield* makeLoginLayer({
      profiles: [existing],
      browser: () =>
        Ref.updateAndGet(arrived, (count) => count + 1).pipe(
          Effect.tap((count) =>
            count === 2 ? Deferred.succeed(gate, null) : Effect.void
          ),
          Effect.flatMap(() => Deferred.await(gate))
        ),
    });
    const login = runCodexSubscriptionLogin({
      subject,
      callbackTimeoutMillis: 100,
    });
    const results = yield* Effect.all(
      [Effect.result(login), Effect.result(login)],
      { concurrency: "unbounded" }
    ).pipe(Effect.provide(layer));
    const failures = results.filter(Result.isFailure);
    const successes = results.filter(Result.isSuccess);

    assert.strictEqual(successes.length, 1);
    assert.strictEqual(failures.length, 1);
    assert.strictEqual(
      failures[0]?.failure._tag,
      "CodexOAuthProfileCommitConflict"
    );
  })
);

it.effect("preserves the first concurrent legacy-login migration winner", () =>
  Effect.gen(function* testConcurrentLegacyLoginMigration() {
    const subject = yield* fixtureSubject;
    const legacy = yield* makeLegacyProfile(subject);
    const arrived = yield* Ref.make(0);
    const gate = yield* Deferred.make<null>();
    const layer = yield* makeLoginLayer({
      profiles: [legacy],
      browser: () =>
        Ref.updateAndGet(arrived, (count) => count + 1).pipe(
          Effect.tap((count) =>
            count === 2 ? Deferred.succeed(gate, null) : Effect.void
          ),
          Effect.flatMap(() => Deferred.await(gate))
        ),
    });
    const login = runCodexSubscriptionLogin({
      subject,
      callbackTimeoutMillis: 100,
    });
    const { results, storedProfile } = yield* Effect.gen(
      function* runConcurrentLegacyLogins() {
        const results = yield* Effect.all(
          [Effect.result(login), Effect.result(login)],
          { concurrency: "unbounded" }
        );
        const storedProfile = yield* getProfile(subject);

        return { results, storedProfile };
      }
    ).pipe(Effect.provide(layer));
    const failures = results.filter(Result.isFailure);

    assert.strictEqual(results.filter(Result.isSuccess).length, 1);
    assert.strictEqual(failures.length, 1);
    assert.strictEqual(
      failures[0]?.failure._tag,
      "CodexOAuthProfileCommitConflict"
    );
    assert.strictEqual(storedProfile.profileKind, "subscription");
  })
);

it.effect(
  "releases the callback resource after browser failure and timeout",
  () =>
    Effect.gen(function* testFinalizers() {
      const subject = yield* fixtureSubject;
      const releases = yield* Ref.make(0);
      const browserFailure = new CodexSubscriptionAuthError({
        operation: "launchBrowser",
        reason: "browserFailure",
        message: "Test browser failure.",
      });
      const browserLayer = yield* makeLoginLayer({
        browser: () => Effect.fail(browserFailure),
        onRelease: Ref.update(releases, (count) => count + 1),
      });

      yield* runCodexSubscriptionLogin({
        subject,
        callbackTimeoutMillis: 100,
      }).pipe(Effect.provide(browserLayer), Effect.flip);

      const timeoutLayer = yield* makeLoginLayer({
        callback: Effect.fail(
          new CodexSubscriptionAuthError({
            operation: "awaitCallback",
            reason: "timeout",
            message: "Test callback timeout.",
          })
        ),
        onRelease: Ref.update(releases, (count) => count + 1),
      });
      const timeout = yield* runCodexSubscriptionLogin({
        subject,
        callbackTimeoutMillis: 1,
      }).pipe(Effect.provide(timeoutLayer), Effect.flip);

      assert.strictEqual(timeout._tag, "CodexSubscriptionAuthError");
      if (timeout._tag === "CodexSubscriptionAuthError") {
        assert.strictEqual(timeout.reason, "timeout");
      }
      assert.strictEqual(yield* Ref.get(releases), 2);
    })
);

it.live("times out and releases the acquired callback resource", () =>
  Effect.gen(function* testLiveCallbackTimeout() {
    const releases = yield* Ref.make(0);
    const layer = CodexLoopbackCallbackMemory({
      callback: Effect.never,
      onRelease: Ref.update(releases, (count) => count + 1),
    });
    const error = yield* Effect.gen(function* awaitTimedCallback() {
      const callback = yield* CodexLoopbackCallback;
      const session = yield* callback.open(Redacted.make("expected-state"));

      return yield* session.awaitCallback(1);
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.flip);

    assert.strictEqual(error.reason, "timeout");
    assert.strictEqual(yield* Ref.get(releases), 1);
  })
);

it.effect(
  "releases the callback resource after callback, exchange, success, and interruption exits",
  () =>
    Effect.gen(function* testAllFinalizerExits() {
      const subject = yield* fixtureSubject;
      const releases = yield* Ref.make(0);
      const onRelease = Ref.update(releases, (count) => count + 1);
      const callbackFailure = new CodexSubscriptionAuthError({
        operation: "awaitCallback",
        reason: "authorizationDenied",
        message: "Test authorization denial.",
      });
      const deniedLayer = yield* makeLoginLayer({
        callback: Effect.fail(callbackFailure),
        onRelease,
      });
      yield* runCodexSubscriptionLogin({
        subject,
        callbackTimeoutMillis: 100,
      }).pipe(Effect.provide(deniedLayer), Effect.flip);

      const mismatchLayer = yield* makeLoginLayer({
        callback: Effect.fail(
          new CodexSubscriptionAuthError({
            operation: "awaitCallback",
            reason: "stateMismatch",
            message: "Test callback state mismatch.",
          })
        ),
        onRelease,
      });
      yield* runCodexSubscriptionLogin({
        subject,
        callbackTimeoutMillis: 100,
      }).pipe(Effect.provide(mismatchLayer), Effect.flip);

      const exchangeFailure = new CodexSubscriptionAuthError({
        operation: "exchangeAuthorizationCode",
        reason: "transportFailure",
        message: "Test exchange failure.",
      });
      const exchangeLayer = yield* makeLoginLayer({
        exchangeAuthorizationCode: () => Effect.fail(exchangeFailure),
        onRelease,
      });
      yield* runCodexSubscriptionLogin({
        subject,
        callbackTimeoutMillis: 100,
      }).pipe(Effect.provide(exchangeLayer), Effect.flip);

      const successLayer = yield* makeLoginLayer({ onRelease });
      yield* runCodexSubscriptionLogin({
        subject,
        callbackTimeoutMillis: 100,
      }).pipe(Effect.provide(successLayer));

      const acquired = yield* Deferred.make<null>();
      const interruptedLayer = yield* makeLoginLayer({
        callback: Effect.never,
        onAcquire: Deferred.succeed(acquired, null).pipe(Effect.asVoid),
        onRelease,
      });
      const fiber = yield* Effect.forkChild(
        runCodexSubscriptionLogin({
          subject,
          callbackTimeoutMillis: 100,
        }).pipe(Effect.provide(interruptedLayer))
      );
      yield* Deferred.await(acquired);
      yield* Fiber.interrupt(fiber);

      assert.strictEqual(yield* Ref.get(releases), 5);
    })
);

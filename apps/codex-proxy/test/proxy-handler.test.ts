import {
  CodexAccessTokenImportProfile,
  CodexHttpStatusError,
  CodexOAuthProfileCipherConfigService,
  CodexOAuthAuthTemporarilyUnavailable,
  CodexOAuthReauthenticationRequired,
  OpenAICompatibleProxy,
  CodexSubscriptionProfile,
  OpenAICompatibleChatCompletionRequest,
  putProfile,
} from "@bundjil/codex-oauth";
import { CodexFileSystemKeyValueStoreLive } from "@bundjil/codex-oauth/filesystem-key-value-store.layer";
import {
  CodexDirectProviderLive,
  CodexHttpClientLive,
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexProfileStoreEncryptedKeyValueLive,
  OpenAICompatibleProxyLive,
} from "@bundjil/codex-oauth/live.layer";
import {
  CodexOAuthMemory,
  CodexResponsesFetchMock,
} from "@bundjil/codex-oauth/mock.layer";
import * as BunServices from "@effect/platform-bun/BunServices";
import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Redacted, Schema } from "effect";
import * as FileSystem from "effect/FileSystem";
import { describe, it as vitestIt } from "vitest";

import { CodexProxyRouteError } from "../src/errors.js";
import {
  CodexProxyConfigLayer,
  CodexProxyErrorResponse,
  CodexProxyHealthResponse,
  CodexProxyLocalProfileStoreDirectory,
  CodexProxyOpenAICompatibleProxyLiveOrUnavailable,
  makeCodexProxyProfileCipherConfigLayer,
  loadCodexProxyConfig,
  makeCodexProxyAppLayer,
  makeCodexProxyConfig,
  makeCodexProxyOpenAICompatibleProxyLocal,
  makeCodexProxyWebHandler,
  CodexProxyReadyLive,
  toCodexProxyVercelRequest,
} from "../src/index.js";

const encodeChatCompletionRequest = Schema.encodeUnknownSync(
  Schema.fromJsonString(OpenAICompatibleChatCompletionRequest)
);

const testConfig = makeCodexProxyConfig({
  internalToken: "test-internal-token",
  mode: "mock",
  subject: {
    connectorId: "bundjil-codex-proxy",
    installationId: "test",
    principal: {
      id: "test",
      issuer: "https://auth.openai.com",
      type: "chatgpt-user",
    },
    profileId: "default",
    provider: "codex",
  },
});

const liveTestConfig = makeCodexProxyConfig({
  internalToken: "test-internal-token",
  mode: "live",
  subject: {
    connectorId: "bundjil-codex-proxy",
    installationId: "test",
    principal: {
      id: "test",
      issuer: "https://auth.openai.com",
      type: "chatgpt-user",
    },
    profileId: "default",
    provider: "codex",
  },
});

const cipherConfig = {
  BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY:
    "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
  BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID: "proxy-local-test-key-v1",
};

const localCipherConfigProvider = ConfigProvider.layer(
  ConfigProvider.fromEnv({ env: cipherConfig })
);

const proofCipherConfig = {
  BUNDJIL_CODEX_PROOF_PROFILE_ENCRYPTION_KEY:
    "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
  BUNDJIL_CODEX_PROOF_PROFILE_ENCRYPTION_KEY_ID: "proxy-proof-test-key-v1",
  BUNDJIL_CODEX_PROXY_PROOF_MODE: "true",
};

const proofCipherConfigProvider = ConfigProvider.fromEnv({
  env: proofCipherConfig,
});

const normalCipherConfigProvider = ConfigProvider.fromEnv({
  env: cipherConfig,
});

const localTestConfig = (directory: string) =>
  makeCodexProxyConfig({
    internalToken: "test-internal-token",
    localProfileStoreDirectory: directory,
    mode: "local",
    subject: {
      connectorId: "bundjil-codex-proxy",
      installationId: "test",
      principal: {
        id: "test",
        issuer: "https://auth.openai.com",
        type: "chatgpt-user",
      },
      profileId: "default",
      provider: "codex",
    },
  });

const makeLiveProfile = (expiresAtEpochMillis: number) =>
  Effect.gen(function* makeImportedLiveProfile() {
    const config = yield* liveTestConfig;

    return yield* Schema.decodeUnknownEffect(CodexSubscriptionProfile)({
      profileVersion: 2,
      profileKind: "subscription",
      subject: config.subject,
      accessToken: "live-access-token",
      refreshToken: "live-refresh-token",
      expiresAtEpochMillis,
      accountId: "live-account-id",
      protocolScopeVersion: "codex-cli-rs-v1",
      scopes: [],
      createdAtEpochMillis: 1_700_000_000_000,
      updatedAtEpochMillis: 1_700_000_000_000,
      lastRefreshedAtEpochMillis: 1_700_000_000_000,
      credentialRevision: "live-revision",
      requiresReauthentication: false,
    });
  });

const makeLocalProfile = (expiresAtEpochMillis: number) =>
  Effect.gen(function* makeImportedLocalProfile() {
    const config = yield* localTestConfig("/tmp/bundjil-local-test");

    return yield* Schema.decodeUnknownEffect(CodexAccessTokenImportProfile)({
      profileVersion: 2,
      profileKind: "access-token-import",
      subject: config.subject,
      accessToken: "live-access-token",
      expiresAtEpochMillis,
      scopes: [],
      createdAtEpochMillis: 1_700_000_000_000,
      updatedAtEpochMillis: 1_700_000_000_000,
      requiresReauthentication: true,
    });
  });

const testWebHandler = Effect.gen(function* makeTestWebHandler() {
  const config = yield* testConfig;

  return makeCodexProxyWebHandler(
    makeCodexProxyAppLayer(CodexProxyConfigLayer(config))
  );
});

const makeLiveProxyLayer = (expiresAtEpochMillis: number) =>
  Effect.gen(function* makeLiveProxyLayer() {
    const profile = yield* makeLiveProfile(expiresAtEpochMillis);
    const httpClient = CodexHttpClientLive.pipe(
      Layer.provide(
        CodexResponsesFetchMock({
          fetch: () =>
            Effect.succeed(
              new Response(
                [
                  'data: {"type":"response.output_text.delta","delta":"Live OK."}',
                  'data: {"type":"response.completed"}',
                  "",
                ].join("\n"),
                {
                  headers: { "content-type": "text/event-stream" },
                  status: 200,
                }
              )
            ),
        })
      )
    );
    const directProvider = CodexDirectProviderLive.pipe(
      Layer.provideMerge(Layer.merge(CodexOAuthMemory([profile]), httpClient))
    );

    return Layer.merge(
      OpenAICompatibleProxyLive.pipe(Layer.provide(directProvider)),
      CodexProxyReadyLive
    );
  });

const liveTestWebHandler = (expiresAtEpochMillis: number) =>
  Effect.gen(function* makeLiveTestWebHandler() {
    const config = yield* liveTestConfig;
    const liveProxyLayer = yield* makeLiveProxyLayer(expiresAtEpochMillis);

    return makeCodexProxyWebHandler(
      makeCodexProxyAppLayer(
        CodexProxyConfigLayer(config),
        liveProxyLayer.pipe(Layer.orDie)
      )
    );
  });

const chatCompletionRequest = (authorization?: string) =>
  new Request("https://bundjil.local/v1/chat/completions", {
    body: encodeChatCompletionRequest({
      messages: [{ content: "Say OK.", role: "user" }],
      model: "gpt-5.5",
      stream: true,
    }),
    headers:
      authorization === undefined
        ? { "content-type": "application/json" }
        : {
            authorization,
            "content-type": "application/json",
          },
    method: "POST",
  });

type TestFetchHandler = (request: Request) => Promise<Response>;

const withTestHandler = <A>(
  run: (handler: TestFetchHandler) => Effect.Effect<A>
) =>
  Effect.acquireRelease(testWebHandler, (webHandler) =>
    Effect.promise(() => webHandler.dispose())
  ).pipe(Effect.flatMap((webHandler) => run(webHandler.handler)));

const withLiveTestHandler = <A>(
  expiresAtEpochMillis: number,
  run: (handler: TestFetchHandler) => Effect.Effect<A>
) =>
  Effect.acquireRelease(
    liveTestWebHandler(expiresAtEpochMillis),
    (webHandler) => Effect.promise(() => webHandler.dispose())
  ).pipe(Effect.flatMap((webHandler) => run(webHandler.handler)));

const makeFailureProxyLayer = (
  error:
    | CodexOAuthReauthenticationRequired
    | CodexOAuthAuthTemporarilyUnavailable
    | CodexHttpStatusError
) =>
  Layer.merge(
    Layer.succeed(
      OpenAICompatibleProxy,
      OpenAICompatibleProxy.of({
        handleChatCompletions: () => Effect.fail(error),
      })
    ),
    CodexProxyReadyLive
  );

const withFailureHandler = <A>(
  error:
    | CodexOAuthReauthenticationRequired
    | CodexOAuthAuthTemporarilyUnavailable
    | CodexHttpStatusError,
  run: (handler: TestFetchHandler) => Effect.Effect<A>
) =>
  Effect.gen(function* makeFailureHandler() {
    const config = yield* liveTestConfig;
    const webHandler = makeCodexProxyWebHandler(
      makeCodexProxyAppLayer(
        CodexProxyConfigLayer(config),
        makeFailureProxyLayer(error)
      )
    );

    return yield* Effect.acquireUseRelease(
      Effect.succeed(webHandler),
      (handler) => run(handler.handler),
      (handler) => Effect.promise(() => handler.dispose())
    );
  });

const withTemporaryDirectory = <A, E, R>(
  use: (directory: string) => Effect.Effect<A, E, R>
) =>
  Effect.acquireUseRelease(
    Effect.sync(
      () => `/tmp/bundjil-codex-proxy-local-${globalThis.crypto.randomUUID()}`
    ),
    use,
    (directory) =>
      Effect.gen(function* removeTemporaryDirectory() {
        const fileSystem = yield* FileSystem.FileSystem;

        yield* fileSystem
          .remove(directory, { recursive: true })
          .pipe(Effect.catchTag("PlatformError", () => Effect.void));
      })
  ).pipe(Effect.provide(BunServices.layer));

const makeLocalEncryptedProfileStore = (directory: string) =>
  CodexProfileStoreEncryptedKeyValueLive.pipe(
    Layer.provideMerge(
      Layer.merge(
        CodexOAuthProfileCipherLive.pipe(
          Layer.provide(
            CodexOAuthProfileCipherConfigLive.pipe(
              Layer.provide(localCipherConfigProvider)
            )
          )
        ),
        CodexFileSystemKeyValueStoreLive(directory)
      )
    )
  );

const withLocalTestHandler = <A>(
  directory: string,
  run: (handler: TestFetchHandler) => Effect.Effect<A>
) =>
  Effect.gen(function* makeLocalTestHandler() {
    const localProfileStoreDirectory = yield* Schema.decodeUnknownEffect(
      CodexProxyLocalProfileStoreDirectory
    )(directory);
    const config = yield* localTestConfig(localProfileStoreDirectory);
    const profile = yield* makeLocalProfile(Date.now() + 60_000);

    yield* putProfile(profile).pipe(
      Effect.provide(makeLocalEncryptedProfileStore(localProfileStoreDirectory))
    );
    const localProxyLayer = makeCodexProxyOpenAICompatibleProxyLocal(
      localProfileStoreDirectory,
      localCipherConfigProvider,
      CodexResponsesFetchMock({
        fetch: () =>
          Effect.succeed(
            new Response(
              [
                'data: {"type":"response.output_text.delta","delta":"Local OK."}',
                'data: {"type":"response.completed"}',
                "",
              ].join("\n"),
              {
                headers: { "content-type": "text/event-stream" },
                status: 200,
              }
            )
          ),
      })
    );
    const webHandler = makeCodexProxyWebHandler(
      makeCodexProxyAppLayer(
        CodexProxyConfigLayer(config),
        CodexProxyOpenAICompatibleProxyLiveOrUnavailable,
        () => localProxyLayer
      )
    );

    return yield* Effect.acquireUseRelease(
      Effect.succeed(webHandler),
      (handler) => run(handler.handler),
      (handler) => Effect.promise(() => handler.dispose())
    );
  });

describe("@bundjil/codex-proxy Effect HTTP handler", () => {
  it.effect(
    "uses the normal package cipher config when proof mode is disabled",
    () =>
      Effect.gen(function* testNormalCipherConfig() {
        const config = yield* CodexOAuthProfileCipherConfigService;

        assert.strictEqual(config.keyId, "proxy-local-test-key-v1");
        assert.strictEqual(
          Redacted.value(config.keyMaterial),
          cipherConfig.BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY
        );
      }).pipe(
        Effect.provide(
          makeCodexProxyProfileCipherConfigLayer(normalCipherConfigProvider)
        )
      )
  );

  it.effect("uses proof-only cipher variables when proof mode is enabled", () =>
    Effect.gen(function* testProofCipherConfig() {
      const config = yield* CodexOAuthProfileCipherConfigService;

      assert.strictEqual(config.keyId, "proxy-proof-test-key-v1");
      assert.strictEqual(
        Redacted.value(config.keyMaterial),
        proofCipherConfig.BUNDJIL_CODEX_PROOF_PROFILE_ENCRYPTION_KEY
      );
    }).pipe(
      Effect.provide(
        makeCodexProxyProfileCipherConfigLayer(proofCipherConfigProvider)
      )
    )
  );

  it.effect(
    "does not require proof cipher variables when normal live config is selected",
    () =>
      Effect.gen(function* testNormalCipherConfigWithoutProofVariables() {
        const config = yield* CodexOAuthProfileCipherConfigService;

        assert.strictEqual(config.keyId, "proxy-local-test-key-v1");
      }).pipe(
        Effect.provide(
          makeCodexProxyProfileCipherConfigLayer(normalCipherConfigProvider)
        )
      )
  );

  it.effect("returns GET /health", () =>
    withTestHandler((handler) =>
      Effect.gen(function* testHealth() {
        const response = yield* Effect.promise(() =>
          handler(new Request("https://bundjil.local/health"))
        );
        const body = yield* Effect.promise(() => response.text());
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(CodexProxyHealthResponse)
        )(body).pipe(Effect.orDie);

        assert.strictEqual(response.status, 200);
        assert.strictEqual(payload.ok, true);
        assert.strictEqual(payload.service, "bundjil-codex-proxy");
        assert.strictEqual(payload.mode, "mock");
      })
    )
  );

  it.effect("rejects local mode without an explicit filesystem directory", () =>
    Effect.gen(function* testMissingLocalDirectory() {
      const error = yield* loadCodexProxyConfig.pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: {
                BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN: "test-internal-token",
                BUNDJIL_CODEX_PROXY_MODE: "local",
              },
            })
          )
        ),
        Effect.flip
      );

      if (!Schema.is(CodexProxyRouteError)(error)) {
        assert.fail("Expected a sanitized Codex proxy configuration error.");
        return;
      }
      assert.strictEqual(error.code, "bad_request");
      assert.notInclude(error.message, "test-internal-token");
    })
  );

  it.effect(
    "rejects local mode when the Vercel runtime marker is present",
    () =>
      Effect.gen(function* testLocalModeInVercel() {
        const error = yield* loadCodexProxyConfig.pipe(
          Effect.provide(
            ConfigProvider.layer(
              ConfigProvider.fromEnv({
                env: {
                  BUNDJIL_CODEX_LOCAL_PROFILE_STORE_DIR: "/tmp/bundjil-local",
                  BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN: "test-internal-token",
                  BUNDJIL_CODEX_PROXY_MODE: "local",
                  VERCEL: "1",
                },
              })
            )
          ),
          Effect.flip
        );

        if (!Schema.is(CodexProxyRouteError)(error)) {
          assert.fail("Expected a sanitized Codex proxy configuration error.");
          return;
        }
        assert.strictEqual(error.code, "bad_request");
        assert.notInclude(error.message, "/tmp/bundjil-local");
        assert.notInclude(error.message, "test-internal-token");
      })
  );

  it.effect("rejects unauthenticated chat completions", () =>
    withTestHandler((handler) =>
      Effect.gen(function* testUnauthenticatedRequest() {
        const response = yield* Effect.promise(() =>
          handler(chatCompletionRequest())
        );
        const body = yield* Effect.promise(() => response.text());
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(CodexProxyErrorResponse)
        )(body).pipe(Effect.orDie);

        assert.strictEqual(response.status, 401);
        assert.strictEqual(payload.error.code, "unauthorized");
        assert.strictEqual(body.includes("test-internal-token"), false);
      })
    )
  );

  it.effect("rejects invalid bearer tokens without leaking token values", () =>
    withTestHandler((handler) =>
      Effect.gen(function* testInvalidToken() {
        const response = yield* Effect.promise(() =>
          handler(chatCompletionRequest("Bearer wrong-token"))
        );
        const body = yield* Effect.promise(() => response.text());
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(CodexProxyErrorResponse)
        )(body).pipe(Effect.orDie);

        assert.strictEqual(response.status, 401);
        assert.strictEqual(payload.error.message, "Unauthorized.");
        assert.strictEqual(body.includes("wrong-token"), false);
        assert.strictEqual(body.includes("test-internal-token"), false);
      })
    )
  );

  it.effect("streams authenticated mock chat completions", () =>
    withTestHandler((handler) =>
      Effect.gen(function* testAuthenticatedMockStream() {
        const response = yield* Effect.promise(() =>
          handler(chatCompletionRequest("Bearer test-internal-token"))
        );
        const body = yield* Effect.promise(() => response.text());

        assert.strictEqual(response.status, 200);
        assert.strictEqual(
          response.headers.get("content-type"),
          "text/event-stream"
        );
        assert.strictEqual(
          response.headers.get("x-bundjil-codex-proxy-mode"),
          "mock"
        );
        assert.match(body, /^data: /);
        assert.match(body, /Bundjil Codex proxy mock response/);
        assert.match(body, /data: \[DONE\]/);
      })
    )
  );

  it.effect("fails closed when live configuration is unavailable", () =>
    Effect.gen(function* testUnavailableLiveConfiguration() {
      const config = yield* liveTestConfig;
      const webHandler = makeCodexProxyWebHandler(
        makeCodexProxyAppLayer(CodexProxyConfigLayer(config))
      );
      const response = yield* Effect.acquireRelease(
        Effect.succeed(webHandler),
        (handler) => Effect.promise(() => handler.dispose())
      ).pipe(
        Effect.flatMap((handler) =>
          Effect.promise(() =>
            handler.handler(chatCompletionRequest("Bearer test-internal-token"))
          )
        )
      );
      const body = yield* Effect.promise(() => response.text());
      const payload = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(CodexProxyErrorResponse)
      )(body).pipe(Effect.orDie);

      assert.strictEqual(response.status, 503);
      assert.strictEqual(
        payload.error.code,
        "codex_auth_temporarily_unavailable"
      );
      assert.strictEqual(body.includes("test-internal-token"), false);
      assert.strictEqual(body.includes("OPENAI_API_KEY"), false);
    })
  );

  it.effect(
    "reports live health as non-ready when configuration is unavailable",
    () =>
      Effect.gen(function* testUnavailableLiveHealth() {
        const config = yield* liveTestConfig;
        const webHandler = makeCodexProxyWebHandler(
          makeCodexProxyAppLayer(CodexProxyConfigLayer(config))
        );
        const response = yield* Effect.acquireUseRelease(
          Effect.succeed(webHandler),
          (handler) =>
            Effect.promise(() =>
              handler.handler(new Request("https://bundjil.local/health"))
            ),
          (handler) => Effect.promise(() => handler.dispose())
        );
        const body = yield* Effect.promise(() => response.text());
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(CodexProxyHealthResponse)
        )(body).pipe(Effect.orDie);

        assert.strictEqual(response.status, 503);
        assert.strictEqual(payload.ok, false);
        assert.strictEqual(payload.mode, "live");
        assert.strictEqual(body.includes("UPSTASH"), false);
      })
  );

  it.effect(
    "maps permanent credential failure to the stable reauthentication error",
    () =>
      Effect.gen(function* testReauthenticationError() {
        const config = yield* liveTestConfig;

        return yield* withFailureHandler(
          new CodexOAuthReauthenticationRequired({
            profileId: config.subject.profileId,
            message: "Sanitized package failure.",
          }),
          (handler) =>
            Effect.gen(function* assertReauthenticationResponse() {
              const response = yield* Effect.promise(() =>
                handler(chatCompletionRequest("Bearer test-internal-token"))
              );
              const body = yield* Effect.promise(() => response.text());
              const payload = yield* Schema.decodeUnknownEffect(
                Schema.fromJsonString(CodexProxyErrorResponse)
              )(body).pipe(Effect.orDie);

              assert.strictEqual(response.status, 502);
              assert.strictEqual(
                payload.error.code,
                "codex_reauthentication_required"
              );
              assert.strictEqual(
                body.includes("Sanitized package failure"),
                false
              );
            })
        );
      })
  );

  it.effect("maps transient auth failure to the stable temporary error", () =>
    withFailureHandler(
      new CodexOAuthAuthTemporarilyUnavailable({
        reason: "providerUnavailable",
        message: "Sanitized package failure.",
      }),
      (handler) =>
        Effect.gen(function* assertTemporaryResponse() {
          const response = yield* Effect.promise(() =>
            handler(chatCompletionRequest("Bearer test-internal-token"))
          );
          const body = yield* Effect.promise(() => response.text());
          const payload = yield* Schema.decodeUnknownEffect(
            Schema.fromJsonString(CodexProxyErrorResponse)
          )(body).pipe(Effect.orDie);

          assert.strictEqual(response.status, 503);
          assert.strictEqual(
            payload.error.code,
            "codex_auth_temporarily_unavailable"
          );
          assert.strictEqual(body.includes("Sanitized package failure"), false);
        })
    )
  );

  it.effect("keeps non-auth provider failures as sanitized 502 responses", () =>
    withFailureHandler(
      new CodexHttpStatusError({
        operation: "postResponsesStream",
        status: 500,
        statusText: "Provider detail secret",
        contentType: "application/json",
        message: "Sanitized package failure.",
      }),
      (handler) =>
        Effect.gen(function* assertProviderResponse() {
          const response = yield* Effect.promise(() =>
            handler(chatCompletionRequest("Bearer test-internal-token"))
          );
          const body = yield* Effect.promise(() => response.text());
          const payload = yield* Schema.decodeUnknownEffect(
            Schema.fromJsonString(CodexProxyErrorResponse)
          )(body).pipe(Effect.orDie);

          assert.strictEqual(response.status, 502);
          assert.strictEqual(payload.error.code, "proxy_error");
          assert.strictEqual(body.includes("Provider detail secret"), false);
          assert.strictEqual(body.includes("Sanitized package failure"), false);
        })
    )
  );

  it.effect("does not expose hosted OAuth browser routes", () =>
    withTestHandler((handler) =>
      Effect.gen(function* testNoOAuthRoutes() {
        const response = yield* Effect.promise(() =>
          handler(new Request("https://bundjil.local/oauth/start"))
        );
        const body = yield* Effect.promise(() => response.text());
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(CodexProxyErrorResponse)
        )(body).pipe(Effect.orDie);

        assert.strictEqual(response.status, 404);
        assert.strictEqual(payload.error.code, "not_found");
      })
    )
  );

  it.effect(
    "streams an imported access-only live profile through mocked fetch",
    () =>
      withLiveTestHandler(Date.now() + 60_000, (handler) =>
        Effect.gen(function* testImportedLiveProfileStream() {
          const response = yield* Effect.promise(() =>
            handler(chatCompletionRequest("Bearer test-internal-token"))
          );
          const body = yield* Effect.promise(() => response.text());

          assert.strictEqual(response.status, 200);
          assert.strictEqual(
            response.headers.get("x-bundjil-codex-proxy-mode"),
            "live"
          );
          assert.match(body, /Live OK\./);
          assert.match(body, /data: \[DONE\]/);
          assert.strictEqual(body.includes("live-access-token"), false);
        })
      )
  );

  it.effect("fails closed when the imported live profile has expired", () =>
    withLiveTestHandler(-1, (handler) =>
      Effect.gen(function* testExpiredImportedLiveProfile() {
        const response = yield* Effect.promise(() =>
          handler(chatCompletionRequest("Bearer test-internal-token"))
        );
        const body = yield* Effect.promise(() => response.text());
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(CodexProxyErrorResponse)
        )(body).pipe(Effect.orDie);

        assert.strictEqual(response.status, 503);
        assert.strictEqual(
          payload.error.code,
          "codex_auth_temporarily_unavailable"
        );
        assert.strictEqual(body.includes("live-access-token"), false);
      })
    )
  );

  it.effect(
    "streams an encrypted local filesystem profile through mocked fetch without Upstash",
    () =>
      withTemporaryDirectory((directory) =>
        withLocalTestHandler(directory, (handler) =>
          Effect.gen(function* testLocalProfileStream() {
            const response = yield* Effect.promise(() =>
              handler(chatCompletionRequest("Bearer test-internal-token"))
            );
            const body = yield* Effect.promise(() => response.text());

            assert.strictEqual(response.status, 200, body);
            assert.strictEqual(
              response.headers.get("x-bundjil-codex-proxy-mode"),
              "local"
            );
            assert.match(body, /Local OK\./);
            assert.match(body, /data: \[DONE\]/);
            assert.strictEqual(body.includes("live-access-token"), false);
          })
        )
      )
  );

  vitestIt("maps Vercel rewrites back to public proxy paths", async () => {
    const routed = toCodexProxyVercelRequest(
      new Request(
        "https://bundjil.local/api/index?path=v1/chat/completions&check=1",
        {
          headers: {
            authorization: "Bearer test-internal-token",
          },
          method: "POST",
        }
      )
    );
    const url = new URL(routed.url);

    assert.strictEqual(url.pathname, "/v1/chat/completions");
    assert.strictEqual(url.search, "?check=1");
    assert.strictEqual(
      routed.headers.get("authorization"),
      "Bearer test-internal-token"
    );
  });
});

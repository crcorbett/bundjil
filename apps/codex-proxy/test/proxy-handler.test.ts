import {
  CodexOAuthProfile,
  OpenAICompatibleChatCompletionRequest,
} from "@bundjil/codex-oauth";
import {
  CodexDirectProviderLive,
  CodexHttpClientLive,
  OpenAICompatibleProxyLive,
} from "@bundjil/codex-oauth/live.layer";
import {
  CodexOAuthMemory,
  CodexResponsesFetchMock,
} from "@bundjil/codex-oauth/mock.layer";
import { assert, it } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import { describe, it as vitestIt } from "vitest";

import {
  CodexProxyConfigLayer,
  CodexProxyErrorResponse,
  CodexProxyHealthResponse,
  makeCodexProxyAppLayer,
  makeCodexProxyConfig,
  makeCodexProxyWebHandler,
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

const makeLiveProfile = (expiresAtEpochMillis: number) =>
  Effect.gen(function* makeImportedLiveProfile() {
    const config = yield* liveTestConfig;

    return yield* Schema.decodeUnknownEffect(CodexOAuthProfile)({
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

    return OpenAICompatibleProxyLive.pipe(Layer.provide(directProvider));
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

describe("@bundjil/codex-proxy Effect HTTP handler", () => {
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

      assert.strictEqual(response.status, 502);
      assert.strictEqual(payload.error.code, "proxy_error");
      assert.match(payload.error.message, /Re-import the local Codex profile/);
      assert.strictEqual(body.includes("test-internal-token"), false);
      assert.strictEqual(body.includes("OPENAI_API_KEY"), false);
    })
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

        assert.strictEqual(response.status, 502);
        assert.match(
          payload.error.message,
          /Re-import the local Codex profile/
        );
        assert.strictEqual(body.includes("live-access-token"), false);
      })
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

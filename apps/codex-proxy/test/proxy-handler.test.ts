import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { describe } from "vitest";

import {
  CodexProxyConfigLayer,
  CodexProxyErrorResponse,
  CodexProxyHealthResponse,
  makeCodexProxyAppLayer,
  makeCodexProxyConfig,
  makeCodexProxyWebHandler,
} from "../src/index.js";

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

const testWebHandler = Effect.gen(function* makeTestWebHandler() {
  const config = yield* testConfig;

  return makeCodexProxyWebHandler(
    makeCodexProxyAppLayer(CodexProxyConfigLayer(config))
  );
});

const chatCompletionRequest = (authorization?: string) =>
  new Request("https://bundjil.local/v1/chat/completions", {
    body: JSON.stringify({
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
});

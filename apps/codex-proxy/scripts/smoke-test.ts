import assert from "node:assert/strict";

import {
  CodexResponsesModelId,
  OpenAICompatibleChatCompletionRequest,
} from "@bundjil/codex";
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { Console, Effect, Schema } from "effect";
import { HttpClient, HttpClientRequest } from "effect/unstable/http";

import {
  CodexProxyConfigLayer,
  makeCodexProxyAppLayer,
  makeCodexProxyConfig,
  makeCodexProxyWebHandler,
} from "../src/index.js";

const SmokeTestResult = Schema.Struct({
  healthStatus: Schema.Number,
  streamStatus: Schema.Number,
  streamLines: Schema.Number,
});

const smokeConfig = makeCodexProxyConfig({
  internalToken: "smoke-test-token",
  mode: "mock",
  subject: {
    connectorId: "bundjil-codex-proxy",
    installationId: "smoke-test",
    principal: {
      id: "smoke-test",
      issuer: "https://auth.openai.com",
      type: "chatgpt-user",
    },
    profileId: "default",
    provider: "codex",
  },
});

const runSmokeTest = Effect.gen(function* runCodexProxySmokeTest() {
  const config = yield* smokeConfig;
  const { handler } = makeCodexProxyWebHandler(
    makeCodexProxyAppLayer(CodexProxyConfigLayer(config))
  );
  const client = yield* HttpClient.HttpClient;
  const server = Bun.serve({
    fetch: (request) => handler(request),
    port: 0,
  });
  const baseUrl = server.url.toString().replace(/\/$/, "");
  const requestBody = yield* Schema.encodeEffect(
    Schema.fromJsonString(OpenAICompatibleChatCompletionRequest)
  )(
    OpenAICompatibleChatCompletionRequest.make({
      messages: [{ content: "Say OK.", role: "user" }],
      model: CodexResponsesModelId.make("gpt-5.5"),
      stream: true,
    })
  );

  try {
    const health = yield* client.execute(
      HttpClientRequest.get(`${baseUrl}/health`)
    );

    assert.equal(health.status, 200);
    assert.equal(
      health.headers["content-type"]?.includes("application/json"),
      true
    );

    const stream = yield* client.execute(
      HttpClientRequest.post(`${baseUrl}/v1/chat/completions`).pipe(
        HttpClientRequest.setHeaders({
          authorization: "Bearer smoke-test-token",
          "content-type": "application/json",
        }),
        HttpClientRequest.bodyText(requestBody, "application/json")
      )
    );
    const body = yield* stream.text;

    assert.equal(stream.status, 200);
    assert.equal(stream.headers["content-type"], "text/event-stream");
    assert.match(body, /^data: /);
    assert.match(body, /data: \[DONE\]/);

    return {
      healthStatus: health.status,
      streamStatus: stream.status,
      streamLines: body.split("\n").length,
    };
  } finally {
    server.stop(true);
  }
});

const main = Effect.gen(function* renderSmokeTest() {
  const result = yield* runSmokeTest.pipe(Effect.provide(BunHttpClient.layer));
  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(SmokeTestResult)
  )(result);
  return yield* Console.log(output);
});

await Effect.runPromise(main);

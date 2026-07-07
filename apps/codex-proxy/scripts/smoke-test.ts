import assert from "node:assert/strict";

import { Effect } from "effect";

import {
  CodexProxyConfigLayer,
  makeCodexProxyAppLayer,
  makeCodexProxyConfig,
  makeCodexProxyWebHandler,
} from "../src/index.js";

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
  const server = Bun.serve({
    fetch: (request) => handler(request),
    port: 0,
  });
  const baseUrl = server.url.toString().replace(/\/$/, "");

  try {
    const health = yield* Effect.promise(() => fetch(`${baseUrl}/health`));

    assert.equal(health.status, 200);
    assert.equal(
      health.headers.get("content-type")?.includes("application/json"),
      true
    );

    const stream = yield* Effect.promise(() =>
      fetch(`${baseUrl}/v1/chat/completions`, {
        body: JSON.stringify({
          messages: [{ content: "Say OK.", role: "user" }],
          model: "gpt-5.5",
          stream: true,
        }),
        headers: {
          authorization: "Bearer smoke-test-token",
          "content-type": "application/json",
        },
        method: "POST",
      })
    );
    const body = yield* Effect.promise(() => stream.text());

    assert.equal(stream.status, 200);
    assert.equal(stream.headers.get("content-type"), "text/event-stream");
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

const result = await Effect.runPromise(runSmokeTest);

console.log(JSON.stringify(result));

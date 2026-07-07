import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";

import {
  CodexHttpNetworkError,
  CodexResponsesFetch,
  CodexResponsesPostInput,
  CodexResponsesProofInput,
  CodexResponsesRequest,
  defaultCodexResponsesEndpoint,
  postResponses,
  runCodexResponsesProof,
} from "../src/index.js";
import {
  CodexHttpClientLive,
  CodexResponsesProofLive,
} from "../src/live.layer.js";

const makeAccessToken = Schema.decodeUnknownEffect(CodexResponsesPostInput)({
  accessToken: "codex-access-token-secret",
  request: {
    model: "gpt-5.5",
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: "hello" }],
      },
    ],
    store: false,
    stream: true,
  },
});

it.effect(
  "posts Codex Responses requests with bearer auth and safe result shape",
  () =>
    Effect.gen(function* testPostResponsesRequestShape() {
      let capturedRequest: Request | undefined;
      const fetchLayer = Layer.succeed(CodexResponsesFetch, {
        fetch: (request: Request) =>
          Effect.sync(() => {
            capturedRequest = request;

            return new Response("data: {}\n\n", {
              headers: { "content-type": "text/event-stream" },
              status: 200,
            });
          }),
      });
      const input = yield* makeAccessToken;
      const result = yield* postResponses(input).pipe(
        Effect.provide(CodexHttpClientLive.pipe(Layer.provide(fetchLayer)))
      );

      assert.strictEqual(result.transport, "direct-codex-responses");
      assert.strictEqual(result.endpoint, defaultCodexResponsesEndpoint);
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.receivedBodyBytes, 10);
      assert.strictEqual(result.receivedStreamLines, 1);

      if (capturedRequest === undefined) {
        assert.fail("Codex Responses fetch was not called.");
        return;
      }

      const request = capturedRequest;

      assert.strictEqual(request.url, defaultCodexResponsesEndpoint);
      assert.strictEqual(request.method, "POST");
      assert.strictEqual(
        request.headers.get("authorization"),
        `Bearer ${Redacted.value(input.accessToken)}`
      );
      assert.strictEqual(
        request.headers.get("content-type"),
        "application/json"
      );
      assert.strictEqual(request.headers.get("chatgpt-account-id"), null);

      const body = yield* Effect.promise(() => request.text());
      const decoded = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(CodexResponsesRequest)
      )(body);

      assert.strictEqual(decoded.model, input.request.model);
      assert.strictEqual(decoded.store, false);
      assert.strictEqual(decoded.stream, true);
    })
);

it.effect(
  "adds chatgpt-account-id only when the proof input supplies one",
  () =>
    Effect.gen(function* testAccountHeader() {
      let capturedRequest: Request | undefined;
      const fetchLayer = Layer.succeed(CodexResponsesFetch, {
        fetch: (request: Request) =>
          Effect.sync(() => {
            capturedRequest = request;

            return new Response("data: {}\n\n", {
              headers: { "content-type": "text/event-stream" },
              status: 200,
            });
          }),
      });
      const proofInput = yield* Schema.decodeUnknownEffect(
        CodexResponsesProofInput
      )({
        accessToken: "codex-access-token-secret",
        accountId: "account-123",
        model: "gpt-5.5",
        prompt: "Reply with OK.",
      });
      const result = yield* runCodexResponsesProof(proofInput).pipe(
        Effect.provide(CodexResponsesProofLive.pipe(Layer.provide(fetchLayer)))
      );

      assert.strictEqual(result.usedAccountHeader, true);

      if (capturedRequest === undefined) {
        assert.fail("Codex Responses fetch was not called.");
        return;
      }

      const request = capturedRequest;

      assert.strictEqual(
        request.headers.get("chatgpt-account-id"),
        "account-123"
      );
    })
);

it.effect(
  "maps unsuccessful Codex Responses statuses without reading response bodies",
  () =>
    Effect.gen(function* testStatusFailure() {
      const fetchLayer = Layer.succeed(CodexResponsesFetch, {
        fetch: () =>
          Effect.succeed(
            new Response("access-token-secret response body", {
              headers: { "content-type": "application/json" },
              status: 401,
              statusText: "Unauthorized",
            })
          ),
      });
      const input = yield* makeAccessToken;
      const error = yield* postResponses(input).pipe(
        Effect.provide(CodexHttpClientLive.pipe(Layer.provide(fetchLayer))),
        Effect.flip
      );
      const rendered = `${String(error)} ${JSON.stringify(error)}`;

      assert.strictEqual(error._tag, "CodexHttpStatusError");
      assert.strictEqual(rendered.includes("access-token-secret"), false);
      assert.strictEqual(rendered.includes("codex-access-token-secret"), false);
    })
);

it.effect("maps fetch failures to safe network errors", () =>
  Effect.gen(function* testNetworkFailure() {
    const fetchLayer = Layer.succeed(CodexResponsesFetch, {
      fetch: () =>
        Effect.fail(
          new CodexHttpNetworkError({
            operation: "fetch",
            message: "Unable to reach Codex Responses endpoint.",
            cause: "forced network failure",
          })
        ),
    });
    const input = yield* makeAccessToken;
    const error = yield* postResponses(input).pipe(
      Effect.provide(CodexHttpClientLive.pipe(Layer.provide(fetchLayer))),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexHttpNetworkError");
    assert.strictEqual(
      JSON.stringify(error).includes("codex-access-token-secret"),
      false
    );
  })
);

it.effect("does not depend on OPENAI_API_KEY for subscription proof mode", () =>
  Effect.gen(function* testNoOpenAiApiKeyFallback() {
    let capturedAuthorization = "";
    const fetchLayer = Layer.succeed(CodexResponsesFetch, {
      fetch: (request: Request) =>
        Effect.sync(() => {
          capturedAuthorization = request.headers.get("authorization") ?? "";

          return new Response("data: {}\n\n", {
            headers: { "content-type": "text/event-stream" },
            status: 200,
          });
        }),
    });
    const input = yield* makeAccessToken;

    yield* postResponses(input).pipe(
      Effect.provide(CodexHttpClientLive.pipe(Layer.provide(fetchLayer)))
    );

    assert.strictEqual(
      capturedAuthorization,
      `Bearer ${Redacted.value(input.accessToken)}`
    );
    assert.strictEqual(capturedAuthorization.includes("OPENAI_API_KEY"), false);
  })
);

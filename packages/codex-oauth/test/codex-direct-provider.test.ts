import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";

import {
  CodexDirectProviderInput,
  CodexHttpClient,
  CodexHttpNetworkError,
  CodexHttpStatusError,
  CodexOAuthProfile,
  CodexOAuthSubject,
  CodexResponsesRequest,
  CodexResponsesStreamMapInput,
  OpenAICompatibleChatCompletionChunk,
  OpenAICompatibleChatCompletionRequest,
  OpenAICompatibleChatCompletionStream,
  OpenAICompatibleProxyInput,
  handleChatCompletions,
  streamChatCompletion,
  toCodexResponses,
  toOpenAICompatibleStream,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import {
  CodexDirectProviderLive,
  CodexRequestMapperLive,
  CodexStreamMapperLive,
} from "../src/live.layer.js";
import {
  CodexDirectProviderMock,
  CodexOAuthMemory,
} from "../src/mock.layer.js";
import {
  makeOpenAICompatibleProxy,
  OpenAICompatibleProxy,
} from "../src/openai-compatible-proxy.service.js";

const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);

const renderForLeakCheck = (value: unknown) =>
  `${String(value)} ${encodeUnknownJson(value)}`;

const fixtureSubject = Schema.decodeUnknownEffect(CodexOAuthSubject)({
  provider: "codex",
  principal: {
    type: "chatgpt-user",
    id: "acct_456",
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

const openAIRequest = Schema.decodeUnknownEffect(
  OpenAICompatibleChatCompletionRequest
)({
  model: "gpt-5.5",
  stream: true,
  messages: [
    { role: "system", content: "Be brief." },
    { role: "user", content: "Say hello." },
    { role: "assistant", content: "Hello." },
  ],
});

it.effect("decodes OpenAI-compatible chat completion requests", () =>
  Effect.gen(function* testOpenAICompatibleDecode() {
    const request = yield* openAIRequest;

    assert.strictEqual(request.model, "gpt-5.5");
    assert.strictEqual(request.stream, true);
    assert.strictEqual(request.messages.length, 3);
  })
);

it.effect("maps OpenAI-compatible requests into Codex Responses payloads", () =>
  Effect.gen(function* testCodexRequestMapping() {
    const request = yield* openAIRequest;
    const codexRequest = yield* toCodexResponses(request).pipe(
      Effect.provide(CodexRequestMapperLive)
    );
    const encoded = yield* Schema.encodeEffect(CodexResponsesRequest)(
      codexRequest
    );

    assert.strictEqual(encoded.model, "gpt-5.5");
    assert.strictEqual(encoded.store, false);
    assert.strictEqual(encoded.stream, true);
    assert.strictEqual(encoded.instructions, "Be brief.");
    assert.strictEqual(encoded.input.length, 2);
    assert.deepStrictEqual(encoded.input[0], {
      role: "user",
      content: [{ type: "input_text", text: "Say hello." }],
    });
    assert.deepStrictEqual(encoded.input[1], {
      role: "assistant",
      content: [{ type: "output_text", text: "Hello." }],
    });
  })
);

it.effect("maps Codex stream deltas to OpenAI-compatible SSE chunks", () =>
  Effect.gen(function* testStreamMapping() {
    const input = yield* Schema.decodeUnknownEffect(
      CodexResponsesStreamMapInput
    )({
      model: "gpt-5.5",
      body: [
        'data: {"type":"response.output_text.delta","delta":"Hel"}',
        'data: {"type":"response.output_text.delta","delta":"lo"}',
        'data: {"type":"response.completed"}',
        "",
      ].join("\n"),
    });
    const stream = yield* toOpenAICompatibleStream(input).pipe(
      Effect.provide(CodexStreamMapperLive)
    );

    assert.strictEqual(stream.contentType, "text/event-stream");
    assert.match(stream.body, /^data: /);
    assert.match(stream.body, /data: \[DONE\]/);

    const firstLine = stream.body
      .split("\n\n")
      .find((line) => line.startsWith("data: {"));

    if (firstLine === undefined) {
      assert.fail("Expected at least one OpenAI-compatible data chunk.");
      return;
    }

    const chunk = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(OpenAICompatibleChatCompletionChunk)
    )(firstLine.slice("data: ".length));

    assert.strictEqual(chunk.model, "gpt-5.5");
    assert.strictEqual(chunk.choices[0]?.delta.content, "Hel");
  })
);

it.effect("rejects private proxy calls with invalid internal auth", () =>
  Effect.gen(function* testProxyAuthFailure() {
    const subject = yield* fixtureSubject;
    const request = yield* openAIRequest;
    const stream = yield* Schema.decodeUnknownEffect(
      OpenAICompatibleChatCompletionStream
    )({
      contentType: "text/event-stream",
      body: "data: [DONE]\n\n",
    });
    const input = yield* Schema.decodeUnknownEffect(OpenAICompatibleProxyInput)(
      {
        authorization: "Bearer wrong-token",
        internalToken: "correct-internal-token",
        completion: {
          subject,
          request,
        },
      }
    );
    const proxyLayer = Layer.effect(
      OpenAICompatibleProxy,
      makeOpenAICompatibleProxy
    ).pipe(Layer.provide(CodexDirectProviderMock({ stream })));
    const error = yield* handleChatCompletions(input).pipe(
      Effect.provide(proxyLayer),
      Effect.flip
    );
    const rendered = renderForLeakCheck(error);

    assert.strictEqual(error._tag, "OpenAICompatibleProxyAuthError");
    assert.strictEqual(rendered.includes("correct-internal-token"), false);
    assert.strictEqual(rendered.includes("wrong-token"), false);
  })
);

it.effect(
  "propagates upstream HTTP status failures without leaking tokens",
  () =>
    Effect.gen(function* testUpstreamStatusFailure() {
      const subject = yield* fixtureSubject;
      const profile = yield* makeProfile(subject, Date.now() + 60_000);
      const request = yield* openAIRequest;
      const input = yield* Schema.decodeUnknownEffect(CodexDirectProviderInput)(
        {
          subject,
          request,
        }
      );
      const httpClientLayer = Layer.succeed(CodexHttpClient, {
        postResponses: () =>
          Effect.fail(
            new CodexHttpNetworkError({
              operation: "postResponses",
              message: "postResponses is not used by direct provider test.",
              cause: "unexpected test operation",
            })
          ),
        postResponsesStream: () =>
          Effect.fail(
            new CodexHttpStatusError({
              operation: "postResponsesStream",
              status: 401,
              statusText: "Unauthorized",
              contentType: "application/json",
              message:
                "Codex Responses endpoint returned an unsuccessful status.",
            })
          ),
      });
      const error = yield* streamChatCompletion(input).pipe(
        Effect.provide(
          CodexDirectProviderLive.pipe(
            Layer.provide(CodexOAuthMemory([profile])),
            Layer.provide(httpClientLayer)
          )
        ),
        Effect.flip
      );
      const rendered = renderForLeakCheck(error);

      assert.strictEqual(error._tag, "CodexHttpStatusError");
      assert.strictEqual(rendered.includes("access-token-secret"), false);
      assert.strictEqual(rendered.includes("refresh-token-secret"), false);
    })
);

it.effect("does not depend on OPENAI_API_KEY for proxy subscription mode", () =>
  Effect.gen(function* testNoApiKeyFallback() {
    const subject = yield* fixtureSubject;
    const request = yield* openAIRequest;
    const stream = yield* Schema.decodeUnknownEffect(
      OpenAICompatibleChatCompletionStream
    )({
      contentType: "text/event-stream",
      body: "data: [DONE]\n\n",
    });
    const input = yield* Schema.decodeUnknownEffect(OpenAICompatibleProxyInput)(
      {
        authorization: `Bearer ${Redacted.value(
          Redacted.make("correct-internal-token")
        )}`,
        internalToken: "correct-internal-token",
        completion: {
          subject,
          request,
        },
      }
    );
    const proxyLayer = Layer.effect(
      OpenAICompatibleProxy,
      makeOpenAICompatibleProxy
    ).pipe(Layer.provide(CodexDirectProviderMock({ stream })));
    const output = yield* handleChatCompletions(input).pipe(
      Effect.provide(proxyLayer)
    );

    assert.strictEqual(output.contentType, "text/event-stream");
    assert.strictEqual(output.body.includes("OPENAI_API_KEY"), false);
  })
);

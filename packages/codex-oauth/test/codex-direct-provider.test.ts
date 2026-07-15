import { assert, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Schema } from "effect";

import {
  CodexSubscriptionProfile,
  CodexDirectProviderInput,
  CodexHttpClient,
  CodexHttpNetworkError,
  CodexHttpStatusError,
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
  Schema.decodeUnknownEffect(CodexSubscriptionProfile)({
    profileVersion: 2,
    profileKind: "subscription",
    subject,
    accessToken: "access-token-secret",
    refreshToken: "refresh-token-secret",
    accountId: "acct_456",
    protocolScopeVersion: "codex-cli-v1",
    expiresAtEpochMillis,
    scopes: ["openid", "profile", "email", "offline_access"],
    createdAtEpochMillis: 1_700_000_000_000,
    updatedAtEpochMillis: 1_700_000_000_000,
    lastRefreshedAtEpochMillis: 1_700_000_000_000,
    credentialRevision: "rev-provider",
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

it.effect("maps tool definitions and tool history into Codex Responses", () =>
  Effect.gen(function* testCodexToolRequestMapping() {
    const request = yield* Schema.decodeUnknownEffect(
      OpenAICompatibleChatCompletionRequest
    )({
      model: "gpt-5.5",
      stream: true,
      messages: [
        { role: "system", content: "Use connected tools when needed." },
        { role: "user", content: "List the available Executor operations." },
        {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              type: "function",
              id: "call_executor_skills",
              function: {
                name: "connection_search",
                arguments: '{"query":"Executor skills"}',
              },
            },
          ],
        },
        {
          role: "tool",
          tool_call_id: "call_executor_skills",
          content: "skills, execute, resume",
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "connection_search",
            description: "Search configured connections.",
            parameters: {
              type: "object",
              properties: { query: { type: "string" } },
              required: ["query"],
            },
            strict: true,
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "connection_search" },
      },
    });
    const codexRequest = yield* toCodexResponses(request).pipe(
      Effect.provide(CodexRequestMapperLive)
    );
    const encoded = yield* Schema.encodeEffect(CodexResponsesRequest)(
      codexRequest
    );

    assert.deepStrictEqual(encoded.tools, [
      {
        type: "function",
        name: "connection_search",
        description: "Search configured connections.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
        strict: true,
      },
    ]);
    assert.deepStrictEqual(encoded.tool_choice, {
      type: "function",
      name: "connection_search",
    });
    assert.strictEqual(encoded.parallel_tool_calls, false);
    assert.deepStrictEqual(encoded.input, [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "List the available Executor operations.",
          },
        ],
      },
      {
        type: "function_call",
        id: "call_executor_skills",
        call_id: "call_executor_skills",
        name: "connection_search",
        arguments: '{"query":"Executor skills"}',
      },
      {
        type: "function_call_output",
        call_id: "call_executor_skills",
        output: "skills, execute, resume",
      },
    ]);
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

    const finalLine = stream.body
      .split("\n\n")
      .find((line) => line.includes('"finish_reason":"stop"'));

    assert.strictEqual(chunk.model, "gpt-5.5");
    assert.strictEqual(chunk.choices[0]?.delta.content, "Hel");
    assert.notStrictEqual(finalLine, undefined);
  })
);

it.effect("maps Codex function calls to OpenAI-compatible tool chunks", () =>
  Effect.gen(function* testFunctionCallStreamMapping() {
    const input = yield* Schema.decodeUnknownEffect(
      CodexResponsesStreamMapInput
    )({
      model: "gpt-5.5",
      body: [
        'data: {"type":"response.output_item.added","output_index":0,"item":{"type":"function_call","id":"fc_executor","call_id":"call_executor","name":"connection_search","arguments":""}}',
        'data: {"type":"response.function_call_arguments.delta","output_index":0,"delta":"{\\"query\\":\\"Executor"}',
        'data: {"type":"response.function_call_arguments.delta","output_index":0,"delta":" skills\\"}"}',
        'data: {"type":"response.completed"}',
        "",
      ].join("\n"),
    });
    const stream = yield* toOpenAICompatibleStream(input).pipe(
      Effect.provide(CodexStreamMapperLive)
    );
    const chunks = yield* Effect.forEach(
      stream.body
        .split("\n\n")
        .filter(
          (line) => line.startsWith("data: {") && !line.endsWith("[DONE]")
        ),
      (line) =>
        Schema.decodeUnknownEffect(
          Schema.fromJsonString(OpenAICompatibleChatCompletionChunk)
        )(line.slice("data: ".length))
    );

    assert.deepStrictEqual(chunks[0]?.choices[0]?.delta.tool_calls, [
      {
        index: 0,
        id: "call_executor",
        type: "function",
        function: { name: "connection_search", arguments: "" },
      },
    ]);
    assert.strictEqual(
      chunks[1]?.choices[0]?.delta.tool_calls?.[0]?.function.arguments,
      '{"query":"Executor'
    );
    assert.strictEqual(
      chunks[2]?.choices[0]?.delta.tool_calls?.[0]?.function.arguments,
      ' skills"}'
    );
    assert.strictEqual(chunks[3]?.choices[0]?.finish_reason, "tool_calls");
  })
);

it.effect("fails closed on malformed Codex function-call events", () =>
  Effect.gen(function* testMalformedFunctionCallEvent() {
    const input = yield* Schema.decodeUnknownEffect(
      CodexResponsesStreamMapInput
    )({
      model: "gpt-5.5",
      body: 'data: {"type":"response.output_item.added","output_index":0,"item":{"type":"function_call","id":"fc_executor","name":"connection_search","arguments":""}}\n\n',
    });
    const error = yield* toOpenAICompatibleStream(input).pipe(
      Effect.provide(CodexStreamMapperLive),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Unable to decode Codex function-call output item."
    );
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
              status: 403,
              statusText: "Forbidden",
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

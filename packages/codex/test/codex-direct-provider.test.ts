import { assert, it } from "@effect/vitest";
import {
  Deferred,
  Effect,
  Fiber,
  Layer,
  Redacted,
  Schema,
  Stream,
} from "effect";

import {
  CodexSubscriptionProfile,
  CodexDirectProviderInput,
  CodexHttpClient,
  CodexHttpNetworkError,
  CodexHttpStatusError,
  CodexOAuthSubject,
  CodexResponsesRequest,
  CodexResponsesRequestPolicy,
  CodexResponsesStreamError,
  OpenAICompatibleChatCompletionChunk,
  OpenAICompatibleChatCompletionDelta,
  OpenAICompatibleChatCompletionRequest,
  OpenAICompatibleProxyInput,
  handleChatCompletions,
  streamChatCompletion,
  toCodexResponses,
  toOpenAICompatibleStream,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import {
  makeOpenAICompatibleProxy,
  OpenAICompatibleProxy,
} from "../src/provider/openai-compatible-proxy.js";
import {
  CodexDirectProviderLive,
  CodexRequestMapperLive,
  CodexStreamMapperLive,
  makeCodexRequestMapperLive,
} from "../src/runtime.js";
import {
  CodexDirectProviderMock,
  CodexOAuthMemory,
} from "../src/testing/index.js";

const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);

const renderForLeakCheck = (value: unknown) =>
  `${String(value)} ${encodeUnknownJson(value)}`;

const validProfileExpiryEpochMillis = 4_102_444_800_000;

const streamBytes = (...parts: readonly (string | Uint8Array)[]) =>
  Stream.make(
    ...parts.map((part) =>
      typeof part === "string" ? new TextEncoder().encode(part) : part
    )
  );

const collectStreamText = (
  body: Stream.Stream<Uint8Array, CodexResponsesStreamError>
) =>
  body.pipe(
    Stream.decodeText(),
    Stream.runFold(
      () => "",
      (output, part) => output + part
    )
  );

const streamFixture = (body: string) => ({
  contentType: "text/event-stream" as const,
  body: streamBytes(body),
});

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
    assert.deepStrictEqual(encoded.reasoning, { effort: "low" });
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

it.effect("maps the decoded high reasoning policy into Terra requests", () =>
  Effect.gen(function* testHighReasoningPolicy() {
    const request = yield* Schema.decodeUnknownEffect(
      OpenAICompatibleChatCompletionRequest
    )({
      model: "gpt-5.6-terra",
      messages: [{ role: "user", content: "Reply with OK." }],
      stream: true,
    });
    const policy = yield* Schema.decodeUnknownEffect(
      CodexResponsesRequestPolicy
    )({ reasoningEffort: "high" });
    const codexRequest = yield* toCodexResponses(request).pipe(
      Effect.provide(makeCodexRequestMapperLive(policy))
    );
    const encoded = yield* Schema.encodeEffect(CodexResponsesRequest)(
      codexRequest
    );

    assert.strictEqual(encoded.model, "gpt-5.6-terra");
    assert.deepStrictEqual(encoded.reasoning, { effort: "high" });
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
    const request = yield* openAIRequest;
    const encodedInput = new TextEncoder().encode(
      [
        'data: {"type":"response.output_text.delta","delta":"Hel 🦅"}',
        'data: {"type":"response.output_text.delta","delta":"lo"}',
        'data: {"type":"response.completed"}',
        "",
      ].join("\n")
    );
    const utf8Split = encodedInput.indexOf(240) + 2;
    const input = {
      model: request.model,
      body: streamBytes(
        encodedInput.subarray(0, utf8Split),
        encodedInput.subarray(utf8Split)
      ),
    };
    const stream = yield* toOpenAICompatibleStream(input).pipe(
      Effect.provide(CodexStreamMapperLive)
    );
    const body = yield* collectStreamText(stream.body);

    assert.strictEqual(stream.contentType, "text/event-stream");
    assert.match(body, /^data: /);
    assert.match(body, /data: \[DONE\]/);

    const firstLine = body
      .split("\n\n")
      .find((line) => line.startsWith("data: {"));

    if (firstLine === undefined) {
      assert.fail("Expected at least one OpenAI-compatible data chunk.");
      return;
    }

    const chunk = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(OpenAICompatibleChatCompletionChunk)
    )(firstLine.slice("data: ".length));

    const finalLine = body
      .split("\n\n")
      .find((line) => line.includes('"finish_reason":"stop"'));

    assert.strictEqual(chunk.model, "gpt-5.5");
    assert.strictEqual(chunk.choices[0]?.delta.content, "Hel 🦅");
    assert.notStrictEqual(finalLine, undefined);
  })
);

it.effect("maps Codex function calls to OpenAI-compatible tool chunks", () =>
  Effect.gen(function* testFunctionCallStreamMapping() {
    const request = yield* openAIRequest;
    const fragments = [
      'data: {"type":"response.output_item.added","output_index":1,',
      '"item":{"type":"function_call","id":"fc_executor","call_id":"call_executor",',
      '"name":"connection_search","arguments":""}}\n',
      'data: {"type":"response.function_call_arguments.delta","output_index":1,',
      '"delta":"{\\"query\\":\\"Executor"}\n',
      'data: {"type":"response.function_call_arguments.delta","output_index":1,',
      '"delta":" skills\\"}"}\n',
      'data: {"type":"response.completed"}\n',
      "",
    ];
    const input = {
      model: request.model,
      body: streamBytes(...fragments),
    };
    const stream = yield* toOpenAICompatibleStream(input).pipe(
      Effect.provide(CodexStreamMapperLive)
    );
    const body = yield* collectStreamText(stream.body);
    const chunks = yield* Effect.forEach(
      body
        .split("\n\n")
        .filter(
          (line) => line.startsWith("data: {") && !line.endsWith("[DONE]")
        ),
      (line) =>
        Schema.decodeUnknownEffect(
          Schema.fromJsonString(OpenAICompatibleChatCompletionChunk)
        )(line.slice("data: ".length))
    );

    const expectedFunctionCallDelta = yield* Schema.decodeUnknownEffect(
      OpenAICompatibleChatCompletionDelta
    )({
      tool_calls: [
        {
          index: 0,
          id: "call_executor",
          type: "function",
          function: { name: "connection_search", arguments: "" },
        },
      ],
    });
    assert.deepStrictEqual(
      chunks[0]?.choices[0]?.delta,
      expectedFunctionCallDelta
    );
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

it.effect("emits a mapped chunk before the upstream stream completes", () =>
  Effect.gen(function* testIncrementalEmission() {
    const request = yield* openAIRequest;
    const releaseUpstream = yield* Deferred.make<null>();
    const firstMappedChunk = yield* Deferred.make<null>();
    const source = streamBytes(
      'data: {"type":"response.output_text.delta","delta":"Early"}\n\n'
    ).pipe(
      Stream.concat(
        Stream.fromEffect(
          Deferred.await(releaseUpstream).pipe(
            Effect.as(
              new TextEncoder().encode(
                'data: {"type":"response.completed"}\n\n'
              )
            )
          )
        )
      )
    );
    const output = yield* toOpenAICompatibleStream({
      model: request.model,
      body: source,
    }).pipe(Effect.provide(CodexStreamMapperLive));
    let received = "";
    const fiber = yield* Effect.forkChild(
      output.body.pipe(
        Stream.decodeText(),
        Stream.runForEach((part) =>
          Effect.sync(() => {
            received += part;
          }).pipe(
            Effect.andThen(Deferred.succeed(firstMappedChunk, null)),
            Effect.asVoid
          )
        )
      )
    );

    yield* Deferred.await(firstMappedChunk);
    assert.include(received, '"content":"Early"');
    assert.notInclude(received, "data: [DONE]");
    yield* Deferred.succeed(releaseUpstream, null);
    yield* Fiber.join(fiber);
    assert.include(received, "data: [DONE]");
  })
);

it.effect("propagates downstream cancellation to the upstream stream", () =>
  Effect.gen(function* testStreamingCancellation() {
    const request = yield* openAIRequest;
    const firstMappedChunk = yield* Deferred.make<null>();
    const upstreamFinalized = yield* Deferred.make<null>();
    const source = streamBytes(
      'data: {"type":"response.output_text.delta","delta":"Cancel"}\n\n'
    ).pipe(
      Stream.concat(Stream.fromEffect(Effect.never)),
      Stream.ensuring(Deferred.succeed(upstreamFinalized, null))
    );
    const output = yield* toOpenAICompatibleStream({
      model: request.model,
      body: source,
    }).pipe(Effect.provide(CodexStreamMapperLive));
    const fiber = yield* Effect.forkChild(
      output.body.pipe(
        Stream.runForEach(() => Deferred.succeed(firstMappedChunk, null))
      )
    );

    yield* Deferred.await(firstMappedChunk);
    yield* Fiber.interrupt(fiber);
    yield* Deferred.await(upstreamFinalized);
  })
);

it.effect("rejects an oversized residual SSE line without retaining it", () =>
  Effect.gen(function* testResidualLineLimit() {
    const request = yield* openAIRequest;
    const secretLine = `data: ${"s".repeat(1024 * 1024)}`;
    const output = yield* toOpenAICompatibleStream({
      model: request.model,
      body: streamBytes(secretLine),
    }).pipe(Effect.provide(CodexStreamMapperLive));
    const error = yield* output.body.pipe(Stream.runDrain, Effect.flip);
    const rendered = renderForLeakCheck(error);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex Responses SSE line exceeded the configured byte limit."
    );
    assert.notInclude(rendered, secretLine.slice(-128));
  })
);

it.effect("rejects an oversized complete SSE line", () =>
  Effect.gen(function* testCompleteLineLimit() {
    const request = yield* openAIRequest;
    const output = yield* toOpenAICompatibleStream({
      model: request.model,
      body: streamBytes(`data: ${"x".repeat(1024 * 1024)}\n`),
    }).pipe(Effect.provide(CodexStreamMapperLive));
    const error = yield* output.body.pipe(Stream.runDrain, Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex Responses SSE line exceeded the configured byte limit."
    );
  })
);

it.effect(
  "fails the mapped stream without a completion marker on upstream failure",
  () =>
    Effect.gen(function* testUpstreamStreamFailure() {
      const request = yield* openAIRequest;
      const upstreamError = new CodexResponsesStreamError({
        operation: "readResponseBody",
        message: "Unable to read Codex Responses body.",
        cause: "Synthetic transport failure.",
      });
      const source = streamBytes(
        'data: {"type":"response.output_text.delta","delta":"Before failure"}\n\n'
      ).pipe(Stream.concat(Stream.fail(upstreamError)));
      const output = yield* toOpenAICompatibleStream({
        model: request.model,
        body: source,
      }).pipe(Effect.provide(CodexStreamMapperLive));
      let received = "";
      const error = yield* output.body.pipe(
        Stream.decodeText(),
        Stream.runForEach((part) =>
          Effect.sync(() => {
            received += part;
          })
        ),
        Effect.flip
      );

      assert.strictEqual(error, upstreamError);
      assert.include(received, '"content":"Before failure"');
      assert.notInclude(received, "data: [DONE]");
    })
);

it.effect("fails closed on malformed Codex function-call events", () =>
  Effect.gen(function* testMalformedFunctionCallEvent() {
    const request = yield* openAIRequest;
    const stream = yield* toOpenAICompatibleStream({
      model: request.model,
      body: streamBytes(
        'data: {"type":"response.output_item.added","output_index":0,"item":{"type":"function_call","id":"fc_executor","name":"connection_search","arguments":""}}\n\n'
      ),
    }).pipe(Effect.provide(CodexStreamMapperLive));
    const error = yield* stream.body.pipe(Stream.runDrain, Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Unable to decode Codex function-call output item."
    );
  })
);

it.effect("fails closed on orphaned Codex function-call arguments", () =>
  Effect.gen(function* testOrphanedFunctionCallArguments() {
    const request = yield* openAIRequest;
    const stream = yield* toOpenAICompatibleStream({
      model: request.model,
      body: streamBytes(
        'data: {"type":"response.function_call_arguments.delta","output_index":3,"delta":"{}"}\n\n'
      ),
    }).pipe(Effect.provide(CodexStreamMapperLive));
    const error = yield* stream.body.pipe(Stream.runDrain, Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex function-call arguments arrived before their output item."
    );
  })
);

it.effect("rejects private proxy calls with invalid internal auth", () =>
  Effect.gen(function* testProxyAuthFailure() {
    const subject = yield* fixtureSubject;
    const request = yield* openAIRequest;
    const stream = streamFixture("data: [DONE]\n\n");
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
      const profile = yield* makeProfile(
        subject,
        validProfileExpiryEpochMillis
      );
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
    const stream = streamFixture("data: [DONE]\n\n");
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
    const body = yield* collectStreamText(output.body);
    assert.strictEqual(body.includes("OPENAI_API_KEY"), false);
  })
);

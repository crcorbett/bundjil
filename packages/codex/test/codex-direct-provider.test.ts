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
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import {
  CodexSubscriptionProfile,
  CodexDirectProviderInput,
  CodexFunctionParameters,
  CodexOAuthSubject,
  CodexResponsesRequest,
  CodexResponsesRequestPolicy,
  CodexResponsesStreamError,
  OpenAICompatibleChatCompletionChunk,
  OpenAICompatibleChatCompletionDelta,
  OpenAICompatibleChatCompletionRequest,
  OpenAICompatibleProxyInternalToken,
  OpenAICompatibleProxyInput,
  handleChatCompletions,
  streamChatCompletion,
} from "../src/index.js";
import type { CodexOAuthSubjectType } from "../src/index.js";
import {
  makeOpenAICompatibleProxy,
  OpenAICompatibleProxy,
} from "../src/provider/openai-compatible-proxy.js";
import {
  CodexRequestMapper,
  makeCodexRequestMapper,
  toCodexResponses,
} from "../src/provider/request-mapper.js";
import { makeCodexResponsesRequestPolicyLayer } from "../src/provider/request-policy.js";
import {
  CodexStreamMapper,
  makeCodexStreamMapper,
  toOpenAICompatibleStream as toOpenAICompatibleStreamWithPolicy,
} from "../src/provider/stream-mapper.js";
import {
  CodexDirectProviderMock,
  CodexOAuthMemory,
  makeCodexDirectProviderHttpClientTestLayer,
} from "../src/testing/index.js";

const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);

const renderForLeakCheck = (value: unknown) =>
  `${String(value)} ${encodeUnknownJson(value)}`;

const validProfileExpiryEpochMillis = 4_102_444_800_000;
const completedStreamEvent =
  '{"type":"response.completed","sequence_number":0,"response":{"status":"completed"}}';
const failedStreamEvent =
  '{"type":"response.failed","sequence_number":0,"response":{"status":"failed"}}';

const CodexStreamMapperTest = Layer.succeed(
  CodexStreamMapper,
  makeCodexStreamMapper
);

const makeCodexRequestMapperTest = (policy: CodexResponsesRequestPolicy) =>
  Layer.effect(CodexRequestMapper, makeCodexRequestMapper).pipe(
    Layer.provide(makeCodexResponsesRequestPolicyLayer(policy))
  );

const CodexRequestMapperTest = makeCodexRequestMapperTest({
  reasoningEffort: "low",
});

const testTransportPolicy = {
  headerTimeoutMillis: 30_000,
  streamIdleTimeoutMillis: 30_000,
  maximumBodyBytes: 32 * 1024 * 1024,
  maximumEvents: 100_000,
};

const toOpenAICompatibleStream = (
  input: Omit<
    Parameters<typeof toOpenAICompatibleStreamWithPolicy>[0],
    "transportPolicy"
  >
) =>
  toOpenAICompatibleStreamWithPolicy({
    ...input,
    transportPolicy: testTransportPolicy,
  });

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

const decodeFunctionToolParameters = (parameters: unknown) =>
  Schema.decodeUnknownEffect(OpenAICompatibleChatCompletionRequest)({
    model: "gpt-5.5",
    messages: [{ role: "user", content: "Use the tool." }],
    tools: [
      {
        type: "function",
        function: { name: "connection_search", parameters },
      },
    ],
  });

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

it.effect("rejects non-object and non-JSON function-tool parameters", () =>
  Effect.gen(function* testFunctionToolParameterBoundary() {
    yield* decodeFunctionToolParameters(["not", "an", "object"]).pipe(
      Effect.flip
    );
    yield* decodeFunctionToolParameters(true).pipe(Effect.flip);
    yield* decodeFunctionToolParameters(42).pipe(Effect.flip);
    yield* decodeFunctionToolParameters("not-an-object").pipe(Effect.flip);
    yield* decodeFunctionToolParameters({
      type: "object",
      unsupported: () => "credential-like-sentinel",
    }).pipe(Effect.flip);
  })
);

it.effect("maps OpenAI-compatible requests into Codex Responses payloads", () =>
  Effect.gen(function* testCodexRequestMapping() {
    const request = yield* openAIRequest;
    const codexRequest = yield* toCodexResponses(request).pipe(
      Effect.provide(CodexRequestMapperTest)
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
      Effect.provide(makeCodexRequestMapperTest(policy))
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
      Effect.provide(CodexRequestMapperTest)
    );
    const encoded = yield* Schema.encodeEffect(CodexResponsesRequest)(
      codexRequest
    );
    const expectedParameters = yield* Schema.decodeUnknownEffect(
      CodexFunctionParameters
    )({
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    });

    assert.deepStrictEqual(encoded.tools, [
      {
        type: "function",
        name: "connection_search",
        description: "Search configured connections.",
        parameters: expectedParameters,
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
        'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"Hel 🦅"}',
        "",
        'data: {"type":"response.output_text.delta","sequence_number":1,"output_index":0,"delta":"lo"}',
        "",
        'data: {"type":"response.completed","sequence_number":2,"response":{"status":"completed"}}',
        "",
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
      Effect.provide(CodexStreamMapperTest)
    );
    const body = yield* collectStreamText(stream.body);

    assert.strictEqual(stream.contentType, "text/event-stream");
    assert.match(body, /^data: /u);
    assert.match(body, /data: \[DONE\]/u);

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

it.effect("fails when the upstream stream ends before completion", () =>
  Effect.gen(function* testIncompleteStreamFailure() {
    const request = yield* openAIRequest;
    const output = yield* toOpenAICompatibleStream({
      model: request.model,
      body: streamBytes(
        'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"Partial"}\n\n'
      ),
    }).pipe(Effect.provide(CodexStreamMapperTest));
    const error = yield* output.body.pipe(Stream.runDrain, Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(error.operation, "toOpenAICompatibleStream");
  })
);

it.effect(
  "rejects malformed recognized events and invalid sequence progression",
  () =>
    Effect.gen(function* testRecognizedEventSequenceParity() {
      const request = yield* openAIRequest;
      const cases = [
        'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0}\n\ndata: {"type":"response.completed","sequence_number":1,"response":{"status":"completed"}}\n\n',
        'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"first"}\n\ndata: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"duplicate"}\n\n',
        'data: {"type":"response.output_text.delta","sequence_number":1,"output_index":0,"delta":"skipped"}\n\n',
        'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"first"}\n\ndata: {"type":"response.output_text.delta","sequence_number":2,"output_index":0,"delta":"skipped"}\n\n',
        'data\n\ndata: {"type":"response.completed","sequence_number":0,"response":{"status":"completed"}}\n\n',
        'data: {"type":"response.created","sequence_number":0}\n\n\uFEFFdata: {"type":"response.completed","sequence_number":1,"response":{"status":"completed"}}\n\n',
      ];

      for (const body of cases) {
        const output = yield* toOpenAICompatibleStream({
          model: request.model,
          body: streamBytes(body),
        }).pipe(Effect.provide(CodexStreamMapperTest));
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

        assert.strictEqual(error._tag, "CodexResponsesStreamError");
        assert.notInclude(received, "data: [DONE]");
      }
    })
);

it.effect("preserves CRLF framing across empty transport chunks", () =>
  Effect.gen(function* testSplitCarriageReturnLineFeed() {
    const request = yield* openAIRequest;
    const output = yield* toOpenAICompatibleStream({
      model: request.model,
      body: streamBytes(
        `data: ${completedStreamEvent}\r`,
        new Uint8Array(),
        "\n\r",
        new Uint8Array(),
        "\n"
      ),
    }).pipe(Effect.provide(CodexStreamMapperTest));
    const body = yield* collectStreamText(output.body);

    assert.include(body, '"finish_reason":"stop"');
    assert.include(body, "data: [DONE]");
  })
);

it.effect("fails closed for invalid terminal event sequences", () =>
  Effect.gen(function* testInvalidTerminalSequences() {
    const request = yield* openAIRequest;
    const cases = [
      `data: ${failedStreamEvent}\n\ndata: ${completedStreamEvent}\n\n`,
      `data: ${completedStreamEvent}\n\ndata: {"type":"response.output_text.delta","sequence_number":1,"output_index":0,"delta":"late"}\n\n`,
      `data: ${completedStreamEvent}\n\ndata: {"type":"response.completed","sequence_number":1,"response":{"status":"completed"}}\n\n`,
      'data: {"type":"response.completed","sequence_number":0}\n\n',
    ];

    for (const upstreamBody of cases) {
      const output = yield* toOpenAICompatibleStream({
        model: request.model,
        body: streamBytes(upstreamBody),
      }).pipe(Effect.provide(CodexStreamMapperTest));
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

      assert.strictEqual(error._tag, "CodexResponsesStreamError");
      assert.notInclude(received, "data: [DONE]");
    }
  })
);

it.effect("maps Codex function calls to OpenAI-compatible tool chunks", () =>
  Effect.gen(function* testFunctionCallStreamMapping() {
    const request = yield* openAIRequest;
    const fragments = [
      'data: {"type":"response.output_item.added","sequence_number":0,"output_index":1,',
      '"item":{"type":"function_call","id":"fc_executor","call_id":"call_executor",',
      '"name":"connection_search","arguments":""}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","sequence_number":1,"output_index":1,',
      '"delta":"{\\"query\\":\\"Executor"}\n\n',
      'data: {"type":"response.function_call_arguments.delta","sequence_number":2,"output_index":1,',
      '"delta":" skills\\"}"}\n\n',
      'data: {"type":"response.completed","sequence_number":3,"response":{"status":"completed"}}\n\n',
      "",
    ];
    const input = {
      model: request.model,
      body: streamBytes(...fragments),
    };
    const stream = yield* toOpenAICompatibleStream(input).pipe(
      Effect.provide(CodexStreamMapperTest)
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
      'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"Early"}\n\n'
    ).pipe(
      Stream.concat(
        Stream.fromEffect(
          Deferred.await(releaseUpstream).pipe(
            Effect.as(
              new TextEncoder().encode(
                'data: {"type":"response.completed","sequence_number":1,"response":{"status":"completed"}}\n\n'
              )
            )
          )
        )
      )
    );
    const output = yield* toOpenAICompatibleStream({
      model: request.model,
      body: source,
    }).pipe(Effect.provide(CodexStreamMapperTest));
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
      'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"Cancel"}\n\n'
    ).pipe(
      Stream.concat(Stream.fromEffect(Effect.never)),
      Stream.ensuring(Deferred.succeed(upstreamFinalized, null))
    );
    const output = yield* toOpenAICompatibleStream({
      model: request.model,
      body: source,
    }).pipe(Effect.provide(CodexStreamMapperTest));
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
    }).pipe(Effect.provide(CodexStreamMapperTest));
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
    }).pipe(Effect.provide(CodexStreamMapperTest));
    const error = yield* output.body.pipe(Stream.runDrain, Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex Responses SSE line exceeded the configured byte limit."
    );
  })
);

it.effect("rejects SSE line fragment limit plus one", () =>
  Effect.gen(function* testLineFragmentLimit() {
    const request = yield* openAIRequest;
    const fragments = globalThis.Array.from(
      { length: 4097 },
      () => new Uint8Array([120])
    );
    const output = yield* toOpenAICompatibleStream({
      model: request.model,
      body: streamBytes(...fragments),
    }).pipe(Effect.provide(CodexStreamMapperTest));
    const error = yield* output.body.pipe(Stream.runDrain, Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex Responses SSE line exceeded the configured fragment limit."
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
      });
      const source = streamBytes(
        'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"Before failure"}\n\n'
      ).pipe(Stream.concat(Stream.fail(upstreamError)));
      const output = yield* toOpenAICompatibleStream({
        model: request.model,
        body: source,
      }).pipe(Effect.provide(CodexStreamMapperTest));
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
        'data: {"type":"response.output_item.added","sequence_number":0,"output_index":0,"item":{"type":"function_call","id":"fc_executor","name":"connection_search","arguments":""}}\n\n'
      ),
    }).pipe(Effect.provide(CodexStreamMapperTest));
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
        'data: {"type":"response.function_call_arguments.delta","sequence_number":0,"output_index":3,"delta":"{}"}\n\n'
      ),
    }).pipe(Effect.provide(CodexStreamMapperTest));
    const error = yield* stream.body.pipe(Stream.runDrain, Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex function-call arguments arrived before their output item."
    );
  })
);

it.effect("rejects duplicate Codex function-call output indexes", () =>
  Effect.gen(function* testDuplicateFunctionCallOutputIndex() {
    const request = yield* openAIRequest;
    const first =
      '{"type":"response.output_item.added","sequence_number":0,"output_index":2,"item":{"type":"function_call","id":"fc_one","call_id":"call_one","name":"first_tool","arguments":""}}';
    const duplicate =
      '{"type":"response.output_item.added","sequence_number":1,"output_index":2,"item":{"type":"function_call","id":"fc_two","call_id":"call_two","name":"second_tool","arguments":""}}';
    const stream = yield* toOpenAICompatibleStream({
      model: request.model,
      body: streamBytes(`data: ${first}\n\ndata: ${duplicate}\n\n`),
    }).pipe(Effect.provide(CodexStreamMapperTest));
    const error = yield* stream.body.pipe(Stream.runDrain, Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex function-call output index was added more than once."
    );
  })
);

it.effect("rejects Codex streams above the mapped event budget", () =>
  Effect.gen(function* testMappedEventLimit() {
    const request = yield* openAIRequest;
    const output = yield* toOpenAICompatibleStreamWithPolicy({
      model: request.model,
      body: streamBytes(
        'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"one"}\n\n' +
          `data: ${completedStreamEvent}\n\n`
      ),
      transportPolicy: { ...testTransportPolicy, maximumEvents: 1 },
    }).pipe(Effect.provide(CodexStreamMapperTest));
    const error = yield* output.body.pipe(Stream.runDrain, Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex Responses SSE stream exceeded the configured event limit."
    );
  })
);

it.effect("rejects private proxy calls with invalid internal auth", () =>
  Effect.gen(function* testProxyAuthFailure() {
    const subject = yield* fixtureSubject;
    const request = yield* openAIRequest;
    const stream = streamFixture("data: [DONE]\n\n");
    const internalToken = yield* Schema.decodeUnknownEffect(
      OpenAICompatibleProxyInternalToken
    )("correct-internal-token");
    const input = yield* Schema.decodeUnknownEffect(OpenAICompatibleProxyInput)(
      {
        authorization: "Bearer wrong-token",
        completion: {
          subject,
          request,
        },
      }
    );
    const proxyLayer = Layer.effect(
      OpenAICompatibleProxy,
      makeOpenAICompatibleProxy(internalToken)
    ).pipe(Layer.provide(CodexDirectProviderMock({ stream })));
    const forgedInput = { ...input, internalToken };
    const error = yield* handleChatCompletions(forgedInput).pipe(
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
      const directProviderLayer = makeCodexDirectProviderHttpClientTestLayer(
        { reasoningEffort: "low" },
        HttpClient.make((request) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              request,
              new Response("private provider body", {
                headers: { "content-type": "application/json" },
                status: 403,
                statusText: "Forbidden",
              })
            )
          )
        )
      ).pipe(Layer.provideMerge(CodexOAuthMemory([profile])));
      const error = yield* streamChatCompletion(input).pipe(
        Effect.provide(directProviderLayer),
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
    const internalToken = yield* Schema.decodeUnknownEffect(
      OpenAICompatibleProxyInternalToken
    )("correct-internal-token");
    const input = yield* Schema.decodeUnknownEffect(OpenAICompatibleProxyInput)(
      {
        authorization: `Bearer ${Redacted.value(
          Redacted.make("correct-internal-token")
        )}`,
        completion: {
          subject,
          request,
        },
      }
    );
    const proxyLayer = Layer.effect(
      OpenAICompatibleProxy,
      makeOpenAICompatibleProxy(internalToken)
    ).pipe(Layer.provide(CodexDirectProviderMock({ stream })));
    const output = yield* handleChatCompletions(input).pipe(
      Effect.provide(proxyLayer)
    );

    assert.strictEqual(output.contentType, "text/event-stream");
    const body = yield* collectStreamText(output.body);
    assert.strictEqual(body.includes("OPENAI_API_KEY"), false);
  })
);

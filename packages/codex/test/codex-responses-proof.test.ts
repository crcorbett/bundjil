import { assert, it as effectIt } from "@effect/vitest";
import {
  ConfigProvider,
  Deferred,
  Effect,
  Fiber,
  Layer,
  Redacted,
  Result,
  Schema,
  Stream,
} from "effect";
import { TestClock } from "effect/testing";
import {
  HttpClient,
  HttpClientError,
  HttpClientResponse,
} from "effect/unstable/http";

import {
  CodexResponsesProof,
  CodexResponsesProofInput,
  CodexResponsesProofResult,
  CodexResponsesRequestError,
  CodexResponsesRequestPolicyLowLive,
  defaultCodexResponsesEndpoint,
  makeCodexResponsesProof,
  runCodexResponsesProof,
} from "../src/index.js";
import type {
  CodexOAuthAccessTokenType,
  CodexOAuthAccountIdType,
} from "../src/index.js";
import { codexResponsesEndpointConfig } from "../src/provider/config.js";
import {
  CodexJsonValue,
  CodexFunctionParameters,
  CodexResponsesFunctionName,
  CodexResponsesOutputTextDeltaEvent,
  CodexResponsesPostInput,
  CodexResponsesStreamMetadata,
} from "../src/provider/contracts.js";
import {
  CodexHttpClient,
  makeCodexHttpClient,
  postResponses,
} from "../src/provider/http-client.js";

const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);

const renderForLeakCheck = (value: unknown) =>
  `${String(value)} ${encodeUnknownJson(value)}`;

type CredentialTypesAreDistinct =
  CodexOAuthAccountIdType extends CodexOAuthAccessTokenType ? false : true;

const credentialTypesAreDistinct: CredentialTypesAreDistinct = true;

const completedEvent =
  '{"type":"response.completed","sequence_number":0,"response":{"status":"completed"}}';
const completedSse = `data: ${completedEvent}\n\n`;
const failedEvent =
  '{"type":"response.failed","sequence_number":0,"response":{"status":"failed"}}';

const nestedJson = (depth: number) =>
  `${'{"next":'.repeat(depth)}null${"}".repeat(depth)}`;

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

const codexHttpClientLayer = (
  client: HttpClient.HttpClient,
  env: Record<string, string> = {}
) =>
  Layer.effect(CodexHttpClient, makeCodexHttpClient).pipe(
    Layer.provide(
      Layer.merge(
        Layer.succeed(HttpClient.HttpClient, client),
        ConfigProvider.layer(ConfigProvider.fromEnv({ env }))
      )
    )
  );

const codexResponsesProofLayer = (client: HttpClient.HttpClient) =>
  Layer.effect(CodexResponsesProof, makeCodexResponsesProof).pipe(
    Layer.provide(
      Layer.merge(
        codexHttpClientLayer(client),
        CodexResponsesRequestPolicyLowLive
      )
    )
  );

effectIt.effect(
  "posts Codex Responses requests with bearer auth and safe result shape",
  () =>
    Effect.gen(function* testPostResponsesRequestShape() {
      let capturedRequest:
        | Parameters<typeof HttpClientResponse.fromWeb>[0]
        | undefined;
      const client = HttpClient.make((request) =>
        Effect.sync(() => {
          capturedRequest = request;

          return HttpClientResponse.fromWeb(
            request,
            new Response(completedSse, {
              headers: {
                "content-type": "text/event-stream; audit-secret=sentinel",
              },
              status: 200,
            })
          );
        })
      );
      const input = yield* makeAccessToken;
      const result = yield* postResponses(input).pipe(
        Effect.provide(codexHttpClientLayer(client))
      );

      assert.strictEqual(result.transport, "direct-codex-responses");
      assert.strictEqual(result.endpoint, defaultCodexResponsesEndpoint);
      assert.strictEqual(result.status, 200);
      assert.strictEqual(
        result.receivedBodyBytes,
        new TextEncoder().encode(completedSse).byteLength
      );
      assert.strictEqual(result.receivedStreamEvents, 1);
      assert.strictEqual(result.contentType, "text/event-stream");
      assert.notInclude(renderForLeakCheck(result), "audit-secret");

      if (capturedRequest === undefined) {
        assert.fail("Codex Responses fetch was not called.");
        return;
      }

      const request = capturedRequest;

      assert.strictEqual(request.url, defaultCodexResponsesEndpoint);
      assert.strictEqual(request.method, "POST");
      assert.strictEqual(
        request.headers["authorization"],
        `Bearer ${Redacted.value(input.accessToken)}`
      );
      assert.strictEqual(request.headers["content-type"], "application/json");
      assert.strictEqual(request.headers["accept"], "text/event-stream");
      assert.strictEqual(
        request.headers["openai-beta"],
        "responses=experimental"
      );
      assert.strictEqual(request.headers["originator"], "codex_cli_rs");
      assert.strictEqual(request.headers["chatgpt-account-id"], undefined);
    })
);

effectIt.effect("allows only the owned Codex Responses endpoint", () =>
  Effect.gen(function* testCodexResponsesEndpointConfig() {
    for (const endpoint of [
      "http://chatgpt.com/backend-api/codex/responses",
      "http://127.0.0.1:8787/capture",
      "https://example.com/capture",
      "not-a-url",
    ]) {
      yield* codexResponsesEndpointConfig
        .parse(
          ConfigProvider.fromUnknown({
            BUNDJIL_CODEX_RESPONSES_ENDPOINT: endpoint,
          })
        )
        .pipe(Effect.flip);
    }

    const endpoint = yield* codexResponsesEndpointConfig.parse(
      ConfigProvider.fromUnknown({
        BUNDJIL_CODEX_RESPONSES_ENDPOINT: defaultCodexResponsesEndpoint,
      })
    );
    assert.strictEqual(endpoint, defaultCodexResponsesEndpoint);
  })
);

effectIt.effect(
  "rejects unsafe credential header values without disclosure",
  () =>
    Effect.gen(function* testUnsafeCredentialHeaderValues() {
      const unsafeToken = "credential-sentinel\nforged-header";
      const unsafeAccountId = "account-sentinel\rforged-header";

      assert.isTrue(credentialTypesAreDistinct);

      for (const input of [
        {
          accessToken: unsafeToken,
          request: {
            model: "gpt-5.5",
            input: [],
            store: false,
            stream: true,
          },
        },
        {
          accessToken: "safe-token",
          accountId: unsafeAccountId,
          request: {
            model: "gpt-5.5",
            input: [],
            store: false,
            stream: true,
          },
        },
      ]) {
        const result = yield* Schema.decodeUnknownEffect(
          CodexResponsesPostInput
        )(input).pipe(
          Effect.mapError(
            () =>
              new CodexResponsesRequestError({
                boundary: "CodexResponsesRequest",
                message: "Unable to decode Codex Responses request.",
              })
          ),
          Effect.result
        );
        assert.isTrue(Result.isFailure(result));
        assert.notInclude(renderForLeakCheck(result), "credential-sentinel");
        assert.notInclude(renderForLeakCheck(result), "account-sentinel");
      }
    })
);

effectIt.effect("bounds recursive JSON without stack defects", () =>
  Effect.gen(function* testBoundedCodexJson() {
    const acceptedParameters = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(CodexFunctionParameters)
    )(`{"value":${nestedJson(31)}}`);
    const acceptedStreamJson = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(CodexJsonValue)
    )(`{"extra":${nestedJson(30)}}`);
    const rejectedParameters = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(CodexFunctionParameters)
    )(`{"value":${nestedJson(32)}}`).pipe(Effect.result);
    const rejectedStreamJson = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(CodexJsonValue)
    )(`{"extra":${nestedJson(32)}}`).pipe(Effect.result);
    const sparseArray: unknown[] = [];
    sparseArray.length = 1;
    const hiddenObject = Object.defineProperty({}, "hidden", {
      enumerable: false,
      value: "not-encoded",
    });

    assert.isTrue(Schema.is(CodexFunctionParameters)(acceptedParameters));
    assert.isTrue(Schema.is(CodexJsonValue)(acceptedStreamJson));
    assert.isTrue(Result.isFailure(rejectedParameters));
    assert.isTrue(Result.isFailure(rejectedStreamJson));
    assert.isFalse(Schema.is(CodexJsonValue)({ items: sparseArray }));
    assert.isFalse(Schema.is(CodexJsonValue)(hiddenObject));
  })
);

effectIt.effect("detaches and freezes decoded provider JSON", () =>
  Effect.gen(function* testCanonicalProviderJsonOwnership() {
    const source = {
      nested: { value: "before" },
      values: ["one", { value: "two" }],
    };
    const decoded = yield* Schema.decodeUnknownEffect(CodexFunctionParameters)(
      source
    );

    source.nested.value = "after";
    source.values[0] = "changed";
    const encoded = yield* Schema.encodeEffect(CodexFunctionParameters)(
      decoded
    );

    assert.deepStrictEqual(encoded, {
      nested: { value: "before" },
      values: ["one", { value: "two" }],
    });
    assert.isTrue(Object.isFrozen(decoded));
    if (typeof decoded !== "object" || decoded === null) {
      assert.fail("Expected canonical object-root function parameters.");
      return;
    }
    assert.isTrue(Object.isFrozen(Reflect.get(decoded, "nested")));
    assert.isTrue(Object.isFrozen(Reflect.get(decoded, "values")));
  })
);

effectIt.effect(
  "rejects mutable canonical JSON through type-side constructors",
  () =>
    Effect.gen(function* testCanonicalProviderJsonConstructors() {
      const mutable = { nested: { value: "before" } };
      const shallowFrozen = Object.freeze({
        nested: { value: "before" },
      });
      let reverseKeys = false;
      const proxyTarget = Object.freeze({ a: 1, b: 2 });
      const frozenProxy = new Proxy(proxyTarget, {
        ownKeys: () => (reverseKeys ? ["b", "a"] : ["a", "b"]),
      });
      const validInput = yield* makeAccessToken;
      const functionName = yield* Schema.decodeUnknownEffect(
        CodexResponsesFunctionName
      )("mutable_parameters");

      assert.isFalse(Schema.is(CodexJsonValue)(mutable));
      assert.isFalse(Schema.is(CodexFunctionParameters)(mutable));
      assert.isFalse(Schema.is(CodexFunctionParameters)(shallowFrozen));
      assert.isFalse(Schema.is(CodexFunctionParameters)(frozenProxy));
      assert.isTrue(
        Result.isFailure(
          yield* Schema.decodeUnknownEffect(
            Schema.toType(CodexFunctionParameters)
          )(mutable).pipe(Effect.result)
        )
      );
      const nestedMutableRequest = {
        accessToken: validInput.accessToken,
        request: {
          ...validInput.request,
          tools: [
            {
              name: functionName,
              parameters: mutable,
              type: "function",
            },
          ],
        },
      };
      const typeSideResult = yield* Schema.decodeUnknownEffect(
        Schema.toType(CodexResponsesPostInput)
      )(nestedMutableRequest).pipe(Effect.result);
      const postInputTypeSide: Schema.Top = CodexResponsesPostInput;
      const makeResult = yield* postInputTypeSide
        .makeEffect(nestedMutableRequest)
        .pipe(Effect.result);

      assert.isTrue(Result.isFailure(typeSideResult));
      if (Result.isFailure(typeSideResult)) {
        assert.include(
          String(typeSideResult.failure),
          '["request"]["tools"][0]["parameters"]'
        );
      }
      assert.isTrue(Result.isFailure(makeResult));
      if (Result.isFailure(makeResult)) {
        assert.include(
          String(makeResult.failure),
          '["request"]["tools"][0]["parameters"]'
        );
      }
      assert.isTrue(
        Result.isFailure(
          yield* postInputTypeSide
            .makeEffect({
              ...nestedMutableRequest,
              request: {
                ...nestedMutableRequest.request,
                tools: [
                  {
                    name: functionName,
                    parameters: frozenProxy,
                    type: "function",
                  },
                ],
              },
            })
            .pipe(Effect.result)
        )
      );

      const decodedProxy = yield* Schema.decodeUnknownEffect(
        CodexFunctionParameters
      )(frozenProxy);
      const encodedBefore = yield* Schema.encodeEffect(CodexFunctionParameters)(
        decodedProxy
      );
      reverseKeys = true;
      const encodedAfter = yield* Schema.encodeEffect(CodexFunctionParameters)(
        decodedProxy
      );
      assert.isFalse(Object.is(decodedProxy, frozenProxy));
      assert.deepStrictEqual(encodedBefore, { a: 1, b: 2 });
      assert.deepStrictEqual(encodedAfter, encodedBefore);

      const decoded = yield* Schema.decodeUnknownEffect(
        CodexFunctionParameters
      )(mutable);
      assert.isTrue(Schema.is(CodexFunctionParameters)(decoded));
      assert.isTrue(Object.isFrozen(decoded));
      assert.isTrue(Object.isFrozen(Reflect.get(decoded, "nested")));
    })
);

effectIt.effect("times out before Codex response headers arrive", () =>
  Effect.gen(function* testCodexResponseHeaderTimeout() {
    const client = HttpClient.make(() => Effect.never);
    const input = yield* makeAccessToken;
    const fiber = yield* Effect.forkChild(
      postResponses(input).pipe(
        Effect.provide(
          codexHttpClientLayer(client, {
            BUNDJIL_CODEX_RESPONSES_HEADER_TIMEOUT_MILLIS: "1000",
          })
        )
      )
    );

    yield* TestClock.adjust("1 second");
    const error = yield* Fiber.join(fiber).pipe(Effect.flip);

    assert.strictEqual(error._tag, "CodexHttpNetworkError");
    assert.strictEqual(
      error.message,
      "Codex Responses endpoint exceeded the header timeout."
    );
  })
);

effectIt.effect("interrupts an idle Codex response body", () =>
  Effect.gen(function* testCodexResponseBodyIdleTimeout() {
    let cancelled = false;
    const client = HttpClient.make((request) =>
      Effect.sync(() => {
        const response = HttpClientResponse.fromWeb(
          request,
          new Response(null, {
            headers: { "content-type": "text/event-stream" },
            status: 200,
          })
        );
        Object.defineProperty(response, "stream", {
          value: Stream.make(new TextEncoder().encode("data: ")).pipe(
            Stream.concat(Stream.never),
            Stream.ensuring(
              Effect.sync(() => {
                cancelled = true;
              })
            )
          ),
        });
        return response;
      })
    );
    const input = yield* makeAccessToken;
    const result = yield* Effect.gen(function* postStreamingResponse() {
      const clientService = yield* CodexHttpClient;
      return yield* clientService.postResponsesStream(input);
    }).pipe(
      Effect.provide(
        codexHttpClientLayer(client, {
          BUNDJIL_CODEX_RESPONSES_STREAM_IDLE_TIMEOUT_MILLIS: "1000",
        })
      )
    );
    const firstChunk = yield* Deferred.make<null>();
    const fiber = yield* Effect.forkChild(
      result.body.pipe(
        Stream.tap(() => Deferred.succeed(firstChunk, null)),
        Stream.runDrain
      )
    );

    yield* Deferred.await(firstChunk);
    yield* Effect.yieldNow;
    yield* TestClock.adjust("1 second");
    const error = yield* Fiber.join(fiber).pipe(Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex Responses body exceeded the idle timeout."
    );
    assert.isTrue(cancelled);
  })
);

effectIt.effect("does not count empty chunks as body progress", () =>
  Effect.gen(function* testCodexResponseEmptyChunkIdleTimeout() {
    let cancelled = false;
    const client = HttpClient.make((request) =>
      Effect.sync(() => {
        const response = HttpClientResponse.fromWeb(
          request,
          new Response(null, {
            headers: { "content-type": "text/event-stream" },
            status: 200,
          })
        );
        Object.defineProperty(response, "stream", {
          value: Stream.fromEffectRepeat(
            Effect.sleep("250 millis").pipe(Effect.as(new Uint8Array()))
          ).pipe(
            Stream.ensuring(
              Effect.sync(() => {
                cancelled = true;
              })
            )
          ),
        });
        return response;
      })
    );
    const input = yield* makeAccessToken;
    const fiber = yield* Effect.forkChild(
      postResponses(input).pipe(
        Effect.provide(
          codexHttpClientLayer(client, {
            BUNDJIL_CODEX_RESPONSES_STREAM_IDLE_TIMEOUT_MILLIS: "1000",
          })
        )
      )
    );

    yield* Effect.yieldNow;
    yield* TestClock.adjust("1 second");
    const error = yield* Fiber.join(fiber).pipe(Effect.flip);

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex Responses body exceeded the idle timeout."
    );
    assert.isTrue(cancelled);
  })
);

effectIt.effect("bounds an accepted stream that is never consumed", () =>
  Effect.gen(function* testUnclaimedCodexResponseStreamTimeout() {
    let requestAborted = false;
    const source = new Response(completedSse, {
      headers: { "content-type": "text/event-stream" },
      status: 200,
    });
    const client = HttpClient.make((request, _url, signal) =>
      Effect.sync(() => {
        signal.addEventListener(
          "abort",
          () => {
            requestAborted = true;
          },
          { once: true }
        );
        return HttpClientResponse.fromWeb(request, source);
      })
    );
    const input = yield* makeAccessToken;

    const response = yield* Effect.gen(
      function* acquireAndDiscardCodexResponseStream() {
        const clientService = yield* CodexHttpClient;
        return yield* clientService.postResponsesStream(input);
      }
    ).pipe(
      Effect.provide(
        codexHttpClientLayer(client, {
          BUNDJIL_CODEX_RESPONSES_STREAM_IDLE_TIMEOUT_MILLIS: "1000",
        })
      )
    );

    assert.isFalse(requestAborted);
    assert.isFalse(source.bodyUsed);
    yield* Effect.yieldNow;
    yield* TestClock.adjust("1 second");
    assert.isTrue(requestAborted);
    assert.isFalse(source.bodyUsed);
    const lateSubscription = yield* response.body.pipe(
      Stream.runDrain,
      Effect.result
    );
    assert.isTrue(Result.isFailure(lateSubscription));
    if (Result.isFailure(lateSubscription)) {
      assert.strictEqual(
        lateSubscription.failure.message,
        "Codex Responses body ownership is unavailable."
      );
      assert.notInclude(
        renderForLeakCheck(lateSubscription.failure),
        "codex-access-token-secret"
      );
    }
    assert.isFalse(source.bodyUsed);
  })
);

effectIt.effect("rejects duplicate Codex response body subscribers", () =>
  Effect.gen(function* testDuplicateCodexResponseStreamSubscription() {
    let requestAborted = false;
    const source = new Response(completedSse, {
      headers: { "content-type": "text/event-stream" },
      status: 200,
    });
    const client = HttpClient.make((request, _url, signal) =>
      Effect.sync(() => {
        signal.addEventListener(
          "abort",
          () => {
            requestAborted = true;
          },
          { once: true }
        );
        return HttpClientResponse.fromWeb(request, source);
      })
    );
    const input = yield* makeAccessToken;
    const response = yield* Effect.gen(function* acquireCodexResponseStream() {
      const clientService = yield* CodexHttpClient;
      return yield* clientService.postResponsesStream(input);
    }).pipe(Effect.provide(codexHttpClientLayer(client)));

    yield* response.body.pipe(Stream.runDrain);
    const duplicateSubscription = yield* response.body.pipe(
      Stream.runDrain,
      Effect.result
    );

    assert.isTrue(Result.isFailure(duplicateSubscription));
    if (Result.isFailure(duplicateSubscription)) {
      assert.strictEqual(
        duplicateSubscription.failure.message,
        "Codex Responses body ownership is unavailable."
      );
    }
    assert.isTrue(requestAborted);
    assert.isTrue(source.bodyUsed);
  })
);

effectIt.effect(
  "starts the unclaimed-body timeout only after valid headers",
  () =>
    Effect.gen(function* testCodexResponseOwnershipTimeoutOrdering() {
      let requestAborted = false;
      const source = new Response(completedSse, {
        headers: { "content-type": "text/event-stream" },
        status: 200,
      });
      const client = HttpClient.make((request, _url, signal) =>
        Effect.gen(function* returnDelayedCodexResponseHeaders() {
          signal.addEventListener(
            "abort",
            () => {
              requestAborted = true;
            },
            { once: true }
          );
          yield* Effect.sleep("2 seconds");
          return HttpClientResponse.fromWeb(request, source);
        })
      );
      const input = yield* makeAccessToken;
      const acquisition = yield* Effect.gen(
        function* acquireDelayedCodexResponseStream() {
          const clientService = yield* CodexHttpClient;
          return yield* clientService.postResponsesStream(input);
        }
      ).pipe(
        Effect.provide(
          codexHttpClientLayer(client, {
            BUNDJIL_CODEX_RESPONSES_HEADER_TIMEOUT_MILLIS: "5000",
            BUNDJIL_CODEX_RESPONSES_STREAM_IDLE_TIMEOUT_MILLIS: "1000",
          })
        ),
        Effect.forkChild
      );

      yield* Effect.yieldNow;
      yield* TestClock.adjust("1 second");
      assert.isFalse(requestAborted);
      yield* TestClock.adjust("1 second");
      const response = yield* Fiber.join(acquisition);
      yield* response.body.pipe(Stream.runDrain);

      assert.isTrue(requestAborted);
      assert.isTrue(source.bodyUsed);
    })
);

effectIt.effect("rejects Codex response bodies above the byte budget", () =>
  Effect.gen(function* testCodexResponseBodyByteLimit() {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(completedSse, {
            headers: { "content-type": "text/event-stream" },
            status: 200,
          })
        )
      )
    );
    const input = yield* makeAccessToken;
    const error = yield* postResponses(input).pipe(
      Effect.provide(
        codexHttpClientLayer(client, {
          BUNDJIL_CODEX_RESPONSES_MAXIMUM_BODY_BYTES: "4",
        })
      ),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex Responses body exceeded the configured byte limit."
    );
  })
);

effectIt.effect("rejects Codex streams above the event budget", () =>
  Effect.gen(function* testCodexResponseEventLimit() {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(
            'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"OK"}\n\n' +
              `data: ${completedEvent}\n\n`,
            {
              headers: { "content-type": "text/event-stream" },
              status: 200,
            }
          )
        )
      )
    );
    const input = yield* makeAccessToken;
    const error = yield* postResponses(input).pipe(
      Effect.provide(
        codexHttpClientLayer(client, {
          BUNDJIL_CODEX_RESPONSES_MAXIMUM_EVENTS: "1",
        })
      ),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex Responses SSE stream exceeded the configured event limit."
    );
  })
);

effectIt.effect(
  "adds chatgpt-account-id only when the proof input supplies one",
  () =>
    Effect.gen(function* testAccountHeader() {
      let capturedRequest:
        | Parameters<typeof HttpClientResponse.fromWeb>[0]
        | undefined;
      const client = HttpClient.make((request) =>
        Effect.sync(() => {
          capturedRequest = request;

          return HttpClientResponse.fromWeb(
            request,
            new Response(completedSse, {
              headers: { "content-type": "text/event-stream" },
              status: 200,
            })
          );
        })
      );
      const proofInput = yield* Schema.decodeUnknownEffect(
        CodexResponsesProofInput
      )({
        accessToken: "codex-access-token-secret",
        accountId: "account-123",
        model: "gpt-5.5",
        prompt: "Reply with OK.",
      });
      const result = yield* runCodexResponsesProof(proofInput).pipe(
        Effect.provide(codexResponsesProofLayer(client))
      );

      assert.strictEqual(result.usedAccountHeader, true);

      if (capturedRequest === undefined) {
        assert.fail("Codex Responses fetch was not called.");
        return;
      }

      const request = capturedRequest;

      assert.strictEqual(request.headers["chatgpt-account-id"], "account-123");
    })
);

effectIt.effect(
  "maps unsuccessful Codex Responses statuses without reading response bodies",
  () =>
    Effect.gen(function* testStatusFailure() {
      const client = HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            new Response("access-token-secret response body", {
              headers: {
                "content-type": "application/json; audit-secret=sentinel",
              },
              status: 401,
              statusText: "Unauthorized",
            })
          )
        )
      );
      const input = yield* makeAccessToken;
      const error = yield* postResponses(input).pipe(
        Effect.provide(codexHttpClientLayer(client)),
        Effect.flip
      );
      const rendered = renderForLeakCheck(error);

      assert.strictEqual(error._tag, "CodexHttpStatusError");
      assert.strictEqual(rendered.includes("access-token-secret"), false);
      assert.strictEqual(rendered.includes("codex-access-token-secret"), false);
      assert.strictEqual(rendered.includes("audit-secret"), false);
      assert.strictEqual(rendered.includes("Unauthorized"), false);
    })
);

effectIt.effect("maps fetch failures to safe network errors", () =>
  Effect.gen(function* testNetworkFailure() {
    const client = HttpClient.make((request) =>
      Effect.fail(
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.TransportError({
            request,
            cause: "forced network failure",
          }),
        })
      )
    );
    const input = yield* makeAccessToken;
    const error = yield* postResponses(input).pipe(
      Effect.provide(codexHttpClientLayer(client)),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexHttpNetworkError");
    assert.strictEqual(
      encodeUnknownJson(error).includes("codex-access-token-secret"),
      false
    );
  })
);

effectIt.effect("rejects arbitrary successful non-SSE bodies", () =>
  Effect.gen(function* rejectSuccessfulJsonBody() {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response('{"status":"ok"}', {
            headers: { "content-type": "application/json" },
            status: 200,
          })
        )
      )
    );
    const input = yield* makeAccessToken;
    const error = yield* postResponses(input).pipe(
      Effect.provide(codexHttpClientLayer(client)),
      Effect.flip
    );

    if (error._tag !== "CodexResponsesStreamError") {
      assert.fail(`Unexpected error: ${error._tag}`);
    }
    assert.strictEqual(error.operation, "postResponses");
  })
);

effectIt.effect("accepts an SSE response whose content type is absent", () =>
  Effect.gen(function* acceptUnlabelledEventStream() {
    const source = new Response(new TextEncoder().encode(completedSse), {
      status: 200,
    });
    const client = HttpClient.make((request) =>
      Effect.succeed(HttpClientResponse.fromWeb(request, source))
    );
    const input = yield* makeAccessToken;
    const response = yield* Effect.gen(
      function* postUnlabelledStreamingResponse() {
        const clientService = yield* CodexHttpClient;
        return yield* clientService.postResponsesStream(input);
      }
    ).pipe(Effect.provide(codexHttpClientLayer(client)));

    assert.strictEqual(response.contentType, "text/event-stream");
    yield* response.body.pipe(Stream.runDrain);
    assert.isTrue(source.bodyUsed);
  })
);

effectIt.effect(
  "accepts an SSE proof response whose content type is absent",
  () =>
    Effect.gen(function* acceptUnlabelledProofEventStream() {
      const source = new Response(new TextEncoder().encode(completedSse), {
        status: 200,
      });
      const client = HttpClient.make((request) =>
        Effect.succeed(HttpClientResponse.fromWeb(request, source))
      );
      const input = yield* makeAccessToken;
      const result = yield* postResponses(input).pipe(
        Effect.provide(codexHttpClientLayer(client))
      );

      assert.strictEqual(result.contentType, "text/event-stream");
      assert.isTrue(source.bodyUsed);
    })
);

effectIt.effect(
  "rejects media types that only mention SSE in a parameter",
  () =>
    Effect.gen(function* rejectMisleadingContentType() {
      const client = HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            new Response(completedSse, {
              headers: {
                "content-type": "application/json; note=text/event-stream",
              },
              status: 200,
            })
          )
        )
      );
      const input = yield* makeAccessToken;
      const error = yield* postResponses(input).pipe(
        Effect.provide(codexHttpClientLayer(client)),
        Effect.flip
      );

      assert.strictEqual(error._tag, "CodexResponsesStreamError");
    })
);

effectIt.effect(
  "finalizes rejected responses without reading their bodies",
  () =>
    Effect.gen(function* testRejectedResponseFinalization() {
      const input = yield* makeAccessToken;

      for (const fixture of [
        { contentType: "application/json", status: 401 },
        { contentType: "application/json", status: 200 },
      ] as const) {
        let proofRequestFinalized = false;
        const proofSource = new Response("rejected-body-secret", {
          headers: { "content-type": fixture.contentType },
          status: fixture.status,
        });
        const proofClient = HttpClient.make((request, _url, signal) =>
          Effect.sync(() => {
            signal.addEventListener(
              "abort",
              () => {
                proofRequestFinalized = true;
              },
              { once: true }
            );
            return HttpClientResponse.fromWeb(request, proofSource);
          })
        );
        const proofResult = yield* postResponses(input).pipe(
          Effect.provide(codexHttpClientLayer(proofClient)),
          Effect.result
        );

        assert.isTrue(proofRequestFinalized);
        assert.isFalse(proofSource.bodyUsed);
        assert.isTrue(Result.isFailure(proofResult));
        assert.notInclude(
          renderForLeakCheck(proofResult),
          "rejected-body-secret"
        );

        let streamRequestFinalized = false;
        const streamSource = new Response("rejected-body-secret", {
          headers: { "content-type": fixture.contentType },
          status: fixture.status,
        });
        const streamClient = HttpClient.make((request, _url, signal) =>
          Effect.sync(() => {
            signal.addEventListener(
              "abort",
              () => {
                streamRequestFinalized = true;
              },
              { once: true }
            );
            return HttpClientResponse.fromWeb(request, streamSource);
          })
        );
        const streamResult = yield* Effect.gen(
          function* postRejectedStreamingResponse() {
            const clientService = yield* CodexHttpClient;
            return yield* clientService.postResponsesStream(input);
          }
        ).pipe(
          Effect.provide(codexHttpClientLayer(streamClient)),
          Effect.result
        );

        assert.isTrue(streamRequestFinalized);
        assert.isFalse(streamSource.bodyUsed);
        assert.isTrue(Result.isFailure(streamResult));
        assert.notInclude(
          renderForLeakCheck(streamResult),
          "rejected-body-secret"
        );
      }
    })
);

effectIt.effect(
  "rejects successful SSE without a decoded completed event",
  () =>
    Effect.gen(function* rejectIncompleteSseBody() {
      const client = HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            new Response(
              'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"OK"}\n\n',
              {
                headers: { "content-type": "text/event-stream" },
                status: 200,
              }
            )
          )
        )
      );
      const input = yield* makeAccessToken;
      const error = yield* postResponses(input).pipe(
        Effect.provide(codexHttpClientLayer(client)),
        Effect.flip
      );

      if (error._tag !== "CodexResponsesStreamError") {
        assert.fail(`Unexpected error: ${error._tag}`);
      }
      assert.strictEqual(error.operation, "postResponses");
    })
);

effectIt.effect("rejects malformed successful SSE data events", () =>
  Effect.gen(function* rejectMalformedSseBody() {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response("data: {not-json}\n\n", {
            headers: { "content-type": "text/event-stream" },
            status: 200,
          })
        )
      )
    );
    const input = yield* makeAccessToken;
    const error = yield* postResponses(input).pipe(
      Effect.provide(codexHttpClientLayer(client)),
      Effect.flip
    );

    if (error._tag !== "CodexResponsesStreamError") {
      assert.fail(`Unexpected error: ${error._tag}`);
    }
    assert.strictEqual(error.operation, "postResponses");
  })
);

effectIt.effect("rejects an unterminated completed SSE event", () =>
  Effect.gen(function* rejectUnterminatedCompletedEvent() {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(`data: ${completedEvent}\n`, {
            headers: { "content-type": "text/event-stream" },
            status: 200,
          })
        )
      )
    );
    const input = yield* makeAccessToken;
    const error = yield* postResponses(input).pipe(
      Effect.provide(codexHttpClientLayer(client)),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
  })
);

effectIt.effect("counts one framed multi-line SSE event", () =>
  Effect.gen(function* testMultiLineEventCount() {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(
            'data: {"type":"response.completed",\ndata: "sequence_number":0,"response":{"status":"completed"}}\n\n',
            {
              headers: { "content-type": "text/event-stream" },
              status: 200,
            }
          )
        )
      )
    );
    const input = yield* makeAccessToken;
    const result = yield* postResponses(input).pipe(
      Effect.provide(codexHttpClientLayer(client))
    );

    assert.strictEqual(result.receivedStreamEvents, 1);
  })
);

effectIt.effect("accepts CR-only SSE framing", () =>
  Effect.gen(function* testCarriageReturnFraming() {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(`data: ${completedEvent}\r\r`, {
            headers: { "content-type": "text/event-stream" },
            status: 200,
          })
        )
      )
    );
    const input = yield* makeAccessToken;
    const result = yield* postResponses(input).pipe(
      Effect.provide(codexHttpClientLayer(client))
    );

    assert.strictEqual(result.receivedStreamEvents, 1);
  })
);

effectIt.effect("accepts one UTF-8 byte-order mark only at stream start", () =>
  Effect.gen(function* testInitialByteOrderMark() {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(`\uFEFFdata: ${completedEvent}\n\n`, {
            headers: { "content-type": "text/event-stream" },
            status: 200,
          })
        )
      )
    );
    const input = yield* makeAccessToken;
    const result = yield* postResponses(input).pipe(
      Effect.provide(codexHttpClientLayer(client))
    );

    assert.strictEqual(result.receivedStreamEvents, 1);
  })
);

effectIt.effect("rejects a multi-line SSE event above the byte limit", () =>
  Effect.gen(function* testMultiLineEventByteLimit() {
    const line = " ".repeat(600_000);
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(`data: ${line}\ndata: ${line}\n\n`, {
            headers: { "content-type": "text/event-stream" },
            status: 200,
          })
        )
      )
    );
    const input = yield* makeAccessToken;
    const error = yield* postResponses(input).pipe(
      Effect.provide(codexHttpClientLayer(client)),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
  })
);

effectIt.effect(
  "counts ignored SSE fields toward the complete event byte limit",
  () =>
    Effect.gen(function* testIgnoredFieldEventByteLimit() {
      const comment = `:${" ".repeat(600_000)}`;
      const client = HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            new Response(
              `${comment}\n${comment}\ndata: ${completedEvent}\n\n`,
              {
                headers: { "content-type": "text/event-stream" },
                status: 200,
              }
            )
          )
        )
      );
      const input = yield* makeAccessToken;
      const error = yield* postResponses(input).pipe(
        Effect.provide(codexHttpClientLayer(client)),
        Effect.flip
      );

      assert.strictEqual(error._tag, "CodexResponsesStreamError");
    })
);

effectIt.effect(
  "rejects invalid terminal ordering and malformed completion",
  () =>
    Effect.gen(function* testTerminalStateMachine() {
      const cases = [
        `data: ${failedEvent}\n\ndata: ${completedEvent}\n\n`,
        `data: ${completedEvent}\n\ndata: {"type":"response.output_text.delta","sequence_number":1,"output_index":0,"delta":"late"}\n\n`,
        `data: ${completedEvent}\n\ndata: {"type":"response.completed","sequence_number":1,"response":{"status":"completed"}}\n\n`,
        'data: {"type":"response.completed","sequence_number":0}\n\n',
      ];
      const input = yield* makeAccessToken;

      for (const body of cases) {
        const error = yield* postResponses(input).pipe(
          Effect.provide(
            codexHttpClientLayer(
              HttpClient.make((request) =>
                Effect.succeed(
                  HttpClientResponse.fromWeb(
                    request,
                    new Response(body, {
                      headers: { "content-type": "text/event-stream" },
                      status: 200,
                    })
                  )
                )
              )
            )
          ),
          Effect.flip
        );
        assert.strictEqual(error._tag, "CodexResponsesStreamError");
      }
    })
);

effectIt.effect(
  "rejects malformed recognized events and invalid sequence progression",
  () =>
    Effect.gen(function* testRecognizedEventSequenceParity() {
      const cases = [
        'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0}\n\ndata: {"type":"response.completed","sequence_number":1,"response":{"status":"completed"}}\n\n',
        'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"first"}\n\ndata: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"duplicate"}\n\n',
        'data: {"type":"response.output_text.delta","sequence_number":1,"output_index":0,"delta":"skipped"}\n\n',
        'data: {"type":"response.output_text.delta","sequence_number":0,"output_index":0,"delta":"first"}\n\ndata: {"type":"response.output_text.delta","sequence_number":2,"output_index":0,"delta":"skipped"}\n\n',
        'data\n\ndata: {"type":"response.completed","sequence_number":0,"response":{"status":"completed"}}\n\n',
        'data: {"type":"response.created","sequence_number":0}\n\n\uFEFFdata: {"type":"response.completed","sequence_number":1,"response":{"status":"completed"}}\n\n',
      ];
      const input = yield* makeAccessToken;

      for (const body of cases) {
        const error = yield* postResponses(input).pipe(
          Effect.provide(
            codexHttpClientLayer(
              HttpClient.make((request) =>
                Effect.succeed(
                  HttpClientResponse.fromWeb(
                    request,
                    new Response(body, {
                      headers: { "content-type": "text/event-stream" },
                      status: 200,
                    })
                  )
                )
              )
            )
          ),
          Effect.flip
        );
        assert.strictEqual(error._tag, "CodexResponsesStreamError");
      }
    })
);

effectIt.effect("rejects over-depth SSE JSON as a typed stream failure", () =>
  Effect.gen(function* testSseJsonDepthLimit() {
    const body = `data: {"type":"response.created","sequence_number":0,"extra":${nestedJson(32)}}\n\n`;
    const input = yield* makeAccessToken;
    const result = yield* postResponses(input).pipe(
      Effect.provide(
        codexHttpClientLayer(
          HttpClient.make((request) =>
            Effect.succeed(
              HttpClientResponse.fromWeb(
                request,
                new Response(body, {
                  headers: { "content-type": "text/event-stream" },
                  status: 200,
                })
              )
            )
          )
        )
      ),
      Effect.result
    );

    assert.isTrue(Result.isFailure(result));
  })
);

effectIt.effect(
  "enforces exact wire-byte event ceilings for every SSE delimiter",
  () =>
    Effect.gen(function* testExactEventWireByteLimits() {
      const input = yield* makeAccessToken;
      const eventMaxBytes = 1024 * 1024;

      for (const delimiter of ["\n", "\r\n", "\r"] as const) {
        const suffix = `${delimiter}data: ${completedEvent}${delimiter}${delimiter}`;
        const suffixBytes = new TextEncoder().encode(suffix).byteLength;
        const exactComment = `:${" ".repeat(
          eventMaxBytes - suffixBytes - 1
        )}${suffix}`;
        const overComment = `:${" ".repeat(
          eventMaxBytes - suffixBytes
        )}${suffix}`;
        const layerForBody = (body: string) =>
          codexHttpClientLayer(
            HttpClient.make((request) =>
              Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(body, {
                    headers: { "content-type": "text/event-stream" },
                    status: 200,
                  })
                )
              )
            )
          );

        const result = yield* postResponses(input).pipe(
          Effect.provide(layerForBody(exactComment))
        );
        const error = yield* postResponses(input).pipe(
          Effect.provide(layerForBody(overComment)),
          Effect.flip
        );

        assert.strictEqual(result.receivedStreamEvents, 1);
        assert.strictEqual(error._tag, "CodexResponsesStreamError");
      }
    })
);

effectIt.effect("rejects SSE event field limit plus one", () =>
  Effect.gen(function* testEventFieldLimit() {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(`${":ignored\n".repeat(4097)}\n`, {
            headers: { "content-type": "text/event-stream" },
            status: 200,
          })
        )
      )
    );
    const input = yield* makeAccessToken;
    const error = yield* postResponses(input).pipe(
      Effect.provide(codexHttpClientLayer(client)),
      Effect.flip
    );

    assert.strictEqual(error._tag, "CodexResponsesStreamError");
    assert.strictEqual(
      error.message,
      "Codex Responses SSE event exceeded the configured field limit."
    );
  })
);

effectIt.effect("rejects impossible numeric boundary values", () =>
  Effect.sync(() => {
    assert.isFalse(
      Schema.is(CodexResponsesStreamMetadata)({
        status: 200.5,
        contentType: "text/event-stream",
      })
    );
    assert.isFalse(
      Schema.is(CodexResponsesProofResult)({
        transport: "direct-codex-responses",
        endpoint: "https://chatgpt.com/backend-api/codex/responses",
        status: 200,
        contentType: "text/event-stream",
        receivedBodyBytes: -1,
        receivedStreamEvents: -0.5,
        usedAccountHeader: false,
      })
    );
    assert.isFalse(
      Schema.is(CodexResponsesOutputTextDeltaEvent)({
        type: "response.output_text.delta",
        sequence_number: 0,
        output_index: -1.5,
        delta: "invalid",
      })
    );
  })
);

effectIt.effect(
  "does not depend on OPENAI_API_KEY for subscription proof mode",
  () =>
    Effect.gen(function* testNoOpenAiApiKeyFallback() {
      let capturedAuthorization = "";
      const client = HttpClient.make((request) =>
        Effect.sync(() => {
          capturedAuthorization = request.headers["authorization"] ?? "";

          return HttpClientResponse.fromWeb(
            request,
            new Response(completedSse, {
              headers: { "content-type": "text/event-stream" },
              status: 200,
            })
          );
        })
      );
      const input = yield* makeAccessToken;

      yield* postResponses(input).pipe(
        Effect.provide(codexHttpClientLayer(client))
      );

      assert.strictEqual(
        capturedAuthorization,
        `Bearer ${Redacted.value(input.accessToken)}`
      );
      assert.strictEqual(
        capturedAuthorization.includes("OPENAI_API_KEY"),
        false
      );
    })
);

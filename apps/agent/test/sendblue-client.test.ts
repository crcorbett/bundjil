import { assert, it } from "@effect/vitest";
import { Deferred, Effect, Fiber, Layer, Redacted, Ref, Schema } from "effect";
import { TestClock } from "effect/testing";
import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import {
  SendblueClient,
  SendblueClientLive,
} from "../agent/lib/sendblue/client.service.js";
import { SendblueConfigService } from "../agent/lib/sendblue/config.js";
import {
  SendblueDeliveryUncertainError,
  SendblueResponseError,
} from "../agent/lib/sendblue/errors.js";
import { SendblueClientMemory } from "../agent/lib/sendblue/memory.layer.js";
import {
  SendblueConfig,
  SendblueSenderIdentities,
  SendblueSendMessageInput,
  SendblueSendMessageSuccess,
  SendblueTypingIndicatorInput,
  SendblueTypingIndicatorSuccess,
} from "../agent/lib/sendblue/schemas.js";
import type { SendblueResponseErrorReason } from "../agent/lib/sendblue/schemas.js";

const senderIdentities = Schema.decodeUnknownSync(SendblueSenderIdentities)({
  "+14155550100": "owner",
});

const config = Schema.decodeUnknownSync(SendblueConfig)({
  allowedServices: ["iMessage"],
  apiBaseUrl: new URL("https://api.sendblue.test"),
  apiKey: Redacted.make("test-api-key"),
  apiSecret: Redacted.make("test-api-secret"),
  fromNumber: "+14155550177",
  replayStore: {
    leaseSeconds: 60,
    prefix: "sendblue:test",
    token: Redacted.make("test-replay-token"),
    ttlSeconds: 86_400,
    url: Redacted.make("https://example.test/redis"),
  },
  routingKey: Redacted.make("test-routing-key"),
  senderIdentities,
  typingMaxDurationMillis: 120_000,
  webhookSecret: Redacted.make("test-webhook-secret"),
});

const messageInput = Schema.decodeUnknownSync(SendblueSendMessageInput)({
  content: "A concise reply.",
  from_number: "+14155550177",
  number: "+14155550100",
});

const startInput = Schema.decodeUnknownSync(SendblueTypingIndicatorInput)({
  from_number: "+14155550177",
  max_duration_ms: 120_000,
  number: "+14155550100",
  state: "start",
});

const stopInput = Schema.decodeUnknownSync(SendblueTypingIndicatorInput)({
  from_number: "+14155550177",
  number: "+14155550100",
  state: "stop",
});

const encodeMessageSuccess = Schema.encodeSync(
  Schema.fromJsonString(SendblueSendMessageSuccess)
);
const encodeTypingSuccess = Schema.encodeSync(
  Schema.fromJsonString(SendblueTypingIndicatorSuccess)
);
const encodeUnknownJson = Schema.encodeUnknownSync(
  Schema.UnknownFromJsonString
);

const makeClientLayer = (client: HttpClient.HttpClient) =>
  SendblueClientLive.pipe(
    Layer.provideMerge(
      Layer.merge(
        Layer.succeed(HttpClient.HttpClient, client),
        Layer.succeed(SendblueConfigService, config)
      )
    )
  );

it.effect(
  "enforces the discriminated typing request and duration boundaries",
  () =>
    Effect.sync(() => {
      const isTypingInput = Schema.is(SendblueTypingIndicatorInput);

      assert.strictEqual(
        isTypingInput({
          from_number: "+14155550177",
          max_duration_ms: 1,
          number: "+14155550100",
          state: "start",
        }),
        true
      );
      assert.strictEqual(
        isTypingInput({
          from_number: "+14155550177",
          max_duration_ms: 300_000,
          number: "+14155550100",
          state: "start",
        }),
        true
      );
      assert.strictEqual(
        isTypingInput({
          from_number: "+14155550177",
          number: "+14155550100",
          state: "start",
        }),
        false
      );
      assert.strictEqual(
        isTypingInput({
          from_number: "+14155550177",
          max_duration_ms: 120_000,
          number: "+14155550100",
          state: "stop",
        }),
        false
      );
      assert.strictEqual(
        isTypingInput({
          from_number: "+14155550177",
          number: "+14155550100",
          state: "paused",
        }),
        false
      );
      assert.strictEqual(
        isTypingInput({
          from_number: "14155550177",
          number: "+14155550100",
          state: "stop",
        }),
        false
      );
      assert.strictEqual(
        isTypingInput({
          from_number: "+14155550177",
          number: "14155550100",
          state: "stop",
        }),
        false
      );
      assert.strictEqual(
        isTypingInput({
          from_number: "+14155550177",
          max_duration_ms: 0,
          number: "+14155550100",
          state: "start",
        }),
        false
      );
      assert.strictEqual(
        isTypingInput({
          from_number: "+14155550177",
          max_duration_ms: 300_001,
          number: "+14155550100",
          state: "start",
        }),
        false
      );
    })
);

it.effect("provides deterministic memory client operations", () =>
  Effect.gen(function* testMemoryClient() {
    const messageError = yield* Effect.gen(function* sendWithMemoryClient() {
      const sendblue = yield* SendblueClient;
      return yield* sendblue.sendMessage(messageInput);
    }).pipe(Effect.provide(SendblueClientMemory()), Effect.flip);

    assert.strictEqual(
      Schema.is(SendblueDeliveryUncertainError)(messageError),
      true
    );
    assert.strictEqual(messageError.reason, "transport");

    const typingError = yield* Effect.gen(function* typeWithMemoryClient() {
      const sendblue = yield* SendblueClient;
      return yield* sendblue.setTypingIndicator(startInput);
    }).pipe(Effect.provide(SendblueClientMemory()), Effect.flip);

    assert.strictEqual(
      Schema.is(SendblueDeliveryUncertainError)(typingError),
      true
    );
    assert.strictEqual(typingError.operation, "setTypingIndicator");

    const seeded = yield* Effect.gen(function* typeWithSeededMemoryClient() {
      const sendblue = yield* SendblueClient;
      return yield* sendblue.setTypingIndicator(stopInput);
    }).pipe(
      Effect.provide(
        SendblueClientMemory({
          setTypingIndicator: () =>
            Effect.succeed(
              Schema.decodeUnknownSync(SendblueTypingIndicatorSuccess)({
                status: "SENT",
              })
            ),
        })
      )
    );
    assert.strictEqual(seeded.status, "SENT");
  })
);

it.effect(
  "sends schema-encoded message requests with Sendblue authentication headers",
  () =>
    Effect.gen(function* testSendMessageRequest() {
      const captured = yield* Ref.make<
        Readonly<{
          body: string;
          keyId: string | null;
          secretKey: string | null;
        }>
      >({ body: "", keyId: null, secretKey: null });
      const client = HttpClient.make((request) =>
        Effect.gen(function* captureSendMessageRequest() {
          const webRequest = yield* HttpClientRequest.toWeb(request).pipe(
            Effect.orDie
          );
          const body = yield* Effect.promise(() => webRequest.text());
          yield* Ref.set(captured, {
            body,
            keyId: webRequest.headers.get("sb-api-key-id"),
            secretKey: webRequest.headers.get("sb-api-secret-key"),
          });
          return HttpClientResponse.fromWeb(
            request,
            new Response(
              encodeMessageSuccess(
                Schema.decodeUnknownSync(SendblueSendMessageSuccess)({
                  message_handle: "msg_test_handle",
                  status: "QUEUED",
                })
              ),
              { headers: { "content-type": "application/json" }, status: 202 }
            )
          );
        })
      );
      yield* Effect.gen(function* executeSendMessage() {
        const sendblue = yield* SendblueClient;
        const response = yield* sendblue.sendMessage(messageInput);
        const request = yield* Ref.get(captured);
        const decodedBody = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(SendblueSendMessageInput)
        )(request.body).pipe(Effect.orDie);

        assert.strictEqual(request.keyId, "test-api-key");
        assert.strictEqual(request.secretKey, "test-api-secret");
        assert.deepStrictEqual(decodedBody, messageInput);
        assert.strictEqual(response.status, "QUEUED");
        assert.strictEqual(response.message_handle, "msg_test_handle");
      }).pipe(Effect.provide(makeClientLayer(client)));
    })
);

it.effect(
  "classifies message provider status and malformed responses without body leakage",
  () =>
    Effect.gen(function* testMessageResponseFailures() {
      const makeResponseClient = (status: number, body: string) =>
        HttpClient.make((request) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              request,
              new Response(body, {
                headers: { "content-type": "application/json" },
                status,
              })
            )
          )
        );
      const unauthorized = yield* Effect.gen(
        function* sendUnauthorizedMessage() {
          const sendblue = yield* SendblueClient;
          return yield* sendblue.sendMessage(messageInput);
        }
      ).pipe(
        Effect.provide(
          makeClientLayer(
            makeResponseClient(
              401,
              encodeUnknownJson({ message: "provider detail" })
            )
          )
        ),
        Effect.flip
      );
      assert.strictEqual(Schema.is(SendblueResponseError)(unauthorized), true);
      assert.strictEqual(unauthorized.reason, "unauthorized");
      assert.notInclude(String(unauthorized), "provider detail");
      assert.notInclude(String(unauthorized), "test-api-key");
      assert.notInclude(String(unauthorized), "test-api-secret");
      assert.notInclude(String(unauthorized), "+14155550100");
      assert.notInclude(String(unauthorized), "A concise reply.");

      const rateLimited = yield* Effect.gen(function* sendRateLimitedMessage() {
        const sendblue = yield* SendblueClient;
        return yield* sendblue.sendMessage(messageInput);
      }).pipe(
        Effect.provide(
          makeClientLayer(makeResponseClient(429, encodeUnknownJson({})))
        ),
        Effect.flip
      );
      assert.strictEqual(rateLimited.reason, "rateLimited");

      const malformed = yield* Effect.gen(
        function* sendMalformedMessageResponse() {
          const sendblue = yield* SendblueClient;
          return yield* sendblue.sendMessage(messageInput);
        }
      ).pipe(
        Effect.provide(
          makeClientLayer(makeResponseClient(200, encodeUnknownJson({})))
        ),
        Effect.flip
      );
      assert.strictEqual(malformed.reason, "malformedResponse");

      const providerRejected = yield* Effect.gen(
        function* sendProviderRejectedMessage() {
          const sendblue = yield* SendblueClient;
          return yield* sendblue.sendMessage(messageInput);
        }
      ).pipe(
        Effect.provide(
          makeClientLayer(
            makeResponseClient(
              202,
              encodeUnknownJson({
                error_message: "provider secret detail",
                status: "ERROR",
              })
            )
          )
        ),
        Effect.flip
      );
      assert.strictEqual(providerRejected.reason, "providerRejected");
      assert.notInclude(String(providerRejected), "provider secret detail");
      assert.notInclude(String(providerRejected), "A concise reply.");
    })
);

it.effect(
  "marks message transport and timeout outcomes uncertain without retry",
  () =>
    Effect.gen(function* testMessageUncertainOutcomes() {
      const transportClient = HttpClient.make((request) =>
        Effect.fail(
          new HttpClientError.HttpClientError({
            reason: new HttpClientError.TransportError({ request }),
          })
        )
      );
      const transport = yield* Effect.gen(
        function* sendMessageTransportFailure() {
          const sendblue = yield* SendblueClient;
          return yield* sendblue.sendMessage(messageInput);
        }
      ).pipe(Effect.provide(makeClientLayer(transportClient)), Effect.flip);
      assert.strictEqual(
        Schema.is(SendblueDeliveryUncertainError)(transport),
        true
      );
      assert.strictEqual(transport.reason, "transport");

      const started = yield* Deferred.make<null>();
      const timeoutClient = HttpClient.make(() =>
        Deferred.succeed(started, null).pipe(Effect.andThen(Effect.never))
      );
      const fiber = yield* Effect.forkChild(
        Effect.gen(function* sendMessageWithTimeout() {
          const sendblue = yield* SendblueClient;
          return yield* sendblue.sendMessage(messageInput);
        }).pipe(Effect.provide(makeClientLayer(timeoutClient)))
      );
      yield* Deferred.await(started);
      yield* TestClock.adjust("31 seconds");
      const timeout = yield* Fiber.join(fiber).pipe(Effect.flip);
      assert.strictEqual(
        Schema.is(SendblueDeliveryUncertainError)(timeout),
        true
      );
      assert.strictEqual(timeout.reason, "timeout");
    })
);

it.effect("sends exact start and stop typing requests", () =>
  Effect.gen(function* testTypingIndicatorRequests() {
    const captured = yield* Ref.make<
      readonly Readonly<{
        body: string;
        contentType: string | null;
        keyId: string | null;
        method: string;
        secretKey: string | null;
        url: string;
      }>[]
    >([]);
    const client = HttpClient.make((request) =>
      Effect.gen(function* captureTypingIndicatorRequest() {
        const webRequest = yield* HttpClientRequest.toWeb(request).pipe(
          Effect.orDie
        );
        const body = yield* Effect.promise(() => webRequest.text());
        yield* Ref.update(captured, (requests) => [
          ...requests,
          {
            body,
            contentType: webRequest.headers.get("content-type"),
            keyId: webRequest.headers.get("sb-api-key-id"),
            method: webRequest.method,
            secretKey: webRequest.headers.get("sb-api-secret-key"),
            url: webRequest.url,
          },
        ]);
        return HttpClientResponse.fromWeb(
          request,
          new Response(
            encodeTypingSuccess(
              Schema.decodeUnknownSync(SendblueTypingIndicatorSuccess)({
                error_message: null,
                number: "+14155550100",
                status: "SENT",
              })
            ),
            { headers: { "content-type": "application/json" }, status: 200 }
          )
        );
      })
    );

    const responses = yield* Effect.gen(function* executeTypingRequests() {
      const sendblue = yield* SendblueClient;
      const started = yield* sendblue.setTypingIndicator(startInput);
      const stopped = yield* sendblue.setTypingIndicator(stopInput);
      return [started, stopped] as const;
    }).pipe(Effect.provide(makeClientLayer(client)));
    const requests = yield* Ref.get(captured);
    const [startRequest, stopRequest] = requests;
    assert.isDefined(startRequest);
    assert.isDefined(stopRequest);
    const decodedStart = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(SendblueTypingIndicatorInput)
    )(startRequest.body).pipe(Effect.orDie);
    const decodedStop = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(SendblueTypingIndicatorInput)
    )(stopRequest.body).pipe(Effect.orDie);

    assert.strictEqual(requests.length, 2);
    assert.deepStrictEqual(decodedStart, startInput);
    assert.deepStrictEqual(decodedStop, stopInput);
    assert.strictEqual(startRequest.method, "POST");
    assert.strictEqual(stopRequest.method, "POST");
    assert.strictEqual(
      startRequest.url,
      "https://api.sendblue.test/api/send-typing-indicator"
    );
    assert.strictEqual(startRequest.contentType, "application/json");
    assert.strictEqual(startRequest.keyId, "test-api-key");
    assert.strictEqual(startRequest.secretKey, "test-api-secret");
    assert.strictEqual(stopRequest.contentType, "application/json");
    assert.strictEqual(stopRequest.keyId, "test-api-key");
    assert.strictEqual(stopRequest.secretKey, "test-api-secret");
    assert.strictEqual(responses[0].status, "SENT");
    assert.strictEqual(responses[1].status, "SENT");
  })
);

it.effect(
  "classifies typing HTTP failures without reading provider bodies",
  () =>
    Effect.gen(function* testTypingHttpFailures() {
      const cases: readonly Readonly<{
        reason: SendblueResponseErrorReason;
        status: number;
      }>[] = [
        { reason: "clientRejected", status: 400 },
        { reason: "unauthorized", status: 401 },
        { reason: "rateLimited", status: 429 },
        { reason: "serverRejected", status: 503 },
      ];

      for (const testCase of cases) {
        const client = HttpClient.make((request) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              request,
              new Response(
                encodeUnknownJson({ detail: "protected provider detail" }),
                {
                  headers: { "content-type": "application/json" },
                  status: testCase.status,
                }
              )
            )
          )
        );
        const error = yield* Effect.gen(function* executeRejectedTyping() {
          const sendblue = yield* SendblueClient;
          return yield* sendblue.setTypingIndicator(startInput);
        }).pipe(
          Effect.provide(makeClientLayer(client)),
          Effect.catchTags({
            SendblueDeliveryUncertainError: Effect.die,
            SendblueRequestError: Effect.die,
          }),
          Effect.flip
        );

        assert.strictEqual(error.operation, "setTypingIndicator");
        assert.strictEqual(error.reason, testCase.reason);
        assert.strictEqual(error.status, testCase.status);
        assert.notInclude(String(error), "protected provider detail");
        assert.notInclude(String(error), "test-api-key");
        assert.notInclude(String(error), "+14155550100");
      }
    })
);

it.effect("requires SENT and rejects ERROR or malformed typing responses", () =>
  Effect.gen(function* testTypingProviderResponses() {
    const makeResponseClient = (body: string) =>
      HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            new Response(body, {
              headers: { "content-type": "application/json" },
              status: 200,
            })
          )
        )
      );
    const responseCases: readonly Readonly<{
      body: string;
      reason: SendblueResponseErrorReason;
    }>[] = [
      {
        body: encodeUnknownJson({ number: "+14155550100" }),
        reason: "malformedResponse",
      },
      {
        body: encodeUnknownJson({
          error_message: "protected provider detail",
          status: "ERROR",
        }),
        reason: "providerRejected",
      },
      {
        body: encodeUnknownJson({ number: "not-e164", status: "SENT" }),
        reason: "malformedResponse",
      },
    ];

    for (const testCase of responseCases) {
      const error = yield* Effect.gen(function* executeInvalidTypingResponse() {
        const sendblue = yield* SendblueClient;
        return yield* sendblue.setTypingIndicator(startInput);
      }).pipe(
        Effect.provide(makeClientLayer(makeResponseClient(testCase.body))),
        Effect.catchTags({
          SendblueDeliveryUncertainError: Effect.die,
          SendblueRequestError: Effect.die,
        }),
        Effect.flip
      );

      assert.strictEqual(error.operation, "setTypingIndicator");
      assert.strictEqual(error.reason, testCase.reason);
      assert.notInclude(String(error), "protected provider detail");
      assert.notInclude(String(error), "+14155550100");
    }
  })
);

it.effect("does not retry an uncertain typing transport failure", () =>
  Effect.gen(function* testTypingTransportFailure() {
    const attempts = yield* Ref.make(0);
    const client = HttpClient.make((request) =>
      Ref.update(attempts, (count) => count + 1).pipe(
        Effect.andThen(
          Effect.fail(
            new HttpClientError.HttpClientError({
              reason: new HttpClientError.TransportError({ request }),
            })
          )
        )
      )
    );
    const error = yield* Effect.gen(function* executeTransportFailure() {
      const sendblue = yield* SendblueClient;
      return yield* sendblue.setTypingIndicator(startInput);
    }).pipe(Effect.provide(makeClientLayer(client)), Effect.flip);

    assert.strictEqual(Schema.is(SendblueDeliveryUncertainError)(error), true);
    assert.strictEqual(error.operation, "setTypingIndicator");
    assert.strictEqual(error.reason, "transport");
    assert.strictEqual(yield* Ref.get(attempts), 1);
  })
);

it.effect("times out typing immediately at the two-second bound", () =>
  Effect.gen(function* testTypingTimeout() {
    const started = yield* Deferred.make<null>();
    const client = HttpClient.make(() =>
      Deferred.succeed(started, null).pipe(Effect.andThen(Effect.never))
    );
    const fiber = yield* Effect.forkChild(
      Effect.gen(function* executeTypingTimeout() {
        const sendblue = yield* SendblueClient;
        return yield* sendblue.setTypingIndicator(startInput);
      }).pipe(Effect.provide(makeClientLayer(client)))
    );
    yield* Deferred.await(started);
    yield* TestClock.adjust("2 seconds");
    const error = yield* Fiber.join(fiber).pipe(Effect.flip);

    assert.strictEqual(Schema.is(SendblueDeliveryUncertainError)(error), true);
    assert.strictEqual(error.operation, "setTypingIndicator");
    assert.strictEqual(error.reason, "timeout");
  })
);

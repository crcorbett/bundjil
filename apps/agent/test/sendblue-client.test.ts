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
} from "../agent/lib/sendblue/schemas.js";

const senderIdentities = Schema.decodeUnknownSync(SendblueSenderIdentities)({
  "+14155550100": "owner",
});

const config = Schema.decodeUnknownSync(SendblueConfig)({
  allowedServices: ["iMessage"],
  apiBaseUrl: new URL("https://api.sendblue.test"),
  apiKey: Redacted.make("test-api-key"),
  apiSecret: Redacted.make("test-api-secret"),
  fromNumber: "+13472760577",
  replayStore: {
    leaseSeconds: 60,
    prefix: "sendblue:test",
    token: Redacted.make("test-replay-token"),
    ttlSeconds: 86_400,
    url: Redacted.make("https://example.test/redis"),
  },
  routingKey: Redacted.make("test-routing-key"),
  senderIdentities,
  webhookSecret: Redacted.make("test-webhook-secret"),
});

const input = Schema.decodeUnknownSync(SendblueSendMessageInput)({
  content: "A concise reply.",
  from_number: "+13472760577",
  number: "+14155550100",
});

const encodeSuccess = Schema.encodeSync(
  Schema.fromJsonString(SendblueSendMessageSuccess)
);

it.effect("provides deterministic unseeded memory client failures", () =>
  Effect.gen(function* testMemoryClient() {
    const error = yield* Effect.gen(function* sendWithMemoryClient() {
      const sendblue = yield* SendblueClient;
      return yield* sendblue.sendMessage(input);
    }).pipe(Effect.provide(SendblueClientMemory()), Effect.flip);

    assert.strictEqual(Schema.is(SendblueDeliveryUncertainError)(error), true);
    assert.strictEqual(error.reason, "transport");
  })
);

it.effect(
  "sends schema-encoded requests with the Sendblue authentication headers",
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
              encodeSuccess(
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
      const layer = SendblueClientLive.pipe(
        Layer.provideMerge(
          Layer.merge(
            Layer.succeed(HttpClient.HttpClient, client),
            Layer.succeed(SendblueConfigService, config)
          )
        )
      );
      yield* Effect.gen(function* executeSendMessage() {
        const sendblue = yield* SendblueClient;
        const response = yield* sendblue.sendMessage(input);
        const request = yield* Ref.get(captured);
        const decodedBody = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(SendblueSendMessageInput)
        )(request.body).pipe(Effect.orDie);

        assert.strictEqual(request.keyId, "test-api-key");
        assert.strictEqual(request.secretKey, "test-api-secret");
        assert.strictEqual(decodedBody.content, input.content);
        assert.strictEqual(decodedBody.number, input.number);
        assert.strictEqual(decodedBody.from_number, input.from_number);
        assert.strictEqual(response.status, "QUEUED");
        assert.strictEqual(response.message_handle, "msg_test_handle");
      }).pipe(Effect.provide(layer));
    })
);

it.effect(
  "classifies provider status and malformed responses without provider body leakage",
  () =>
    Effect.gen(function* testResponseFailures() {
      const makeLayer = (status: number, body: string) =>
        SendblueClientLive.pipe(
          Layer.provideMerge(
            Layer.merge(
              Layer.succeed(
                HttpClient.HttpClient,
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
                )
              ),
              Layer.succeed(SendblueConfigService, config)
            )
          )
        );
      const unauthorized = yield* Effect.gen(function* sendUnauthorized() {
        const sendblue = yield* SendblueClient;
        return yield* sendblue.sendMessage(input);
      }).pipe(
        Effect.provide(makeLayer(401, '{"message":"provider detail"}')),
        Effect.flip
      );
      assert.strictEqual(Schema.is(SendblueResponseError)(unauthorized), true);
      assert.strictEqual(unauthorized.reason, "unauthorized");
      assert.notInclude(String(unauthorized), "provider detail");
      assert.notInclude(String(unauthorized), "test-api-key");
      assert.notInclude(String(unauthorized), "test-api-secret");
      assert.notInclude(String(unauthorized), "+14155550100");
      assert.notInclude(String(unauthorized), "A concise reply.");

      const rateLimited = yield* Effect.gen(function* sendRateLimited() {
        const sendblue = yield* SendblueClient;
        return yield* sendblue.sendMessage(input);
      }).pipe(Effect.provide(makeLayer(429, "{}")), Effect.flip);
      assert.strictEqual(rateLimited.reason, "rateLimited");

      const malformed = yield* Effect.gen(function* sendMalformedResponse() {
        const sendblue = yield* SendblueClient;
        return yield* sendblue.sendMessage(input);
      }).pipe(Effect.provide(makeLayer(200, "{}")), Effect.flip);
      assert.strictEqual(malformed.reason, "malformedResponse");

      const providerRejected = yield* Effect.gen(function* sendProviderError() {
        const sendblue = yield* SendblueClient;
        return yield* sendblue.sendMessage(input);
      }).pipe(
        Effect.provide(
          makeLayer(
            202,
            '{"status":"ERROR","error_message":"provider secret detail"}'
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
  "marks transport and timeout outcomes uncertain without automatic retries",
  () =>
    Effect.gen(function* testUncertainOutcomes() {
      const transportLayer = SendblueClientLive.pipe(
        Layer.provideMerge(
          Layer.merge(
            Layer.succeed(
              HttpClient.HttpClient,
              HttpClient.make((request) =>
                Effect.fail(
                  new HttpClientError.HttpClientError({
                    reason: new HttpClientError.TransportError({ request }),
                  })
                )
              )
            ),
            Layer.succeed(SendblueConfigService, config)
          )
        )
      );
      const transport = yield* Effect.gen(function* sendTransportFailure() {
        const sendblue = yield* SendblueClient;
        return yield* sendblue.sendMessage(input);
      }).pipe(Effect.provide(transportLayer), Effect.flip);
      assert.strictEqual(
        Schema.is(SendblueDeliveryUncertainError)(transport),
        true
      );
      assert.strictEqual(transport.reason, "transport");

      const started = yield* Deferred.make<null>();
      const timeoutLayer = SendblueClientLive.pipe(
        Layer.provideMerge(
          Layer.merge(
            Layer.succeed(
              HttpClient.HttpClient,
              HttpClient.make(() =>
                Deferred.succeed(started, null).pipe(
                  Effect.andThen(Effect.never)
                )
              )
            ),
            Layer.succeed(SendblueConfigService, config)
          )
        )
      );
      const fiber = yield* Effect.forkChild(
        Effect.gen(function* sendWithTimeout() {
          const sendblue = yield* SendblueClient;
          return yield* sendblue.sendMessage(input);
        }).pipe(Effect.provide(timeoutLayer))
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

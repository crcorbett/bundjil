import {
  ChannelDeliveryUncertainError,
  ChannelConversation,
  ChannelOutboundText,
  ChannelProviderRejectedError,
  ChannelTransport,
  ChannelWebhookAuthenticationError,
  ChannelWebhookSchemaError,
} from "@bundjil/channel";
import { runChannelTransportConformance } from "@bundjil/channel/testing";
import { assert, it } from "@effect/vitest";
import { Deferred, Effect, Fiber, Layer, Redacted, Ref, Schema } from "effect";
import * as TestClock from "effect/testing/TestClock";
import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import { layerLive } from "../src/live.layer.js";
import {
  SendblueConfig,
  SendbluePresenceResponse,
  SendblueSendMessageRequest,
  SendblueSendMessageResponse,
  SendblueWebhookBodyLimitBytes,
  SendblueWebhookMessage,
} from "../src/schemas.js";

const fixtures = Effect.gen(function* decodeSendblueFixtures() {
  const config = yield* Schema.decodeEffect(SendblueConfig)({
    apiKey: Redacted.make("test-key"),
    apiSecret: Redacted.make("test-secret"),
    webhookSecret: Redacted.make("test-webhook-secret"),
    line: "+14155550177",
    allowedServices: ["iMessage"],
    typingDurationMillis: 120_000,
  });
  const webhook = yield* Schema.decodeEffect(SendblueWebhookMessage)({
    content: "hello",
    from_number: "+14155550100",
    to_number: "+14155550177",
    sendblue_number: "+14155550177",
    message_handle: "message-1",
    is_outbound: false,
    status: "RECEIVED",
    service: "iMessage",
    group_id: null,
    media_url: null,
  });
  const encodedWebhook = yield* Schema.encodeEffect(
    Schema.fromJsonString(SendblueWebhookMessage)
  )(webhook);
  const conversation = yield* Schema.decodeEffect(ChannelConversation)({
    provider: "sendblue",
    conversationId: "conversation-1",
    participantId: "+14155550100",
    providerAgentId: "+14155550177",
  });
  const text = yield* Schema.decodeEffect(ChannelOutboundText)("reply");
  return { config, webhook, encodedWebhook, conversation, text };
});

const layer = (client: HttpClient.HttpClient, config: SendblueConfig) =>
  layerLive(config).pipe(
    Layer.provide(Layer.succeed(HttpClient.HttpClient, client))
  );

const unusedClient = HttpClient.make((request) =>
  Effect.fail(
    new HttpClientError.HttpClientError({
      reason: new HttpClientError.TransportError({ request }),
    })
  )
);

it.effect("runs the shared ChannelTransport conformance journey", () =>
  Effect.gen(function* testSendblueConformance() {
    const fixture = yield* fixtures;
    const sendResponse = yield* Schema.decodeEffect(
      SendblueSendMessageResponse
    )({ status: "QUEUED", message_handle: "provider-message-1" });
    const presenceResponse = yield* Schema.decodeEffect(
      SendbluePresenceResponse
    )({ status: "SENT" });
    const sendBody = yield* Schema.encodeEffect(
      Schema.fromJsonString(SendblueSendMessageResponse)
    )(sendResponse);
    const presenceBody = yield* Schema.encodeEffect(
      Schema.fromJsonString(SendbluePresenceResponse)
    )(presenceResponse);
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(
            request.url.endsWith("send-message") ? sendBody : presenceBody,
            { status: 202, headers: { "content-type": "application/json" } }
          )
        )
      )
    );
    const result = yield* runChannelTransportConformance({
      webhookRequest: new Request("https://example.invalid/sendblue", {
        method: "POST",
        headers: { "sb-signing-secret": "test-webhook-secret" },
        body: fixture.encodedWebhook,
      }),
      send: { conversation: fixture.conversation, text: fixture.text },
      presence: { conversation: fixture.conversation, action: "start" },
    }).pipe(Effect.provide(layer(client, fixture.config)));

    assert.strictEqual(result.webhook._tag, "Accepted");
    assert.strictEqual(result.send.provider, "sendblue");
    assert.strictEqual(result.send.messageId, "provider-message-1");
    assert.strictEqual(result.presence, "accepted");
  })
);

it.effect(
  "authenticates before decoding and accepts a direct inbound text",
  () =>
    Effect.gen(function* testAuthenticatedWebhook() {
      const fixture = yield* fixtures;
      const accepted = yield* Effect.gen(function* decodeAcceptedWebhook() {
        const transport = yield* ChannelTransport;
        return yield* transport.decodeWebhook(
          new Request("https://example.invalid/sendblue", {
            method: "POST",
            headers: { "sb-signing-secret": "test-webhook-secret" },
            body: fixture.encodedWebhook,
          })
        );
      }).pipe(Effect.provide(layer(unusedClient, fixture.config)));

      assert.strictEqual(accepted._tag, "Accepted");
      if (accepted._tag === "Accepted") {
        assert.strictEqual(accepted.message.messageId, "message-1");
        assert.strictEqual(accepted.message.text, "hello");
      }

      const missing = yield* Effect.gen(
        function* decodeUnauthenticatedWebhook() {
          const transport = yield* ChannelTransport;
          return yield* transport.decodeWebhook(
            new Request("https://example.invalid/sendblue", {
              method: "POST",
              body: fixture.encodedWebhook,
            })
          );
        }
      ).pipe(Effect.provide(layer(unusedClient, fixture.config)), Effect.flip);
      assert.strictEqual(
        Schema.is(ChannelWebhookAuthenticationError)(missing),
        true
      );
    })
);

it.effect("rejects invalid authentication before an invalid body", () =>
  Effect.gen(function* testAuthenticationPrecedence() {
    const fixture = yield* fixtures;
    const error = yield* Effect.gen(function* decodeInvalidAuthentication() {
      const transport = yield* ChannelTransport;
      return yield* transport.decodeWebhook(
        new Request("https://example.invalid/sendblue", {
          method: "POST",
          headers: { "sb-signing-secret": "wrong" },
          body: "not-json",
        })
      );
    }).pipe(Effect.provide(layer(unusedClient, fixture.config)), Effect.flip);
    assert.strictEqual(
      Schema.is(ChannelWebhookAuthenticationError)(error),
      true
    );
  })
);

it.effect("enforces body limits and authenticated payload shape", () =>
  Effect.gen(function* testWebhookPayloadFailures() {
    const fixture = yield* fixtures;
    const decode = (body: string) =>
      Effect.gen(function* decodeWebhookBody() {
        const transport = yield* ChannelTransport;
        return yield* transport.decodeWebhook(
          new Request("https://example.invalid/sendblue", {
            method: "POST",
            headers: { "sb-signing-secret": "test-webhook-secret" },
            body,
          })
        );
      }).pipe(Effect.provide(layer(unusedClient, fixture.config)), Effect.flip);
    const malformed = yield* decode("not-json");
    const oversized = yield* decode(
      "x".repeat(SendblueWebhookBodyLimitBytes + 1)
    );

    assert.strictEqual(Schema.is(ChannelWebhookSchemaError)(malformed), true);
    assert.strictEqual(Schema.is(ChannelWebhookSchemaError)(oversized), true);
  })
);

it.effect(
  "maps authenticated unsupported inputs to closed ignore reasons",
  () =>
    Effect.gen(function* testIgnoredWebhook() {
      const fixture = yield* fixtures;
      const outbound = yield* Schema.encodeEffect(
        Schema.fromJsonString(SendblueWebhookMessage)
      )({ ...fixture.webhook, is_outbound: true });
      const result = yield* Effect.gen(function* decodeIgnoredWebhook() {
        const transport = yield* ChannelTransport;
        return yield* transport.decodeWebhook(
          new Request("https://example.invalid/sendblue", {
            method: "POST",
            headers: { "sb-signing-secret": "test-webhook-secret" },
            body: outbound,
          })
        );
      }).pipe(Effect.provide(layer(unusedClient, fixture.config)));

      assert.deepStrictEqual(result, { _tag: "Ignored", reason: "nonInbound" });
    })
);

it.effect(
  "encodes outbound requests and decodes accepted provider responses",
  () =>
    Effect.gen(function* testSendMessage() {
      const fixture = yield* fixtures;
      const captured = yield* Ref.make("");
      const sendResponse = yield* Schema.decodeEffect(
        SendblueSendMessageResponse
      )({ status: "QUEUED", message_handle: "provider-message-1" });
      const responseBody = yield* Schema.encodeEffect(
        Schema.fromJsonString(SendblueSendMessageResponse)
      )(sendResponse);
      const client = HttpClient.make((request) =>
        Effect.gen(function* captureRequest() {
          const web = yield* HttpClientRequest.toWeb(request).pipe(
            Effect.mapError(
              () =>
                new HttpClientError.HttpClientError({
                  reason: new HttpClientError.TransportError({ request }),
                })
            )
          );
          const body = yield* Effect.tryPromise({
            try: () => web.text(),
            catch: () =>
              new HttpClientError.HttpClientError({
                reason: new HttpClientError.TransportError({ request }),
              }),
          });
          yield* Ref.set(captured, body);
          assert.strictEqual(web.headers.get("sb-api-key-id"), "test-key");
          assert.strictEqual(
            web.headers.get("sb-api-secret-key"),
            "test-secret"
          );
          return HttpClientResponse.fromWeb(
            request,
            new Response(responseBody, {
              status: 202,
              headers: { "content-type": "application/json" },
            })
          );
        })
      );
      const accepted = yield* Effect.gen(function* sendMessage() {
        const transport = yield* ChannelTransport;
        return yield* transport.sendMessage({
          conversation: fixture.conversation,
          text: fixture.text,
        });
      }).pipe(Effect.provide(layer(client, fixture.config)));
      const body = yield* Ref.get(captured);
      const decodedBody = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(SendblueSendMessageRequest)
      )(body);

      assert.strictEqual(decodedBody.content, "reply");
      assert.strictEqual(decodedBody.number, "+14155550100");
      assert.strictEqual(accepted.messageId, "provider-message-1");
    })
);

it.effect(
  "maps rejection and malformed provider responses to safe errors",
  () =>
    Effect.gen(function* testProviderResponseFailures() {
      const fixture = yield* fixtures;
      const errorBody = yield* Schema.encodeEffect(
        Schema.UnknownFromJsonString
      )({
        message: "private provider detail",
      });
      const client = (status: number, body: string) =>
        HttpClient.make((request) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              request,
              new Response(body, {
                status,
                headers: { "content-type": "application/json" },
              })
            )
          )
        );
      const send = (http: HttpClient.HttpClient) =>
        Effect.gen(function* sendRejectedMessage() {
          const transport = yield* ChannelTransport;
          return yield* transport.sendMessage({
            conversation: fixture.conversation,
            text: fixture.text,
          });
        }).pipe(Effect.provide(layer(http, fixture.config)), Effect.flip);
      const rejected = yield* send(client(400, errorBody));
      const malformed = yield* send(client(200, errorBody));

      assert.strictEqual(
        Schema.is(ChannelProviderRejectedError)(rejected),
        true
      );
      assert.strictEqual(
        Schema.is(ChannelProviderRejectedError)(malformed),
        true
      );
      assert.notInclude(String(rejected), "private provider detail");
      assert.notInclude(String(rejected), "test-secret");
    })
);

it.effect("marks transport and timeout sends as uncertain", () =>
  Effect.gen(function* testUncertainSend() {
    const fixture = yield* fixtures;
    const transportClient = HttpClient.make((request) =>
      Effect.fail(
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.TransportError({ request }),
        })
      )
    );
    const send = (client: HttpClient.HttpClient) =>
      Effect.gen(function* sendUncertainMessage() {
        const transport = yield* ChannelTransport;
        return yield* transport.sendMessage({
          conversation: fixture.conversation,
          text: fixture.text,
        });
      }).pipe(Effect.provide(layer(client, fixture.config)), Effect.flip);
    const transport = yield* send(transportClient);
    assert.strictEqual(
      Schema.is(ChannelDeliveryUncertainError)(transport),
      true
    );

    const started = yield* Deferred.make<null>();
    const timeoutClient = HttpClient.make(() =>
      Deferred.succeed(started, null).pipe(Effect.andThen(Effect.never))
    );
    const fiber = yield* Effect.forkChild(send(timeoutClient));
    yield* Deferred.await(started);
    yield* TestClock.adjust("31 seconds");
    const timeout = yield* Fiber.join(fiber);
    assert.strictEqual(Schema.is(ChannelDeliveryUncertainError)(timeout), true);
  })
);

it.effect("encodes presence and maps successful provider acceptance", () =>
  Effect.gen(function* testPresence() {
    const fixture = yield* fixtures;
    const responseBody = yield* Schema.encodeEffect(
      Schema.fromJsonString(SendbluePresenceResponse)
    )({ status: "SENT" });
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(responseBody, {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        )
      )
    );
    const result = yield* Effect.gen(function* setPresence() {
      const transport = yield* ChannelTransport;
      return yield* transport.setPresence({
        conversation: fixture.conversation,
        action: "start",
      });
    }).pipe(Effect.provide(layer(client, fixture.config)));

    assert.strictEqual(result, "accepted");
  })
);

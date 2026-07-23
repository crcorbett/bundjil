import { createHmac } from "node:crypto";

import {
  ChannelConversation,
  ChannelDeliveryUncertainError,
  ChannelOutboundText,
  ChannelProviderRejectedError,
  ChannelTransport,
  ChannelUnavailableError,
  ChannelWebhookAuthenticationError,
  ChannelWebhookSchemaError,
} from "@bundjil/channel";
import { runChannelTransportConformance } from "@bundjil/channel/testing";
import { assert, it } from "@effect/vitest";
import {
  Deferred,
  Effect,
  Fiber,
  Layer,
  Option,
  Redacted,
  Result,
  Schema,
} from "effect";
import * as TestClock from "effect/testing/TestClock";

import { layerClient, PhotonClient } from "../src/client.js";
import type { PhotonClientShape, PhotonSdkFactory } from "../src/client.js";
import {
  PhotonConfig,
  PhotonMessagesWebhook,
  PhotonWebhookBodyLimitBytes,
  PhotonWebhookPayload,
} from "../src/schemas.js";
import { layerTransport } from "../src/transport.layer.js";

const webhookId = "60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c";
const webhookSecret = "test-photon-webhook-secret";

const fixtures = Effect.gen(function* decodePhotonFixtures() {
  const config = yield* Schema.decodeEffect(PhotonConfig)({
    projectId: "test-project",
    projectSecret: Redacted.make("test-project-secret"),
    webhookId,
    webhookSecret: Redacted.make(webhookSecret),
    webhookToleranceSeconds: 300,
  });
  const webhook = yield* Schema.decodeEffect(PhotonWebhookPayload)({
    event: "messages",
    space: {
      id: "opaque-space-1",
      platform: "iMessage",
      type: "dm",
      phone: "shared",
    },
    message: {
      id: "stable-message-1",
      platform: "iMessage",
      direction: "inbound",
      timestamp: "2026-07-21T12:00:00.000Z",
      sender: { id: "+14155550100", platform: "iMessage" },
      space: {
        id: "opaque-space-1",
        platform: "iMessage",
        type: "dm",
        phone: "shared",
      },
      content: { type: "text", text: "hello" },
    },
  });
  const encodedWebhook = yield* Schema.encodeEffect(
    Schema.fromJsonString(PhotonWebhookPayload)
  )(webhook);
  const conversation = yield* Schema.decodeEffect(ChannelConversation)({
    provider: "photon",
    conversationId: "opaque-space-1",
    participantId: "+14155550100",
  });
  const text = yield* Schema.decodeEffect(ChannelOutboundText)("reply");
  return { config, webhook, encodedWebhook, conversation, text };
});

const request = (
  body: string,
  options?: {
    readonly event?: string;
    readonly id?: string;
    readonly secret?: string;
    readonly signature?: string;
    readonly timestamp?: number;
  }
) => {
  const timestamp = options?.timestamp ?? 0;
  const signature =
    options?.signature ??
    `v0=${createHmac("sha256", options?.secret ?? webhookSecret)
      .update(`v0:${timestamp}:${body}`)
      .digest("hex")}`;
  return new Request("https://example.invalid/photon", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-spectrum-event": options?.event ?? "messages",
      "x-spectrum-signature": signature,
      "x-spectrum-timestamp": String(timestamp),
      "x-spectrum-webhook-id": options?.id ?? webhookId,
    },
    body,
  });
};

const successClient = PhotonClient.of({
  sendMessage: () => Effect.succeed({ id: "provider-message-1" }),
  setPresence: () => Effect.sync(() => {}),
});

const layer = (config: typeof PhotonConfig.Type, client = successClient) =>
  layerTransport(config).pipe(
    Layer.provide(Layer.succeed(PhotonClient, client))
  );

it.effect("runs the shared ChannelTransport conformance journey", () =>
  Effect.gen(function* testPhotonConformance() {
    const fixture = yield* fixtures;
    const result = yield* runChannelTransportConformance({
      webhookRequest: request(fixture.encodedWebhook),
      send: { conversation: fixture.conversation, text: fixture.text },
      presence: { conversation: fixture.conversation, action: "start" },
    }).pipe(Effect.provide(layer(fixture.config)));

    assert.strictEqual(result.webhook._tag, "Accepted");
    assert.strictEqual(result.send.provider, "photon");
    assert.strictEqual(result.send.messageId, "provider-message-1");
    assert.strictEqual(result.presence, "accepted");
  })
);

it.effect("authenticates signed bytes before decoding the payload", () =>
  Effect.gen(function* testPhotonAuthentication() {
    const fixture = yield* fixtures;
    const decode = (webhookRequest: Request) =>
      Effect.gen(function* decodeWebhook() {
        const transport = yield* ChannelTransport;
        return yield* transport.decodeWebhook(webhookRequest);
      }).pipe(Effect.provide(layer(fixture.config)));

    const valid = yield* decode(request(fixture.encodedWebhook));
    assert.strictEqual(valid._tag, "Accepted");

    const missing = yield* decode(
      new Request("https://example.invalid/photon", {
        method: "POST",
        body: fixture.encodedWebhook,
      })
    ).pipe(Effect.flip);
    const invalid = yield* decode(
      request("not-json", { secret: "wrong-secret" })
    ).pipe(Effect.flip);
    const wrongWebhook = yield* decode(
      request(fixture.encodedWebhook, {
        id: "00000000-0000-0000-0000-000000000000",
      })
    ).pipe(Effect.flip);

    assert.strictEqual(
      Schema.is(ChannelWebhookAuthenticationError)(missing),
      true
    );
    assert.strictEqual(
      Schema.is(ChannelWebhookAuthenticationError)(invalid),
      true
    );
    assert.strictEqual(
      Schema.is(ChannelWebhookAuthenticationError)(wrongWebhook),
      true
    );
  })
);

it.effect("rejects stale signatures and bounded or malformed bodies", () =>
  Effect.gen(function* testPhotonPayloadFailures() {
    const fixture = yield* fixtures;
    const decode = (webhookRequest: Request) =>
      Effect.gen(function* decodeWebhook() {
        const transport = yield* ChannelTransport;
        return yield* transport.decodeWebhook(webhookRequest);
      }).pipe(Effect.provide(layer(fixture.config)), Effect.flip);

    yield* TestClock.adjust("301 seconds");
    const stale = yield* decode(request(fixture.encodedWebhook));
    const malformed = yield* decode(request("not-json", { timestamp: 301 }));
    const oversized = yield* decode(
      request("x".repeat(PhotonWebhookBodyLimitBytes + 1), { timestamp: 301 })
    );

    assert.strictEqual(
      Schema.is(ChannelWebhookAuthenticationError)(stale),
      true
    );
    assert.strictEqual(Schema.is(ChannelWebhookSchemaError)(malformed), true);
    assert.strictEqual(Schema.is(ChannelWebhookSchemaError)(oversized), true);
  })
);

it.effect(
  "ignores unsupported events and preserves stable retry identity",
  () =>
    Effect.gen(function* testPhotonEventPolicy() {
      const fixture = yield* fixtures;
      const decode = (webhookRequest: Request) =>
        Effect.gen(function* decodeWebhook() {
          const transport = yield* ChannelTransport;
          return yield* transport.decodeWebhook(webhookRequest);
        }).pipe(Effect.provide(layer(fixture.config)));
      const unsupported = yield* Schema.encodeEffect(
        Schema.fromJsonString(PhotonWebhookPayload)
      )({ event: "future-event" });
      const ignored = yield* decode(
        request(unsupported, { event: "future-event" })
      );
      const first = yield* decode(request(fixture.encodedWebhook));
      const retry = yield* decode(request(fixture.encodedWebhook));

      assert.deepStrictEqual(ignored, {
        _tag: "Ignored",
        reason: "unsupportedEvent",
      });
      assert.strictEqual(first._tag, "Accepted");
      assert.strictEqual(retry._tag, "Accepted");
      if (first._tag === "Accepted" && retry._tag === "Accepted") {
        assert.strictEqual(first.message.messageId, retry.message.messageId);
      }
    })
);

it.effect("rejects inconsistent messages and ignores unsupported content", () =>
  Effect.gen(function* testPhotonMessagePolicy() {
    const fixture = yield* fixtures;
    const messagesWebhook = Schema.is(PhotonMessagesWebhook)(fixture.webhook)
      ? fixture.webhook
      : yield* Effect.die("messages fixture required");
    const encode = Schema.encodeEffect(
      Schema.fromJsonString(PhotonWebhookPayload)
    );
    const decode = (body: string) =>
      Effect.gen(function* decodeWebhook() {
        const transport = yield* ChannelTransport;
        return yield* transport.decodeWebhook(request(body));
      }).pipe(Effect.provide(layer(fixture.config)));
    const unsupported = yield* encode({
      ...messagesWebhook,
      message: {
        ...messagesWebhook.message,
        content: { type: "attachment" },
      },
    });
    const inconsistent = yield* encode({
      ...messagesWebhook,
      message: {
        ...messagesWebhook.message,
        space: { ...messagesWebhook.message.space, id: "different-space" },
      },
    });
    const ignored = yield* decode(unsupported);
    const invalid = yield* decode(inconsistent).pipe(Effect.flip);

    assert.deepStrictEqual(ignored, {
      _tag: "Ignored",
      reason: "unsupportedEvent",
    });
    assert.strictEqual(Schema.is(ChannelWebhookSchemaError)(invalid), true);
  })
);

it.effect(
  "ignores group spaces that cannot be reconstructed from a webhook",
  () =>
    Effect.gen(function* testPhotonGroupPolicy() {
      const fixture = yield* fixtures;
      const messagesWebhook = Schema.is(PhotonMessagesWebhook)(fixture.webhook)
        ? fixture.webhook
        : yield* Effect.die("messages fixture required");
      const body = yield* Schema.encodeEffect(
        Schema.fromJsonString(PhotonWebhookPayload)
      )({
        ...messagesWebhook,
        space: { ...messagesWebhook.space, type: "group" },
        message: {
          ...messagesWebhook.message,
          space: { ...messagesWebhook.message.space, type: "group" },
        },
      });
      const result = yield* Effect.gen(function* decodeWebhook() {
        const transport = yield* ChannelTransport;
        return yield* transport.decodeWebhook(request(body));
      }).pipe(Effect.provide(layer(fixture.config)));

      assert.deepStrictEqual(result, {
        _tag: "Ignored",
        reason: "unsupportedConversation",
      });
    })
);

it.effect(
  "decodes complete SDK results and keeps send failures uncertain",
  () =>
    Effect.gen(function* testPhotonSendFailures() {
      const fixture = yield* fixtures;
      const send = (client: PhotonClientShape) =>
        Effect.gen(function* sendMessage() {
          const transport = yield* ChannelTransport;
          return yield* transport.sendMessage({
            conversation: fixture.conversation,
            text: fixture.text,
          });
        }).pipe(Effect.provide(layer(fixture.config, client)), Effect.flip);
      const malformed = yield* send(
        PhotonClient.of({
          sendMessage: () =>
            Effect.fail(
              new ChannelProviderRejectedError({
                provider: "photon",
                operation: "sendMessage",
                reason: "invalidPayload",
                retry: "never",
              })
            ),
          setPresence: () => Effect.sync(() => {}),
        })
      );
      const uncertain = yield* send(
        PhotonClient.of({
          sendMessage: () =>
            Effect.fail(
              new ChannelDeliveryUncertainError({
                provider: "photon",
                operation: "sendMessage",
                reason: "uncertain",
                retry: "readbackRequired",
              })
            ),
          setPresence: () => Effect.sync(() => {}),
        })
      );

      assert.strictEqual(
        Schema.is(ChannelProviderRejectedError)(malformed),
        true
      );
      assert.strictEqual(
        Schema.is(ChannelDeliveryUncertainError)(uncertain),
        true
      );
      assert.notInclude(String(uncertain), "test-project-secret");
    })
);

it.effect(
  "times out ambiguous sends and presence without callback escape",
  () =>
    Effect.gen(function* testPhotonTimeouts() {
      const fixture = yield* fixtures;
      const sendStarted = yield* Deferred.make<null>();
      const presenceStarted = yield* Deferred.make<null>();
      const client = PhotonClient.of({
        sendMessage: () =>
          Deferred.succeed(sendStarted, null).pipe(
            Effect.andThen(Effect.never)
          ),
        setPresence: () =>
          Deferred.succeed(presenceStarted, null).pipe(
            Effect.andThen(Effect.never)
          ),
      });
      const sendFiber = yield* Effect.gen(function* sendMessage() {
        const transport = yield* ChannelTransport;
        return yield* transport.sendMessage({
          conversation: fixture.conversation,
          text: fixture.text,
        });
      }).pipe(
        Effect.provide(layer(fixture.config, client)),
        Effect.flip,
        Effect.forkChild
      );
      yield* Deferred.await(sendStarted);
      yield* TestClock.adjust("31 seconds");
      const sendError = yield* Fiber.join(sendFiber);
      assert.strictEqual(
        Schema.is(ChannelDeliveryUncertainError)(sendError),
        true
      );

      const presenceFiber = yield* Effect.gen(function* setPresence() {
        const transport = yield* ChannelTransport;
        return yield* transport.setPresence({
          conversation: fixture.conversation,
          action: "stop",
        });
      }).pipe(
        Effect.provide(layer(fixture.config, client)),
        Effect.flip,
        Effect.forkChild
      );
      yield* Deferred.await(presenceStarted);
      yield* TestClock.adjust("16 seconds");
      const presenceError = yield* Fiber.join(presenceFiber);
      assert.strictEqual(
        Schema.is(ChannelUnavailableError)(presenceError),
        true
      );
    })
);

it.effect("separates direct-space resolution failure from ambiguous send", () =>
  Effect.gen(function* testPhotonSdkFailureBoundaries() {
    const fixture = yield* fixtures;
    const run = (factory: PhotonSdkFactory) =>
      Effect.gen(function* runSdkClient() {
        const client = yield* PhotonClient;
        return yield* client.sendMessage(
          fixture.conversation.participantId,
          fixture.text
        );
      }).pipe(
        Effect.provide(layerClient(fixture.config, factory)),
        Effect.result
      );
    const unavailableResult = yield* run({
      acquire: async () => ({
        resolveDirectSpace: async () => {
          throw new Error("private direct-space detail");
        },
        stop: async () => {},
      }),
    });
    const uncertainResult = yield* run({
      acquire: async () => ({
        resolveDirectSpace: async () => ({
          sendMessage: async () => {
            throw new Error("private send detail");
          },
          setPresence: async () => {},
        }),
        stop: async () => {},
      }),
    });
    const malformedResult = yield* run({
      acquire: async () => ({
        resolveDirectSpace: async () => ({
          sendMessage: async () => {},
          setPresence: async () => {},
        }),
        stop: async () => {},
      }),
    });

    assert.strictEqual(Result.isFailure(unavailableResult), true);
    assert.strictEqual(Result.isFailure(uncertainResult), true);
    assert.strictEqual(Result.isFailure(malformedResult), true);
    const unavailable = Option.getOrThrow(Result.getFailure(unavailableResult));
    const uncertain = Option.getOrThrow(Result.getFailure(uncertainResult));
    const malformed = Option.getOrThrow(Result.getFailure(malformedResult));
    assert.strictEqual(Schema.is(ChannelUnavailableError)(unavailable), true);
    assert.strictEqual(
      Schema.is(ChannelDeliveryUncertainError)(uncertain),
      true
    );
    assert.strictEqual(
      Schema.is(ChannelProviderRejectedError)(malformed),
      true
    );
    assert.notInclude(String(unavailable), "private direct-space detail");
    assert.notInclude(String(uncertain), "private send detail");
  })
);

it.effect(
  "acquires once and observes cleanup failure with a safe release",
  () =>
    Effect.gen(function* testPhotonLifecycle() {
      const fixture = yield* fixtures;
      const stops = { count: 0 };
      const participants: string[] = [];
      const factory: PhotonSdkFactory = {
        acquire: async () => ({
          resolveDirectSpace: async (participantId) => {
            participants.push(participantId);
            return {
              sendMessage: async () => ({ id: "provider-message-1" }),
              setPresence: async () => {},
            };
          },
          stop: async () => {
            stops.count += 1;
            throw new Error("private cleanup detail");
          },
        }),
      };
      const result = yield* Effect.gen(function* useScopedPhotonClient() {
        const client = yield* PhotonClient;
        const send = yield* client.sendMessage(
          fixture.conversation.participantId,
          fixture.text
        );
        yield* client.setPresence(fixture.conversation.participantId, "start");
        return send;
      }).pipe(Effect.provide(layerClient(fixture.config, factory)));

      assert.deepStrictEqual(result, { id: "provider-message-1" });
      assert.deepStrictEqual(participants, [
        fixture.conversation.participantId,
        fixture.conversation.participantId,
      ]);
      assert.strictEqual(stops.count, 2);
    })
);

it.effect(
  "models operation-scoped acquisition failure without eager setup",
  () =>
    Effect.gen(function* testPhotonAcquisitionFailure() {
      const fixture = yield* fixtures;
      let acquisitions = 0;
      const clientLayer = layerClient(fixture.config, {
        acquire: async () => {
          acquisitions += 1;
          throw new Error("private acquisition detail");
        },
      });
      const client = yield* PhotonClient.pipe(Effect.provide(clientLayer));

      assert.strictEqual(acquisitions, 0);

      const result = yield* client
        .sendMessage(fixture.conversation.participantId, fixture.text)
        .pipe(Effect.result);

      assert.strictEqual(Result.isFailure(result), true);
      const error = Option.getOrThrow(Result.getFailure(result));
      assert.strictEqual(Schema.is(ChannelUnavailableError)(error), true);
      assert.strictEqual(acquisitions, 1);
      assert.notInclude(String(error), "private acquisition detail");
    })
);

it.effect("verifies webhooks without acquiring the outbound SDK", () =>
  Effect.gen(function* testLazyPhotonWebhookBoundary() {
    const fixture = yield* fixtures;
    let acquisitions = 0;
    const transportLayer = layerTransport(fixture.config).pipe(
      Layer.provide(
        layerClient(fixture.config, {
          acquire: async () => {
            acquisitions += 1;
            throw new Error("outbound SDK must stay lazy");
          },
        })
      )
    );
    const transport = yield* ChannelTransport.pipe(
      Effect.provide(transportLayer)
    );

    const unsupportedBody = '{"event":"health"}';
    const result = yield* transport.decodeWebhook(
      request(unsupportedBody, {
        event: "health",
      })
    );

    assert.deepStrictEqual(result, {
      _tag: "Ignored",
      reason: "unsupportedEvent",
    });
    assert.strictEqual(acquisitions, 0);
  })
);

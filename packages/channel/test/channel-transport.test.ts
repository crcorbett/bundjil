import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";

import {
  ChannelOutboundText,
  ChannelSendAccepted,
  ChannelTransport,
  ChannelWebhookResult,
} from "../src/index.js";
import { layerMemory } from "../src/memory.layer.js";

const decodedFixture = Effect.gen(function* decodeChannelFixture() {
  const webhook = yield* Schema.decodeEffect(ChannelWebhookResult)({
    _tag: "Accepted",
    message: {
      messageId: "inbound-1",
      conversation: {
        provider: "photon",
        conversationId: "conversation-1",
        participantId: "participant-1",
      },
      text: "hello",
    },
  });
  const send = yield* Schema.decodeEffect(ChannelSendAccepted)({
    provider: "photon",
    messageId: "outbound-1",
  });
  return { webhook, send };
});

it.effect("provides one nominal transport through the memory Layer", () =>
  Effect.gen(function* testMemoryTransport() {
    const fixture = yield* decodedFixture;
    const result = yield* Effect.gen(function* runMemoryTransport() {
      const transport = yield* ChannelTransport;
      const webhook = yield* transport.decodeWebhook(
        new Request("https://example.invalid/webhook")
      );
      const send = yield* transport.sendMessage({
        conversation:
          fixture.webhook._tag === "Accepted"
            ? fixture.webhook.message.conversation
            : yield* Effect.die("accepted fixture required"),
        text: yield* Schema.decodeEffect(ChannelOutboundText)("reply"),
      });
      const presence = yield* transport.setPresence({
        conversation:
          fixture.webhook._tag === "Accepted"
            ? fixture.webhook.message.conversation
            : yield* Effect.die("accepted fixture required"),
        action: "start",
      });
      return { webhook, send, presence };
    }).pipe(
      Effect.provide(
        layerMemory({
          webhook: fixture.webhook,
          send: fixture.send,
          presence: "accepted",
        })
      )
    );

    assert.equal(result.webhook._tag, "Accepted");
    assert.equal(result.send.messageId, "outbound-1");
    assert.equal(result.presence, "accepted");
  })
);

it.effect("round-trips the encoded webhook contract", () =>
  Effect.gen(function* roundTripWebhook() {
    const fixture = yield* decodedFixture;
    const encoded = yield* Schema.encodeEffect(ChannelWebhookResult)(
      fixture.webhook
    );
    const decoded = yield* Schema.decodeEffect(ChannelWebhookResult)(encoded);

    assert.deepEqual(decoded, fixture.webhook);
  })
);

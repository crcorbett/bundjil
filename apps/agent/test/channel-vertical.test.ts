import {
  ChannelOutboundText,
  ChannelSendAccepted,
  ChannelTransport,
  ChannelWebhookResult,
} from "@bundjil/channel";
import { layerMemory as ChannelTransportMemory } from "@bundjil/channel/memory";
import { layerMemory as PhotonTransportMemory } from "@bundjil/photon/memory";
import { layerMemory as SendblueTransportMemory } from "@bundjil/sendblue/memory";
import { PersistenceMemory } from "@bundjil/store/memory";
import { assert, it } from "@effect/vitest";
import { Array, Effect, Layer, Schema, pipe } from "effect";

import {
  Channel,
  ChannelAdapterState,
  ChannelIdentityMemory,
  ChannelLive,
  ChannelReplayMemory,
  ChannelRouter,
  ChannelRouterMemory,
  EveChannelDispatch,
  EveChannelDispatchFailureMemory,
  EveChannelDispatchMemory,
} from "../agent/lib/channel/index.js";
import {
  ChannelIdentityRecords,
  ChannelOutboundCoordinates,
  ChannelReplayOptions,
} from "../agent/lib/channel/schemas.js";
import type { ChannelAdapterStateEncoded } from "../agent/lib/channel/schemas.js";

const fixtures = Effect.gen(function* decodeChannelVerticalFixtures() {
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
    messageId: "provider-message-1",
  });
  const identities = yield* Schema.decodeEffect(ChannelIdentityRecords)([
    { participantId: "participant-1", principalId: "principal-1" },
  ]);
  const replay = yield* Schema.decodeEffect(ChannelReplayOptions)({
    prefix: "channel:v1:test:",
    leaseMilliseconds: 30_000,
    ttlMilliseconds: 86_400_000,
  });
  const coordinates = yield* Schema.decodeEffect(ChannelOutboundCoordinates)({
    sessionId: "session-1",
    turnId: "turn-1",
    sequence: 0,
  });
  const message =
    webhook._tag === "Accepted"
      ? webhook.message
      : yield* Effect.die("accepted fixture required");
  return { webhook, message, send, identities, replay, coordinates };
});

const channelLayer = fixtures.pipe(
  Effect.map((fixture) => {
    const dependencies = Layer.mergeAll(
      ChannelTransportMemory({
        webhook: fixture.webhook,
        send: fixture.send,
        presence: "accepted",
      }),
      ChannelIdentityMemory(fixture.identities),
      ChannelRouterMemory,
      ChannelReplayMemory(fixture.replay).pipe(Layer.provide(PersistenceMemory))
    );
    return ChannelLive.pipe(Layer.provide(dependencies));
  })
);

it.effect("runs the same clean app journey from both provider Layers", () =>
  Effect.gen(function* testProviderSubstitution() {
    const fixture = yield* fixtures;
    const text = yield* Schema.decodeEffect(ChannelOutboundText)("reply");
    const sendblueWebhook = yield* Schema.decodeEffect(ChannelWebhookResult)({
      _tag: "Accepted",
      message: {
        ...fixture.message,
        conversation: {
          ...fixture.message.conversation,
          provider: "sendblue",
        },
      },
    });
    const sendblueSend = yield* Schema.decodeEffect(ChannelSendAccepted)({
      provider: "sendblue",
      messageId: "provider-message-1",
    });
    const providers = [
      {
        expected: "sendblue",
        layer: SendblueTransportMemory({
          webhook: sendblueWebhook,
          send: sendblueSend,
          presence: "accepted",
        }),
      },
      {
        expected: "photon",
        layer: PhotonTransportMemory({
          webhook: fixture.webhook,
          send: fixture.send,
          presence: "accepted",
        }),
      },
    ];

    const results = yield* Effect.all(
      providers.map(({ expected, layer }) => {
        const dependencies = Layer.mergeAll(
          layer,
          ChannelIdentityMemory(fixture.identities),
          ChannelRouterMemory,
          ChannelReplayMemory(fixture.replay).pipe(
            Layer.provide(PersistenceMemory)
          )
        );
        return Effect.gen(function* runProviderJourney() {
          const channel = yield* Channel;
          const inbound = yield* channel.decodeWebhook(
            new Request("https://example.invalid/webhook")
          );
          if (inbound._tag !== "Accepted") {
            return yield* Effect.die("accepted provider fixture required");
          }
          const prepared = yield* channel.prepareInbound(inbound.message);
          if (prepared._tag !== "Dispatch") {
            return yield* Effect.die("fresh provider dispatch required");
          }
          const presence = yield* channel.handleEvent({
            _tag: "PresenceRequested",
            action: "start",
            conversation: inbound.message.conversation,
          });
          const outbound = yield* channel.handleEvent({
            _tag: "OutboundTextReady",
            coordinates: fixture.coordinates,
            conversation: inbound.message.conversation,
            text,
          });
          return {
            expected,
            provider: inbound.message.conversation.provider,
            presence: presence.outcome,
            outbound: outbound.outcome,
          };
        }).pipe(Effect.provide(ChannelLive.pipe(Layer.provide(dependencies))));
      })
    );

    for (const result of results) {
      assert.strictEqual(result.provider, result.expected);
      assert.strictEqual(result.presence._tag, "Presence");
      assert.strictEqual(result.outbound._tag, "SendAccepted");
    }
  })
);

it.effect(
  "runs accepted ingress through fresh identity routing replay and dispatch",
  () =>
    Effect.gen(function* testAcceptedVerticalJourney() {
      const layer = yield* channelLayer;
      const fixture = yield* fixtures;
      const result = yield* Effect.gen(function* runAcceptedVerticalJourney() {
        const channel = yield* Channel;
        const dispatch = yield* EveChannelDispatch;
        const decoded = yield* channel.decodeWebhook(
          new Request("https://example.invalid/webhook")
        );
        assert.strictEqual(decoded._tag, "Accepted");
        if (decoded._tag !== "Accepted") {
          return yield* Effect.die("accepted fixture required");
        }
        const prepared = yield* channel.prepareInbound(decoded.message);
        assert.strictEqual(prepared._tag, "Dispatch");
        if (prepared._tag !== "Dispatch") {
          return yield* Effect.die("dispatch required");
        }
        yield* dispatch.dispatch(prepared.prepared);
        yield* channel.completeInbound(prepared.prepared.claim);
        return prepared.prepared;
      }).pipe(Effect.provide(Layer.mergeAll(layer, EveChannelDispatchMemory)));

      assert.strictEqual(result.principalId, "principal-1");
      assert.strictEqual(
        result.continuationToken,
        "channel:v1:photon:conversation-1"
      );
      assert.deepStrictEqual(result.message, fixture.message);
    })
);

it.effect("returns ignored ingress without app policy", () =>
  Effect.gen(function* testIgnoredIngress() {
    const fixture = yield* fixtures;
    const ignored = yield* Schema.decodeEffect(ChannelWebhookResult)({
      _tag: "Ignored",
      reason: "unsupportedEvent",
    });
    const result = yield* Effect.gen(function* runIgnoredIngress() {
      const transport = yield* ChannelTransport;
      return yield* transport.decodeWebhook(
        new Request("https://example.invalid/webhook")
      );
    }).pipe(
      Effect.provide(
        ChannelTransportMemory({
          webhook: ignored,
          send: fixture.send,
          presence: "no-op",
        })
      )
    );
    assert.deepStrictEqual(result, ignored);
  })
);

it.effect("rejects an identity that is not explicitly configured", () =>
  Effect.gen(function* testIdentityRejection() {
    const layer = yield* channelLayer;
    const fixture = yield* fixtures;
    const untrusted = yield* Schema.decodeEffect(ChannelWebhookResult)({
      _tag: "Accepted",
      message: {
        ...fixture.message,
        conversation: {
          ...fixture.message.conversation,
          participantId: "participant-2",
        },
      },
    });
    const untrustedMessage =
      untrusted._tag === "Accepted"
        ? untrusted.message
        : yield* Effect.die("accepted fixture required");
    const error = yield* Effect.gen(function* prepareUntrustedIdentity() {
      const channel = yield* Channel;
      return yield* channel.prepareInbound(untrustedMessage);
    }).pipe(Effect.provide(layer), Effect.flip);

    assert.strictEqual(error._tag, "ChannelIdentityError");
  })
);

it.effect("atomically accepts only one concurrent inbound claim", () =>
  Effect.gen(function* testConcurrentClaim() {
    const layer = yield* channelLayer;
    const fixture = yield* fixtures;
    const results = yield* Effect.gen(function* prepareConcurrentInbound() {
      const channel = yield* Channel;
      return yield* Effect.all(
        [
          channel.prepareInbound(fixture.message),
          channel.prepareInbound(fixture.message),
        ],
        { concurrency: "unbounded" }
      );
    }).pipe(Effect.provide(layer));

    assert.strictEqual(
      pipe(
        results,
        Array.filter((result) => result._tag === "Dispatch")
      ).length,
      1
    );
    assert.strictEqual(
      pipe(
        results,
        Array.filter((result) => result._tag === "Duplicate")
      ).length,
      1
    );
  })
);

it.effect("reports request-scoped Eve dispatch failure", () =>
  Effect.gen(function* testDispatchFailure() {
    const fixture = yield* fixtures;
    const layer = yield* channelLayer;
    const exit = yield* Effect.gen(function* dispatchInbound() {
      const channel = yield* Channel;
      const dispatch = yield* EveChannelDispatch;
      const prepared = yield* channel.prepareInbound(fixture.message);
      if (prepared._tag !== "Dispatch") {
        return yield* Effect.die("dispatch required");
      }
      return yield* dispatch.dispatch(prepared.prepared);
    }).pipe(
      Effect.provide(Layer.mergeAll(layer, EveChannelDispatchFailureMemory)),
      Effect.exit
    );
    assert.strictEqual(exit._tag, "Failure");
  })
);

it.effect(
  "handles stateless presence and suppresses duplicate outbound sends",
  () =>
    Effect.gen(function* testChannelEvents() {
      const fixture = yield* fixtures;
      const layer = yield* channelLayer;
      const text = yield* Schema.decodeEffect(ChannelOutboundText)("reply");
      const results = yield* Effect.gen(function* handleChannelEvents() {
        const channel = yield* Channel;
        const presence = yield* channel.handleEvent({
          _tag: "PresenceRequested",
          action: "start",
          conversation: fixture.message.conversation,
        });
        const first = yield* channel.handleEvent({
          _tag: "OutboundTextReady",
          coordinates: fixture.coordinates,
          conversation: fixture.message.conversation,
          text,
        });
        const duplicate = yield* channel.handleEvent({
          _tag: "OutboundTextReady",
          coordinates: fixture.coordinates,
          conversation: fixture.message.conversation,
          text,
        });
        return { presence, first, duplicate };
      }).pipe(Effect.provide(layer));

      assert.deepStrictEqual(results.presence.outcome, {
        _tag: "Presence",
        result: "accepted",
      });
      assert.strictEqual(results.first.outcome._tag, "SendAccepted");
      assert.strictEqual(results.duplicate.outcome._tag, "Duplicate");
    })
);

it.effect("round-trips one immutable encoded adapter snapshot", () =>
  Effect.gen(function* testAdapterStateRoundTrip() {
    const fixture = yield* fixtures;
    const state = yield* Schema.decodeEffect(ChannelAdapterState)({
      snapshot: {
        _tag: "V1",
        conversation: fixture.message.conversation,
      },
    });
    const encoded: ChannelAdapterStateEncoded =
      yield* Schema.encodeEffect(ChannelAdapterState)(state);
    const decoded = yield* Schema.decodeEffect(ChannelAdapterState)(encoded);

    assert.deepStrictEqual(decoded, state);
    assert.notStrictEqual(decoded, state);
  })
);

it.effect("derives stable routing without importing the legacy provider", () =>
  Effect.gen(function* testStableRouting() {
    const fixture = yield* fixtures;
    const tokens = yield* Effect.gen(function* routeConversation() {
      const router = yield* ChannelRouter;
      return yield* Effect.all([
        router.route(fixture.message.conversation),
        router.route(fixture.message.conversation),
      ]);
    }).pipe(Effect.provide(ChannelRouterMemory));

    assert.strictEqual(tokens[0], tokens[1]);
  })
);

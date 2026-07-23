import { Effect, Schema } from "effect";
import type { ManagedRuntime } from "effect";
import { defineChannel, POST } from "eve/channels";
import type { ChannelEvents } from "eve/channels";

import { Channel } from "./channel.js";
import {
  EveChannelDispatch,
  layerEve as EveChannelDispatchEve,
} from "./dispatch.js";
import {
  ChannelAdapterState,
  ChannelEvent,
  ChannelWebhookQuery,
} from "./schemas.js";
import type {
  ChannelMutableAdapterStateEncoded,
  ChannelWebhookPath,
  ChannelWebhookProofPolicy,
} from "./schemas.js";

interface ChannelEveContext {
  readonly state: ChannelMutableAdapterStateEncoded;
}

export const makeChannelEveEvents = <E>(
  channelRuntime: ManagedRuntime.ManagedRuntime<Channel, E>
): ChannelEvents<ChannelEveContext> => {
  const presence = (
    state: ChannelMutableAdapterStateEncoded,
    action: "start" | "stop"
  ) =>
    channelRuntime.runPromise(
      Effect.gen(function* handleChannelPresence() {
        const channel = yield* Channel;
        const decodedState =
          yield* Schema.decodeEffect(ChannelAdapterState)(state);
        const event = yield* Schema.decodeUnknownEffect(ChannelEvent)({
          _tag: "PresenceRequested",
          action,
          conversation: decodedState.snapshot.conversation,
        });
        const result = yield* channel.handleEvent(event);
        const encoded = yield* Schema.encodeEffect(ChannelAdapterState)({
          snapshot: result.state,
        });
        state.snapshot = encoded.snapshot;
      })
    );

  return {
    "authorization.completed"(event, channel) {
      return event.outcome === "authorized"
        ? presence(channel.state, "start")
        : Promise.resolve();
    },
    "authorization.required"(_event, channel) {
      return presence(channel.state, "stop");
    },
    "input.requested"(_event, channel) {
      return presence(channel.state, "stop");
    },
    "message.completed"(event, channel, context) {
      return channelRuntime.runPromise(
        Effect.gen(function* handleCompletedChannelMessage() {
          if (
            event.finishReason === "tool-calls" ||
            event.message === null ||
            event.message.trim().length === 0
          ) {
            return;
          }
          const service = yield* Channel;
          const decodedState = yield* Schema.decodeEffect(ChannelAdapterState)(
            channel.state
          );
          const outbound = yield* Schema.decodeUnknownEffect(ChannelEvent)({
            _tag: "OutboundTextReady",
            conversation: decodedState.snapshot.conversation,
            coordinates: {
              sequence: event.sequence,
              sessionId: context.session.id,
              turnId: event.turnId,
            },
            text: event.message.trim(),
          });
          const result = yield* service.handleEvent(outbound);
          const encoded = yield* Schema.encodeEffect(ChannelAdapterState)({
            snapshot: result.state,
          });
          channel.state.snapshot = encoded.snapshot;
        })
      );
    },
    "session.completed"(_event, channel) {
      return presence(channel.state, "stop");
    },
    "session.failed"(_event, channel) {
      return presence(channel.state, "stop");
    },
    "session.waiting"(_event, channel) {
      return presence(channel.state, "stop");
    },
    "turn.completed"(_event, channel) {
      return presence(channel.state, "stop");
    },
    "turn.failed"(_event, channel) {
      return presence(channel.state, "stop");
    },
    "turn.started"(_event, channel) {
      return presence(channel.state, "start");
    },
  };
};

export const makeChannelEveChannel = <E>(
  channelRuntime: ManagedRuntime.ManagedRuntime<Channel, E>,
  webhookPath: ChannelWebhookPath,
  proofPolicy: ChannelWebhookProofPolicy
) =>
  defineChannel<ChannelMutableAdapterStateEncoded, ChannelEveContext>({
    context(state) {
      return { state };
    },
    events: makeChannelEveEvents(channelRuntime),
    routes: [
      POST(webhookPath, async (request, { send, waitUntil }) => {
        const result = await channelRuntime.runPromise(
          Effect.gen(function* handleChannelWebhook() {
            const query = yield* Schema.decodeUnknownEffect(
              ChannelWebhookQuery
            )(Object.fromEntries(new URL(request.url).searchParams));
            const channel = yield* Channel;
            const decoded = yield* channel.decodeWebhook(request);
            if (decoded._tag === "Ignored") {
              return { response: new Response(null, { status: 204 }) };
            }
            const prepared = yield* channel.prepareInbound(decoded.message);
            if (prepared._tag === "Duplicate") {
              return { response: new Response(null, { status: 204 }) };
            }
            const background = Effect.gen(function* dispatchChannelInbound() {
              const dispatch = yield* EveChannelDispatch;
              yield* dispatch.dispatch(prepared.prepared);
              yield* channel.completeInbound(prepared.prepared.claim);
            }).pipe(
              Effect.tapError((error) =>
                Effect.logError(`Channel inbound failed: ${error._tag}`)
              ),
              Effect.provide(EveChannelDispatchEve(send))
            );
            if (
              proofPolicy === "provider-retry" &&
              query["bundjil-proof"] === "retry-once"
            ) {
              yield* background;
              return { response: new Response(null, { status: 503 }) };
            }
            const fiber = yield* Effect.forkDetach(background, {
              startImmediately: true,
            });
            return {
              fiber,
              response: new Response(null, { status: 202 }),
            };
          }).pipe(
            Effect.catchTags({
              ChannelIdentityError: () =>
                Effect.succeed({
                  response: new Response(null, { status: 204 }),
                }),
              ChannelReplayError: () =>
                Effect.succeed({
                  response: new Response(null, { status: 503 }),
                }),
              ChannelRoutingError: () =>
                Effect.succeed({
                  response: new Response(null, { status: 503 }),
                }),
              ChannelWebhookAuthenticationError: () =>
                Effect.succeed({
                  response: new Response(null, { status: 401 }),
                }),
              ChannelWebhookSchemaError: () =>
                Effect.succeed({
                  response: new Response(null, { status: 400 }),
                }),
            })
          )
        );
        if ("fiber" in result) {
          const completion = Promise.withResolvers<undefined>();
          result.fiber.addObserver(() => {
            completion.resolve();
          });
          waitUntil(completion.promise);
        }
        return result.response;
      }),
    ],
  });

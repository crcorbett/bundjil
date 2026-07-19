import { Effect, ManagedRuntime, Schema } from "effect";
import { defineChannel, POST } from "eve/channels";
import type { ChannelEvents } from "eve/channels";

import { SendblueChannel } from "../lib/sendblue/channel.service.js";
import { SendblueChannelRuntimeLive } from "../lib/sendblue/live.layer.js";
import type {
  SendblueChannelState,
  SendblueTypingLifecycleCommand,
} from "../lib/sendblue/schemas.js";
import {
  SendblueTypingLifecycle,
  SendblueTypingTransitionInput,
} from "../lib/sendblue/schemas.js";

type SendblueEncodedChannelState = Schema.Codec.Encoded<
  typeof SendblueChannelState
>;

interface SendblueEveEventContext {
  readonly state: SendblueEncodedChannelState;
}

const runtime = ManagedRuntime.make(SendblueChannelRuntimeLive);

export const makeSendblueEveEvents = <E>(
  channelRuntime: ManagedRuntime.ManagedRuntime<SendblueChannel, E>
): ChannelEvents<SendblueEveEventContext> => {
  const transitionTyping = (
    state: SendblueEncodedChannelState,
    command: Schema.Codec.Encoded<typeof SendblueTypingLifecycleCommand>
  ) =>
    channelRuntime.runPromise(
      Effect.gen(function* transitionSendblueTyping() {
        const sendblue = yield* SendblueChannel;
        const input = yield* Schema.decodeUnknownEffect(
          SendblueTypingTransitionInput
        )({ command, state }).pipe(Effect.orDie);
        const transition = yield* sendblue.transitionTyping(input);
        const typing = yield* Schema.encodeEffect(SendblueTypingLifecycle)(
          transition.lifecycle
        ).pipe(Effect.orDie);
        Object.assign(state, { typing });
        return yield* Effect.void;
      })
    );

  return {
    "action.result"() {
      return Promise.resolve();
    },
    "actions.requested"() {
      return Promise.resolve();
    },
    "authorization.completed"(event, channel) {
      if (event.outcome !== "authorized") {
        return Promise.resolve();
      }
      return transitionTyping(channel.state, {
        _tag: "ResumeTurn",
        turnId: event.turnId,
      });
    },
    "authorization.required"(event, channel) {
      return transitionTyping(channel.state, {
        _tag: "StopTurn",
        expectedTurnId: event.turnId,
      });
    },
    "input.requested"(event, channel) {
      return transitionTyping(channel.state, {
        _tag: "StopTurn",
        expectedTurnId: event.turnId,
      });
    },
    "message.appended"() {
      return Promise.resolve();
    },
    "message.completed"(event, channel, ctx) {
      return channelRuntime.runPromise(
        Effect.gen(function* completeSendblueMessage() {
          const sendblue = yield* SendblueChannel;
          if (event.finishReason === "tool-calls") {
            return;
          }
          if (event.message !== null && event.message.trim().length > 0) {
            const input = yield* Schema.decodeUnknownEffect(
              SendblueTypingTransitionInput
            )({
              command: {
                _tag: "StopTurn",
                expectedTurnId: event.turnId,
              },
              state: channel.state,
            }).pipe(Effect.orDie);
            const transition = yield* sendblue.transitionTyping(input);
            const typing = yield* Schema.encodeEffect(SendblueTypingLifecycle)(
              transition.lifecycle
            ).pipe(Effect.orDie);
            Object.assign(channel.state, { typing });
          }
          yield* sendblue.deliverCompletedMessage({
            finishReason: event.finishReason,
            message: event.message,
            sequence: event.sequence,
            sessionId: ctx.session.id,
            state: channel.state,
            stepIndex: event.stepIndex,
            turnId: event.turnId,
          });
        }).pipe(Effect.asVoid)
      );
    },
    "reasoning.appended"() {
      return Promise.resolve();
    },
    "reasoning.completed"() {
      return Promise.resolve();
    },
    "session.completed"(_event, channel) {
      return transitionTyping(channel.state, {
        _tag: "StopTurn",
      });
    },
    "session.failed"(_event, channel) {
      return channelRuntime.runPromise(
        Effect.gen(function* cleanupFailedSendblueSession() {
          const sendblue = yield* SendblueChannel;
          const input = yield* Schema.decodeUnknownEffect(
            SendblueTypingTransitionInput
          )({
            command: { _tag: "StopTurn" },
            state: channel.state,
          }).pipe(Effect.orDie);
          yield* sendblue.transitionTyping(input);
        }).pipe(Effect.catchCause(() => Effect.void))
      );
    },
    "session.waiting"(_event, channel) {
      return transitionTyping(channel.state, {
        _tag: "StopTurn",
      });
    },
    "turn.completed"(event, channel) {
      return transitionTyping(channel.state, {
        _tag: "StopTurn",
        expectedTurnId: event.turnId,
      });
    },
    "turn.failed"(event, channel) {
      return transitionTyping(channel.state, {
        _tag: "StopTurn",
        expectedTurnId: event.turnId,
      });
    },
    "turn.started"(event, channel) {
      return transitionTyping(channel.state, {
        _tag: "StartTurn",
        turnId: event.turnId,
      });
    },
  } satisfies ChannelEvents<SendblueEveEventContext>;
};

export const makeSendblueEveChannel = <E>(
  channelRuntime: ManagedRuntime.ManagedRuntime<SendblueChannel, E>
) => {
  const events = makeSendblueEveEvents(channelRuntime);
  return defineChannel<SendblueEncodedChannelState, SendblueEveEventContext>({
    context(state) {
      return { state };
    },
    events,
    routes: [
      POST("/eve/v1/sendblue/webhook", async (request, { send, waitUntil }) =>
        channelRuntime.runPromise(
          Effect.gen(function* handleSendblueWebhook() {
            const sendblue = yield* SendblueChannel;
            const decision = yield* sendblue.authorizeAndClaimInbound(request);
            if (decision._tag !== "Dispatch") {
              return new Response(null, { status: 200 });
            }
            waitUntil(
              channelRuntime.runPromise(
                sendblue.dispatchAcceptedInbound(decision, (state) =>
                  send(decision.message, {
                    auth: decision.auth,
                    continuationToken: decision.continuationToken,
                    state,
                  })
                )
              )
            );
            return new Response(null, { status: 202 });
          }).pipe(
            Effect.catchTags({
              SendblueReplayStoreError: () =>
                Effect.succeed(new Response(null, { status: 503 })),
              SendblueRoutingError: () =>
                Effect.succeed(new Response(null, { status: 503 })),
              SendblueWebhookAuthenticationError: () =>
                Effect.succeed(new Response(null, { status: 401 })),
              SendblueWebhookSchemaError: () =>
                Effect.succeed(new Response(null, { status: 400 })),
            })
          )
        )
      ),
    ],
  });
};

export default makeSendblueEveChannel(runtime);

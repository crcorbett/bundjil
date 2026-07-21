import { ChannelTransport } from "@bundjil/channel";
import type {
  ChannelPresenceError,
  ChannelSendError,
  ChannelInboundTextMessageType,
  ChannelDeliveryUncertainError,
} from "@bundjil/channel";
import { Context, Effect, Layer, Match } from "effect";

import type {
  ChannelIdentityError,
  ChannelReplayError,
  ChannelRoutingError,
} from "./errors.js";
import { ChannelIdentity } from "./identity.js";
import { ChannelReplay } from "./replay.js";
import { ChannelRouter } from "./router.js";
import type {
  ChannelEvent,
  ChannelEventResult,
  ChannelPrepareInboundResult,
  ChannelReplayClaim,
} from "./schemas.js";

export type ChannelPrepareInboundError =
  | ChannelIdentityError
  | ChannelReplayError
  | ChannelRoutingError;

export type ChannelHandleEventError =
  | ChannelReplayError
  | ChannelPresenceError
  | ChannelSendError;

export interface ChannelShape {
  readonly decodeWebhook: ChannelTransport["Service"]["decodeWebhook"];
  readonly prepareInbound: (
    message: ChannelInboundTextMessageType
  ) => Effect.Effect<ChannelPrepareInboundResult, ChannelPrepareInboundError>;
  readonly completeInbound: (
    claim: ChannelReplayClaim
  ) => Effect.Effect<void, ChannelReplayError>;
  readonly handleEvent: (
    event: ChannelEvent
  ) => Effect.Effect<ChannelEventResult, ChannelHandleEventError>;
}

export class Channel extends Context.Service<Channel, ChannelShape>()(
  "@bundjil/agent/Channel"
) {}

export const layerLive = Layer.effect(
  Channel,
  Effect.gen(function* makeChannel() {
    const transport = yield* ChannelTransport;
    const identity = yield* ChannelIdentity;
    const router = yield* ChannelRouter;
    const replay = yield* ChannelReplay;

    return Channel.of({
      decodeWebhook: transport.decodeWebhook,
      prepareInbound: Effect.fn("Channel.prepareInbound")(function* (message) {
        const principalId = yield* identity.resolve(
          message.conversation.participantId
        );
        const continuationToken = yield* router.route(message.conversation);
        const replayResult = yield* replay.claimInbound(message);
        return yield* Match.value(replayResult).pipe(
          Match.tag("Duplicate", () =>
            Effect.succeed<ChannelPrepareInboundResult>({ _tag: "Duplicate" })
          ),
          Match.tag("Claimed", ({ claim }) => {
            const result: ChannelPrepareInboundResult = {
              _tag: "Dispatch",
              prepared: {
                claim,
                principalId,
                continuationToken,
                message,
                state: {
                  snapshot: {
                    _tag: "V1",
                    conversation: message.conversation,
                  },
                },
              },
            };
            return Effect.succeed(result);
          }),
          Match.exhaustive
        );
      }),
      completeInbound: replay.complete,
      handleEvent: Effect.fn("Channel.handleEvent")(function* (event) {
        return yield* Match.value(event).pipe(
          Match.tag("PresenceRequested", ({ action, conversation }) =>
            transport.setPresence({ action, conversation }).pipe(
              Effect.map((result) => {
                const eventResult: ChannelEventResult = {
                  state: { _tag: "V1", conversation },
                  outcome: { _tag: "Presence", result },
                };
                return eventResult;
              })
            )
          ),
          Match.tag(
            "OutboundTextReady",
            ({ conversation, coordinates, text }) =>
              Effect.gen(function* sendOutboundText() {
                const replayResult = yield* replay.claimOutbound(coordinates);
                if (replayResult._tag === "Duplicate") {
                  const result: ChannelEventResult = {
                    state: { _tag: "V1", conversation },
                    outcome: { _tag: "Duplicate" },
                  };
                  return result;
                }
                const accepted = yield* transport
                  .sendMessage({ conversation, text })
                  .pipe(
                    Effect.catchTag(
                      "ChannelDeliveryUncertainError",
                      (error: ChannelDeliveryUncertainError) =>
                        replay
                          .uncertain(replayResult.claim)
                          .pipe(Effect.andThen(Effect.fail(error)))
                    ),
                    Effect.catchTags({
                      ChannelProviderRejectedError: (error) =>
                        replay
                          .retryable(replayResult.claim)
                          .pipe(Effect.andThen(Effect.fail(error))),
                      ChannelRequestEncodingError: (error) =>
                        replay
                          .retryable(replayResult.claim)
                          .pipe(Effect.andThen(Effect.fail(error))),
                      ChannelUnavailableError: (error) =>
                        replay
                          .retryable(replayResult.claim)
                          .pipe(Effect.andThen(Effect.fail(error))),
                      ChannelUnsupportedOperationError: (error) =>
                        replay
                          .retryable(replayResult.claim)
                          .pipe(Effect.andThen(Effect.fail(error))),
                    })
                  );
                yield* replay.complete(replayResult.claim);
                const result: ChannelEventResult = {
                  state: { _tag: "V1", conversation },
                  outcome: {
                    _tag: "SendAccepted",
                    messageId: accepted.messageId,
                  },
                };
                return result;
              })
          ),
          Match.exhaustive
        );
      }),
    });
  })
);

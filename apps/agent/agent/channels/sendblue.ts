import { EveMessageCompletedEventTypeValue } from "@bundjil/eve";
import { Effect, ManagedRuntime, Schema } from "effect";
import { defineChannel, POST } from "eve/channels";

import { SendblueChannel } from "../lib/sendblue/channel.js";
import { SendblueRoutingError } from "../lib/sendblue/errors.js";
import { SendblueChannelRuntimeLive } from "../lib/sendblue/runtime.js";
import { SendblueCompletedMessage } from "../lib/sendblue/schemas.js";
import type { SendblueChannelState } from "../lib/sendblue/schemas.js";

const runtime = ManagedRuntime.make(SendblueChannelRuntimeLive);

export const makeSendblueEveChannel = <E>(
  channelRuntime: ManagedRuntime.ManagedRuntime<SendblueChannel, E>
) =>
  defineChannel<SendblueChannelState, { readonly state: SendblueChannelState }>(
    {
      context(state) {
        return { state };
      },
      events: {
        [EveMessageCompletedEventTypeValue](event, channel, ctx) {
          return channelRuntime.runPromise(
            Effect.gen(function* deliverSendblueCompletedMessage() {
              const sendblue = yield* SendblueChannel;
              const completed = yield* Schema.decodeUnknownEffect(
                SendblueCompletedMessage
              )({
                finishReason: event.finishReason,
                message: event.message,
                sequence: event.sequence,
                sessionId: ctx.session.id,
                state: channel.state,
                stepIndex: event.stepIndex,
                turnId: event.turnId,
              }).pipe(
                Effect.mapError(
                  () =>
                    new SendblueRoutingError({
                      message: "The completed Eve message is invalid.",
                    })
                )
              );
              return yield* sendblue.deliverCompletedMessage(completed);
            }).pipe(Effect.asVoid)
          );
        },
      },
      routes: [
        POST("/eve/v1/sendblue/webhook", async (request, { send, waitUntil }) =>
          channelRuntime.runPromise(
            Effect.gen(function* handleSendblueWebhook() {
              const sendblue = yield* SendblueChannel;
              const decision =
                yield* sendblue.authorizeAndClaimInbound(request);
              if (decision._tag !== "Dispatch") {
                return new Response(null, { status: 200 });
              }
              waitUntil(
                channelRuntime.runPromise(
                  sendblue.dispatchAcceptedInbound(
                    decision,
                    Effect.tryPromise({
                      try: () =>
                        send(decision.message, {
                          auth: decision.auth,
                          continuationToken: decision.continuationToken,
                          state: decision.state,
                        }),
                      catch: () =>
                        new SendblueRoutingError({
                          message:
                            "Unable to dispatch the Sendblue message to Eve.",
                        }),
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
    }
  );

export default makeSendblueEveChannel(runtime);

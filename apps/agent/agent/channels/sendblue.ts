import { Effect, ManagedRuntime } from "effect";
import { defineChannel, POST } from "eve/channels";

import { SendblueChannel } from "../lib/sendblue/channel.service.js";
import { SendblueChannelRuntimeLive } from "../lib/sendblue/live.layer.js";
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
        "message.completed"(event, channel, ctx) {
          return channelRuntime.runPromise(
            Effect.gen(function* deliverSendblueCompletedMessage() {
              const sendblue = yield* SendblueChannel;
              return yield* sendblue.deliverCompletedMessage({
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
                  sendblue.dispatchAcceptedInbound(decision, () =>
                    send(decision.message, {
                      auth: decision.auth,
                      continuationToken: decision.continuationToken,
                      state: decision.state,
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

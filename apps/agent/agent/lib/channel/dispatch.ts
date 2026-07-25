import { EveSessionId } from "@bundjil/eve";
import { Context, Effect, Layer, Schema } from "effect";
import type { SendFn } from "eve/channels";

import { EveChannelDispatchError } from "./errors.js";
import { ChannelHandoff } from "./handoff.js";
import { ChannelAdapterState, ChannelHandoffAcceptance } from "./schemas.js";
import type {
  ChannelHandoffAcceptance as ChannelHandoffAcceptanceType,
  ChannelHandoffAttempt,
  ChannelPreparedInbound,
} from "./schemas.js";

export interface EveChannelDispatchShape {
  readonly dispatch: (
    input: ChannelPreparedInbound,
    attempt: ChannelHandoffAttempt
  ) => Effect.Effect<ChannelHandoffAcceptanceType, EveChannelDispatchError>;
}

export class EveChannelDispatch extends Context.Service<
  EveChannelDispatch,
  EveChannelDispatchShape
>()("@bundjil/agent/EveChannelDispatch") {}

export const layerMemory = Layer.effect(
  EveChannelDispatch,
  Schema.decodeEffect(ChannelHandoffAcceptance)({
    acceptedAtEpochMilliseconds: 0,
    sessionFingerprint: "0".repeat(64),
    workFingerprint: "1".repeat(64),
  }).pipe(
    Effect.mapError(() => new EveChannelDispatchError({ reason: "failed" })),
    Effect.map((acceptance) =>
      EveChannelDispatch.of({
        dispatch: Effect.fn("EveChannelDispatch.dispatch")(() =>
          Effect.succeed(acceptance)
        ),
      })
    )
  )
);

export const layerFailureMemory = Layer.succeed(
  EveChannelDispatch,
  EveChannelDispatch.of({
    dispatch: Effect.fn("EveChannelDispatch.dispatch")(function* () {
      return yield* new EveChannelDispatchError({ reason: "failed" });
    }),
  })
);

export const layerEve = (send: SendFn<typeof ChannelAdapterState.Encoded>) =>
  Layer.effect(
    EveChannelDispatch,
    Effect.gen(function* makeEveChannelDispatch() {
      const handoff = yield* ChannelHandoff;
      return EveChannelDispatch.of({
        dispatch: Effect.fn("EveChannelDispatch.dispatch")(
          function* (input, attempt) {
            yield* handoff
              .sendStarted(attempt)
              .pipe(
                Effect.mapError(
                  () => new EveChannelDispatchError({ reason: "failed" })
                )
              );
            return yield* Effect.gen(function* sendChannelInboundToEve() {
              const state = yield* Schema.encodeEffect(ChannelAdapterState)(
                input.state
              );
              const session = yield* Effect.tryPromise({
                try: () =>
                  send(input.message.text, {
                    auth: {
                      attributes: {
                        channel: input.message.conversation.provider,
                      },
                      authenticator: input.message.conversation.provider,
                      principalId: input.principalId,
                      principalType: "user",
                    },
                    continuationToken: input.continuationToken,
                    state,
                  }),
                catch: () => new EveChannelDispatchError({ reason: "failed" }),
              });
              const sessionId = yield* Schema.decodeUnknownEffect(EveSessionId)(
                session.id
              );
              return yield* handoff.sendAccepted(attempt, sessionId);
            }).pipe(
              Effect.tapError(() => handoff.sendRejected(attempt)),
              Effect.mapError(
                () => new EveChannelDispatchError({ reason: "failed" })
              )
            );
          }
        ),
      });
    })
  );

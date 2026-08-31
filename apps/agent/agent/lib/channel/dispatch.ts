import { EveSessionId } from "@bundjil/eve";
import { Context, Effect, Layer, Option, Schema } from "effect";
import type { SendFn } from "eve/channels";

import { EveChannelDispatchError } from "./errors.js";
import { ChannelHandoff } from "./handoff.js";
import { ChannelAdapterState, ChannelHandoffAcceptance } from "./schemas.js";
import type {
  ChannelHandoffAcceptance as ChannelHandoffAcceptanceType,
  ChannelHandoffAttempt,
  ChannelPreparedInbound,
} from "./schemas.js";

export interface EveChannelDispatchContract {
  readonly dispatch: (
    input: ChannelPreparedInbound,
    attempt: ChannelHandoffAttempt
  ) => Effect.Effect<ChannelHandoffAcceptanceType, EveChannelDispatchError>;
}

export class EveChannelDispatch extends Context.Service<
  EveChannelDispatch,
  EveChannelDispatchContract
>()("@bundjil/agent/EveChannelDispatch") {}

export const layerMemory = Layer.effect(
  EveChannelDispatch,
  Schema.decodeEffect(ChannelHandoffAcceptance)({
    acceptedAtEpochMilliseconds: 0,
    sessionFingerprint: "0".repeat(64),
    workFingerprint: "1".repeat(64),
  }).pipe(
    Effect.mapError(() => new EveChannelDispatchError({ reason: "rejected" })),
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
      return yield* new EveChannelDispatchError({ reason: "rejected" });
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
                  () => new EveChannelDispatchError({ reason: "rejected" })
                )
              );
            const state = yield* Schema.encodeEffect(ChannelAdapterState)(
              input.state
            ).pipe(
              Effect.mapError(
                () => new EveChannelDispatchError({ reason: "rejected" })
              ),
              Effect.tapError(() =>
                handoff
                  .sendRejected(attempt, "rejected")
                  .pipe(
                    Effect.mapError(
                      () => new EveChannelDispatchError({ reason: "rejected" })
                    )
                  )
              ),
              Effect.mapError(
                () => new EveChannelDispatchError({ reason: "rejected" })
              )
            );
            const accepted = yield* Effect.tryPromise({
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
              catch: () =>
                new EveChannelDispatchError({
                  reason: "acceptance-uncertain",
                }),
            }).pipe(
              Effect.flatMap((session) =>
                Schema.decodeUnknownEffect(EveSessionId)(session.id)
              ),
              Effect.flatMap((sessionId) =>
                handoff.sendAccepted(attempt, sessionId)
              ),
              Effect.tapError(() => handoff.sendRejected(attempt, "uncertain")),
              Effect.mapError(
                () =>
                  new EveChannelDispatchError({
                    reason: "acceptance-uncertain",
                  })
              ),
              Effect.timeoutOption(handoff.acceptanceTimeout)
            );
            if (Option.isNone(accepted)) {
              yield* handoff.sendRejected(attempt, "timeout").pipe(
                Effect.mapError(
                  () =>
                    new EveChannelDispatchError({
                      reason: "acceptance-timeout",
                    })
                )
              );
              return yield* new EveChannelDispatchError({
                reason: "acceptance-timeout",
              });
            }
            return accepted.value;
          }
        ),
      });
    })
  );

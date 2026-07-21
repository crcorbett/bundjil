import { Context, Effect, Layer, Schema } from "effect";
import type { SendFn } from "eve/channels";

import { EveChannelDispatchError } from "./errors.js";
import type { ChannelPreparedInbound } from "./schemas.js";
import { ChannelAdapterState } from "./schemas.js";

export interface EveChannelDispatchShape {
  readonly dispatch: (
    input: ChannelPreparedInbound
  ) => Effect.Effect<void, EveChannelDispatchError>;
}

export class EveChannelDispatch extends Context.Service<
  EveChannelDispatch,
  EveChannelDispatchShape
>()("@bundjil/agent/EveChannelDispatch") {}

export const layerMemory = Layer.succeed(
  EveChannelDispatch,
  EveChannelDispatch.of({
    dispatch: Effect.fn("EveChannelDispatch.dispatch")(function* () {
      return yield* Effect.void;
    }),
  })
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
  Layer.succeed(
    EveChannelDispatch,
    EveChannelDispatch.of({
      dispatch: Effect.fn("EveChannelDispatch.dispatch")(function* (input) {
        const state = yield* Effect.mapError(
          Schema.encodeEffect(ChannelAdapterState)(input.state),
          () => new EveChannelDispatchError({ reason: "failed" })
        );
        yield* Effect.tryPromise({
          try: () =>
            send(input.message.text, {
              auth: {
                attributes: { channel: input.message.conversation.provider },
                authenticator: input.message.conversation.provider,
                principalId: input.principalId,
                principalType: "user",
              },
              continuationToken: input.continuationToken,
              state,
            }),
          catch: () => new EveChannelDispatchError({ reason: "failed" }),
        });
      }),
    })
  );

import { Context, Effect, Layer } from "effect";

import { EveChannelDispatchError } from "./errors.js";
import type { ChannelPreparedInbound } from "./schemas.js";

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

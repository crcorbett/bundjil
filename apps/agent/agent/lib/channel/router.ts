import type { ChannelConversationType } from "@bundjil/channel";
import { Context, Effect, Layer, Schema } from "effect";

import { ChannelRoutingError } from "./errors.js";
import { ChannelContinuationToken } from "./schemas.js";
import type { ChannelContinuationToken as ChannelContinuationTokenType } from "./schemas.js";

export interface ChannelRouterShape {
  readonly route: (
    conversation: ChannelConversationType
  ) => Effect.Effect<ChannelContinuationTokenType, ChannelRoutingError>;
}

export class ChannelRouter extends Context.Service<
  ChannelRouter,
  ChannelRouterShape
>()("@bundjil/agent/ChannelRouter") {}

export const layerMemory = Layer.succeed(
  ChannelRouter,
  ChannelRouter.of({
    route: Effect.fn("ChannelRouter.route")(function* (conversation) {
      return yield* Schema.decodeEffect(ChannelContinuationToken)(
        `channel:v1:${conversation.provider}:${conversation.conversationId}`
      ).pipe(
        Effect.mapError(
          () => new ChannelRoutingError({ reason: "unavailable" })
        )
      );
    }),
  })
);

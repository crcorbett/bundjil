import type { ChannelConversationType } from "@bundjil/channel";
import { Context, Effect, Layer, Redacted, Schema } from "effect";

import { ChannelRoutingError } from "./errors.js";
import { ChannelContinuationToken } from "./schemas.js";
import type {
  ChannelContinuationToken as ChannelContinuationTokenType,
  ChannelRoutingSecret,
} from "./schemas.js";

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

export const layerLive = (secret: ChannelRoutingSecret) =>
  Layer.effect(
    ChannelRouter,
    Effect.gen(function* makeChannelRouter() {
      const key = yield* Effect.tryPromise({
        try: () =>
          globalThis.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(Redacted.value(secret)),
            { hash: "SHA-256", name: "HMAC" },
            false,
            ["sign"]
          ),
        catch: () => new ChannelRoutingError({ reason: "unavailable" }),
      });

      return ChannelRouter.of({
        route: Effect.fn("ChannelRouter.route")(function* (conversation) {
          const signature = yield* Effect.tryPromise({
            try: () =>
              globalThis.crypto.subtle.sign(
                "HMAC",
                key,
                new TextEncoder().encode(
                  `${conversation.provider}:${conversation.conversationId}`
                )
              ),
            catch: () => new ChannelRoutingError({ reason: "unavailable" }),
          });
          const token = Array.from(new Uint8Array(signature), (byte) =>
            byte.toString(16).padStart(2, "0")
          ).join("");
          return yield* Schema.decodeEffect(ChannelContinuationToken)(
            `channel:v1:${token}`
          ).pipe(
            Effect.mapError(
              () => new ChannelRoutingError({ reason: "unavailable" })
            )
          );
        }),
      });
    })
  );

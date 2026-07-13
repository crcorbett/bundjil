import { Context, Effect, Encoding, Layer, Redacted, Schema } from "effect";

import { SendblueConfigService } from "./config.js";
import { SendblueRoutingError } from "./errors.js";
import { SendblueConversationKey } from "./schemas.js";
import type {
  E164PhoneNumber,
  SendblueConversationKey as SendblueConversationKeyType,
} from "./schemas.js";

const textEncoder = new TextEncoder();

export const keyedSendblueDigest = (
  key: Redacted.Redacted,
  values: readonly string[]
) =>
  Effect.tryPromise({
    try: async () => {
      const cryptoKey = await globalThis.crypto.subtle.importKey(
        "raw",
        textEncoder.encode(Redacted.value(key)),
        { hash: "SHA-256", name: "HMAC" },
        false,
        ["sign"]
      );
      const signature = await globalThis.crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        textEncoder.encode(values.join("\u0000"))
      );
      return Encoding.encodeHex(new Uint8Array(signature));
    },
    catch: () =>
      new SendblueRoutingError({
        message: "Unable to derive the Sendblue conversation key.",
      }),
  });

export interface SendblueSessionRouterShape {
  readonly route: (
    senderNumber: E164PhoneNumber,
    sendblueNumber: E164PhoneNumber
  ) => Effect.Effect<SendblueConversationKeyType, SendblueRoutingError>;
}

export class SendblueSessionRouter extends Context.Service<
  SendblueSessionRouter,
  SendblueSessionRouterShape
>()("@bundjil/agent/SendblueSessionRouter") {}

export const makeSendblueSessionRouter = (routingKey: Redacted.Redacted) =>
  SendblueSessionRouter.of({
    route: Effect.fn("SendblueSessionRouter.route")(function* (
      senderNumber: E164PhoneNumber,
      sendblueNumber: E164PhoneNumber
    ) {
      const digest = yield* keyedSendblueDigest(routingKey, [
        "conversation",
        senderNumber,
        sendblueNumber,
      ]);
      return yield* Schema.decodeUnknownEffect(SendblueConversationKey)(
        `sendblue:conversation:${digest}`
      ).pipe(
        Effect.mapError(
          () =>
            new SendblueRoutingError({
              message: "Unable to derive the Sendblue conversation key.",
            })
        )
      );
    }),
  });

export const SendblueSessionRouterLive = Layer.effect(
  SendblueSessionRouter,
  Effect.gen(function* makeSendblueSessionRouterLive() {
    const config = yield* SendblueConfigService;
    return makeSendblueSessionRouter(config.routingKey);
  })
);

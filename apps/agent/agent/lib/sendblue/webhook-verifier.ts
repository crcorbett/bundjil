import { timingSafeEqual } from "node:crypto";

import { Context, Effect, Layer, Redacted } from "effect";

import { SendblueConfigService } from "./config.js";
import { SendblueWebhookAuthenticationError } from "./errors.js";

const textEncoder = new TextEncoder();

export interface SendblueWebhookVerifierShape {
  readonly verify: (
    headers: Headers
  ) => Effect.Effect<void, SendblueWebhookAuthenticationError>;
}

export class SendblueWebhookVerifier extends Context.Service<
  SendblueWebhookVerifier,
  SendblueWebhookVerifierShape
>()("@bundjil/agent/SendblueWebhookVerifier") {}

export const makeSendblueWebhookVerifier = (webhookSecret: Redacted.Redacted) =>
  SendblueWebhookVerifier.of({
    verify: Effect.fn("SendblueWebhookVerifier.verify")(function* (headers) {
      const suppliedSecret = headers.get("sb-signing-secret");
      if (suppliedSecret === null) {
        return yield* new SendblueWebhookAuthenticationError({
          message: "The Sendblue webhook signing secret is missing.",
        });
      }

      const expected = textEncoder.encode(Redacted.value(webhookSecret));
      const received = textEncoder.encode(suppliedSecret);
      if (
        expected.byteLength !== received.byteLength ||
        !timingSafeEqual(expected, received)
      ) {
        return yield* new SendblueWebhookAuthenticationError({
          message: "The Sendblue webhook signing secret is invalid.",
        });
      }
      return yield* Effect.void;
    }),
  });

export const SendblueWebhookVerifierLive = Layer.effect(
  SendblueWebhookVerifier,
  Effect.gen(function* makeSendblueWebhookVerifierLive() {
    const config = yield* SendblueConfigService;
    return makeSendblueWebhookVerifier(config.webhookSecret);
  })
);

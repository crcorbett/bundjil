import { Effect, Layer } from "effect";

import { SendblueClient } from "./client.service.js";
import type { SendblueClientShape } from "./client.service.js";
import { SendblueDeliveryUncertainError } from "./errors.js";

export interface SendblueClientMemoryOptions {
  readonly sendMessage?: SendblueClientShape["sendMessage"];
  readonly setTypingIndicator?: SendblueClientShape["setTypingIndicator"];
}

export const SendblueClientMemory = (
  options: SendblueClientMemoryOptions = {}
) =>
  Layer.succeed(
    SendblueClient,
    SendblueClient.of({
      sendMessage:
        options.sendMessage ??
        (() =>
          Effect.fail(
            new SendblueDeliveryUncertainError({
              message:
                "The Sendblue memory client is not seeded for sendMessage.",
              operation: "sendMessage",
              reason: "transport",
            })
          )),
      setTypingIndicator:
        options.setTypingIndicator ??
        (() =>
          Effect.fail(
            new SendblueDeliveryUncertainError({
              message:
                "The Sendblue memory client is not seeded for setTypingIndicator.",
              operation: "setTypingIndicator",
              reason: "transport",
            })
          )),
    })
  );

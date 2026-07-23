import { Effect, Layer, Schema } from "effect";

import {
  ChannelPresenceResult,
  ChannelSendAccepted,
  ChannelWebhookResult,
} from "./schemas.js";
import { ChannelTransport } from "./service.js";

export const ChannelTransportMemoryConfig = Schema.Struct({
  webhook: ChannelWebhookResult,
  send: ChannelSendAccepted,
  presence: ChannelPresenceResult,
});
export type ChannelTransportMemoryConfig =
  typeof ChannelTransportMemoryConfig.Type;
export type ChannelTransportMemoryConfigEncoded =
  typeof ChannelTransportMemoryConfig.Encoded;

export const layerMemory = (config: ChannelTransportMemoryConfig) =>
  Layer.succeed(
    ChannelTransport,
    ChannelTransport.of({
      decodeWebhook: () => Effect.succeed(config.webhook),
      sendMessage: () => Effect.succeed(config.send),
      setPresence: () => Effect.succeed(config.presence),
    })
  );

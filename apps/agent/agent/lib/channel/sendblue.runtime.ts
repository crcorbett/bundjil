import { layerLive as SendblueTransportLive } from "@bundjil/sendblue";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

import { layerLive as ChannelLive } from "./channel.js";
import {
  ChannelConfig,
  layerLive as ChannelConfigLive,
  loadSendblueConfig,
} from "./config.js";
import { layerLive as ChannelHandoffLive } from "./handoff.js";
import { channelServices } from "./runtime.js";

export const SendblueChannelRuntimeLive = Layer.unwrap(
  Effect.gen(function* makeSendblueChannelRuntime() {
    const config = yield* ChannelConfig;
    const sendblue = yield* loadSendblueConfig;
    const transport = SendblueTransportLive(sendblue).pipe(
      Layer.provide(FetchHttpClient.layer)
    );
    return Layer.merge(
      ChannelLive.pipe(
        Layer.provide(Layer.merge(transport, channelServices(config)))
      ),
      ChannelHandoffLive(config.routingSecret)
    );
  })
).pipe(Layer.provide(ChannelConfigLive));

import { layerLive as SendblueTransportLive } from "@bundjil/sendblue";
import { UpstashPersistenceLive } from "@bundjil/store/upstash";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

import { layerLive as ChannelLive } from "./channel.js";
import { ChannelConfig, layerLive as ChannelConfigLive } from "./config.js";
import { layerLive as ChannelIdentityLive } from "./identity.js";
import { layerLive as ChannelReplayLive } from "./replay.js";
import { layerLive as ChannelRouterLive } from "./router.js";

export const ChannelRuntimeLive = Layer.unwrap(
  Effect.gen(function* makeChannelRuntime() {
    const config = yield* ChannelConfig;
    const transport = SendblueTransportLive(config.sendblue).pipe(
      Layer.provide(FetchHttpClient.layer)
    );
    const replay = ChannelReplayLive(config.replay).pipe(
      Layer.provide(UpstashPersistenceLive(config.store))
    );
    const services = Layer.mergeAll(
      transport,
      replay,
      ChannelIdentityLive(config.identities),
      ChannelRouterLive(config.routingSecret)
    );
    return ChannelLive.pipe(Layer.provide(services));
  })
).pipe(Layer.provide(ChannelConfigLive));

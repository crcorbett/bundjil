import { UpstashPersistenceLive } from "@bundjil/store/upstash";
import { Layer } from "effect";

import type { ChannelConfigShape } from "./config.js";
import { layerLive as ChannelIdentityLive } from "./identity.js";
import { layerLive as ChannelReplayLive } from "./replay.js";
import { layerLive as ChannelRouterLive } from "./router.js";

export const channelServices = (config: ChannelConfigShape) =>
  Layer.mergeAll(
    ChannelReplayLive(config.replay).pipe(
      Layer.provide(UpstashPersistenceLive(config.store))
    ),
    ChannelIdentityLive(config.identities),
    ChannelRouterLive(config.routingSecret)
  );

import { layerLive as PhotonTransportLive } from "@bundjil/photon";
import { Effect, Layer } from "effect";

import { layerLive as ChannelLive } from "./channel.js";
import {
  ChannelConfig,
  layerLive as ChannelConfigLive,
  loadPhotonConfig,
} from "./config.js";
import { channelServices } from "./runtime.js";

export const PhotonChannelRuntimeLive = Layer.unwrap(
  Effect.gen(function* makePhotonChannelRuntime() {
    const config = yield* ChannelConfig;
    const photon = yield* loadPhotonConfig;
    return ChannelLive.pipe(
      Layer.provide(
        Layer.merge(PhotonTransportLive(photon), channelServices(config))
      )
    );
  })
).pipe(Layer.provide(ChannelConfigLive));

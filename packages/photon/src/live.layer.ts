import { Layer } from "effect";

import { layerClientLive } from "./client.js";
import type { PhotonConfig } from "./schemas.js";
import { layerTransport } from "./transport.layer.js";

export const layerLive = (config: PhotonConfig) =>
  layerTransport(config).pipe(Layer.provide(layerClientLive(config)));

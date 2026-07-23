import type { ChannelTransportMemoryConfig } from "@bundjil/channel/memory";
import { layerMemory as channelLayerMemory } from "@bundjil/channel/memory";

export const layerMemory = (config: ChannelTransportMemoryConfig) =>
  channelLayerMemory(config);

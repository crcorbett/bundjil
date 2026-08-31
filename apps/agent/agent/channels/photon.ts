import { ManagedRuntime } from "effect";

import { createChannelEveChannel } from "../lib/channel/eve.js";
import { PhotonChannelRuntimeLive } from "../lib/channel/photon.runtime.js";

const runtime = ManagedRuntime.make(PhotonChannelRuntimeLive);

export const makePhotonEveChannel = <E>(
  channelRuntime: Parameters<typeof createChannelEveChannel<E>>[0]
) =>
  createChannelEveChannel(
    channelRuntime,
    "/eve/v1/photon/webhook",
    "provider-retry"
  );

export default makePhotonEveChannel(runtime);

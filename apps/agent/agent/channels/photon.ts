import { ManagedRuntime } from "effect";

import { makeChannelEveChannel } from "../lib/channel/eve.js";
import { PhotonChannelRuntimeLive } from "../lib/channel/photon.runtime.js";

const runtime = ManagedRuntime.make(PhotonChannelRuntimeLive);

export const makePhotonEveChannel = <E>(
  channelRuntime: Parameters<typeof makeChannelEveChannel<E>>[0]
) => makeChannelEveChannel(channelRuntime, "/eve/v1/photon/webhook");

export default makePhotonEveChannel(runtime);

import { ManagedRuntime } from "effect";

import { makeChannelEveChannel } from "../lib/channel/eve.js";
import { SendblueChannelRuntimeLive } from "../lib/channel/sendblue.runtime.js";

const runtime = ManagedRuntime.make(SendblueChannelRuntimeLive);

export const makeSendblueEveChannel = <E>(
  channelRuntime: Parameters<typeof makeChannelEveChannel<E>>[0]
) => makeChannelEveChannel(channelRuntime, "/eve/v1/sendblue/webhook");

export default makeSendblueEveChannel(runtime);

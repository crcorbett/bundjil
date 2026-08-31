import { ManagedRuntime } from "effect";

import { createChannelEveChannel } from "../lib/channel/eve.js";
import { SendblueChannelRuntimeLive } from "../lib/channel/sendblue.runtime.js";

const runtime = ManagedRuntime.make(SendblueChannelRuntimeLive);

export const makeSendblueEveChannel = <E>(
  channelRuntime: Parameters<typeof createChannelEveChannel<E>>[0]
) =>
  createChannelEveChannel(
    channelRuntime,
    "/eve/v1/sendblue/webhook",
    "disabled"
  );

export default makeSendblueEveChannel(runtime);

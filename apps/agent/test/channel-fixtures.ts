import type { ChannelSource, RouteHandlerArgs } from "eve/channels";
import type { Delivery } from "eve/sessions";

import type { ChannelMutableAdapterStateEncoded } from "../agent/lib/channel/schemas.js";

export const makeChannelDelivery = (sessionId: string): Delivery => ({
  sessionId,
  deliveryId: "test-delivery",
  stream: () => {
    throw new Error("The fixture does not read delivery streams.");
  },
  result: () =>
    Promise.reject(new Error("The fixture does not await settlement.")),
});

export const makeChannelRouteArgs = (input: {
  readonly send: ChannelSource<ChannelMutableAdapterStateEncoded>["send"];
  readonly waitUntil: RouteHandlerArgs<ChannelMutableAdapterStateEncoded>["waitUntil"];
}): RouteHandlerArgs<ChannelMutableAdapterStateEncoded> => ({
  from: () => ({
    send: input.send,
    create: () => Promise.reject(new Error("Unexpected session creation.")),
    respond: () => Promise.reject(new Error("Unexpected input response.")),
    cancel: () => Promise.reject(new Error("Unexpected cancellation.")),
    compact: () => Promise.reject(new Error("Unexpected compaction.")),
    clear: () => Promise.reject(new Error("Unexpected history clearing.")),
    reset: () => Promise.reject(new Error("Unexpected session reset.")),
  }),
  resolveSession: () => Promise.resolve(undefined),
  attachSession: () => {
    throw new Error("Unexpected session attachment.");
  },
  to: () => {
    throw new Error("Unexpected proactive delivery.");
  },
  params: {},
  requestIp: null,
  describe: () => Promise.reject(new Error("Unexpected agent description.")),
  listSkillFiles: () => Promise.reject(new Error("Unexpected skill listing.")),
  readSkill: () => Promise.reject(new Error("Unexpected skill read.")),
  invokeTool: () => Promise.reject(new Error("Unexpected tool invocation.")),
  waitUntil: input.waitUntil,
});

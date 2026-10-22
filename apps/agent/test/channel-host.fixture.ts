import type { ChannelSource, RouteHandlerArgs, Session } from "eve/channels";

// These are Eve's host callbacks. Unexpected calls fail rather than doing I/O.
const unused = (): never => {
  throw new Error("This Eve host operation is not used by the fixture.");
};

export const makeChannelSession = (id: string): Session => ({
  id,
  cancel: () => Promise.resolve({ status: "no_active_turn" }),
  clear: () => Promise.resolve({ status: "no_active_session" }),
  compact: () => Promise.resolve({ status: "no_active_session" }),
  reset: () => Promise.resolve({ status: "no_active_session" }),
  send: unused,
  respond: unused,
  getEventStream: () => Promise.resolve(new ReadableStream()),
  getStreamTailIndex: () => Promise.resolve(-1),
});

export const makeChannelRouteArgs = <State>(options: {
  readonly send: ChannelSource<State>["send"];
  readonly waitUntil: RouteHandlerArgs<State>["waitUntil"];
  readonly onAddress?: (address: string) => void;
}): RouteHandlerArgs<State> => ({
  from: (address) => {
    options.onAddress?.(address);
    return {
      ...makeChannelSession("unused"),
      create: unused,
      respond: unused,
      send: options.send,
    };
  },
  resolveSession: () => Promise.resolve<undefined>(globalThis.undefined),
  attachSession: makeChannelSession,
  to: unused,
  params: {},
  requestIp: null,
  describe: unused,
  listSkillFiles: unused,
  readSkill: unused,
  invokeTool: unused,
  waitUntil: options.waitUntil,
});

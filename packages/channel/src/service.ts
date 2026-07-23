import type { Effect } from "effect";
import { Context } from "effect";

import type {
  ChannelPresenceError,
  ChannelSendError,
  ChannelWebhookError,
} from "./errors.js";
import type {
  ChannelPresenceInput,
  ChannelPresenceResult,
  ChannelSendAccepted,
  ChannelSendMessageInput,
  ChannelWebhookResult,
} from "./schemas.js";

export interface ChannelTransportShape {
  readonly decodeWebhook: (
    request: Request
  ) => Effect.Effect<ChannelWebhookResult, ChannelWebhookError>;
  readonly sendMessage: (
    input: ChannelSendMessageInput
  ) => Effect.Effect<ChannelSendAccepted, ChannelSendError>;
  readonly setPresence: (
    input: ChannelPresenceInput
  ) => Effect.Effect<ChannelPresenceResult, ChannelPresenceError>;
}

export class ChannelTransport extends Context.Service<
  ChannelTransport,
  ChannelTransportShape
>()("@bundjil/channel/ChannelTransport") {}

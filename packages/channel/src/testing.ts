import { Effect } from "effect";

import type {
  ChannelPresenceInput,
  ChannelSendMessageInput,
} from "./schemas.js";
import { ChannelTransport } from "./service.js";

export interface ChannelTransportConformanceInput {
  readonly webhookRequest: Request;
  readonly send: ChannelSendMessageInput;
  readonly presence: ChannelPresenceInput;
}

export const runChannelTransportConformance = Effect.fn(
  "ChannelTransport.runConformance"
)(function* (input: ChannelTransportConformanceInput) {
  const transport = yield* ChannelTransport;
  const webhook = yield* transport.decodeWebhook(input.webhookRequest);
  const send = yield* transport.sendMessage(input.send);
  const presence = yield* transport.setPresence(input.presence);
  return { webhook, send, presence };
});

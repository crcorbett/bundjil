import { Schema } from "effect";

import {
  ChannelOperation,
  ChannelProvider,
  ChannelRetryClass,
  ChannelSafeReason,
  ChannelSafeStatus,
} from "../schemas.js";

export const ChannelFailureFields = {
  provider: ChannelProvider,
  operation: ChannelOperation,
  reason: ChannelSafeReason,
  status: Schema.optional(ChannelSafeStatus),
  retry: Schema.optional(ChannelRetryClass),
};

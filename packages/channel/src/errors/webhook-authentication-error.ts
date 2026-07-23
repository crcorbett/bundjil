import { Schema } from "effect";

import { ChannelFailureFields } from "./failure-fields.js";

export class ChannelWebhookAuthenticationError extends Schema.TaggedErrorClass<ChannelWebhookAuthenticationError>()(
  "ChannelWebhookAuthenticationError",
  ChannelFailureFields
) {}

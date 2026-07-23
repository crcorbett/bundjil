import { Schema } from "effect";

import { ChannelFailureFields } from "./failure-fields.js";

export class ChannelWebhookSchemaError extends Schema.TaggedErrorClass<ChannelWebhookSchemaError>()(
  "ChannelWebhookSchemaError",
  ChannelFailureFields
) {}

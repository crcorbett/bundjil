import { Schema } from "effect";

import { ChannelFailureFields } from "./failure-fields.js";

export class ChannelDeliveryUncertainError extends Schema.TaggedErrorClass<ChannelDeliveryUncertainError>()(
  "ChannelDeliveryUncertainError",
  ChannelFailureFields
) {}

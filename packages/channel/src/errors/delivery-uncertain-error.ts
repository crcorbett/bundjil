import { Schema } from "effect";

import { ChannelFailureFields } from "./failure-fields.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class ChannelDeliveryUncertainError extends Schema.TaggedError<ChannelDeliveryUncertainError>()(
  "ChannelDeliveryUncertainError",
  ChannelFailureFields
) {}

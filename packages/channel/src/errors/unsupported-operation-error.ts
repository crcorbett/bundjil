import { Schema } from "effect";

import { ChannelFailureFields } from "./failure-fields.js";

export class ChannelUnsupportedOperationError extends Schema.TaggedErrorClass<ChannelUnsupportedOperationError>()(
  "ChannelUnsupportedOperationError",
  ChannelFailureFields
) {}

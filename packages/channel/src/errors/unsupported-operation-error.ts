import { Schema } from "effect";

import { ChannelFailureFields } from "./failure-fields.js";

export class ChannelUnsupportedOperationError extends Schema.TaggedError<ChannelUnsupportedOperationError>()(
  "ChannelUnsupportedOperationError",
  ChannelFailureFields
) {}

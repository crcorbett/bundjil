import { Schema } from "effect";

import { ChannelFailureFields } from "./failure-fields.js";

export class ChannelRequestEncodingError extends Schema.TaggedError<ChannelRequestEncodingError>()(
  "ChannelRequestEncodingError",
  ChannelFailureFields
) {}

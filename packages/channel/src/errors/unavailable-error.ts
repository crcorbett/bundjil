import { Schema } from "effect";

import { ChannelFailureFields } from "./failure-fields.js";

export class ChannelUnavailableError extends Schema.TaggedError<ChannelUnavailableError>()(
  "ChannelUnavailableError",
  ChannelFailureFields
) {}

import { Schema } from "effect";

import { ChannelFailureFields } from "./failure-fields.js";

export class ChannelProviderRejectedError extends Schema.TaggedErrorClass<ChannelProviderRejectedError>()(
  "ChannelProviderRejectedError",
  ChannelFailureFields
) {}

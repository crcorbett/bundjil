import { Schema } from "effect";

export class ChannelReplayError extends Schema.TaggedErrorClass<ChannelReplayError>()(
  "ChannelReplayError",
  {
    operation: Schema.Literals([
      "accept",
      "claim",
      "complete",
      "retryable",
      "settleSession",
      "uncertain",
    ]),
  }
) {}

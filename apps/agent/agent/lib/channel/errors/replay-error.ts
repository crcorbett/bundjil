import { Schema } from "effect";

export class ChannelReplayError extends Schema.TaggedError<ChannelReplayError>()(
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

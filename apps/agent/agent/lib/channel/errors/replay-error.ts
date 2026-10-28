import { Schema } from "effect";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
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

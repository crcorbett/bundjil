import { Schema } from "effect";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class EveChannelDispatchError extends Schema.TaggedError<EveChannelDispatchError>()(
  "EveChannelDispatchError",
  {
    reason: Schema.Literals([
      "acceptance-timeout",
      "acceptance-uncertain",
      "rejected",
    ]),
  }
) {}

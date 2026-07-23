import { Schema } from "effect";

export class EveChannelDispatchError extends Schema.TaggedErrorClass<EveChannelDispatchError>()(
  "EveChannelDispatchError",
  { reason: Schema.Literal("failed") }
) {}

import { Schema } from "effect";

export class StartMiddlewareNextError extends Schema.TaggedErrorClass<StartMiddlewareNextError>()(
  "StartMiddlewareNextError",
  { cause: Schema.Defect }
) {}

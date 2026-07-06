import { Schema } from "effect";

export class StartMiddlewareOptionalResponseError extends Schema.TaggedErrorClass<StartMiddlewareOptionalResponseError>()(
  "StartMiddlewareOptionalResponseError",
  { cause: Schema.Defect }
) {}

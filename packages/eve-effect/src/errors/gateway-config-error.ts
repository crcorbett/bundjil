import { Schema } from "effect";

export class BundjilAgentGatewayConfigError extends Schema.TaggedErrorClass<BundjilAgentGatewayConfigError>()(
  "BundjilAgentGatewayConfigError",
  {
    setting: Schema.NonEmptyString,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

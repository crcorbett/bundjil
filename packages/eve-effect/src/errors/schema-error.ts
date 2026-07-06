import { Schema } from "effect";

import { BundjilAgentSchemaBoundary } from "./contracts.js";

export class BundjilAgentSchemaError extends Schema.TaggedErrorClass<BundjilAgentSchemaError>()(
  "BundjilAgentSchemaError",
  {
    boundary: BundjilAgentSchemaBoundary,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

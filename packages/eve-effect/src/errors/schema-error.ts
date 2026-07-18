import { Schema } from "effect";

import {
  BundjilAgentDiagnosticMessage,
  BundjilAgentSchemaBoundary,
} from "./contracts.js";

export class BundjilAgentSchemaError extends Schema.TaggedErrorClass<BundjilAgentSchemaError>()(
  "BundjilAgentSchemaError",
  {
    boundary: BundjilAgentSchemaBoundary,
    message: BundjilAgentDiagnosticMessage,
    cause: Schema.Defect,
  }
) {}

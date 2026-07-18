import { Schema } from "effect";

import {
  BundjilAgentDiagnosticMessage,
  BundjilAgentOperationName,
} from "./contracts.js";

export class BundjilAgentOperationError extends Schema.TaggedErrorClass<BundjilAgentOperationError>()(
  "BundjilAgentOperationError",
  {
    operation: BundjilAgentOperationName,
    message: BundjilAgentDiagnosticMessage,
    cause: Schema.Defect,
  }
) {}

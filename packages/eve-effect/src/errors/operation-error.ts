import { Schema } from "effect";

import { BundjilAgentOperationName } from "./contracts.js";

export class BundjilAgentOperationError extends Schema.TaggedErrorClass<BundjilAgentOperationError>()(
  "BundjilAgentOperationError",
  {
    operation: BundjilAgentOperationName,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

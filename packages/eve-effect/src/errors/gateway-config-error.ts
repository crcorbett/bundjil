import { Schema } from "effect";

import {
  BundjilAgentDiagnosticMessage,
  BundjilAgentGatewaySetting,
} from "./contracts.js";

export class BundjilAgentGatewayConfigError extends Schema.TaggedErrorClass<BundjilAgentGatewayConfigError>()(
  "BundjilAgentGatewayConfigError",
  {
    setting: BundjilAgentGatewaySetting,
    message: BundjilAgentDiagnosticMessage,
    cause: Schema.Defect,
  }
) {}

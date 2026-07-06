import { Schema } from "effect";

import { BundjilAgentGatewayConfigError } from "./errors/gateway-config-error.js";
import { BundjilAgentOperationError } from "./errors/operation-error.js";
import { BundjilAgentSchemaError } from "./errors/schema-error.js";

export {
  BundjilAgentOperationName,
  BundjilAgentSchemaBoundary,
} from "./errors/contracts.js";
export type {
  BundjilAgentOperationName as BundjilAgentOperationNameType,
  BundjilAgentSchemaBoundary as BundjilAgentSchemaBoundaryType,
} from "./errors/contracts.js";
export { BundjilAgentGatewayConfigError } from "./errors/gateway-config-error.js";
export { BundjilAgentOperationError } from "./errors/operation-error.js";
export { BundjilAgentSchemaError } from "./errors/schema-error.js";

export const WorkspaceStatusFailure = Schema.Union([
  BundjilAgentOperationError,
  BundjilAgentSchemaError,
  BundjilAgentGatewayConfigError,
]);

export type WorkspaceStatusFailure = typeof WorkspaceStatusFailure.Type;

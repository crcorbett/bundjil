import { Schema } from "effect";

export const BundjilAgentOperationName = Schema.Literals([
  "getWorkspaceStatus",
]);

export type BundjilAgentOperationName = typeof BundjilAgentOperationName.Type;

export const BundjilAgentSchemaBoundary = Schema.Literals([
  "WorkspaceSummary",
  "WorkspaceStatusInput",
  "WorkspaceStatusSuccess",
  "WorkspaceStatusToolInput",
  "WorkspaceStatusToolSuccess",
]);

export type BundjilAgentSchemaBoundary = typeof BundjilAgentSchemaBoundary.Type;

export const BundjilAgentDiagnosticMessage = Schema.NonEmptyString;
export type BundjilAgentDiagnosticMessage =
  typeof BundjilAgentDiagnosticMessage.Type;

export const BundjilAgentGatewaySetting = Schema.NonEmptyString;
export type BundjilAgentGatewaySetting = typeof BundjilAgentGatewaySetting.Type;

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

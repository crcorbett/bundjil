import { Schema } from "effect";

export const WorkspaceSchemaBoundary = Schema.Literals([
  "WorkspaceSummary",
  "WorkspaceStatusInput",
  "WorkspaceStatusSuccess",
  "WorkspaceStatusToolInput",
  "WorkspaceStatusToolSuccess",
]);

export type WorkspaceSchemaBoundary = typeof WorkspaceSchemaBoundary.Type;

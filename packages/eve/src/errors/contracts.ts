import { Schema } from "effect";

export const WorkspaceSchemaBoundary = Schema.Literals([
  "WorkspaceStatusInput",
  "WorkspaceStatusSuccess",
  "WorkspaceStatusToolInput",
  "WorkspaceStatusToolSuccess",
]);

export type WorkspaceSchemaBoundary = typeof WorkspaceSchemaBoundary.Type;

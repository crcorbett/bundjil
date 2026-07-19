import { Schema } from "effect";

export const WorkspaceSchemaBoundary = Schema.Literals([
  "WorkspaceSummary",
  "WorkspaceStatusInput",
  "WorkspaceStatusSuccess",
  "WorkspaceStatusToolInput",
  "WorkspaceStatusToolSuccess",
]);

export type WorkspaceSchemaBoundary = typeof WorkspaceSchemaBoundary.Type;

export const WorkspaceSchemaErrorMessage = Schema.NonEmptyString;
export type WorkspaceSchemaErrorMessage =
  typeof WorkspaceSchemaErrorMessage.Type;

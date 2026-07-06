import { Schema } from "effect";

export const WorkspaceStatusInput = Schema.Struct({
  question: Schema.NonEmptyString,
});

export type WorkspaceStatusInput = typeof WorkspaceStatusInput.Type;

export const WorkspaceStatusSuccess = Schema.Struct({
  workspaceName: Schema.NonEmptyString,
  packageNames: Schema.Array(Schema.NonEmptyString),
  agentSummary: Schema.NonEmptyString,
});

export type WorkspaceStatusSuccess = typeof WorkspaceStatusSuccess.Type;

export type WorkspaceStatusToolInput = WorkspaceStatusInput;

export type WorkspaceStatusToolSuccess = WorkspaceStatusSuccess;

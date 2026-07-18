import { Schema } from "effect";

import {
  BundjilPackageName,
  BundjilWorkspaceName,
} from "./workspace-status.js";

export {
  BundjilPackageName,
  BundjilWorkspaceName,
} from "./workspace-status.js";

export const BundjilWorkspaceStatusQuestion = Schema.NonEmptyString;
export type BundjilWorkspaceStatusQuestion =
  typeof BundjilWorkspaceStatusQuestion.Type;

export const BundjilAgentSummary = Schema.NonEmptyString;
export type BundjilAgentSummary = typeof BundjilAgentSummary.Type;

export const EveMessageCompletedEventTypeValue = "message.completed";

export const EveMessageCompletedEventType = Schema.Literal(
  EveMessageCompletedEventTypeValue
);
export type EveMessageCompletedEventType =
  typeof EveMessageCompletedEventType.Type;

export const EveAssistantStepFinishReason = Schema.Literals([
  "content-filter",
  "error",
  "length",
  "other",
  "stop",
  "tool-calls",
]);
export type EveAssistantStepFinishReason =
  typeof EveAssistantStepFinishReason.Type;

export const EveSessionId = Schema.NonEmptyString.pipe(
  Schema.brand("EveSessionId")
);
export type EveSessionId = typeof EveSessionId.Type;

export const EveTurnId = Schema.NonEmptyString.pipe(Schema.brand("EveTurnId"));
export type EveTurnId = typeof EveTurnId.Type;

export const EveAssistantMessageContent = Schema.String;
export type EveAssistantMessageContent = typeof EveAssistantMessageContent.Type;

export const WorkspaceStatusInput = Schema.Struct({
  question: BundjilWorkspaceStatusQuestion,
});

export type WorkspaceStatusInput = typeof WorkspaceStatusInput.Type;

export const WorkspaceStatusSuccess = Schema.Struct({
  workspaceName: BundjilWorkspaceName,
  packageNames: Schema.Array(BundjilPackageName),
  agentSummary: BundjilAgentSummary,
});

export type WorkspaceStatusSuccess = typeof WorkspaceStatusSuccess.Type;

export type WorkspaceStatusToolInput = WorkspaceStatusInput;

export type WorkspaceStatusToolSuccess = WorkspaceStatusSuccess;

import { Context, Effect, Layer, Schema } from "effect";

import { WorkspaceSchemaError } from "../errors.js";
import { WorkspaceStatusSuccess } from "../schemas.js";
import type {
  WorkspaceStatusInput,
  WorkspaceStatusSuccess as WorkspaceStatusSuccessType,
} from "../schemas.js";
import { makeWorkspaceSummary } from "../workspace-status.js";

export interface WorkspaceOperationsShape {
  readonly getWorkspaceStatus: (
    input: WorkspaceStatusInput
  ) => Effect.Effect<WorkspaceStatusSuccessType, WorkspaceSchemaError>;
}

export class WorkspaceOperations extends Context.Service<
  WorkspaceOperations,
  WorkspaceOperationsShape
>()("@bundjil/eve/WorkspaceOperations") {}

export const WorkspaceOperationsLive = Layer.effect(
  WorkspaceOperations,
  Effect.succeed({
    getWorkspaceStatus: Effect.fn("WorkspaceOperationsLive.getWorkspaceStatus")(
      (input: WorkspaceStatusInput) =>
        Effect.gen(function* getWorkspaceStatus() {
          const workspace = yield* makeWorkspaceSummary().pipe(
            Effect.mapError(
              () =>
                new WorkspaceSchemaError({
                  boundary: "WorkspaceSummary",
                  message: "Unable to decode workspace summary.",
                })
            )
          );

          return yield* Schema.decodeUnknownEffect(WorkspaceStatusSuccess)({
            workspaceName: workspace.name,
            packageNames: workspace.packages,
            agentSummary: `Question: ${input.question}. Workspace ${workspace.name} exposes ${workspace.packages.length} packages: ${workspace.packages.join(", ")}.`,
          }).pipe(
            Effect.mapError(
              () =>
                new WorkspaceSchemaError({
                  boundary: "WorkspaceStatusSuccess",
                  message: "Unable to encode workspace status success.",
                })
            )
          );
        }).pipe(Effect.withSpan("WorkspaceOperations.getWorkspaceStatus"))
    ),
  })
);

export const WorkspaceOperationsMemory = (
  workspaceStatus: WorkspaceStatusSuccessType
) =>
  Layer.succeed(WorkspaceOperations, {
    getWorkspaceStatus: Effect.fn(
      "WorkspaceOperationsMemory.getWorkspaceStatus"
    )((_input: WorkspaceStatusInput) => Effect.succeed(workspaceStatus)),
  });

export const getWorkspaceStatus = Effect.fnUntraced(
  function* getWorkspaceStatus(input: WorkspaceStatusInput) {
    const operations = yield* WorkspaceOperations;

    return yield* operations.getWorkspaceStatus(input);
  }
);

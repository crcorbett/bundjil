import { makeWorkspaceSummary } from "@bundjil/core";
import { Context, Effect, Layer, Schema } from "effect";

import { BundjilAgentSchemaError } from "../errors.js";
import type { WorkspaceStatusFailure } from "../errors.js";
import { WorkspaceStatusSuccess } from "../schemas.js";
import type {
  WorkspaceStatusInput,
  WorkspaceStatusSuccess as WorkspaceStatusSuccessType,
} from "../schemas.js";

export interface BundjilAgentOperationsShape {
  readonly getWorkspaceStatus: (
    input: WorkspaceStatusInput
  ) => Effect.Effect<WorkspaceStatusSuccessType, WorkspaceStatusFailure>;
}

export class BundjilAgentOperations extends Context.Service<
  BundjilAgentOperations,
  BundjilAgentOperationsShape
>()("@bundjil/eve-effect/BundjilAgentOperations") {}

export const BundjilAgentOperationsLive = Layer.effect(
  BundjilAgentOperations,
  Effect.succeed({
    getWorkspaceStatus: Effect.fn(
      "BundjilAgentOperationsLive.getWorkspaceStatus"
    )((input: WorkspaceStatusInput) =>
      Effect.gen(function* getWorkspaceStatus() {
        const workspace = yield* makeWorkspaceSummary().pipe(
          Effect.mapError(
            (cause) =>
              new BundjilAgentSchemaError({
                boundary: "WorkspaceSummary",
                message: "Unable to decode workspace summary.",
                cause,
              })
          )
        );

        return yield* Schema.decodeEffect(WorkspaceStatusSuccess)({
          workspaceName: workspace.name,
          packageNames: workspace.packages,
          agentSummary: `Question: ${input.question}. Workspace ${workspace.name} exposes ${workspace.packages.length} packages: ${workspace.packages.join(", ")}.`,
        }).pipe(
          Effect.mapError(
            (cause) =>
              new BundjilAgentSchemaError({
                boundary: "WorkspaceStatusSuccess",
                message: "Unable to decode workspace status success.",
                cause,
              })
          )
        );
      }).pipe(Effect.withSpan("BundjilAgentOperations.getWorkspaceStatus"))
    ),
  })
);

export const BundjilAgentOperationsMemory = (
  workspaceStatus: WorkspaceStatusSuccessType
) =>
  Layer.succeed(BundjilAgentOperations, {
    getWorkspaceStatus: Effect.fn(
      "BundjilAgentOperationsMemory.getWorkspaceStatus"
    )((_input: WorkspaceStatusInput) => Effect.succeed(workspaceStatus)),
  });

export const getWorkspaceStatus = (input: WorkspaceStatusInput) =>
  Effect.gen(function* getWorkspaceStatus() {
    const operations = yield* BundjilAgentOperations;

    return yield* operations.getWorkspaceStatus(input);
  });

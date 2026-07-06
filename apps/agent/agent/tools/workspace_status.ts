import {
  BundjilAgentOperationsLive,
  WorkspaceStatusInput,
  WorkspaceStatusSuccess,
  getWorkspaceStatus,
} from "@bundjil/eve-effect";
import { toEveSchema } from "@bundjil/eve-effect/eve/tool-adapter";
import { Effect } from "effect";
import { defineTool } from "eve/tools";

export const workspaceStatusInputSchema = toEveSchema(WorkspaceStatusInput);
export const workspaceStatusOutputSchema = toEveSchema(WorkspaceStatusSuccess);

const workspaceStatusTool = defineTool({
  description:
    "Report deterministic Bundjil workspace status from the app-owned Effect operation.",
  inputSchema: workspaceStatusInputSchema,
  outputSchema: workspaceStatusOutputSchema,
  execute(input) {
    return Effect.runPromise(
      getWorkspaceStatus(input).pipe(Effect.provide(BundjilAgentOperationsLive))
    );
  },
});

export default workspaceStatusTool;

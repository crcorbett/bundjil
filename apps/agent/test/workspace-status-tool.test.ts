import { defaultWorkspacePackages } from "@bundjil/core";
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import type { ToolContext } from "eve/tools";

import workspaceStatusTool, {
  workspaceStatusInputSchema,
  workspaceStatusOutputSchema,
} from "../agent/tools/workspace_status.js";

const unusedToolContext: ToolContext = {
  session: {
    id: "test-session",
    auth: {
      current: null,
      initiator: null,
    },
    turn: {
      id: "test-turn",
      sequence: 0,
    },
  },
  abortSignal: new AbortController().signal,
  callId: "test-call",
  getSandbox: () => Promise.reject(new Error("Sandbox is not used.")),
  getSkill: () => {
    throw new Error("Skills are not used.");
  },
  getToken: () => Promise.reject(new Error("Auth is not used.")),
  requireAuth: () => {
    throw new Error("Auth is not used.");
  },
};

it.effect("executes the Eve tool through the live Effect named operation", () =>
  Effect.gen(function* testWorkspaceStatusTool() {
    const status = yield* Effect.promise(() =>
      Promise.resolve(
        workspaceStatusTool.execute(
          {
            question: "Which packages are available?",
          },
          unusedToolContext
        )
      )
    );

    assert.strictEqual(status.workspaceName, "bundjil");
    assert.deepStrictEqual(status.packageNames, defaultWorkspacePackages);
    assert.include(status.packageNames, "@bundjil/eve-effect");
    assert.include(status.agentSummary, "Which packages are available?");
    assert.include(status.agentSummary, "@bundjil/eve-effect");
  })
);

it.effect(
  "uses Effect Schema adapters for Eve input and output validation",
  () =>
    Effect.sync(() => {
      assert.strictEqual(
        workspaceStatusTool.inputSchema,
        workspaceStatusInputSchema
      );
      assert.strictEqual(
        workspaceStatusTool.outputSchema,
        workspaceStatusOutputSchema
      );

      assert.isFunction(workspaceStatusInputSchema["~standard"].validate);
      assert.isFunction(
        workspaceStatusInputSchema["~standard"].jsonSchema.input
      );
      assert.isFunction(workspaceStatusOutputSchema["~standard"].validate);
      assert.isFunction(
        workspaceStatusOutputSchema["~standard"].jsonSchema.output
      );

      assert.deepStrictEqual(
        workspaceStatusInputSchema["~standard"].validate({ question: "" }),
        {
          issues: [
            {
              message: 'Expected a value with a length of at least 1, got ""',
              path: ["question"],
            },
          ],
        }
      );

      assert.deepStrictEqual(
        workspaceStatusOutputSchema["~standard"].validate({
          workspaceName: "bundjil",
          packageNames: defaultWorkspacePackages,
          agentSummary: "Workspace status.",
        }),
        {
          value: {
            workspaceName: "bundjil",
            packageNames: defaultWorkspacePackages,
            agentSummary: "Workspace status.",
          },
        }
      );
    })
);

import { defaultWorkspacePackages } from "@bundjil/core";
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";

import {
  BundjilAgentOperationsLive,
  BundjilAgentOperationsMemory,
  getWorkspaceStatus,
} from "../src/index.js";

it.effect(
  "gets deterministic workspace status from the live Effect service",
  () =>
    Effect.gen(function* testLiveWorkspaceStatus() {
      const status = yield* getWorkspaceStatus({
        question: "What can this workspace do?",
      }).pipe(Effect.provide(BundjilAgentOperationsLive));

      assert.strictEqual(status.workspaceName, "bundjil");
      assert.deepStrictEqual(status.packageNames, defaultWorkspacePackages);
      assert.include(status.agentSummary, "What can this workspace do?");
      assert.include(status.agentSummary, "@bundjil/core");
    })
);

it.effect("can replace the operation with a memory layer", () =>
  Effect.gen(function* testMemoryWorkspaceStatus() {
    const status = yield* getWorkspaceStatus({
      question: "Use the memory layer.",
    }).pipe(
      Effect.provide(
        BundjilAgentOperationsMemory({
          workspaceName: "memory-workspace",
          packageNames: ["@bundjil/memory-only"],
          agentSummary: "Memory-backed status for tests.",
        })
      )
    );

    assert.deepStrictEqual(status, {
      workspaceName: "memory-workspace",
      packageNames: ["@bundjil/memory-only"],
      agentSummary: "Memory-backed status for tests.",
    });
  })
);

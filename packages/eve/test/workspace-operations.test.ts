import { assert, it } from "@effect/vitest";
import { Effect } from "effect";

import {
  WorkspaceOperationsLive,
  WorkspaceOperationsMemory,
  defaultWorkspacePackages,
  getWorkspaceStatus,
  makeWorkspaceSummary,
} from "../src/index.js";

it.effect("creates the default workspace summary", () =>
  Effect.gen(function* testDefaultSummary() {
    const summary = yield* makeWorkspaceSummary();

    assert.strictEqual(summary.name, "bundjil");
    assert.deepStrictEqual(summary.packages, defaultWorkspacePackages);
  })
);

it.effect("allows a custom workspace name", () =>
  Effect.gen(function* testCustomName() {
    const summary = yield* makeWorkspaceSummary("example");

    assert.strictEqual(summary.name, "example");
  })
);

it.effect(
  "gets deterministic workspace status from the live Effect service",
  () =>
    Effect.gen(function* testLiveWorkspaceStatus() {
      const status = yield* getWorkspaceStatus({
        question: "What can this workspace do?",
      }).pipe(Effect.provide(WorkspaceOperationsLive));

      assert.strictEqual(status.workspaceName, "bundjil");
      assert.deepStrictEqual(status.packageNames, defaultWorkspacePackages);
      assert.include(status.agentSummary, "What can this workspace do?");
      assert.deepStrictEqual(status.packageNames, [
        "@bundjil/codex",
        "@bundjil/eve",
        "@bundjil/store",
      ]);
    })
);

it.effect("can replace the operation with a memory layer", () =>
  Effect.gen(function* testMemoryWorkspaceStatus() {
    const status = yield* getWorkspaceStatus({
      question: "Use the memory layer.",
    }).pipe(
      Effect.provide(
        WorkspaceOperationsMemory({
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

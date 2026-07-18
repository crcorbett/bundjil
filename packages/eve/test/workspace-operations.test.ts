import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";

import {
  BundjilDefaultWorkspacePackage,
  EveAssistantStepFinishReason,
  EveMessageCompletedEventType,
  EveMessageCompletedEventTypeValue,
  EveSessionId,
  EveTurnId,
  WorkspaceOperationsLive,
  WorkspaceOperationsMemory,
  WorkspaceStatusSuccess,
  defaultWorkspacePackages,
  getWorkspaceStatus,
  makeWorkspaceSummary,
} from "../src/index.js";

it.effect("creates the default workspace summary", () =>
  Effect.gen(function* testDefaultSummary() {
    const summary = yield* makeWorkspaceSummary();

    assert.strictEqual(summary.name, "bundjil");
    assert.strictEqual(
      summary.packages.join(","),
      defaultWorkspacePackages.join(",")
    );
  })
);

it.effect("allows a custom workspace name", () =>
  Effect.gen(function* testCustomName() {
    const summary = yield* makeWorkspaceSummary("example");

    assert.strictEqual(summary.name, "example");
  })
);

it.effect("decodes canonical Eve completed-event contracts", () =>
  Effect.gen(function* testCompletedEventContracts() {
    assert.strictEqual(
      yield* Schema.decodeUnknownEffect(EveMessageCompletedEventType)(
        EveMessageCompletedEventTypeValue
      ),
      "message.completed"
    );
    assert.deepStrictEqual(
      yield* Effect.forEach(
        ["content-filter", "error", "length", "other", "stop", "tool-calls"],
        (finishReason) =>
          Schema.decodeUnknownEffect(EveAssistantStepFinishReason)(finishReason)
      ),
      ["content-filter", "error", "length", "other", "stop", "tool-calls"]
    );
    assert.strictEqual(
      yield* Schema.decodeUnknownEffect(EveSessionId)("session-private"),
      "session-private"
    );
    assert.strictEqual(
      yield* Schema.decodeUnknownEffect(EveTurnId)("turn-private"),
      "turn-private"
    );
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
      assert.strictEqual(
        status.packageNames.join(","),
        defaultWorkspacePackages.join(",")
      );
      assert.include(status.agentSummary, "What can this workspace do?");
      assert.strictEqual(
        status.packageNames.join(","),
        "@bundjil/codex,@bundjil/eve,@bundjil/store"
      );
      assert.isTrue(
        Schema.is(BundjilDefaultWorkspacePackage)(status.packageNames[0])
      );
    })
);

it.effect("can replace the operation with a memory layer", () =>
  Effect.gen(function* testMemoryWorkspaceStatus() {
    const status = yield* getWorkspaceStatus({
      question: "Use the memory layer.",
    }).pipe(
      Effect.provide(
        WorkspaceOperationsMemory(
          Schema.decodeUnknownSync(WorkspaceStatusSuccess)({
            workspaceName: "memory-workspace",
            packageNames: ["@bundjil/memory-only"],
            agentSummary: "Memory-backed status for tests.",
          })
        )
      )
    );

    assert.strictEqual(status.workspaceName, "memory-workspace");
    assert.strictEqual(status.packageNames[0], "@bundjil/memory-only");
    assert.strictEqual(status.agentSummary, "Memory-backed status for tests.");
  })
);

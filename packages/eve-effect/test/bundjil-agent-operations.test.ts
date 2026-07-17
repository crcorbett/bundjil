import { defaultWorkspacePackages } from "@bundjil/core";
import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";

import {
  BundjilAgentOperationsLive,
  BundjilAgentOperationsMemory,
  EveAssistantStepFinishReason,
  EveMessageCompletedEventType,
  EveMessageCompletedEventTypeValue,
  EveSessionId,
  EveTurnId,
  WorkspaceStatusSuccess,
  getWorkspaceStatus,
} from "../src/index.js";

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
      }).pipe(Effect.provide(BundjilAgentOperationsLive));

      assert.strictEqual(status.workspaceName, "bundjil");
      assert.strictEqual(
        status.packageNames.join(","),
        defaultWorkspacePackages.join(",")
      );
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
        BundjilAgentOperationsMemory(
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

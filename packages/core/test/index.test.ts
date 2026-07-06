import { assert, it } from "@effect/vitest";
import { Effect } from "effect";

import { defaultWorkspacePackages, makeWorkspaceSummary } from "../src/index";

it.effect("creates the default Bundjil workspace summary", () =>
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

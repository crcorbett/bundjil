import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";

import {
  BundjilDefaultWorkspacePackage,
  defaultWorkspacePackages,
  makeWorkspaceSummary,
} from "../src/index.js";

it.effect("creates the default Bundjil workspace summary", () =>
  Effect.gen(function* testDefaultSummary() {
    const summary = yield* makeWorkspaceSummary();

    assert.strictEqual(summary.name, "bundjil");
    assert.deepStrictEqual(summary.packages, defaultWorkspacePackages);
    assert.isTrue(
      Schema.is(BundjilDefaultWorkspacePackage)(summary.packages[0])
    );
  })
);

it.effect("allows a custom workspace name", () =>
  Effect.gen(function* testCustomName() {
    const summary = yield* makeWorkspaceSummary("example");

    assert.strictEqual(summary.name, "example");
  })
);

it.effect(
  "rejects an empty workspace name through the Effect error channel",
  () =>
    Effect.gen(function* testInvalidWorkspaceName() {
      const error = yield* Effect.flip(makeWorkspaceSummary(""));

      assert.isDefined(error);
    })
);

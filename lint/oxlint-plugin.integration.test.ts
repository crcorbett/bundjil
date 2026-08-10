import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { deterministicEffectNativeVitestFixture } from "../packages/codex/test/fixtures/effect-native-vitest-positive.js";

const runFixture = (fixture: string) => {
  const child = spawnSync(
    "bunx",
    [
      "--bun",
      "oxlint",
      "--config",
      "lint/fixtures/effect-native.config.json",
      fixture,
    ],
    { encoding: "utf-8" }
  );
  return {
    exitCode: child.status,
    output: `${child.stdout}\n${child.stderr}`,
  };
};

describe("installed Bundjil Oxlint plugin", () => {
  it("accepts the exact positive fixture", () => {
    const result = runFixture("lint/fixtures/effect-native-positive.ts");
    expect(result.exitCode).toBe(0);
    expect(result.output).not.toContain("bundjil(");
  });

  it("accepts the Effect TestClock fixture through installed Oxlint", () => {
    const result = runFixture(
      "lint/fixtures/effect-native-test-clock-positive.ts"
    );
    expect(result.exitCode).toBe(0);
    expect(result.output).not.toContain("bundjil(");
  });

  it("accepts the package-resolved @effect/vitest fixture", () => {
    expect(deterministicEffectNativeVitestFixture).toBeDefined();
    const result = runFixture(
      "packages/codex/test/fixtures/effect-native-vitest-positive.ts"
    );
    expect(result.exitCode).toBe(0);
    expect(result.output).not.toContain("bundjil(");
  });

  it("rejects every exact negative rule fixture by stable ID", () => {
    const result = runFixture("lint/fixtures/effect-native-negative.ts");
    expect(result.exitCode).not.toBe(0);
    for (const rule of [
      "bundjil(no-ambient-time-in-effect)",
      "bundjil(no-async-await-in-effect-service)",
      "bundjil(no-runtime-execution-outside-boundary)",
      "bundjil(require-try-promise-catch)",
    ]) {
      expect(result.output).toContain(rule);
    }
  });
});

import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import nodePath from "node:path";

import { describe, expect, it } from "vitest";

import { deterministicEffectNativeVitestFixture } from "../packages/codex/test/fixtures/effect-native-vitest-positive.js";

const { resolve } = nodePath;

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

const runRootProbe = (probe: string) => {
  const child = spawnSync(
    "bunx",
    ["--bun", "oxlint", "--config", "oxlint.config.ts", probe],
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
      "bundjil(no-exported-effect-gen-function)",
      "bundjil(no-layer-or-die-in-service)",
      "bundjil(no-primitive-effect-failure)",
      "bundjil(no-runtime-execution-outside-boundary)",
      "bundjil(no-unregistered-native-collection)",
      "bundjil(require-try-promise-catch)",
    ]) {
      expect(result.output).toContain(rule);
    }
  });

  it("loads both anti-slop plugins through the root config", () => {
    const genericProbe = "packages/channel/src/.anti-slop-lint-probe.ts";
    const effectProbe = "packages/codex/src/.anti-slop-effect-lint-probe.ts";
    writeFileSync(
      resolve(genericProbe),
      'const inspect = (value: unknown) => typeof value === "string";\nvoid inspect;\n'
    );
    writeFileSync(
      resolve(effectProbe),
      'import { makeCodexOAuthHttpClient } from "./auth/http-client.js";\nvoid makeCodexOAuthHttpClient;\n'
    );

    try {
      const generic = runRootProbe(genericProbe);
      const effect = runRootProbe(effectProbe);
      expect(generic.exitCode).not.toBe(0);
      expect(generic.output).toContain("anti-slop(no-runtime-typeof)");
      expect(generic.output).toContain("anti-slop(no-unknown-parameters)");
      expect(effect.exitCode).not.toBe(0);
      expect(effect.output).toContain(
        "anti-slop-effect(no-service-constructor-imports)"
      );
    } finally {
      rmSync(resolve(genericProbe), { force: true });
      rmSync(resolve(effectProbe), { force: true });
    }
  });

  it("allows TypeScript value/type namespaces without allowing JavaScript duplicates", () => {
    const typescriptProbe = "packages/channel/src/.namespace-lint-probe.ts";
    const javascriptProbe = "packages/channel/src/.duplicate-lint-probe.js";
    writeFileSync(
      resolve(typescriptProbe),
      "const OwnerContract = { value: true };\ntype OwnerContract = typeof OwnerContract;\nvoid OwnerContract;\n"
    );
    writeFileSync(
      resolve(javascriptProbe),
      "const duplicate = 1;\nconst duplicate = 2;\nvoid duplicate;\n"
    );

    try {
      const typescript = runRootProbe(typescriptProbe);
      const javascript = runRootProbe(javascriptProbe);
      expect(typescript.exitCode).toBe(0);
      expect(typescript.output).not.toContain("no-redeclare");
      expect(javascript.exitCode).not.toBe(0);
      expect(javascript.output).toContain(
        "Identifier `duplicate` has already been declared"
      );
    } finally {
      rmSync(resolve(typescriptProbe), { force: true });
      rmSync(resolve(javascriptProbe), { force: true });
    }
  });

  it("applies ambient-time enforcement to owned tooling", () => {
    const probe = "tooling/.ambient-time-lint-probe.ts";
    writeFileSync(resolve(probe), "new Date();\n");

    try {
      const child = spawnSync(
        "bunx",
        ["--bun", "oxlint", "--config", "oxlint.config.ts", probe],
        { encoding: "utf-8" }
      );
      expect(child.status).not.toBe(0);
      expect(`${child.stdout}\n${child.stderr}`).toContain(
        "bundjil(no-ambient-time-in-effect)"
      );
    } finally {
      rmSync(resolve(probe), { force: true });
    }
  });

  it("applies primitive-failure enforcement to infrastructure scripts", () => {
    const probe =
      "packages/infrastructure/scripts/.primitive-failure-lint-probe.ts";
    writeFileSync(
      resolve(probe),
      'import { Effect } from "effect";\nEffect.fail("primitive");\n'
    );

    try {
      const child = spawnSync(
        "bunx",
        ["--bun", "oxlint", "--config", "oxlint.config.ts", probe],
        { encoding: "utf-8" }
      );
      expect(child.status).not.toBe(0);
      expect(`${child.stdout}\n${child.stderr}`).toContain(
        "bundjil(no-primitive-effect-failure)"
      );
    } finally {
      rmSync(resolve(probe), { force: true });
    }
  });

  it("applies native-collection review to owned package scripts", () => {
    const probe =
      "packages/infrastructure/scripts/.native-collection-lint-probe.ts";
    writeFileSync(resolve(probe), 'const values = new Set(["value"]);\n');

    try {
      const child = spawnSync(
        "bunx",
        ["--bun", "oxlint", "--config", "oxlint.config.ts", probe],
        { encoding: "utf-8" }
      );
      expect(child.status).not.toBe(0);
      expect(`${child.stdout}\n${child.stderr}`).toContain(
        "bundjil(no-unregistered-native-collection)"
      );
    } finally {
      rmSync(resolve(probe), { force: true });
    }
  });
});

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// Compile real files with the installed compiler: a successful patch command
// alone does not prove TypeScript or Effect errors still fail the check.
const compile = (source: string) => {
  const root = process.cwd();
  mkdirSync(path.join(root, "tmp"), { recursive: true });
  const directory = mkdtempSync(path.join(root, "tmp/compiler-"));
  try {
    writeFileSync(path.join(directory, "fixture.ts"), source);
    writeFileSync(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({
        extends: path.join(root, "tsconfig.base.json"),
        compilerOptions: {
          composite: false,
          incremental: false,
          noEmit: true,
          rootDir: directory,
        },
        include: ["fixture.ts"],
      })
    );
    const result = spawnSync(
      "node",
      [
        path.join(root, "node_modules/.bin/tsc"),
        "--project",
        path.join(directory, "tsconfig.json"),
      ],
      { encoding: "utf-8", timeout: 30_000 }
    );
    return {
      status: result.status,
      output: `${result.stdout}\n${result.stderr}`,
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};

describe("installed TypeScript 7 with Effect diagnostics", () => {
  it("uses the native compiler for the workspace tsc command", () => {
    const result = spawnSync("node", ["node_modules/.bin/tsc", "--version"], {
      encoding: "utf-8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("Version 7.0.2+effect-tsgo.0.38.0");
  });

  it("accepts a valid Effect program", () => {
    const result = compile(
      'import { Effect } from "effect"; export const program = Effect.gen(function* () { return yield* Effect.succeed(1); });'
    );
    expect(result.status).toBe(0);
  });

  it.each([
    [
      "TypeScript assignment",
      'export const count: number = "wrong";',
      "TS2322",
    ],
    [
      "unrun Effect",
      'import { Effect } from "effect"; export const program = Effect.gen(function* () { Effect.succeed(1); return yield* Effect.succeed(2); });',
      "effect(floatingEffect)",
    ],
  ])("rejects %s", (_name, source, diagnostic) => {
    const result = compile(source);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain(diagnostic);
  });
});

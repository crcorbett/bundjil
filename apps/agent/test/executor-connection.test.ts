import { execFile, execFileSync } from "node:child_process";

import { assert, it } from "@effect/vitest";
import { Data, Effect, Match } from "effect";

import connection from "../agent/connections/executor.js";

class ExecutorConnectionTestError extends Data.TaggedError(
  "ExecutorConnectionTestError"
)<{
  reason: string;
}> {}

const syntheticEndpoint =
  "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=browser";
const syntheticKey = "executor-connection-synthetic-secret";
const bunExecutable =
  typeof Bun === "undefined"
    ? execFileSync("which", ["bun"], { encoding: "utf-8" }).trim()
    : (Bun.which("bun") ?? "bun");

const runExecutorConnectionSubprocess = Effect.fn(
  "ExecutorConnectionTest.runSubprocess"
)(function* (probe: "import" | "missing-key" | "synthetic-key") {
  const env =
    probe === "synthetic-key"
      ? {
          BUNDJIL_EXECUTOR_API_KEY: syntheticKey,
          BUNDJIL_EXECUTOR_MCP_URL: syntheticEndpoint,
        }
      : { BUNDJIL_EXECUTOR_MCP_URL: syntheticEndpoint };
  const source = Match.value(probe).pipe(
    Match.when("import", () => 'import "./agent/connections/executor.js";'),
    Match.when("missing-key", () =>
      [
        'import connection from "./agent/connections/executor.js";',
        "const auth = connection.auth;",
        'if (!auth || typeof auth === "function" || !("getToken" in auth)) throw new Error("expected static bearer authentication");',
        'const failure = await auth.getToken({ connection: { url: connection.url }, principal: { type: "app" } }).then(() => undefined, (error) => error);',
        "const renderedFailure = String(failure);",
        'if (failure === undefined || !renderedFailure.includes("ExecutorConnectionConfigError") || !renderedFailure.includes("loadApiKey") || renderedFailure.includes("BUNDJIL_EXECUTOR_API_KEY")) throw new Error("expected sanitized missing-key error");',
      ].join("\n")
    ),
    Match.when("synthetic-key", () =>
      [
        'import connection from "./agent/connections/executor.js";',
        "const auth = connection.auth;",
        'if (!auth || typeof auth === "function" || !("getToken" in auth)) throw new Error("expected static bearer authentication");',
        'const token = await auth.getToken({ connection: { url: connection.url }, principal: { type: "app" } });',
        'if (token.token.length !== 36) throw new Error("expected adapter bearer");',
      ].join("\n")
    ),
    Match.exhaustive
  );

  const output = yield* Effect.callback<
    Readonly<{ stderr: string; stdout: string }>,
    ExecutorConnectionTestError
  >((resume) => {
    const child = execFile(
      bunExecutable,
      ["--eval", source],
      {
        cwd: `${import.meta.dirname}/..`,
        encoding: "utf-8",
        env,
      },
      (error, stdout, stderr) => {
        resume(
          error === null
            ? Effect.succeed({ stderr, stdout })
            : Effect.fail(
                new ExecutorConnectionTestError({
                  reason: "Executor connection executable-edge proof failed.",
                })
              )
        );
      }
    );

    return Effect.sync(() => {
      child.kill();
    });
  });
  assert.notInclude(output.stdout, syntheticKey);
  assert.notInclude(output.stderr, syntheticKey);
});

it.effect(
  "defines the app-scoped Executor connection at the adapter edge",
  () =>
    Effect.gen(function* testExecutorConnection() {
      assert.deepStrictEqual(connection.tools, {
        allow: ["skills", "execute", "resume"],
      });
      const { auth, approval, headers } = connection;
      assert.strictEqual(approval, undefined);
      assert.strictEqual(headers, undefined);
      if (!auth || typeof auth === "function" || !("getToken" in auth)) {
        assert.fail("Expected static bearer authentication.");
      } else {
        assert.strictEqual(auth.principalType, "app");
      }

      yield* runExecutorConnectionSubprocess("import");
      yield* runExecutorConnectionSubprocess("missing-key");
      yield* runExecutorConnectionSubprocess("synthetic-key");
    }).pipe(Effect.withSpan("ExecutorConnectionTest.definition"))
);

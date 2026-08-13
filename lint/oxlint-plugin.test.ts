import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

import {
  noAmbientTimeInEffectRule,
  noAsyncAwaitInEffectServiceRule,
  noPrimitiveEffectFailureRule,
  noRuntimeExecutionOutsideBoundaryRule,
  requireTryPromiseCatchRule,
  taggedErrorNameRule,
} from "./oxlint-plugin.js";

RuleTester.describe = (_text, method) => {
  method();
};
RuleTester.it = (_text, method) => {
  method();
};

const makeRuleTester = () =>
  new RuleTester({
    languageOptions: {
      parserOptions: {
        lang: "ts",
      },
    },
  });

describe("bundjil/tagged-error-name", () => {
  it("enforces matching tagged-error contract names", () => {
    const ruleTester = makeRuleTester();

    expect(() => {
      ruleTester.run("tagged-error-name", taggedErrorNameRule, {
        valid: [
          `
          class ExampleError extends Schema.TaggedErrorClass<ExampleError>()(
            "ExampleError",
            {}
          ) {}
        `,
          "class OrdinaryClass {}",
        ],
        invalid: [
          {
            code: `
            class WrongDeclaration extends Schema.TaggedErrorClass<ExampleError>()(
              "ExampleError",
              {}
            ) {}
          `,
            errors: [{ messageId: "mismatch" }],
          },
          {
            code: `
            class ExampleError extends Schema.TaggedErrorClass<WrongSelfType>()(
              "ExampleError",
              {}
            ) {}
          `,
            errors: [{ messageId: "mismatch" }],
          },
          {
            code: `
            class ExampleError extends Schema.TaggedErrorClass<ExampleError>()(
              "WrongLiteralTag",
              {}
            ) {}
          `,
            errors: [{ messageId: "mismatch" }],
          },
        ],
      });
    }).not.toThrow();
  });
});

describe("bundjil/no-ambient-time-in-effect", () => {
  it("rejects ambient clocks, timers and TestClock escape while preserving explicit time", () => {
    expect(() => {
      makeRuleTester().run(
        "no-ambient-time-in-effect",
        noAmbientTimeInEffectRule,
        {
          valid: [
            "Effect.gen(function* () { const value = yield* Clock.currentTimeMillis; return new Date(value); });",
            "Effect.gen(function* () { const fiber = yield* Effect.fork(Effect.sleep('1 second')); yield* TestClock.adjust('1 second'); return yield* Fiber.join(fiber); });",
            "new Date(1_700_000_000_000);",
            {
              code: "Date.now(); Date.now(); setTimeout(() => undefined, 1);",
              filename: "/repo/apps/codex-proxy/test/prove-preview.test.ts",
            },
          ],
          invalid: [
            { code: "Date.now();", errors: [{ messageId: "noDateNow" }] },
            { code: "new Date();", errors: [{ messageId: "noNewDate" }] },
            {
              code: "setTimeout(() => undefined, 1);",
              errors: [{ messageId: "nosetTimeout" }],
            },
            {
              code: "setInterval(() => undefined, 1);",
              errors: [{ messageId: "nosetInterval" }],
            },
            {
              code: "Bun.sleep(1);",
              errors: [{ messageId: "noBunSleep" }],
            },
            {
              code: "TestClock.withLive(Effect.sleep('1 second'));",
              errors: [{ messageId: "noTestClockWithLive" }],
            },
            {
              code: "import { setTimeout as delay } from 'node:timers/promises'; delay(1);",
              errors: [{ messageId: "nosetTimeout" }],
            },
            {
              code: "Date.now();",
              filename: "/repo/apps/codex-proxy/test/prove-preview.test.ts",
              errors: [{ messageId: "staleException" }],
            },
          ],
        }
      );
    }).not.toThrow();
  });
});

describe("bundjil/no-async-await-in-effect-service", () => {
  it("confines Promise syntax to direct Effect ingress callbacks", () => {
    expect(() => {
      makeRuleTester().run(
        "no-async-await-in-effect-service",
        noAsyncAwaitInEffectServiceRule,
        {
          valid: [
            "import { Effect } from 'effect'; Effect.promise(async () => await fetch('/'));",
            "import { Effect as Fx } from 'effect'; Fx.tryPromise({ try: async () => await fetch('/'), catch: () => new Error() });",
            "import { Effect } from 'effect'; Effect.tryPromise({ catch: () => new Error(), try: () => new Promise(() => undefined) });",
            "const program = Effect.gen(function* () { return yield* service.read; });",
            {
              code: "const acquire = async () => { await one(); await two(); await three(); }; const resolve = async () => undefined;",
              filename: "/repo/packages/photon/src/client.ts",
            },
          ],
          invalid: [
            {
              code: "const read = async () => 1;",
              errors: [{ messageId: "noAsync" }],
            },
            {
              code: "async function read() { return await fetch('/'); }",
              errors: [{ messageId: "noAsync" }, { messageId: "noAwait" }],
            },
            {
              code: "const value = new Promise(() => undefined);",
              errors: [{ messageId: "noPromise" }],
            },
            {
              code: "const acquire = async () => { await one(); };",
              filename: "/repo/packages/photon/src/client.ts",
              errors: [{ messageId: "staleException" }],
            },
          ],
        }
      );
    }).not.toThrow();
  });
});

describe("bundjil/require-try-promise-catch", () => {
  it("requires import-aware object form with both try and catch", () => {
    expect(() => {
      makeRuleTester().run(
        "require-try-promise-catch",
        requireTryPromiseCatchRule,
        {
          valid: [
            "import { Effect } from 'effect'; Effect.tryPromise({ try: () => fetch('/'), catch: () => new Error() });",
            "import { tryPromise as attempt } from 'effect/Effect'; attempt({ try: () => fetch('/'), catch: () => new Error() });",
            "const tryPromise = (value: unknown) => value; tryPromise(() => fetch('/'));",
          ],
          invalid: [
            {
              code: "import { Effect } from 'effect'; Effect.tryPromise(() => fetch('/'));",
              errors: [{ messageId: "requireCatch" }],
            },
            {
              code: "import { tryPromise as attempt } from 'effect/Effect'; attempt({ try: () => fetch('/') });",
              errors: [{ messageId: "requireCatch" }],
            },
          ],
        }
      );
    }).not.toThrow();
  });
});

describe("bundjil/no-primitive-effect-failure", () => {
  it("requires owner-named values in Effect failure channels", () => {
    expect(() => {
      makeRuleTester().run(
        "no-primitive-effect-failure",
        noPrimitiveEffectFailureRule,
        {
          valid: [
            "import { Effect } from 'effect'; Effect.fail(new ExampleError());",
            "import { fail as reject } from 'effect/Effect'; reject(new ExampleError());",
            "import { Effect } from 'effect'; Effect.mapError(() => new ExampleError());",
            "const fail = (value: unknown) => value; fail('unrelated');",
          ],
          invalid: [
            {
              code: "import { Effect } from 'effect'; Effect.fail('invalid');",
              errors: [{ messageId: "noPrimitiveFailure" }],
            },
            {
              code: "import { fail as reject } from 'effect/Effect'; reject(42);",
              errors: [{ messageId: "noPrimitiveFailure" }],
            },
            {
              code: "import { Effect as Fx } from 'effect'; Fx.failSync(() => `invalid`);",
              errors: [{ messageId: "noPrimitiveFailure" }],
            },
            {
              code:
                "import { Effect } from 'effect'; Effect.fail(`invalid-" +
                "$" +
                "{reason}`);",
              errors: [{ messageId: "noPrimitiveFailure" }],
            },
            {
              code: "import { Effect } from 'effect'; Effect.fail(undefined);",
              errors: [{ messageId: "noPrimitiveFailure" }],
            },
            {
              code: "import { mapError as classify } from 'effect/Effect'; classify(() => ('invalid' as const));",
              errors: [{ messageId: "noPrimitiveFailure" }],
            },
            {
              code: "import { Effect } from 'effect'; Effect.mapError(function () { return false; });",
              errors: [{ messageId: "noPrimitiveFailure" }],
            },
          ],
        }
      );
    }).not.toThrow();
  });
});

describe("bundjil/no-runtime-execution-outside-boundary", () => {
  it("allows named owners and rejects import-aware service execution", () => {
    expect(() => {
      makeRuleTester().run(
        "no-runtime-execution-outside-boundary",
        noRuntimeExecutionOutsideBoundaryRule,
        {
          valid: [
            {
              code: "import { Effect } from 'effect'; Effect.runPromise(program);",
              filename: "/repo/packages/example/scripts/prove.ts",
            },
            {
              code: "import { ManagedRuntime } from 'effect'; ManagedRuntime.make(layer);",
              filename: "/repo/apps/agent/agent/channels/photon.ts",
            },
          ],
          invalid: [
            {
              code: "import { Effect as Fx } from 'effect'; Fx.runPromise(program);",
              filename: "/repo/packages/example/src/service.ts",
              errors: [{ messageId: "noRuntimeExecution" }],
            },
            {
              code: "import { runSync as execute } from 'effect/Effect'; execute(program);",
              filename: "/repo/packages/example/src/service.ts",
              errors: [{ messageId: "noRuntimeExecution" }],
            },
            {
              code: "import { ManagedRuntime } from 'effect'; const runtime = undefined;",
              filename: "/repo/apps/agent/agent/channels/photon.ts",
              errors: [{ messageId: "staleException" }],
            },
          ],
        }
      );
    }).not.toThrow();
  });
});

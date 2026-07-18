import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Redacted, Schema } from "effect";

import {
  ExecutorConfigError,
  ExecutorConfigOperation,
  ExecutorElicitationMode,
  ExecutorMcpEndpoint,
  loadExecutorApiKey,
  loadExecutorEndpoint,
} from "../agent/lib/executor/config.js";

const browserEndpoint =
  "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=browser";
const modelEndpoint =
  "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=model";
const syntheticKey = "executor-config-synthetic-secret";

it.effect("encodes and decodes only the Executor config error target tag", () =>
  Effect.sync(() => {
    const expected = {
      _tag: "ExecutorConfigError",
      message: "ExecutorConfigError: loadApiKey",
      operation: "loadApiKey",
      reason: "Executor MCP credential configuration is invalid.",
    } as const;
    const encoded = Schema.encodeUnknownSync(ExecutorConfigError)(
      new ExecutorConfigError({
        message: expected.message,
        operation: expected.operation,
        reason: expected.reason,
      })
    );

    assert.deepStrictEqual(encoded, expected);
    assert.strictEqual(
      Schema.is(ExecutorConfigOperation)("loadEndpoint"),
      true
    );
    assert.strictEqual(Schema.is(ExecutorConfigOperation)("loadApiKey"), true);

    const decoded = Schema.decodeUnknownSync(ExecutorConfigError)(expected);
    assert.strictEqual(decoded._tag, "ExecutorConfigError");
    assert.strictEqual(Schema.is(ExecutorConfigError)(decoded), true);

    const oldEncoded = {
      ...expected,
      _tag: "ExecutorConnectionConfigError",
    };
    assert.strictEqual(Schema.is(ExecutorConfigError)(oldEncoded), false);
    assert.throws(() => {
      Schema.decodeUnknownSync(ExecutorConfigError)(oldEncoded);
    });
  })
);

it.effect(
  "loads explicit model and browser Executor toolkit endpoints and a redacted key",
  () =>
    Effect.gen(function* testExecutorConfig() {
      for (const endpointUrl of [modelEndpoint, browserEndpoint]) {
        const endpoint = yield* loadExecutorEndpoint().pipe(
          Effect.provide(
            ConfigProvider.layer(
              ConfigProvider.fromEnv({
                env: { BUNDJIL_EXECUTOR_MCP_URL: endpointUrl },
              })
            )
          )
        );

        assert.strictEqual(endpoint.href, endpointUrl);
        assert.strictEqual(Schema.is(ExecutorMcpEndpoint)(endpoint), true);
      }
      const key = yield* loadExecutorApiKey().pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: { BUNDJIL_EXECUTOR_API_KEY: syntheticKey },
            })
          )
        )
      );

      assert.strictEqual(Schema.is(ExecutorElicitationMode)("model"), true);
      assert.strictEqual(Schema.is(ExecutorElicitationMode)("browser"), true);
      assert.strictEqual(Schema.is(ExecutorElicitationMode)("native"), false);
      assert.strictEqual(
        Schema.is(Schema.Redacted(Schema.NonEmptyString))(key),
        true
      );
      assert.strictEqual(Redacted.value(key), syntheticKey);
    })
);

it.effect(
  "rejects every endpoint form outside the explicit supported-mode toolkit policy",
  () =>
    Effect.gen(function* testExecutorEndpointPolicy() {
      for (const endpoint of [
        "http://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=browser",
        "https://example.test/mcp/toolkits/bundjil-test?elicitation_mode=browser",
        "https://executor.sh:8443/mcp/toolkits/bundjil-test?elicitation_mode=browser",
        "https://executor.sh/mcp?elicitation_mode=browser",
        "https://executor.sh/mcp/toolkits/?elicitation_mode=browser",
        "https://user@executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=browser",
        "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=browser#fragment",
        "https://executor.sh/mcp/toolkits/bundjil-test",
        "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=browser&elicitation_mode=browser",
        "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=native",
        "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=unknown",
        "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=browser&allow_model_resume=true",
        "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=browser&extra=value",
      ]) {
        const error = yield* loadExecutorEndpoint().pipe(
          Effect.provide(
            ConfigProvider.layer(
              ConfigProvider.fromEnv({
                env: { BUNDJIL_EXECUTOR_MCP_URL: endpoint },
              })
            )
          ),
          Effect.flip
        );

        assert.strictEqual(Schema.is(ExecutorConfigError)(error), true);
        assert.strictEqual(error.operation, "loadEndpoint");
        assert.strictEqual(
          error.reason,
          "Executor MCP endpoint configuration is invalid."
        );
        assert.notInclude(String(error), endpoint);
      }
    })
);

it.effect("sanitizes missing endpoint and credential failures", () =>
  Effect.gen(function* testMissingExecutorConfig() {
    const endpointError = yield* loadExecutorEndpoint().pipe(
      Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env: {} }))),
      Effect.flip
    );
    const keyError = yield* loadExecutorApiKey().pipe(
      Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env: {} }))),
      Effect.flip
    );

    assert.strictEqual(Schema.is(ExecutorConfigError)(endpointError), true);
    assert.strictEqual(endpointError.operation, "loadEndpoint");
    assert.notInclude(String(endpointError), syntheticKey);
    assert.strictEqual(Schema.is(ExecutorConfigError)(keyError), true);
    assert.strictEqual(keyError.operation, "loadApiKey");
    assert.notInclude(String(keyError), syntheticKey);
  })
);

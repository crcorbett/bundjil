import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Redacted, Schema } from "effect";

import {
  ExecutorConnectionConfigError,
  ExecutorMcpEndpoint,
  loadExecutorApiKey,
  loadExecutorEndpoint,
} from "../agent/lib/executor/config.js";

const validEndpoint =
  "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=browser";
const syntheticKey = "executor-config-synthetic-secret";

it.effect(
  "loads a browser-mode Executor toolkit endpoint and redacted key",
  () =>
    Effect.gen(function* testExecutorConfig() {
      const endpoint = yield* loadExecutorEndpoint().pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: { BUNDJIL_EXECUTOR_MCP_URL: validEndpoint },
            })
          )
        )
      );
      const key = yield* loadExecutorApiKey().pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: { BUNDJIL_EXECUTOR_API_KEY: syntheticKey },
            })
          )
        )
      );

      assert.strictEqual(endpoint.href, validEndpoint);
      assert.strictEqual(Schema.is(ExecutorMcpEndpoint)(endpoint), true);
      assert.strictEqual(
        Schema.is(Schema.Redacted(Schema.NonEmptyString))(key),
        true
      );
      assert.strictEqual(Redacted.value(key), syntheticKey);
    })
);

it.effect(
  "rejects every endpoint form outside the browser-mode toolkit policy",
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
        "https://executor.sh/mcp/toolkits/bundjil-test?elicitation_mode=model",
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

        assert.strictEqual(
          Schema.is(ExecutorConnectionConfigError)(error),
          true
        );
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

    assert.strictEqual(
      Schema.is(ExecutorConnectionConfigError)(endpointError),
      true
    );
    assert.strictEqual(endpointError.operation, "loadEndpoint");
    assert.notInclude(String(endpointError), syntheticKey);
    assert.strictEqual(
      Schema.is(ExecutorConnectionConfigError)(keyError),
      true
    );
    assert.strictEqual(keyError.operation, "loadApiKey");
    assert.notInclude(String(keyError), syntheticKey);
  })
);

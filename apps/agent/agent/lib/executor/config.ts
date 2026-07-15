import { Config, ConfigProvider, Effect, Schema } from "effect";

export const ExecutorConnectionConfigOperation = Schema.Literals([
  "loadEndpoint",
  "loadApiKey",
]);

export const ExecutorElicitationMode = Schema.Literals(["model", "browser"]);

export class ExecutorConnectionConfigError extends Schema.TaggedErrorClass<ExecutorConnectionConfigError>()(
  "ExecutorConnectionConfigError",
  {
    message: Schema.NonEmptyString,
    operation: ExecutorConnectionConfigOperation,
    reason: Schema.NonEmptyString,
  }
) {}

export const ExecutorMcpEndpoint = Schema.URL.pipe(
  Schema.check(
    Schema.makeFilter((endpoint) => {
      if (endpoint.protocol !== "https:") {
        return "Executor MCP endpoint must use HTTPS.";
      }
      if (endpoint.hostname !== "executor.sh") {
        return "Executor MCP endpoint must use the approved Executor host.";
      }
      if (endpoint.port) {
        return "Executor MCP endpoint must not override the HTTPS port.";
      }
      if (
        !/^\/(?:[a-z0-9-]+\/)?mcp\/toolkits\/[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(
          endpoint.pathname
        )
      ) {
        return "Executor MCP endpoint must identify a dedicated toolkit.";
      }
      if (endpoint.username || endpoint.password || endpoint.hash) {
        return "Executor MCP endpoint must not contain userinfo or a fragment.";
      }
      const modes = endpoint.searchParams.getAll("elicitation_mode");
      if (modes.length !== 1 || !Schema.is(ExecutorElicitationMode)(modes[0])) {
        return "Executor MCP endpoint must select one explicit supported elicitation mode.";
      }
      if (endpoint.searchParams.has("allow_model_resume")) {
        return "Executor MCP endpoint must not enable legacy model resume.";
      }
      if (
        [...endpoint.searchParams.keys()].some(
          (name) => name !== "elicitation_mode"
        )
      ) {
        return "Executor MCP endpoint contains an unsupported query parameter.";
      }

      return true;
    })
  )
);

const endpointConfig = Config.schema(
  ExecutorMcpEndpoint,
  "BUNDJIL_EXECUTOR_MCP_URL"
);
const apiKeyConfig = Config.schema(
  Schema.Redacted(Schema.NonEmptyString),
  "BUNDJIL_EXECUTOR_API_KEY"
);

export const loadExecutorEndpoint = Effect.fn("ExecutorConfig.loadEndpoint")(
  function* () {
    return yield* endpointConfig;
  },
  (effect) =>
    effect.pipe(
      Effect.mapError(
        () =>
          new ExecutorConnectionConfigError({
            message: "ExecutorConnectionConfigError: loadEndpoint",
            operation: "loadEndpoint",
            reason: "Executor MCP endpoint configuration is invalid.",
          })
      )
    )
);

export const loadExecutorApiKey = Effect.fn("ExecutorConfig.loadApiKey")(
  function* () {
    return yield* apiKeyConfig;
  },
  (effect) =>
    effect.pipe(
      Effect.mapError(
        () =>
          new ExecutorConnectionConfigError({
            message: "ExecutorConnectionConfigError: loadApiKey",
            operation: "loadApiKey",
            reason: "Executor MCP credential configuration is invalid.",
          })
      )
    )
);

export const ExecutorConfigProviderLayer = ConfigProvider.layer(
  ConfigProvider.fromEnv()
);

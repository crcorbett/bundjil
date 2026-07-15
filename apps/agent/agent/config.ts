import type { LanguageModel } from "ai";
import {
  Config,
  ConfigProvider,
  Data,
  Effect,
  Match,
  Option,
  Redacted,
  Schema,
} from "effect";

import {
  AgentModelProviderConfig,
  AgentModelProviderMode,
  createAgentModel,
  defaultAgentModel,
} from "./model-provider.js";
import type { AgentModelProviderDeps } from "./model-provider.js";

export class AgentModelProviderConfigError extends Data.TaggedError(
  "AgentModelProviderConfigError"
)<{
  cause: unknown;
  message: string;
}> {}

const agentModelConfig = Config.schema(
  Schema.NonEmptyString,
  "BUNDJIL_AGENT_MODEL"
).pipe(Config.withDefault(defaultAgentModel));

const agentModelProviderModeConfig = Config.schema(
  AgentModelProviderMode,
  "BUNDJIL_AGENT_MODEL_PROVIDER"
).pipe(Config.withDefault("gateway"));

const codexProxyBaseUrlConfig = Config.url("BUNDJIL_CODEX_PROXY_BASE_URL");

const codexProxyInternalTokenConfig = Config.redacted(
  "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"
);

const codexProxyProtectionBypassConfig = Config.option(
  Config.redacted("BUNDJIL_CODEX_PROXY_VERCEL_BYPASS")
);

const codexProxyModelConfig = Config.option(
  Config.schema(Schema.NonEmptyString, "BUNDJIL_CODEX_PROXY_MODEL")
);

const codexProxyContextWindowTokensConfig = Config.schema(
  Schema.Int.check(Schema.isGreaterThan(0)),
  "BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS"
).pipe(Config.withDefault(200_000));

export const loadAgentModelProviderConfig = Effect.gen(
  function* loadAgentModelProviderConfigFromProvider() {
    const provider = yield* agentModelProviderModeConfig;
    const gatewayModel = yield* agentModelConfig;
    const providerConfigUnknown = yield* Match.value(provider).pipe(
      Match.when("gateway", () =>
        Effect.succeed({
          model: gatewayModel,
          provider,
        } as const)
      ),
      Match.when("codex-proxy", () =>
        Effect.all({
          baseURL: codexProxyBaseUrlConfig,
          internalToken: codexProxyInternalTokenConfig,
          modelContextWindowTokens: codexProxyContextWindowTokensConfig,
          protectionBypass: codexProxyProtectionBypassConfig,
          proxyModel: codexProxyModelConfig,
        }).pipe(
          Effect.map(
            ({
              baseURL,
              internalToken,
              modelContextWindowTokens,
              protectionBypass,
              proxyModel,
            }) =>
              ({
                baseURL,
                internalToken: Redacted.value(internalToken),
                model: Option.isNone(proxyModel)
                  ? gatewayModel
                  : proxyModel.value,
                modelContextWindowTokens,
                ...(Option.isNone(protectionBypass)
                  ? {}
                  : {
                      protectionBypass: Redacted.value(protectionBypass.value),
                    }),
                provider,
              }) as const
          )
        )
      ),
      Match.exhaustive
    );

    return yield* AgentModelProviderConfig.pipe(Schema.decodeUnknownEffect)(
      providerConfigUnknown
    );
  }
).pipe(
  Effect.mapError(
    (cause) =>
      new AgentModelProviderConfigError({
        cause,
        message: "Unable to load Bundjil agent model provider config.",
      })
  ),
  Effect.withSpan("AgentModelProviderConfig.load")
);

export type AgentConfig = Readonly<{
  model: LanguageModel;
  modelContextWindowTokens?: number;
  modelProvider: AgentModelProviderConfig;
}>;

export const loadAgentConfig: (
  deps?: AgentModelProviderDeps
) => Effect.Effect<AgentConfig, AgentModelProviderConfigError> = Effect.fn(
  "AgentConfig.load"
)(function* (deps: AgentModelProviderDeps = {}) {
  const modelProvider = yield* loadAgentModelProviderConfig;

  return {
    model: createAgentModel(modelProvider, deps),
    ...(modelProvider.provider === "codex-proxy"
      ? { modelContextWindowTokens: modelProvider.modelContextWindowTokens }
      : {}),
    modelProvider,
  };
});

export const loadAgentConfigFromEnv = loadAgentConfig().pipe(
  Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
);

export const agentConfig = Effect.runSync(loadAgentConfigFromEnv);

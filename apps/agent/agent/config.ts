import type { LanguageModel } from "ai";
import { Config, ConfigProvider, Effect, Match, Option, Schema } from "effect";

import {
  AgentCodexProxyModelProviderConfig,
  AgentModelProviderDiagnostic,
  AgentModelProviderMode,
  AgentModelId,
  AgentVercelProtectionBypass,
  createAgentModel,
  defaultAgentModel,
} from "./model-provider.js";
import type { AgentModelProviderConfig } from "./model-provider.js";

export class AgentModelProviderConfigError extends Schema.TaggedErrorClass<AgentModelProviderConfigError>()(
  "AgentModelProviderConfigError",
  { message: AgentModelProviderDiagnostic }
) {}

const agentModelConfig = Config.schema(
  AgentModelId,
  "BUNDJIL_AGENT_MODEL"
).pipe(Config.withDefault(defaultAgentModel));

const agentModelProviderModeConfig = Config.schema(
  AgentModelProviderMode,
  "BUNDJIL_AGENT_MODEL_PROVIDER"
).pipe(Config.withDefault("gateway"));

const codexProxyBaseUrlConfig = Config.schema(
  AgentCodexProxyModelProviderConfig.fields.baseURL,
  "BUNDJIL_CODEX_PROXY_BASE_URL"
);

const codexProxyInternalTokenConfig = Config.schema(
  AgentCodexProxyModelProviderConfig.fields.internalToken,
  "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"
);

const codexProxyProtectionBypassConfig = Config.option(
  Config.schema(
    AgentVercelProtectionBypass,
    "BUNDJIL_CODEX_PROXY_VERCEL_BYPASS"
  )
);

const codexProxyModelConfig = Config.option(
  Config.schema(AgentModelId, "BUNDJIL_CODEX_PROXY_MODEL")
);

const codexProxyContextWindowTokensConfig = Config.schema(
  AgentCodexProxyModelProviderConfig.fields.modelContextWindowTokens,
  "BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS"
).pipe(Config.withDefault(200_000));

export const loadAgentModelProviderConfig = Effect.gen(
  function* loadAgentModelProviderConfigFromProvider() {
    const provider = yield* agentModelProviderModeConfig;
    const gatewayModel = yield* agentModelConfig;
    const model = yield* Schema.decodeEffect(AgentModelId)(gatewayModel);
    const providerConfig = yield* Match.value(provider).pipe(
      Match.when("gateway", () =>
        Effect.succeed<AgentModelProviderConfig>({
          model,
          provider: "gateway",
        })
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
            }) => {
              const common = {
                baseURL,
                internalToken,
                model: Option.isNone(proxyModel) ? model : proxyModel.value,
                modelContextWindowTokens,
                provider: "codex-proxy",
              } satisfies AgentCodexProxyModelProviderConfig;
              return Option.isNone(protectionBypass)
                ? common
                : ({
                    ...common,
                    protectionBypass: protectionBypass.value,
                  } satisfies AgentCodexProxyModelProviderConfig);
            }
          )
        )
      ),
      Match.exhaustive
    );
    return providerConfig;
  }
).pipe(
  Effect.mapError(
    () =>
      new AgentModelProviderConfigError({
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

export const loadAgentConfig: () => Effect.Effect<
  AgentConfig,
  AgentModelProviderConfigError
> = Effect.fn("AgentConfig.load")(function* () {
  const modelProvider = yield* loadAgentModelProviderConfig;

  const model = createAgentModel(modelProvider);
  return modelProvider.provider === "codex-proxy"
    ? {
        model,
        modelContextWindowTokens: modelProvider.modelContextWindowTokens,
        modelProvider,
      }
    : { model, modelProvider };
});

export const loadAgentConfigFromEnv = loadAgentConfig().pipe(
  Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
);

export const agentConfig = Effect.runSync(loadAgentConfigFromEnv);

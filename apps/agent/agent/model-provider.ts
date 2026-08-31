import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { Match, Redacted, Schema } from "effect";

export const AgentModelId = Schema.NonEmptyString.pipe(
  Schema.brand("AgentModelId")
);
export type AgentModelId = typeof AgentModelId.Type;

export const AgentModelProviderDiagnostic = Schema.NonEmptyString;
export type AgentModelProviderDiagnostic =
  typeof AgentModelProviderDiagnostic.Type;

export const defaultAgentModel = "google/gemini-2.5-flash";

export const AgentVercelProtectionBypass = Schema.RedactedFromValue(
  Schema.NonEmptyString
);
export type AgentVercelProtectionBypass =
  typeof AgentVercelProtectionBypass.Type;

// Eve evaluates this configuration inside the agent bundle. Keeping the
// Redacted schema app-owned avoids crossing Effect registry instances during
// hosted builds.
export const AgentCodexProxyInternalToken = Schema.RedactedFromValue(
  Schema.NonEmptyString
);
export type AgentCodexProxyInternalToken =
  typeof AgentCodexProxyInternalToken.Type;

export const AgentModelProviderMode = Schema.Literals([
  "gateway",
  "codex-proxy",
]);

export type AgentModelProviderMode = typeof AgentModelProviderMode.Type;

export const AgentCodexProxyBaseUrl = Schema.URL;
export type AgentCodexProxyBaseUrl = typeof AgentCodexProxyBaseUrl.Type;

export const AgentModelContextWindowTokens = Schema.Int.check(
  Schema.isGreaterThan(0)
);
export type AgentModelContextWindowTokens =
  typeof AgentModelContextWindowTokens.Type;

export const AgentGatewayModelProviderConfig = Schema.Struct({
  model: AgentModelId,
  provider: Schema.Literal("gateway"),
});

export type AgentGatewayModelProviderConfig =
  typeof AgentGatewayModelProviderConfig.Type;

export const AgentCodexProxyModelProviderConfig = Schema.Struct({
  baseURL: AgentCodexProxyBaseUrl,
  internalToken: AgentCodexProxyInternalToken,
  model: AgentModelId,
  modelContextWindowTokens: AgentModelContextWindowTokens,
  protectionBypass: Schema.optional(AgentVercelProtectionBypass),
  provider: Schema.Literal("codex-proxy"),
});

export type AgentCodexProxyModelProviderConfig =
  typeof AgentCodexProxyModelProviderConfig.Type;

export const AgentModelProviderConfig = Schema.Union([
  AgentGatewayModelProviderConfig,
  AgentCodexProxyModelProviderConfig,
]);

export type AgentModelProviderConfig = typeof AgentModelProviderConfig.Type;

export const createAgentModel = (
  config: AgentModelProviderConfig
): LanguageModel =>
  Match.value(config).pipe(
    Match.when({ provider: "gateway" }, ({ model }) => model),
    Match.when(
      { provider: "codex-proxy" },
      ({ baseURL, internalToken, model, protectionBypass }) => {
        const providerConfig = {
          apiKey: Redacted.value(internalToken),
          baseURL: new URL("/v1", baseURL).toString(),
          name: "bundjil-codex-proxy",
        };
        const provider = createOpenAICompatible(
          protectionBypass === undefined
            ? providerConfig
            : {
                ...providerConfig,
                headers: {
                  "x-vercel-protection-bypass":
                    Redacted.value(protectionBypass),
                },
              }
        );

        return provider(model);
      }
    ),
    Match.exhaustive
  );

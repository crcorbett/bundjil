import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { OpenAICompatibleProviderSettings } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { Match, Redacted, Schema } from "effect";

export const AgentModelId = Schema.NonEmptyString.pipe(
  Schema.brand("AgentModelId")
);
export type AgentModelId = typeof AgentModelId.Type;

export const defaultAgentModel = "google/gemini-2.5-flash";

export const AgentVercelProtectionBypass = Schema.RedactedFromValue(
  Schema.NonEmptyString
);
export type AgentVercelProtectionBypass =
  typeof AgentVercelProtectionBypass.Type;

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

export const AgentGatewayModelProviderConfig = Schema.Struct({
  model: AgentModelId,
  provider: Schema.Literal("gateway"),
});

export type AgentGatewayModelProviderConfig =
  typeof AgentGatewayModelProviderConfig.Type;

export const AgentCodexProxyModelProviderConfig = Schema.Struct({
  baseURL: Schema.URL,
  internalToken: AgentCodexProxyInternalToken,
  model: AgentModelId,
  modelContextWindowTokens: Schema.Int.check(Schema.isGreaterThan(0)),
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

export type AgentModelProviderDeps = Readonly<
  Pick<OpenAICompatibleProviderSettings, "fetch">
>;

export const createAgentModel = (
  config: AgentModelProviderConfig,
  deps: AgentModelProviderDeps = {}
): LanguageModel =>
  Match.value(config).pipe(
    Match.when({ provider: "gateway" }, ({ model }) => model),
    Match.when(
      { provider: "codex-proxy" },
      ({ baseURL, internalToken, model, protectionBypass }) => {
        const provider = createOpenAICompatible({
          apiKey: Redacted.value(internalToken),
          baseURL: baseURL.toString(),
          ...(protectionBypass === undefined
            ? {}
            : {
                headers: {
                  "x-vercel-protection-bypass":
                    Redacted.value(protectionBypass),
                },
              }),
          ...(deps.fetch === undefined ? {} : { fetch: deps.fetch }),
          name: "bundjil-codex-proxy",
        });

        return provider(model);
      }
    ),
    Match.exhaustive
  );

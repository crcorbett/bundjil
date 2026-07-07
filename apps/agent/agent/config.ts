import { Config, ConfigProvider, Effect, Schema } from "effect";

const defaultAgentModel = "google/gemini-2.5-flash";

const agentModelConfig = Config.schema(
  Schema.NonEmptyString,
  "BUNDJIL_AGENT_MODEL"
).pipe(Config.withDefault(defaultAgentModel));

export const agentConfig = {
  model: Effect.runSync(agentModelConfig.parse(ConfigProvider.fromEnv())),
} as const;

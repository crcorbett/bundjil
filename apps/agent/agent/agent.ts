import { Config, ConfigProvider, Effect, Schema } from "effect";
import { defineAgent } from "eve";

const defaultAgentModel = "google/gemini-2.5-flash";

const agentModelConfig = Config.schema(
  Schema.NonEmptyString,
  "BUNDJIL_AGENT_MODEL"
).pipe(Config.withDefault(defaultAgentModel));

const agentModel = Effect.runSync(
  agentModelConfig.parse(ConfigProvider.fromEnv())
);

export default defineAgent({
  model: agentModel,
});

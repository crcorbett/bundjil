import { Config, ConfigProvider, Effect, Option } from "effect";

import {
  CodexResponsesEndpoint,
  CodexResponsesModelId,
  CodexResponsesNonEmptyContent,
  CodexResponsesProofInput,
  CodexOAuthAccessToken,
  CodexOAuthAccountId,
} from "./schemas.js";

export const defaultCodexResponsesEndpoint = CodexResponsesEndpoint.make(
  "https://chatgpt.com/backend-api/codex/responses"
);

export const defaultCodexResponsesModel = CodexResponsesModelId.make("gpt-5.5");

const proofAccessTokenConfig = Config.schema(
  CodexOAuthAccessToken,
  "CODEX_ACCESS_TOKEN"
);

const proofAccountIdConfig = Config.option(
  Config.schema(CodexOAuthAccountId, "BUNDJIL_CODEX_ACCOUNT_ID")
);

const proofModelConfig = Config.schema(
  CodexResponsesModelId,
  "BUNDJIL_CODEX_MODEL"
).pipe(Config.withDefault(defaultCodexResponsesModel));

const proofPromptConfig = Config.schema(
  CodexResponsesNonEmptyContent,
  "BUNDJIL_CODEX_PROOF_PROMPT"
).pipe(Config.withDefault("Reply with OK."));

export const codexResponsesEndpointConfig = Config.schema(
  CodexResponsesEndpoint,
  "BUNDJIL_CODEX_RESPONSES_ENDPOINT"
).pipe(Config.withDefault(defaultCodexResponsesEndpoint));

export const loadCodexResponsesProofInput = Effect.gen(
  function* loadCodexResponsesProofInputFromConfig() {
    const accessToken = yield* proofAccessTokenConfig;
    const accountId = yield* proofAccountIdConfig;
    const model = yield* proofModelConfig;
    const prompt = yield* proofPromptConfig;

    return CodexResponsesProofInput.make({
      accessToken,
      ...(Option.isNone(accountId) ? {} : { accountId: accountId.value }),
      model,
      prompt,
    });
  }
);

export const loadCodexResponsesProofInputFromEnv =
  loadCodexResponsesProofInput.pipe(
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
  );

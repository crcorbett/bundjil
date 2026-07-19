import {
  Config,
  ConfigProvider,
  Effect,
  Option,
  Redacted,
  Schema,
} from "effect";

import {
  CodexOAuthAccessToken,
  CodexOAuthAccountId,
} from "../auth/credentials.js";
import {
  CodexResponsesEndpoint,
  CodexResponsesModelId,
  CodexResponsesNonEmptyContent,
  CodexResponsesProofInput,
} from "./contracts.js";
import { CodexResponsesRequestError } from "./errors.js";

export const defaultCodexResponsesEndpoint =
  "https://chatgpt.com/backend-api/codex/responses";

export const defaultCodexResponsesModel = "gpt-5.5";

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
    const rawAccessToken = yield* proofAccessTokenConfig;
    const accountId = yield* proofAccountIdConfig;
    const model = yield* proofModelConfig;
    const prompt = yield* proofPromptConfig;

    return yield* Schema.decodeUnknownEffect(CodexResponsesProofInput)({
      accessToken: Redacted.value(rawAccessToken),
      ...(Option.isNone(accountId) ? {} : { accountId: accountId.value }),
      model,
      prompt,
    }).pipe(
      Effect.mapError(
        (cause) =>
          new CodexResponsesRequestError({
            boundary: "CodexResponsesProofInput",
            message: "Unable to decode Codex Responses proof config.",
            cause,
          })
      )
    );
  }
);

export const loadCodexResponsesProofInputFromEnv =
  loadCodexResponsesProofInput.pipe(
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
  );

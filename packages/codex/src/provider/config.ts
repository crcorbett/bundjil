import { Config, ConfigProvider, Effect, Option, Schema } from "effect";

import {
  CodexOAuthAccessToken,
  CodexOAuthAccountId,
} from "../auth/credentials.js";
import {
  CodexResponsesEndpoint,
  CodexResponsesModelId,
  CodexResponsesNonEmptyContent,
  CodexResponsesProofInput,
  CodexResponsesTransportPolicy,
} from "./contracts.js";
import { CodexResponsesRequestError } from "./errors.js";

export const defaultCodexResponsesEndpoint =
  "https://chatgpt.com/backend-api/codex/responses";

export const defaultCodexResponsesModel = CodexResponsesModelId.make("gpt-5.5");

const defaultCodexResponsesHeaderTimeoutMillis = 30_000;
const defaultCodexResponsesStreamIdleTimeoutMillis = 30_000;
const defaultCodexResponsesMaximumBodyBytes = 32 * 1024 * 1024;
const defaultCodexResponsesMaximumEvents = 100_000;

const CodexResponsesTransportLimitFromString = Schema.NumberFromString.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(1)
);

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

const codexResponsesHeaderTimeoutMillisConfig = Config.schema(
  CodexResponsesTransportLimitFromString,
  "BUNDJIL_CODEX_RESPONSES_HEADER_TIMEOUT_MILLIS"
).pipe(Config.withDefault(defaultCodexResponsesHeaderTimeoutMillis));

const codexResponsesStreamIdleTimeoutMillisConfig = Config.schema(
  CodexResponsesTransportLimitFromString,
  "BUNDJIL_CODEX_RESPONSES_STREAM_IDLE_TIMEOUT_MILLIS"
).pipe(Config.withDefault(defaultCodexResponsesStreamIdleTimeoutMillis));

const codexResponsesMaximumBodyBytesConfig = Config.schema(
  CodexResponsesTransportLimitFromString,
  "BUNDJIL_CODEX_RESPONSES_MAXIMUM_BODY_BYTES"
).pipe(Config.withDefault(defaultCodexResponsesMaximumBodyBytes));

const codexResponsesMaximumEventsConfig = Config.schema(
  CodexResponsesTransportLimitFromString,
  "BUNDJIL_CODEX_RESPONSES_MAXIMUM_EVENTS"
).pipe(Config.withDefault(defaultCodexResponsesMaximumEvents));

export const loadCodexResponsesTransportPolicy = Effect.gen(
  function* loadCodexResponsesTransportPolicyFromConfig() {
    const headerTimeoutMillis = yield* codexResponsesHeaderTimeoutMillisConfig;
    const streamIdleTimeoutMillis =
      yield* codexResponsesStreamIdleTimeoutMillisConfig;
    const maximumBodyBytes = yield* codexResponsesMaximumBodyBytesConfig;
    const maximumEvents = yield* codexResponsesMaximumEventsConfig;

    return yield* CodexResponsesTransportPolicy.makeEffect({
      headerTimeoutMillis,
      streamIdleTimeoutMillis,
      maximumBodyBytes,
      maximumEvents,
    }).pipe(
      Effect.mapError(
        () =>
          new CodexResponsesRequestError({
            boundary: "CodexResponsesRequest",
            message: "Unable to decode Codex Responses transport policy.",
          })
      )
    );
  }
);

export const loadCodexResponsesProofInput = Effect.gen(
  function* loadCodexResponsesProofInputFromConfig() {
    const rawAccessToken = yield* proofAccessTokenConfig;
    const accountId = yield* proofAccountIdConfig;
    const model = yield* proofModelConfig;
    const prompt = yield* proofPromptConfig;

    return yield* CodexResponsesProofInput.makeEffect({
      accessToken: rawAccessToken,
      ...(Option.isNone(accountId) ? {} : { accountId: accountId.value }),
      model,
      prompt,
    }).pipe(
      Effect.mapError(
        () =>
          new CodexResponsesRequestError({
            boundary: "CodexResponsesProofInput",
            message: "Unable to decode Codex Responses proof config.",
          })
      )
    );
  }
);

export const loadCodexResponsesProofInputFromEnv =
  loadCodexResponsesProofInput.pipe(
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
  );

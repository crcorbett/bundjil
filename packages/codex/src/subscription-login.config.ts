import { Config, Context, Duration, Effect, Layer, Schema } from "effect";

import { CodexSubscriptionAuthError } from "./errors.js";
import { CodexSubscriptionLoginInput } from "./schemas.js";
import type { CodexSubscriptionLoginInput as CodexSubscriptionLoginInputType } from "./schemas.js";

const principalIdConfig = Config.schema(
  Schema.NonEmptyString,
  "BUNDJIL_CODEX_PROFILE_PRINCIPAL_ID"
);

const connectorIdConfig = Config.schema(
  Schema.NonEmptyString.pipe(Schema.brand("CodexOAuthConnectorId")),
  "BUNDJIL_CODEX_PROFILE_CONNECTOR_ID"
).pipe(Config.withDefault("bundjil-local"));

const installationIdConfig = Config.schema(
  Schema.NonEmptyString.pipe(Schema.brand("CodexOAuthInstallationId")),
  "BUNDJIL_CODEX_PROFILE_INSTALLATION_ID"
).pipe(Config.withDefault("agent-dev"));

const profileIdConfig = Config.schema(
  Schema.NonEmptyString.pipe(Schema.brand("CodexOAuthProfileId")),
  "BUNDJIL_CODEX_PROFILE_ID"
).pipe(Config.withDefault("default"));

const callbackTimeoutConfig = Config.duration(
  "BUNDJIL_CODEX_LOGIN_CALLBACK_TIMEOUT"
).pipe(Config.withDefault(Duration.minutes(5)));

export class CodexSubscriptionLoginConfigService extends Context.Service<
  CodexSubscriptionLoginConfigService,
  CodexSubscriptionLoginInputType
>()("@bundjil/codex/CodexSubscriptionLoginConfig") {}

export const loadCodexSubscriptionLoginConfig = Effect.gen(
  function* loadCodexSubscriptionLoginConfigOperation() {
    const principalId = yield* principalIdConfig;
    const connectorId = yield* connectorIdConfig;
    const installationId = yield* installationIdConfig;
    const profileId = yield* profileIdConfig;
    const callbackTimeout = yield* callbackTimeoutConfig;

    return yield* Schema.decodeUnknownEffect(CodexSubscriptionLoginInput)({
      subject: {
        provider: "codex",
        principal: {
          type: "chatgpt-user",
          id: principalId,
          issuer: "https://auth.openai.com",
        },
        connectorId,
        installationId,
        profileId,
      },
      callbackTimeoutMillis: Duration.toMillis(callbackTimeout),
    }).pipe(
      Effect.mapError(
        () =>
          new CodexSubscriptionAuthError({
            operation: "completeLogin",
            reason: "tokenMetadataInvalid",
            message: "Unable to load the trusted-local login configuration.",
          })
      )
    );
  }
);

export const CodexSubscriptionLoginConfigLive = Layer.effect(
  CodexSubscriptionLoginConfigService,
  loadCodexSubscriptionLoginConfig
);

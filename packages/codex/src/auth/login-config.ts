import { Config, Context, Duration, Effect, Layer, Schema } from "effect";

import { CodexSubscriptionLoginInput } from "./contracts.js";
import type { CodexSubscriptionLoginInput as CodexSubscriptionLoginInputType } from "./contracts.js";
import {
  CodexOAuthConnectorId,
  CodexOAuthInstallationId,
  CodexOAuthPrincipalId,
  CodexOAuthProfileId,
} from "./credentials.js";
import { CodexSubscriptionAuthError } from "./errors.js";

const principalIdConfig = Config.schema(
  CodexOAuthPrincipalId,
  "BUNDJIL_CODEX_PROFILE_PRINCIPAL_ID"
);

const connectorIdConfig = Config.schema(
  CodexOAuthConnectorId,
  "BUNDJIL_CODEX_PROFILE_CONNECTOR_ID"
).pipe(Config.withDefault("bundjil-local"));

const installationIdConfig = Config.schema(
  CodexOAuthInstallationId,
  "BUNDJIL_CODEX_PROFILE_INSTALLATION_ID"
).pipe(Config.withDefault("agent-dev"));

const profileIdConfig = Config.schema(
  CodexOAuthProfileId,
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

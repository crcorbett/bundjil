import {
  Config,
  Context,
  Duration,
  Effect,
  Layer,
  Option,
  Schema,
} from "effect";

import { CodexLocalProfileImportConfig } from "./contracts.js";
import type { CodexLocalProfileImportConfig as CodexLocalProfileImportConfigType } from "./contracts.js";
import {
  CodexLocalAuthFile,
  CodexOAuthConnectorId,
  CodexOAuthInstallationId,
  CodexOAuthPrincipalId,
  CodexOAuthProfileId,
} from "./credentials.js";
import { CodexLocalProfileImportError } from "./errors.js";

const localAuthFileConfig = Config.option(
  Config.schema(CodexLocalAuthFile, "BUNDJIL_CODEX_LOCAL_AUTH_FILE")
);

const homeDirectoryConfig = Config.option(Config.nonEmptyString("HOME"));

const principalIdConfig = Config.schema(
  CodexOAuthPrincipalId,
  "BUNDJIL_CODEX_PROFILE_PRINCIPAL_ID"
);

const connectorIdConfig = Config.schema(
  CodexOAuthConnectorId,
  "BUNDJIL_CODEX_PROFILE_CONNECTOR_ID"
);

const installationIdConfig = Config.schema(
  CodexOAuthInstallationId,
  "BUNDJIL_CODEX_PROFILE_INSTALLATION_ID"
);

const profileIdConfig = Config.schema(
  CodexOAuthProfileId,
  "BUNDJIL_CODEX_PROFILE_ID"
);

const accessTokenTtlConfig = Config.duration(
  "BUNDJIL_CODEX_LOCAL_ACCESS_TOKEN_TTL"
).pipe(Config.withDefault(Duration.hours(1)));

export class CodexLocalProfileImportConfigService extends Context.Service<
  CodexLocalProfileImportConfigService,
  CodexLocalProfileImportConfigType
>()("@bundjil/codex/CodexLocalProfileImportConfig") {}

export const loadCodexLocalProfileImportConfig = Effect.gen(
  function* loadCodexLocalProfileImportConfigFromProvider() {
    const configuredLocalAuthFile = yield* localAuthFileConfig;
    const homeDirectory = yield* homeDirectoryConfig;
    const principalId = yield* principalIdConfig;
    const connectorId = yield* connectorIdConfig;
    const installationId = yield* installationIdConfig;
    const profileId = yield* profileIdConfig;
    const accessTokenTtl = yield* accessTokenTtlConfig;

    const localAuthFile = Option.match(configuredLocalAuthFile, {
      onNone: () =>
        Option.match(homeDirectory, {
          onNone: () => null,
          onSome: (home) => `${home}/.codex/auth.json`,
        }),
      onSome: (path) => path,
    });

    return yield* Schema.decodeUnknownEffect(CodexLocalProfileImportConfig)({
      localAuthFile,
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
      accessTokenTtlMillis: Duration.toMillis(accessTokenTtl),
    }).pipe(
      Effect.mapError(
        () =>
          new CodexLocalProfileImportError({
            operation: "loadConfig",
            message: "Unable to load local Codex profile import config.",
          })
      )
    );
  }
).pipe(Effect.withSpan("CodexLocalProfileImportConfig.load"));

export const CodexLocalProfileImportConfigLive = Layer.effect(
  CodexLocalProfileImportConfigService,
  loadCodexLocalProfileImportConfig
);

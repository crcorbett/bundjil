import {
  CodexOAuthConnectorId,
  CodexOAuthInstallationId,
  CodexOAuthProfileId,
  CodexOAuthSubject,
} from "@bundjil/codex-oauth";
import {
  Config,
  ConfigProvider,
  Context,
  Effect,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";

import { CodexProxyRouteError } from "./errors.js";
import {
  CodexProxyDevServerConfig,
  CodexProxyMode,
  CodexProxyRuntimeConfig,
} from "./schemas.js";
import type {
  CodexProxyDevServerConfig as CodexProxyDevServerConfigType,
  CodexProxyRuntimeConfig as CodexProxyRuntimeConfigType,
} from "./schemas.js";

const proxyModeConfig = Config.schema(
  CodexProxyMode,
  "BUNDJIL_CODEX_PROXY_MODE"
).pipe(Config.withDefault("mock"));

const internalTokenConfig = Config.redacted(
  "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"
);

const profileIdConfig = Config.schema(
  CodexOAuthProfileId,
  "BUNDJIL_CODEX_PROFILE_ID"
).pipe(Config.withDefault("default"));

const connectorIdConfig = Config.schema(
  CodexOAuthConnectorId,
  "BUNDJIL_CODEX_CONNECTOR_ID"
).pipe(Config.withDefault("bundjil-codex-proxy"));

const installationIdConfig = Config.schema(
  CodexOAuthInstallationId,
  "BUNDJIL_CODEX_INSTALLATION_ID"
).pipe(Config.withDefault("local"));

const subjectPrincipalIdConfig = Config.schema(
  Schema.NonEmptyString,
  "BUNDJIL_CODEX_SUBJECT_ID"
).pipe(Config.withDefault("default"));

const accountIdConfig = Config.option(
  Config.schema(Schema.NonEmptyString, "BUNDJIL_CODEX_ACCOUNT_ID")
);

const portConfig = Config.port("PORT").pipe(Config.withDefault(8787));

const SchemaDecode = {
  codexOAuthSubject: (input: unknown) =>
    CodexOAuthSubject.pipe(Schema.decodeUnknownEffect)(input).pipe(
      Effect.mapError(
        (cause) =>
          new CodexProxyRouteError({
            boundary: "CodexProxyRuntimeConfig",
            cause,
            code: "bad_request",
            message: "Unable to decode Codex proxy OAuth subject config.",
            responseMessage: "The Codex proxy config is invalid.",
            status: 400,
          })
      )
    ),
  codexProxyDevServerConfig: (input: unknown) =>
    CodexProxyDevServerConfig.pipe(Schema.decodeUnknownEffect)(input).pipe(
      Effect.mapError(
        (cause) =>
          new CodexProxyRouteError({
            boundary: "CodexProxyRuntimeConfig",
            cause,
            code: "bad_request",
            message: "Unable to decode Codex proxy dev server config.",
            responseMessage: "The Codex proxy config is invalid.",
            status: 400,
          })
      )
    ),
  codexProxyRuntimeConfig: (input: unknown) =>
    CodexProxyRuntimeConfig.pipe(Schema.decodeUnknownEffect)(input).pipe(
      Effect.mapError(
        (cause) =>
          new CodexProxyRouteError({
            boundary: "CodexProxyRuntimeConfig",
            cause,
            code: "bad_request",
            message: "Unable to decode Codex proxy runtime config.",
            responseMessage: "The Codex proxy config is invalid.",
            status: 400,
          })
      )
    ),
} as const;

export class CodexProxyConfig extends Context.Service<
  CodexProxyConfig,
  CodexProxyRuntimeConfigType
>()("@bundjil/codex-proxy/CodexProxyConfig") {}

export const loadCodexProxyConfig = Effect.gen(
  function* loadCodexProxyConfigFromProvider() {
    const mode = yield* proxyModeConfig;
    const internalToken = yield* internalTokenConfig;
    const profileId = yield* profileIdConfig;
    const connectorId = yield* connectorIdConfig;
    const installationId = yield* installationIdConfig;
    const subjectPrincipalId = yield* subjectPrincipalIdConfig;
    const accountId = yield* accountIdConfig;
    const subject = yield* SchemaDecode.codexOAuthSubject({
      connectorId,
      installationId,
      principal: {
        id: subjectPrincipalId,
        issuer: "https://auth.openai.com",
        type: "chatgpt-user",
      },
      profileId,
      provider: "codex",
    });

    return yield* SchemaDecode.codexProxyRuntimeConfig({
      mode,
      internalToken: Redacted.value(internalToken),
      subject,
      ...(Option.isNone(accountId) ? {} : { accountId: accountId.value }),
    });
  }
).pipe(Effect.withSpan("CodexProxyConfig.load"));

export const loadCodexProxyConfigFromEnv = loadCodexProxyConfig.pipe(
  Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
);

export const loadCodexProxyDevServerConfig = Effect.gen(
  function* loadCodexProxyDevServerConfigFromProvider() {
    const port = yield* portConfig;

    return yield* SchemaDecode.codexProxyDevServerConfig({ port });
  }
).pipe(Effect.withSpan("CodexProxyDevServerConfig.load"));

export const loadCodexProxyDevServerConfigFromEnv =
  loadCodexProxyDevServerConfig.pipe(
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
  );

export const CodexProxyConfigLive = Layer.effect(
  CodexProxyConfig,
  loadCodexProxyConfig
).pipe(Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv())));

export const CodexProxyConfigLayer = (config: CodexProxyRuntimeConfigType) =>
  Layer.succeed(CodexProxyConfig, config);

export const makeCodexProxyConfig = (input: unknown) =>
  SchemaDecode.codexProxyRuntimeConfig(input);

export type { CodexProxyDevServerConfigType, CodexProxyRuntimeConfigType };

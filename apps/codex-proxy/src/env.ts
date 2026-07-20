import {
  CodexOAuthPrincipalId,
  CodexOAuthConnectorId,
  CodexOAuthInstallationId,
  CodexOAuthAccountId,
  CodexOAuthProfileId,
  CodexOAuthSubject,
  CodexResponsesReasoningEffort,
  OpenAICompatibleProxyInternalToken,
} from "@bundjil/codex";
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
  CodexProxyLocalProfileStoreDirectory,
  CodexProxyMode,
  CodexProxyRuntimeConfig,
  CodexProxyVercelRuntimeMarker,
} from "./schemas.js";
import type {
  CodexProxyDevServerConfig as CodexProxyDevServerConfigType,
  CodexProxyRuntimeConfig as CodexProxyRuntimeConfigType,
} from "./schemas.js";

const proxyModeConfig = Config.schema(
  CodexProxyMode,
  "BUNDJIL_CODEX_PROXY_MODE"
).pipe(Config.withDefault("mock"));

const reasoningEffortConfig = Config.schema(
  CodexResponsesReasoningEffort,
  "BUNDJIL_CODEX_PROXY_REASONING_EFFORT"
);

const codexProxyConfigDefaults = ConfigProvider.fromEnv({
  env: {
    BUNDJIL_CODEX_PROXY_REASONING_EFFORT: "low",
  },
});

const internalTokenConfig = Config.schema(
  OpenAICompatibleProxyInternalToken,
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
  CodexOAuthPrincipalId,
  "BUNDJIL_CODEX_SUBJECT_ID"
).pipe(Config.withDefault("default"));

const accountIdConfig = Config.option(
  Config.schema(CodexOAuthAccountId, "BUNDJIL_CODEX_ACCOUNT_ID")
);

const localProfileStoreDirectoryConfig = Config.option(
  Config.schema(
    CodexProxyLocalProfileStoreDirectory,
    "BUNDJIL_CODEX_LOCAL_PROFILE_STORE_DIR"
  )
);

const vercelRuntimeMarkerConfig = Config.option(
  Config.schema(CodexProxyVercelRuntimeMarker, "VERCEL")
);

const portConfig = Config.port("PORT").pipe(Config.withDefault(8787));

const decodeCodexOAuthSubject = (input: unknown) =>
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
  );

const decodeCodexProxyDevServerConfig = (input: unknown) =>
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
  );

const decodeCodexProxyRuntimeConfig = (input: unknown) =>
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
  );

export class CodexProxyConfig extends Context.Service<
  CodexProxyConfig,
  CodexProxyRuntimeConfigType
>()("@bundjil/codex-proxy/CodexProxyConfig") {}

export const loadCodexProxyConfig = Effect.gen(
  function* loadCodexProxyConfigFromProvider() {
    const mode = yield* proxyModeConfig;
    const reasoningEffort = yield* reasoningEffortConfig;
    const internalToken = yield* internalTokenConfig;
    const profileId = yield* profileIdConfig;
    const connectorId = yield* connectorIdConfig;
    const installationId = yield* installationIdConfig;
    const subjectPrincipalId = yield* subjectPrincipalIdConfig;
    const accountId = yield* accountIdConfig;
    const localProfileStoreDirectory = yield* localProfileStoreDirectoryConfig;
    const vercelRuntimeMarker = yield* vercelRuntimeMarkerConfig;
    const subject = yield* decodeCodexOAuthSubject({
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

    const config = yield* decodeCodexProxyRuntimeConfig({
      mode,
      reasoningEffort,
      internalToken: Redacted.value(internalToken),
      subject,
      ...(Option.isNone(accountId)
        ? {}
        : { accountId: Redacted.value(accountId.value) }),
      ...(Option.isNone(localProfileStoreDirectory)
        ? {}
        : { localProfileStoreDirectory: localProfileStoreDirectory.value }),
    });

    if (
      config.mode === "local" &&
      config.localProfileStoreDirectory === undefined
    ) {
      return yield* new CodexProxyRouteError({
        boundary: "CodexProxyRuntimeConfig",
        code: "bad_request",
        message:
          "Local Codex proxy mode requires a local profile store directory.",
        responseMessage: "The Codex proxy config is invalid.",
        status: 400,
      });
    }

    if (config.mode === "local" && Option.isSome(vercelRuntimeMarker)) {
      return yield* new CodexProxyRouteError({
        boundary: "CodexProxyRuntimeConfig",
        code: "bad_request",
        message: "Local Codex proxy mode is unavailable in Vercel.",
        responseMessage: "The Codex proxy config is invalid.",
        status: 400,
      });
    }

    return config;
  }
).pipe(
  Effect.withSpan("CodexProxyConfig.load"),
  Effect.provide(ConfigProvider.layerAdd(codexProxyConfigDefaults))
);

export const loadCodexProxyConfigFromEnv = loadCodexProxyConfig.pipe(
  Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
);

export const loadCodexProxyDevServerConfig = Effect.gen(
  function* loadCodexProxyDevServerConfigFromProvider() {
    const port = yield* portConfig;

    return yield* decodeCodexProxyDevServerConfig({ port });
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

export const makeCodexProxyConfig = (
  input: typeof CodexProxyRuntimeConfig.Encoded
) => decodeCodexProxyRuntimeConfig(input);

export type { CodexProxyDevServerConfigType, CodexProxyRuntimeConfigType };

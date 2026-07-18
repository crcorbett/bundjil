import { Context, Effect, Layer, Redacted, Schema } from "effect";

import { CodexSubscriptionAuthError } from "./errors.js";
import {
  CodexOAuthAuthorizationMaterial,
  CodexOAuthAuthorizationSession,
  CodexSubscriptionAuthProtocolConfig,
} from "./schemas.js";
import type {
  CodexOAuthAuthorizationMaterial as CodexOAuthAuthorizationMaterialType,
  CodexSubscriptionAuthProtocolConfig as CodexSubscriptionAuthProtocolConfigType,
} from "./schemas.js";

export interface CodexSubscriptionAuthProtocolConfigShape {
  readonly config: CodexSubscriptionAuthProtocolConfigType;
}

export class CodexSubscriptionAuthProtocolConfigService extends Context.Service<
  CodexSubscriptionAuthProtocolConfigService,
  CodexSubscriptionAuthProtocolConfigShape
>()("@bundjil/codex/CodexSubscriptionAuthProtocolConfigService") {}

const officialProtocolConfig = Schema.decodeUnknownEffect(
  CodexSubscriptionAuthProtocolConfig
)({
  issuer: "https://auth.openai.com",
  authorizationEndpoint: "https://auth.openai.com/oauth/authorize",
  tokenEndpoint: "https://auth.openai.com/oauth/token",
  clientId: "app_EMoamEEZ73f0CkXaXp7hrann",
  callbackHost: "127.0.0.1",
  callbackPath: "/auth/callback",
  callbackPorts: [1455, 1457],
  scopes: [
    "openid",
    "profile",
    "email",
    "offline_access",
    "api.connectors.read",
    "api.connectors.invoke",
  ],
  originator: "codex_cli_rs",
  protocolScopeVersion: "codex-cli-rs-v1",
});

export const CodexSubscriptionAuthProtocolConfigLive = Layer.effect(
  CodexSubscriptionAuthProtocolConfigService,
  officialProtocolConfig.pipe(
    Effect.map((config) =>
      CodexSubscriptionAuthProtocolConfigService.of({ config })
    )
  )
);

export const CodexSubscriptionAuthProtocolConfigTest = (
  config: CodexSubscriptionAuthProtocolConfigType
) =>
  Layer.succeed(
    CodexSubscriptionAuthProtocolConfigService,
    CodexSubscriptionAuthProtocolConfigService.of({ config })
  );

const encodeBase64Url = Schema.encodeEffect(Schema.Uint8ArrayFromBase64Url);

const randomBase64Url = Effect.fn("CodexSubscriptionAuth.randomBase64Url")(
  function* () {
    const bytes = yield* Effect.try({
      try: () => globalThis.crypto.getRandomValues(new Uint8Array(32)),
      catch: () =>
        new CodexSubscriptionAuthError({
          operation: "createAuthorizationSession",
          reason: "cryptoFailure",
          message: "Unable to generate secure OAuth authorization material.",
        }),
    });

    return yield* encodeBase64Url(bytes).pipe(
      Effect.mapError(
        () =>
          new CodexSubscriptionAuthError({
            operation: "createAuthorizationSession",
            reason: "cryptoFailure",
            message: "Unable to encode secure OAuth authorization material.",
          })
      )
    );
  }
);

export const createCodexOAuthAuthorizationMaterial = Effect.fn(
  "CodexSubscriptionAuth.createAuthorizationMaterial"
)(function* () {
  const state = yield* randomBase64Url();
  const codeVerifier = yield* randomBase64Url();
  const verifierDigest = yield* Effect.tryPromise({
    try: () =>
      globalThis.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(codeVerifier)
      ),
    catch: () =>
      new CodexSubscriptionAuthError({
        operation: "createAuthorizationSession",
        reason: "cryptoFailure",
        message: "Unable to derive the OAuth PKCE challenge.",
      }),
  });
  const codeChallenge = yield* encodeBase64Url(
    new Uint8Array(verifierDigest)
  ).pipe(
    Effect.mapError(
      () =>
        new CodexSubscriptionAuthError({
          operation: "createAuthorizationSession",
          reason: "cryptoFailure",
          message: "Unable to encode the OAuth PKCE challenge.",
        })
    )
  );

  return yield* Schema.decodeUnknownEffect(CodexOAuthAuthorizationMaterial)({
    state,
    codeVerifier,
    codeChallenge,
  }).pipe(
    Effect.mapError(
      () =>
        new CodexSubscriptionAuthError({
          operation: "createAuthorizationSession",
          reason: "cryptoFailure",
          message: "Unable to construct the OAuth authorization material.",
        })
    )
  );
});

export const buildCodexOAuthAuthorizationSession = Effect.fn(
  "CodexSubscriptionAuth.buildAuthorizationSession"
)(function* (
  material: CodexOAuthAuthorizationMaterialType,
  redirectUri: string
) {
  const protocol = yield* CodexSubscriptionAuthProtocolConfigService;
  const authorizationUrl = new URL(protocol.config.authorizationEndpoint);

  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", protocol.config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("scope", protocol.config.scopes.join(" "));
  authorizationUrl.searchParams.set("code_challenge", material.codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("id_token_add_organizations", "true");
  authorizationUrl.searchParams.set("codex_cli_simplified_flow", "true");
  authorizationUrl.searchParams.set("state", Redacted.value(material.state));
  authorizationUrl.searchParams.set("originator", protocol.config.originator);

  return yield* Schema.decodeUnknownEffect(CodexOAuthAuthorizationSession)({
    state: Redacted.value(material.state),
    codeVerifier: Redacted.value(material.codeVerifier),
    codeChallenge: material.codeChallenge,
    authorizationUrl: authorizationUrl.toString(),
    redirectUri,
  }).pipe(
    Effect.mapError(
      () =>
        new CodexSubscriptionAuthError({
          operation: "createAuthorizationSession",
          reason: "cryptoFailure",
          message: "Unable to construct the OAuth authorization session.",
        })
    )
  );
});

export const createCodexOAuthAuthorizationSession = Effect.fn(
  "CodexSubscriptionAuth.createAuthorizationSession"
)(function* (redirectUri: string) {
  const material = yield* createCodexOAuthAuthorizationMaterial();

  return yield* buildCodexOAuthAuthorizationSession(material, redirectUri);
});

import { Schema } from "effect";

import {
  CodexOAuthAccessToken,
  CodexOAuthAccountId,
  CodexOAuthAuthorizationCode,
  CodexOAuthAuthorizationUrl,
  CodexOAuthCodeVerifier,
  CodexOAuthIdToken,
  CodexOAuthProfileId,
  CodexOAuthProtocolScopeVersion,
  CodexOAuthRefreshToken,
  CodexOAuthState,
  CodexOAuthSubject,
} from "./credentials.js";

export const CodexCliAuthMode = Schema.Literal("chatgpt");

export type CodexCliAuthMode = typeof CodexCliAuthMode.Type;

export const CodexCliAuthCache = Schema.Struct({
  auth_mode: CodexCliAuthMode,
  last_refresh: Schema.DateFromString,
  tokens: Schema.Struct({
    access_token: CodexOAuthAccessToken,
  }),
});

export type CodexCliAuthCache = typeof CodexCliAuthCache.Type;

export const CodexLocalProfileImportConfig = Schema.Struct({
  localAuthFile: Schema.NonEmptyString,
  subject: CodexOAuthSubject,
  accessTokenTtlMillis: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
});

export type CodexLocalProfileImportConfig =
  typeof CodexLocalProfileImportConfig.Type;

export const CodexLocalProfileImportExpiryStatus = Schema.Literal("valid");

export type CodexLocalProfileImportExpiryStatus =
  typeof CodexLocalProfileImportExpiryStatus.Type;

export const CodexLocalProfileImportResult = Schema.Struct({
  profileId: CodexOAuthProfileId,
  mode: CodexCliAuthMode,
  requiresReauthentication: Schema.Literal(true),
  expiryStatus: CodexLocalProfileImportExpiryStatus,
  encryptedStore: Schema.Literal("stored"),
});

export type CodexLocalProfileImportResult =
  typeof CodexLocalProfileImportResult.Type;

export const CodexSubscriptionAuthProtocolConfig = Schema.Struct({
  issuer: Schema.NonEmptyString,
  authorizationEndpoint: Schema.NonEmptyString,
  tokenEndpoint: Schema.NonEmptyString,
  clientId: Schema.NonEmptyString,
  callbackHost: Schema.Literal("127.0.0.1"),
  callbackPath: Schema.Literal("/auth/callback"),
  callbackPorts: Schema.Tuple([Schema.Literal(1455), Schema.Literal(1457)]),
  scopes: Schema.Tuple([
    Schema.Literal("openid"),
    Schema.Literal("profile"),
    Schema.Literal("email"),
    Schema.Literal("offline_access"),
    Schema.Literal("api.connectors.read"),
    Schema.Literal("api.connectors.invoke"),
  ]),
  originator: Schema.Literal("codex_cli_rs"),
  protocolScopeVersion: CodexOAuthProtocolScopeVersion,
});

export type CodexSubscriptionAuthProtocolConfig =
  typeof CodexSubscriptionAuthProtocolConfig.Type;

export const CodexOAuthAuthorizationMaterial = Schema.Struct({
  state: CodexOAuthState,
  codeVerifier: CodexOAuthCodeVerifier,
  codeChallenge: Schema.NonEmptyString,
});

export type CodexOAuthAuthorizationMaterial =
  typeof CodexOAuthAuthorizationMaterial.Type;

export const CodexOAuthAuthorizationSession = Schema.Struct({
  state: CodexOAuthState,
  codeVerifier: CodexOAuthCodeVerifier,
  codeChallenge: Schema.NonEmptyString,
  authorizationUrl: CodexOAuthAuthorizationUrl,
  redirectUri: Schema.NonEmptyString,
});

export type CodexOAuthAuthorizationSession =
  typeof CodexOAuthAuthorizationSession.Type;

export const CodexOAuthAuthorizationCallback = Schema.Struct({
  code: CodexOAuthAuthorizationCode,
  state: CodexOAuthState,
  redirectUri: Schema.NonEmptyString,
});

export type CodexOAuthAuthorizationCallback =
  typeof CodexOAuthAuthorizationCallback.Type;

export const CodexOAuthTokenResponse = Schema.Struct({
  id_token: CodexOAuthIdToken,
  access_token: CodexOAuthAccessToken,
  refresh_token: CodexOAuthRefreshToken,
});

export type CodexOAuthTokenResponse = typeof CodexOAuthTokenResponse.Type;

export const CodexOAuthRefreshResponse = Schema.Struct({
  id_token: Schema.optional(CodexOAuthIdToken),
  access_token: Schema.optional(CodexOAuthAccessToken),
  refresh_token: Schema.optional(CodexOAuthRefreshToken),
});

export type CodexOAuthRefreshResponse = typeof CodexOAuthRefreshResponse.Type;

export const CodexOAuthCodeExchangeInput = Schema.Struct({
  code: CodexOAuthAuthorizationCode,
  codeVerifier: CodexOAuthCodeVerifier,
  redirectUri: Schema.NonEmptyString,
});

export type CodexOAuthCodeExchangeInput =
  typeof CodexOAuthCodeExchangeInput.Type;

export const CodexOAuthRefreshTransportInput = Schema.Struct({
  refreshToken: CodexOAuthRefreshToken,
});

export type CodexOAuthRefreshTransportInput =
  typeof CodexOAuthRefreshTransportInput.Type;

export const CodexOAuthProviderErrorResponse = Schema.Union([
  Schema.Struct({
    error: Schema.NonEmptyString,
    error_description: Schema.optional(Schema.NonEmptyString),
  }),
  Schema.Struct({
    error: Schema.Struct({
      code: Schema.optional(Schema.NonEmptyString),
      message: Schema.optional(Schema.NonEmptyString),
    }),
  }),
]);

export type CodexOAuthProviderErrorResponse =
  typeof CodexOAuthProviderErrorResponse.Type;

export const CodexOAuthJwtExpiry = Schema.Struct({
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
});

export type CodexOAuthJwtExpiry = typeof CodexOAuthJwtExpiry.Type;

export const CodexOAuthAccountMetadata = Schema.Struct({
  accountId: CodexOAuthAccountId,
});

export type CodexOAuthAccountMetadata = typeof CodexOAuthAccountMetadata.Type;

export const CodexSubscriptionLoginInput = Schema.Struct({
  subject: CodexOAuthSubject,
  callbackTimeoutMillis: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
});

export type CodexSubscriptionLoginInput =
  typeof CodexSubscriptionLoginInput.Type;

export const CodexSubscriptionLoginExpiryCategory = Schema.Literal("valid");

export const CodexSubscriptionLoginResult = Schema.Struct({
  profileId: CodexOAuthProfileId,
  mode: CodexCliAuthMode,
  expiryCategory: CodexSubscriptionLoginExpiryCategory,
  refreshCapable: Schema.Literal(true),
  encryptedStore: Schema.Literal("stored"),
});

export type CodexSubscriptionLoginResult =
  typeof CodexSubscriptionLoginResult.Type;

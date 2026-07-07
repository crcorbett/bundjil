import { Schema } from "effect";

export const CodexOAuthProvider = Schema.Literal("codex");

export type CodexOAuthProvider = typeof CodexOAuthProvider.Type;

export const CodexOAuthProfileId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthProfileId")
);

export type CodexOAuthProfileId = typeof CodexOAuthProfileId.Type;

export const CodexOAuthConnectorId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthConnectorId")
);

export type CodexOAuthConnectorId = typeof CodexOAuthConnectorId.Type;

export const CodexOAuthInstallationId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthInstallationId")
);

export type CodexOAuthInstallationId = typeof CodexOAuthInstallationId.Type;

export const CodexOAuthPrincipalType = Schema.Literals([
  "chatgpt-user",
  "codex-access-token",
]);

export type CodexOAuthPrincipalType = typeof CodexOAuthPrincipalType.Type;

export const OAuthPrincipal = Schema.Struct({
  type: CodexOAuthPrincipalType,
  id: Schema.NonEmptyString,
  issuer: Schema.NonEmptyString,
});

export type OAuthPrincipal = typeof OAuthPrincipal.Type;

export const CodexOAuthSubject = Schema.Struct({
  provider: CodexOAuthProvider,
  principal: OAuthPrincipal,
  connectorId: CodexOAuthConnectorId,
  installationId: CodexOAuthInstallationId,
  profileId: CodexOAuthProfileId,
});

export type CodexOAuthSubject = typeof CodexOAuthSubject.Type;

export const CodexOAuthAccessToken = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type CodexOAuthAccessToken = typeof CodexOAuthAccessToken.Type;

export const CodexOAuthRefreshToken = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type CodexOAuthRefreshToken = typeof CodexOAuthRefreshToken.Type;

export const CodexOAuthTokenRefreshResult = Schema.Struct({
  subject: CodexOAuthSubject,
  accessToken: CodexOAuthAccessToken,
  refreshToken: Schema.optional(CodexOAuthRefreshToken),
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
});

export type CodexOAuthTokenRefreshResult =
  typeof CodexOAuthTokenRefreshResult.Type;

export const CodexOAuthProfile = Schema.Struct({
  subject: CodexOAuthSubject,
  accessToken: CodexOAuthAccessToken,
  refreshToken: Schema.optional(CodexOAuthRefreshToken),
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  scopes: Schema.Array(Schema.NonEmptyString),
  createdAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  requiresReauthentication: Schema.Boolean,
});

export type CodexOAuthProfile = typeof CodexOAuthProfile.Type;

export const CodexOAuthLoginStart = Schema.Struct({
  profileId: CodexOAuthProfileId,
  connectorId: CodexOAuthConnectorId,
  installationId: CodexOAuthInstallationId,
  redirectUri: Schema.NonEmptyString,
});

export type CodexOAuthLoginStart = typeof CodexOAuthLoginStart.Type;

export const CodexOAuthLoginStartResult = Schema.Struct({
  authorizationUrl: Schema.NonEmptyString,
  state: Schema.RedactedFromValue(Schema.NonEmptyString),
  codeVerifier: Schema.RedactedFromValue(Schema.NonEmptyString),
});

export type CodexOAuthLoginStartResult = typeof CodexOAuthLoginStartResult.Type;

export const CodexOAuthLoginCallback = Schema.Struct({
  code: Schema.RedactedFromValue(Schema.NonEmptyString),
  state: Schema.RedactedFromValue(Schema.NonEmptyString),
  redirectUri: Schema.NonEmptyString,
});

export type CodexOAuthLoginCallback = typeof CodexOAuthLoginCallback.Type;

export const CodexOAuthRefreshInput = Schema.Struct({
  subject: CodexOAuthSubject,
  refreshToken: CodexOAuthRefreshToken,
});

export type CodexOAuthRefreshInput = typeof CodexOAuthRefreshInput.Type;

export const CodexOAuthRevokeInput = Schema.Struct({
  subject: CodexOAuthSubject,
  accessToken: Schema.optional(CodexOAuthAccessToken),
  refreshToken: Schema.optional(CodexOAuthRefreshToken),
});

export type CodexOAuthRevokeInput = typeof CodexOAuthRevokeInput.Type;

import { Schema } from "effect";

export const CodexFileSystemDirectory = Schema.NonEmptyString.pipe(
  Schema.brand("CodexFileSystemDirectory")
);
export type CodexFileSystemDirectory = typeof CodexFileSystemDirectory.Type;

export const CodexRuntimePlatform = Schema.NonEmptyString.pipe(
  Schema.brand("CodexRuntimePlatform")
);
export type CodexRuntimePlatform = typeof CodexRuntimePlatform.Type;

export const CodexOAuthCallbackRequestMethod = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthCallbackRequestMethod")
);
export type CodexOAuthCallbackRequestMethod =
  typeof CodexOAuthCallbackRequestMethod.Type;

export const CodexOAuthCallbackRequestUrl = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthCallbackRequestUrl")
);
export type CodexOAuthCallbackRequestUrl =
  typeof CodexOAuthCallbackRequestUrl.Type;

export const CodexOAuthCallbackPath = Schema.Literal("/auth/callback");
export type CodexOAuthCallbackPath = typeof CodexOAuthCallbackPath.Type;

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

export const CodexOAuthPrincipalId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthPrincipalId")
);
export type CodexOAuthPrincipalId = typeof CodexOAuthPrincipalId.Type;

export const CodexOAuthIssuerUri = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthIssuerUri")
);
export type CodexOAuthIssuerUri = typeof CodexOAuthIssuerUri.Type;

export const OAuthPrincipal = Schema.Struct({
  type: CodexOAuthPrincipalType,
  id: CodexOAuthPrincipalId,
  issuer: CodexOAuthIssuerUri,
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

export const CodexOAuthState = Schema.RedactedFromValue(Schema.NonEmptyString);
export type CodexOAuthState = typeof CodexOAuthState.Type;

export const CodexOAuthCodeVerifier = Schema.RedactedFromValue(
  Schema.NonEmptyString
);
export type CodexOAuthCodeVerifier = typeof CodexOAuthCodeVerifier.Type;

export const CodexOAuthAuthorizationUrl = Schema.RedactedFromValue(
  Schema.NonEmptyString
);
export type CodexOAuthAuthorizationUrl = typeof CodexOAuthAuthorizationUrl.Type;

export const CodexOAuthAuthorizationCode = Schema.RedactedFromValue(
  Schema.NonEmptyString
);
export type CodexOAuthAuthorizationCode =
  typeof CodexOAuthAuthorizationCode.Type;

export const CodexOAuthIdToken = Schema.RedactedFromValue(
  Schema.NonEmptyString
);
export type CodexOAuthIdToken = typeof CodexOAuthIdToken.Type;

export const CodexOAuthAccountId = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type CodexOAuthAccountId = typeof CodexOAuthAccountId.Type;

export const CodexOAuthScope = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthScope")
);
export type CodexOAuthScope = typeof CodexOAuthScope.Type;

export const CodexOAuthSubjectHash = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthSubjectHash")
);
export type CodexOAuthSubjectHash = typeof CodexOAuthSubjectHash.Type;

export const CodexOAuthRedirectUri = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthRedirectUri")
);
export type CodexOAuthRedirectUri = typeof CodexOAuthRedirectUri.Type;

export const CodexOAuthCodeChallenge = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthCodeChallenge")
);
export type CodexOAuthCodeChallenge = typeof CodexOAuthCodeChallenge.Type;

export const CodexLocalAuthFile = Schema.NonEmptyString.pipe(
  Schema.brand("CodexLocalAuthFile")
);
export type CodexLocalAuthFile = typeof CodexLocalAuthFile.Type;

export const CodexSubscriptionAuthorizationEndpoint =
  Schema.NonEmptyString.pipe(
    Schema.brand("CodexSubscriptionAuthorizationEndpoint")
  );
export type CodexSubscriptionAuthorizationEndpoint =
  typeof CodexSubscriptionAuthorizationEndpoint.Type;

export const CodexSubscriptionTokenEndpoint = Schema.NonEmptyString.pipe(
  Schema.brand("CodexSubscriptionTokenEndpoint")
);
export type CodexSubscriptionTokenEndpoint =
  typeof CodexSubscriptionTokenEndpoint.Type;

export const CodexSubscriptionClientId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexSubscriptionClientId")
);
export type CodexSubscriptionClientId = typeof CodexSubscriptionClientId.Type;

export const CodexOAuthCredentialRevision = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthCredentialRevision")
);

export type CodexOAuthCredentialRevision =
  typeof CodexOAuthCredentialRevision.Type;

export const CodexOAuthProtocolScopeVersion = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthProtocolScopeVersion")
);

export type CodexOAuthProtocolScopeVersion =
  typeof CodexOAuthProtocolScopeVersion.Type;

export const CodexOAuthTokenRefreshResult = Schema.Struct({
  subject: CodexOAuthSubject,
  accessToken: CodexOAuthAccessToken,
  refreshToken: Schema.optional(CodexOAuthRefreshToken),
  accountId: Schema.optional(CodexOAuthAccountId),
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
});

export type CodexOAuthTokenRefreshResult =
  typeof CodexOAuthTokenRefreshResult.Type;

export const CodexOAuthCredential = Schema.Struct({
  accessToken: CodexOAuthAccessToken,
  accountId: CodexOAuthAccountId,
  credentialRevision: CodexOAuthCredentialRevision,
});

export type CodexOAuthCredential = typeof CodexOAuthCredential.Type;

export const CodexOAuthRecoverAfterUnauthorizedInput = Schema.Struct({
  subject: CodexOAuthSubject,
  observedCredentialRevision: CodexOAuthCredentialRevision,
});

export type CodexOAuthRecoverAfterUnauthorizedInput =
  typeof CodexOAuthRecoverAfterUnauthorizedInput.Type;

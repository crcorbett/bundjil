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

export const CodexOAuthProfileVersion = Schema.Literal(2);

export type CodexOAuthProfileVersion = typeof CodexOAuthProfileVersion.Type;

export const CodexOAuthProfileKind = Schema.Literals([
  "access-token-import",
  "subscription",
]);

export type CodexOAuthProfileKind = typeof CodexOAuthProfileKind.Type;

export const CodexAccessTokenImportProfile = Schema.Struct({
  profileVersion: CodexOAuthProfileVersion,
  profileKind: Schema.Literal("access-token-import"),
  subject: CodexOAuthSubject,
  accessToken: CodexOAuthAccessToken,
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  scopes: Schema.Array(CodexOAuthScope),
  createdAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  requiresReauthentication: Schema.Boolean,
});

export type CodexAccessTokenImportProfile =
  typeof CodexAccessTokenImportProfile.Type;

export const CodexSubscriptionProfile = Schema.Struct({
  profileVersion: CodexOAuthProfileVersion,
  profileKind: Schema.Literal("subscription"),
  subject: CodexOAuthSubject,
  accessToken: CodexOAuthAccessToken,
  refreshToken: CodexOAuthRefreshToken,
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  accountId: CodexOAuthAccountId,
  protocolScopeVersion: CodexOAuthProtocolScopeVersion,
  scopes: Schema.Array(CodexOAuthScope),
  createdAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  lastRefreshedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  credentialRevision: CodexOAuthCredentialRevision,
  requiresReauthentication: Schema.Boolean,
});

export type CodexSubscriptionProfile = typeof CodexSubscriptionProfile.Type;

export const CodexOAuthProfile = Schema.Union([
  CodexAccessTokenImportProfile,
  CodexSubscriptionProfile,
]);

export type CodexOAuthProfile = typeof CodexOAuthProfile.Type;

export const LegacyCodexOAuthProfileV1 = Schema.Struct({
  subject: CodexOAuthSubject,
  accessToken: CodexOAuthAccessToken,
  refreshToken: Schema.optional(CodexOAuthRefreshToken),
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  scopes: Schema.Array(CodexOAuthScope),
  createdAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  requiresReauthentication: Schema.Boolean,
});

export type LegacyCodexOAuthProfileV1 = typeof LegacyCodexOAuthProfileV1.Type;

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
  localAuthFile: CodexLocalAuthFile,
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

export const CodexOAuthProfileCipherAlgorithm = Schema.Literal("AES-GCM");

export type CodexOAuthProfileCipherAlgorithm =
  typeof CodexOAuthProfileCipherAlgorithm.Type;

export const CodexOAuthProfileCipherKeyId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthProfileCipherKeyId")
);

export type CodexOAuthProfileCipherKeyId =
  typeof CodexOAuthProfileCipherKeyId.Type;

export const CodexOAuthProfileCipherKeyMaterial = Schema.RedactedFromValue(
  Schema.NonEmptyString
);
export type CodexOAuthProfileCipherKeyMaterial =
  typeof CodexOAuthProfileCipherKeyMaterial.Type;

export const CodexOAuthProfileCipherConfig = Schema.Struct({
  algorithm: CodexOAuthProfileCipherAlgorithm,
  keyId: CodexOAuthProfileCipherKeyId,
  keyMaterial: CodexOAuthProfileCipherKeyMaterial,
});

export type CodexOAuthProfileCipherConfig =
  typeof CodexOAuthProfileCipherConfig.Type;

const EncryptedCodexOAuthProfileFields = {
  algorithm: CodexOAuthProfileCipherAlgorithm,
  keyId: CodexOAuthProfileCipherKeyId,
  nonce: Schema.Uint8Array,
  ciphertext: Schema.Uint8Array,
  subjectHash: CodexOAuthSubjectHash,
  createdAtEpochMillis: Schema.Number.check(Schema.isFinite()),
  updatedAtEpochMillis: Schema.Number.check(Schema.isFinite()),
} as const;

export const EncryptedCodexOAuthProfile = Schema.Struct({
  version: Schema.Number.check(Schema.isFinite()),
  ...EncryptedCodexOAuthProfileFields,
});

export type EncryptedCodexOAuthProfile = typeof EncryptedCodexOAuthProfile.Type;

export const EncryptedCodexOAuthProfileV1 = Schema.Struct({
  version: Schema.Literal(1),
  ...EncryptedCodexOAuthProfileFields,
});

export type EncryptedCodexOAuthProfileV1 =
  typeof EncryptedCodexOAuthProfileV1.Type;

export const EncryptedCodexOAuthProfileV2 = Schema.Struct({
  version: Schema.Literal(2),
  ...EncryptedCodexOAuthProfileFields,
});

export type EncryptedCodexOAuthProfileV2 =
  typeof EncryptedCodexOAuthProfileV2.Type;

export const CodexOAuthRefreshLockTtlMillis = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThan(0)),
  Schema.brand("CodexOAuthRefreshLockTtlMillis")
);

export type CodexOAuthRefreshLockTtlMillis =
  typeof CodexOAuthRefreshLockTtlMillis.Type;

export const CodexOAuthRefreshPolicy = Schema.Struct({
  refreshSkewMillis: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  lockTtlMillis: CodexOAuthRefreshLockTtlMillis,
});

export type CodexOAuthRefreshPolicy = typeof CodexOAuthRefreshPolicy.Type;

export const CodexOAuthRefreshLockOwner = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type CodexOAuthRefreshLockOwner = typeof CodexOAuthRefreshLockOwner.Type;

export const CodexOAuthRefreshLockAcquireInput = Schema.Struct({
  subject: CodexOAuthSubject,
  ttlMillis: CodexOAuthRefreshLockTtlMillis,
});

export type CodexOAuthRefreshLockAcquireInput =
  typeof CodexOAuthRefreshLockAcquireInput.Type;

export const CodexOAuthRefreshLockLease = Schema.Struct({
  subject: CodexOAuthSubject,
  subjectHash: CodexOAuthSubjectHash,
  owner: CodexOAuthRefreshLockOwner,
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
});

export type CodexOAuthRefreshLockLease = typeof CodexOAuthRefreshLockLease.Type;

export const CodexOAuthLoginStart = Schema.Struct({
  profileId: CodexOAuthProfileId,
  connectorId: CodexOAuthConnectorId,
  installationId: CodexOAuthInstallationId,
  redirectUri: CodexOAuthRedirectUri,
});

export type CodexOAuthLoginStart = typeof CodexOAuthLoginStart.Type;

export const CodexOAuthLoginStartResult = Schema.Struct({
  authorizationUrl: CodexOAuthAuthorizationUrl,
  state: CodexOAuthState,
  codeVerifier: CodexOAuthCodeVerifier,
});

export type CodexOAuthLoginStartResult = typeof CodexOAuthLoginStartResult.Type;

export const CodexOAuthLoginCallback = Schema.Struct({
  code: CodexOAuthAuthorizationCode,
  state: CodexOAuthState,
  redirectUri: CodexOAuthRedirectUri,
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

export const CodexOAuthProfileCommitOperation = Schema.Literals([
  "initialWrite",
  "replaceLegacy",
  "replace",
  "refresh",
  "markReauthenticationRequired",
]);

export type CodexOAuthProfileCommitOperation =
  typeof CodexOAuthProfileCommitOperation.Type;

export const CodexOAuthProfileCommitLegacyReplacementInput = Schema.Struct({
  expectedLegacyProfile: CodexAccessTokenImportProfile,
  profile: CodexSubscriptionProfile,
});

export type CodexOAuthProfileCommitLegacyReplacementInput =
  typeof CodexOAuthProfileCommitLegacyReplacementInput.Type;

export const CodexOAuthProfileCommitReplacementInput = Schema.Struct({
  profile: CodexSubscriptionProfile,
  expectedRevision: CodexOAuthCredentialRevision,
});

export type CodexOAuthProfileCommitReplacementInput =
  typeof CodexOAuthProfileCommitReplacementInput.Type;

export const CodexOAuthProfileCommitRefreshInput = Schema.Struct({
  profile: CodexSubscriptionProfile,
  expectedRevision: CodexOAuthCredentialRevision,
});

export type CodexOAuthProfileCommitRefreshInput =
  typeof CodexOAuthProfileCommitRefreshInput.Type;

export const CodexOAuthProfileCommitReauthenticationInput = Schema.Struct({
  profile: CodexSubscriptionProfile,
  expectedRevision: CodexOAuthCredentialRevision,
});

export type CodexOAuthProfileCommitReauthenticationInput =
  typeof CodexOAuthProfileCommitReauthenticationInput.Type;

export const CodexSubscriptionAuthProtocolConfig = Schema.Struct({
  issuer: CodexOAuthIssuerUri,
  authorizationEndpoint: CodexSubscriptionAuthorizationEndpoint,
  tokenEndpoint: CodexSubscriptionTokenEndpoint,
  clientId: CodexSubscriptionClientId,
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
  codeChallenge: CodexOAuthCodeChallenge,
});

export type CodexOAuthAuthorizationMaterial =
  typeof CodexOAuthAuthorizationMaterial.Type;

export const CodexOAuthAuthorizationSession = Schema.Struct({
  state: CodexOAuthState,
  codeVerifier: CodexOAuthCodeVerifier,
  codeChallenge: CodexOAuthCodeChallenge,
  authorizationUrl: CodexOAuthAuthorizationUrl,
  redirectUri: CodexOAuthRedirectUri,
});

export type CodexOAuthAuthorizationSession =
  typeof CodexOAuthAuthorizationSession.Type;

export const CodexOAuthAuthorizationCallback = Schema.Struct({
  code: CodexOAuthAuthorizationCode,
  state: CodexOAuthState,
  redirectUri: CodexOAuthRedirectUri,
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
  redirectUri: CodexOAuthRedirectUri,
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

export const CodexStoredProfileProofResult = Schema.Struct({
  found: Schema.Boolean,
  envelopeVersion2: Schema.Boolean,
  ciphertextPresent: Schema.Boolean,
  profileKindSubscription: Schema.Boolean,
  refreshCapable: Schema.Boolean,
  expiryValid: Schema.Boolean,
  requiresReauthenticationFalse: Schema.Boolean,
  markerLeakFalse: Schema.Boolean,
});

export type CodexStoredProfileProofResult =
  typeof CodexStoredProfileProofResult.Type;

export const CodexOAuthObserverEventType = Schema.Literals([
  "refreshStarted",
  "refreshSucceeded",
  "refreshConflict",
  "refreshWinnerUsed",
  "reauthenticationMarked",
]);

export type CodexOAuthObserverEventType =
  typeof CodexOAuthObserverEventType.Type;

export const CodexOAuthObserverEvent = Schema.Struct({
  type: CodexOAuthObserverEventType,
  operation: Schema.optional(CodexOAuthProfileCommitOperation),
  profileKind: Schema.optional(CodexOAuthProfileKind),
  requiresReauthentication: Schema.optional(Schema.Boolean),
});

export type CodexOAuthObserverEvent = typeof CodexOAuthObserverEvent.Type;

export const CodexOAuthObserverCounters = Schema.Struct({
  refreshStarted: Schema.Int,
  refreshSucceeded: Schema.Int,
  refreshConflict: Schema.Int,
  refreshWinnerUsed: Schema.Int,
  reauthenticationMarked: Schema.Int,
});

export type CodexOAuthObserverCounters = typeof CodexOAuthObserverCounters.Type;

export const CodexOAuthObserverSnapshot = Schema.Struct({
  counters: CodexOAuthObserverCounters,
  events: Schema.Array(CodexOAuthObserverEvent),
});

export type CodexOAuthObserverSnapshot = typeof CodexOAuthObserverSnapshot.Type;

export const CodexResponsesModelId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesModelId")
);

export type CodexResponsesModelId = typeof CodexResponsesModelId.Type;

export const CodexResponsesEndpoint = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesEndpoint")
);

export type CodexResponsesEndpoint = typeof CodexResponsesEndpoint.Type;

export const CodexResponsesContent = Schema.String;
export type CodexResponsesContent = typeof CodexResponsesContent.Type;

export const CodexResponsesNonEmptyContent = Schema.NonEmptyString;
export type CodexResponsesNonEmptyContent =
  typeof CodexResponsesNonEmptyContent.Type;

export const CodexResponsesFunctionName = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesFunctionName")
);
export type CodexResponsesFunctionName = typeof CodexResponsesFunctionName.Type;

export const CodexResponsesFunctionCallId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesFunctionCallId")
);
export type CodexResponsesFunctionCallId =
  typeof CodexResponsesFunctionCallId.Type;

export const CodexResponsesOutputItemId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesOutputItemId")
);
export type CodexResponsesOutputItemId = typeof CodexResponsesOutputItemId.Type;

export const CodexResponsesFunctionArguments = Schema.String;
export type CodexResponsesFunctionArguments =
  typeof CodexResponsesFunctionArguments.Type;

export const CodexResponsesStreamContentType = Schema.String;
export type CodexResponsesStreamContentType =
  typeof CodexResponsesStreamContentType.Type;

export const CodexResponsesStreamEventKind = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesStreamEventKind")
);
export type CodexResponsesStreamEventKind =
  typeof CodexResponsesStreamEventKind.Type;

export const CodexResponsesRecognizedStreamEventType = Schema.Literals([
  "response.output_text.delta",
  "response.output_item.added",
  "response.function_call_arguments.delta",
]);
export type CodexResponsesRecognizedStreamEventType =
  typeof CodexResponsesRecognizedStreamEventType.Type;

export const CodexResponsesInputTextContent = Schema.Struct({
  type: Schema.Literal("input_text"),
  text: CodexResponsesNonEmptyContent,
});

export type CodexResponsesInputTextContent =
  typeof CodexResponsesInputTextContent.Type;

export const CodexResponsesOutputTextContent = Schema.Struct({
  type: Schema.Literal("output_text"),
  text: CodexResponsesNonEmptyContent,
});

export type CodexResponsesOutputTextContent =
  typeof CodexResponsesOutputTextContent.Type;

export const CodexResponsesTextContent = Schema.Union([
  CodexResponsesInputTextContent,
  CodexResponsesOutputTextContent,
]);

export type CodexResponsesTextContent = typeof CodexResponsesTextContent.Type;

export const CodexResponsesInputMessage = Schema.Struct({
  role: Schema.Literals(["user", "system", "assistant"]),
  content: Schema.Array(CodexResponsesTextContent),
});

export type CodexResponsesInputMessage = typeof CodexResponsesInputMessage.Type;

const CodexResponsesFunctionCallFields = {
  type: Schema.Literal("function_call"),
  call_id: CodexResponsesFunctionCallId,
  name: CodexResponsesFunctionName,
  arguments: CodexResponsesFunctionArguments,
};

export const CodexResponsesFunctionCall = Schema.Struct({
  ...CodexResponsesFunctionCallFields,
});

export type CodexResponsesFunctionCall = typeof CodexResponsesFunctionCall.Type;

export const CodexResponsesFunctionCallOutputItem = Schema.Struct({
  id: CodexResponsesOutputItemId,
  ...CodexResponsesFunctionCallFields,
});

export type CodexResponsesFunctionCallOutputItem =
  typeof CodexResponsesFunctionCallOutputItem.Type;

export const CodexResponsesFunctionCallOutput = Schema.Struct({
  type: Schema.Literal("function_call_output"),
  call_id: CodexResponsesFunctionCallId,
  output: CodexResponsesContent,
});

export type CodexResponsesFunctionCallOutput =
  typeof CodexResponsesFunctionCallOutput.Type;

export const CodexResponsesInput = Schema.Union([
  CodexResponsesInputMessage,
  CodexResponsesFunctionCall,
  CodexResponsesFunctionCallOutput,
]);

export type CodexResponsesInput = typeof CodexResponsesInput.Type;

export const CodexResponsesFunctionTool = Schema.Struct({
  type: Schema.Literal("function"),
  name: CodexResponsesFunctionName,
  description: Schema.optional(CodexResponsesContent),
  parameters: Schema.Unknown,
  strict: Schema.optional(Schema.Boolean),
});

export type CodexResponsesFunctionTool = typeof CodexResponsesFunctionTool.Type;

export const CodexResponsesToolChoice = Schema.Union([
  Schema.Literals(["auto", "none", "required"]),
  Schema.Struct({
    type: Schema.Literal("function"),
    name: CodexResponsesFunctionName,
  }),
]);

export type CodexResponsesToolChoice = typeof CodexResponsesToolChoice.Type;

export const CodexResponsesReasoning = Schema.Struct({
  effort: Schema.Literals(["low", "medium", "high", "xhigh"]),
});

export type CodexResponsesReasoning = typeof CodexResponsesReasoning.Type;

export const CodexResponsesRequest = Schema.Struct({
  model: CodexResponsesModelId,
  input: Schema.Array(CodexResponsesInput),
  store: Schema.Boolean,
  instructions: Schema.optional(CodexResponsesNonEmptyContent),
  stream: Schema.Boolean,
  reasoning: Schema.optional(CodexResponsesReasoning),
  tools: Schema.optional(Schema.Array(CodexResponsesFunctionTool)),
  tool_choice: Schema.optional(CodexResponsesToolChoice),
  parallel_tool_calls: Schema.optional(Schema.Boolean),
});

export type CodexResponsesRequest = typeof CodexResponsesRequest.Type;

export const CodexResponsesStreamBody = Schema.RedactedFromValue(Schema.String);

export type CodexResponsesStreamBody = typeof CodexResponsesStreamBody.Type;

export const CodexResponsesStreamResult = Schema.Struct({
  status: Schema.Number.check(Schema.isFinite()),
  contentType: CodexResponsesStreamContentType,
  body: CodexResponsesStreamBody,
});

export type CodexResponsesStreamResult = typeof CodexResponsesStreamResult.Type;

export const CodexResponsesStreamEvent = Schema.Struct({
  type: CodexResponsesStreamEventKind,
  delta: Schema.optional(CodexResponsesContent),
  output_index: Schema.optional(Schema.Number.check(Schema.isFinite())),
  item: Schema.optional(Schema.Unknown),
});

export type CodexResponsesStreamEvent = typeof CodexResponsesStreamEvent.Type;

export const CodexResponsesOutputItemKind = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesOutputItemKind")
);
export type CodexResponsesOutputItemKind =
  typeof CodexResponsesOutputItemKind.Type;

export const CodexResponsesOutputItemDiscriminator = Schema.Struct({
  type: CodexResponsesOutputItemKind,
});

export type CodexResponsesOutputItemDiscriminator =
  typeof CodexResponsesOutputItemDiscriminator.Type;

export const CodexResponsesFunctionCallAddedEvent = Schema.Struct({
  type: Schema.Literal("response.output_item.added"),
  output_index: Schema.Number.check(Schema.isFinite()),
  item: CodexResponsesFunctionCallOutputItem,
});

export type CodexResponsesFunctionCallAddedEvent =
  typeof CodexResponsesFunctionCallAddedEvent.Type;

export const CodexResponsesFunctionArgumentsDeltaEvent = Schema.Struct({
  type: Schema.Literal("response.function_call_arguments.delta"),
  output_index: Schema.Number.check(Schema.isFinite()),
  delta: CodexResponsesFunctionArguments,
});

export type CodexResponsesFunctionArgumentsDeltaEvent =
  typeof CodexResponsesFunctionArgumentsDeltaEvent.Type;

export const CodexResponsesStreamMapInput = Schema.Struct({
  model: CodexResponsesModelId,
  body: CodexResponsesStreamBody,
});

export type CodexResponsesStreamMapInput =
  typeof CodexResponsesStreamMapInput.Type;

export const CodexResponsesPostInput = Schema.Struct({
  accessToken: CodexOAuthAccessToken,
  accountId: Schema.optional(CodexOAuthAccountId),
  request: CodexResponsesRequest,
});

export type CodexResponsesPostInput = typeof CodexResponsesPostInput.Type;

export const OpenAICompatibleChatRole = Schema.Literals([
  "system",
  "user",
  "assistant",
  "tool",
]);

export type OpenAICompatibleChatRole = typeof OpenAICompatibleChatRole.Type;

export const OpenAICompatibleMessageToolCall = Schema.Struct({
  type: Schema.Literal("function"),
  id: CodexResponsesFunctionCallId,
  function: Schema.Struct({
    arguments: CodexResponsesFunctionArguments,
    name: CodexResponsesFunctionName,
  }),
});

export type OpenAICompatibleMessageToolCall =
  typeof OpenAICompatibleMessageToolCall.Type;

export const OpenAICompatibleChatMessage = Schema.Union([
  Schema.Struct({
    role: Schema.Literal("system"),
    content: CodexResponsesContent,
  }),
  Schema.Struct({
    role: Schema.Literal("user"),
    content: CodexResponsesContent,
  }),
  Schema.Struct({
    role: Schema.Literal("assistant"),
    content: Schema.optional(Schema.NullOr(CodexResponsesContent)),
    tool_calls: Schema.optional(Schema.Array(OpenAICompatibleMessageToolCall)),
  }),
  Schema.Struct({
    role: Schema.Literal("tool"),
    content: CodexResponsesContent,
    tool_call_id: CodexResponsesFunctionCallId,
  }),
]);

export type OpenAICompatibleChatMessage =
  typeof OpenAICompatibleChatMessage.Type;

export const OpenAICompatibleFunctionTool = Schema.Struct({
  type: Schema.Literal("function"),
  function: Schema.Struct({
    name: CodexResponsesFunctionName,
    description: Schema.optional(CodexResponsesContent),
    parameters: Schema.Unknown,
    strict: Schema.optional(Schema.Boolean),
  }),
});

export type OpenAICompatibleFunctionTool =
  typeof OpenAICompatibleFunctionTool.Type;

export const OpenAICompatibleToolChoice = Schema.Union([
  Schema.Literals(["auto", "none", "required"]),
  Schema.Struct({
    type: Schema.Literal("function"),
    function: Schema.Struct({ name: CodexResponsesFunctionName }),
  }),
]);

export type OpenAICompatibleToolChoice = typeof OpenAICompatibleToolChoice.Type;

export const OpenAICompatibleChatCompletionRequest = Schema.Struct({
  model: CodexResponsesModelId,
  messages: Schema.Array(OpenAICompatibleChatMessage),
  stream: Schema.optional(Schema.Boolean),
  tools: Schema.optional(Schema.Array(OpenAICompatibleFunctionTool)),
  tool_choice: Schema.optional(OpenAICompatibleToolChoice),
});

export type OpenAICompatibleChatCompletionRequest =
  typeof OpenAICompatibleChatCompletionRequest.Type;

export const OpenAICompatibleChatCompletionDelta = Schema.Struct({
  content: Schema.optional(CodexResponsesContent),
  tool_calls: Schema.optional(
    Schema.Array(
      Schema.Struct({
        index: Schema.Number.check(Schema.isFinite()),
        id: Schema.optional(CodexResponsesFunctionCallId),
        type: Schema.optional(Schema.Literal("function")),
        function: Schema.Struct({
          name: Schema.optional(CodexResponsesFunctionName),
          arguments: Schema.optional(CodexResponsesFunctionArguments),
        }),
      })
    )
  ),
});

export type OpenAICompatibleChatCompletionDelta =
  typeof OpenAICompatibleChatCompletionDelta.Type;

export const OpenAICompatibleChatCompletionFinishReason = Schema.Literals([
  "stop",
  "tool_calls",
]);
export type OpenAICompatibleChatCompletionFinishReason =
  typeof OpenAICompatibleChatCompletionFinishReason.Type;

export const OpenAICompatibleChatCompletionChoice = Schema.Struct({
  index: Schema.Number.check(Schema.isFinite()),
  delta: OpenAICompatibleChatCompletionDelta,
  finish_reason: Schema.optional(
    Schema.NullOr(OpenAICompatibleChatCompletionFinishReason)
  ),
});

export type OpenAICompatibleChatCompletionChoice =
  typeof OpenAICompatibleChatCompletionChoice.Type;

export const OpenAICompatibleChatCompletionId = Schema.NonEmptyString.pipe(
  Schema.brand("OpenAICompatibleChatCompletionId")
);
export type OpenAICompatibleChatCompletionId =
  typeof OpenAICompatibleChatCompletionId.Type;

export const OpenAICompatibleChatCompletionChunk = Schema.Struct({
  id: OpenAICompatibleChatCompletionId,
  object: Schema.Literal("chat.completion.chunk"),
  created: Schema.Number.check(Schema.isFinite()),
  model: CodexResponsesModelId,
  choices: Schema.Array(OpenAICompatibleChatCompletionChoice),
});

export type OpenAICompatibleChatCompletionChunk =
  typeof OpenAICompatibleChatCompletionChunk.Type;

export const OpenAICompatibleChatCompletionStreamBody = Schema.String;
export type OpenAICompatibleChatCompletionStreamBody =
  typeof OpenAICompatibleChatCompletionStreamBody.Type;

export const OpenAICompatibleChatCompletionStream = Schema.Struct({
  contentType: Schema.Literal("text/event-stream"),
  body: OpenAICompatibleChatCompletionStreamBody,
});

export type OpenAICompatibleChatCompletionStream =
  typeof OpenAICompatibleChatCompletionStream.Type;

export const CodexDirectProviderInput = Schema.Struct({
  subject: CodexOAuthSubject,
  accountId: Schema.optional(CodexOAuthAccountId),
  request: OpenAICompatibleChatCompletionRequest,
});

export type CodexDirectProviderInput = typeof CodexDirectProviderInput.Type;

export const OpenAICompatibleProxyInternalToken = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type OpenAICompatibleProxyInternalToken =
  typeof OpenAICompatibleProxyInternalToken.Type;

export const OpenAICompatibleProxyAuthorizationHeader = Schema.String;
export type OpenAICompatibleProxyAuthorizationHeader =
  typeof OpenAICompatibleProxyAuthorizationHeader.Type;

export const OpenAICompatibleProxyInput = Schema.Struct({
  authorization: Schema.optional(OpenAICompatibleProxyAuthorizationHeader),
  internalToken: OpenAICompatibleProxyInternalToken,
  completion: CodexDirectProviderInput,
});

export type OpenAICompatibleProxyInput = typeof OpenAICompatibleProxyInput.Type;

export const UpstashRedisRestUrl = Schema.URL;

export type UpstashRedisRestUrl = typeof UpstashRedisRestUrl.Type;

export const UpstashRedisRestToken = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type UpstashRedisRestToken = typeof UpstashRedisRestToken.Type;

export const UpstashRedisKeyPrefix = Schema.NonEmptyString.pipe(
  Schema.brand("UpstashRedisKeyPrefix")
);

export type UpstashRedisKeyPrefix = typeof UpstashRedisKeyPrefix.Type;

export const UpstashRedisConfig = Schema.Struct({
  keyPrefix: UpstashRedisKeyPrefix,
  restUrl: UpstashRedisRestUrl,
  restToken: UpstashRedisRestToken,
});

export type UpstashRedisConfig = typeof UpstashRedisConfig.Type;

export const CodexResponsesProofInput = Schema.Struct({
  accessToken: CodexOAuthAccessToken,
  accountId: Schema.optional(CodexOAuthAccountId),
  model: CodexResponsesModelId,
  prompt: CodexResponsesNonEmptyContent,
});

export type CodexResponsesProofInput = typeof CodexResponsesProofInput.Type;

export const CodexResponsesProofResult = Schema.Struct({
  transport: Schema.Literal("direct-codex-responses"),
  endpoint: CodexResponsesEndpoint,
  status: Schema.Number.check(Schema.isFinite()),
  contentType: CodexResponsesStreamContentType,
  receivedBodyBytes: Schema.Number.check(Schema.isFinite()),
  receivedStreamLines: Schema.Number.check(Schema.isFinite()),
  usedAccountHeader: Schema.Boolean,
});

export type CodexResponsesProofResult = typeof CodexResponsesProofResult.Type;

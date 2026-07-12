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
  scopes: Schema.Array(Schema.NonEmptyString),
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
  scopes: Schema.Array(Schema.NonEmptyString),
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
  scopes: Schema.Array(Schema.NonEmptyString),
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

export const CodexOAuthProfileCipherAlgorithm = Schema.Literal("AES-GCM");

export type CodexOAuthProfileCipherAlgorithm =
  typeof CodexOAuthProfileCipherAlgorithm.Type;

export const CodexOAuthProfileCipherKeyId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexOAuthProfileCipherKeyId")
);

export type CodexOAuthProfileCipherKeyId =
  typeof CodexOAuthProfileCipherKeyId.Type;

export const CodexOAuthProfileCipherConfig = Schema.Struct({
  algorithm: CodexOAuthProfileCipherAlgorithm,
  keyId: CodexOAuthProfileCipherKeyId,
  keyMaterial: Schema.RedactedFromValue(Schema.NonEmptyString),
});

export type CodexOAuthProfileCipherConfig =
  typeof CodexOAuthProfileCipherConfig.Type;

const EncryptedCodexOAuthProfileFields = {
  algorithm: CodexOAuthProfileCipherAlgorithm,
  keyId: CodexOAuthProfileCipherKeyId,
  nonce: Schema.Uint8Array,
  ciphertext: Schema.Uint8Array,
  subjectHash: Schema.NonEmptyString,
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
  subjectHash: Schema.NonEmptyString,
  owner: CodexOAuthRefreshLockOwner,
  expiresAtEpochMillis: Schema.Number.check(Schema.isFinite()),
});

export type CodexOAuthRefreshLockLease = typeof CodexOAuthRefreshLockLease.Type;

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

export const CodexResponsesInputTextContent = Schema.Struct({
  type: Schema.Literal("input_text"),
  text: Schema.NonEmptyString,
});

export type CodexResponsesInputTextContent =
  typeof CodexResponsesInputTextContent.Type;

export const CodexResponsesOutputTextContent = Schema.Struct({
  type: Schema.Literal("output_text"),
  text: Schema.NonEmptyString,
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

export const CodexResponsesReasoning = Schema.Struct({
  effort: Schema.Literals(["low", "medium", "high", "xhigh"]),
});

export type CodexResponsesReasoning = typeof CodexResponsesReasoning.Type;

export const CodexResponsesRequest = Schema.Struct({
  model: CodexResponsesModelId,
  input: Schema.Array(CodexResponsesInputMessage),
  store: Schema.Boolean,
  instructions: Schema.optional(Schema.NonEmptyString),
  stream: Schema.Boolean,
  reasoning: Schema.optional(CodexResponsesReasoning),
});

export type CodexResponsesRequest = typeof CodexResponsesRequest.Type;

export const CodexResponsesStreamBody = Schema.RedactedFromValue(Schema.String);

export type CodexResponsesStreamBody = typeof CodexResponsesStreamBody.Type;

export const CodexResponsesStreamResult = Schema.Struct({
  status: Schema.Number.check(Schema.isFinite()),
  contentType: Schema.String,
  body: CodexResponsesStreamBody,
});

export type CodexResponsesStreamResult = typeof CodexResponsesStreamResult.Type;

export const CodexResponsesStreamEvent = Schema.Struct({
  type: Schema.NonEmptyString,
  delta: Schema.optional(Schema.String),
});

export type CodexResponsesStreamEvent = typeof CodexResponsesStreamEvent.Type;

export const CodexResponsesStreamMapInput = Schema.Struct({
  model: CodexResponsesModelId,
  body: CodexResponsesStreamBody,
});

export type CodexResponsesStreamMapInput =
  typeof CodexResponsesStreamMapInput.Type;

export const CodexResponsesPostInput = Schema.Struct({
  accessToken: CodexOAuthAccessToken,
  accountId: Schema.optional(Schema.NonEmptyString),
  request: CodexResponsesRequest,
});

export type CodexResponsesPostInput = typeof CodexResponsesPostInput.Type;

export const OpenAICompatibleChatRole = Schema.Literals([
  "system",
  "user",
  "assistant",
]);

export type OpenAICompatibleChatRole = typeof OpenAICompatibleChatRole.Type;

export const OpenAICompatibleChatMessage = Schema.Struct({
  role: OpenAICompatibleChatRole,
  content: Schema.NonEmptyString,
});

export type OpenAICompatibleChatMessage =
  typeof OpenAICompatibleChatMessage.Type;

export const OpenAICompatibleChatCompletionRequest = Schema.Struct({
  model: CodexResponsesModelId,
  messages: Schema.Array(OpenAICompatibleChatMessage),
  stream: Schema.optional(Schema.Boolean),
});

export type OpenAICompatibleChatCompletionRequest =
  typeof OpenAICompatibleChatCompletionRequest.Type;

export const OpenAICompatibleChatCompletionDelta = Schema.Struct({
  content: Schema.optional(Schema.String),
});

export type OpenAICompatibleChatCompletionDelta =
  typeof OpenAICompatibleChatCompletionDelta.Type;

export const OpenAICompatibleChatCompletionChoice = Schema.Struct({
  index: Schema.Number.check(Schema.isFinite()),
  delta: OpenAICompatibleChatCompletionDelta,
  finish_reason: Schema.optional(Schema.NullOr(Schema.String)),
});

export type OpenAICompatibleChatCompletionChoice =
  typeof OpenAICompatibleChatCompletionChoice.Type;

export const OpenAICompatibleChatCompletionChunk = Schema.Struct({
  id: Schema.NonEmptyString,
  object: Schema.Literal("chat.completion.chunk"),
  created: Schema.Number.check(Schema.isFinite()),
  model: CodexResponsesModelId,
  choices: Schema.Array(OpenAICompatibleChatCompletionChoice),
});

export type OpenAICompatibleChatCompletionChunk =
  typeof OpenAICompatibleChatCompletionChunk.Type;

export const OpenAICompatibleChatCompletionStream = Schema.Struct({
  contentType: Schema.Literal("text/event-stream"),
  body: Schema.String,
});

export type OpenAICompatibleChatCompletionStream =
  typeof OpenAICompatibleChatCompletionStream.Type;

export const CodexDirectProviderInput = Schema.Struct({
  subject: CodexOAuthSubject,
  accountId: Schema.optional(Schema.NonEmptyString),
  request: OpenAICompatibleChatCompletionRequest,
});

export type CodexDirectProviderInput = typeof CodexDirectProviderInput.Type;

export const OpenAICompatibleProxyInternalToken = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type OpenAICompatibleProxyInternalToken =
  typeof OpenAICompatibleProxyInternalToken.Type;

export const OpenAICompatibleProxyInput = Schema.Struct({
  authorization: Schema.optional(Schema.String),
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
  accountId: Schema.optional(Schema.NonEmptyString),
  model: CodexResponsesModelId,
  prompt: Schema.NonEmptyString,
});

export type CodexResponsesProofInput = typeof CodexResponsesProofInput.Type;

export const CodexResponsesProofResult = Schema.Struct({
  transport: Schema.Literal("direct-codex-responses"),
  endpoint: CodexResponsesEndpoint,
  status: Schema.Number.check(Schema.isFinite()),
  contentType: Schema.String,
  receivedBodyBytes: Schema.Number.check(Schema.isFinite()),
  receivedStreamLines: Schema.Number.check(Schema.isFinite()),
  usedAccountHeader: Schema.Boolean,
});

export type CodexResponsesProofResult = typeof CodexResponsesProofResult.Type;

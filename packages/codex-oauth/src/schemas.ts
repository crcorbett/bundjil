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

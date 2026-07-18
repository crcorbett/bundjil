import { Schema } from "effect";

export const CodexErrorMessage = Schema.NonEmptyString;
export const CodexHttpStatusText = Schema.String;
export const CodexHttpContentType = Schema.String;

export const CodexOAuthProfileSchemaBoundary = Schema.Literals([
  "CodexOAuthProfile",
  "CodexAccessTokenImportProfile",
  "CodexSubscriptionProfile",
  "CodexOAuthSubject",
  "CodexOAuthTokenRefreshResult",
]);

export type CodexOAuthProfileSchemaBoundary =
  typeof CodexOAuthProfileSchemaBoundary.Type;

export const CodexOAuthProfileStorageOperation = Schema.Literals([
  "deriveProfileStorageKey",
  "getProfile",
  "putProfile",
  "putLegacyProfile",
  "removeProfile",
  "hasProfile",
  "seedProfiles",
]);

export type CodexOAuthProfileStorageOperation =
  typeof CodexOAuthProfileStorageOperation.Type;

export const CodexLocalProfileImportOperation = Schema.Literals([
  "loadConfig",
  "readCache",
  "decodeCache",
  "validateExpiry",
  "buildProfile",
  "putProfile",
  "encodeResult",
]);

export type CodexLocalProfileImportOperation =
  typeof CodexLocalProfileImportOperation.Type;

export const CodexOAuthProfileCipherOperation = Schema.Literals([
  "loadKey",
  "encrypt",
  "decrypt",
  "encode",
  "decode",
  "unsupportedVersion",
  "keyMismatch",
  "integrityMismatch",
]);

export type CodexOAuthProfileCipherOperation =
  typeof CodexOAuthProfileCipherOperation.Type;

export const CodexOAuthRefreshLockOperation = Schema.Literals([
  "acquire",
  "release",
]);

export type CodexOAuthRefreshLockOperation =
  typeof CodexOAuthRefreshLockOperation.Type;

export const CodexOAuthRefreshLockFailureReason = Schema.Literals([
  "acquisition",
  "contended",
  "expired",
  "release",
]);

export type CodexOAuthRefreshLockFailureReason =
  typeof CodexOAuthRefreshLockFailureReason.Type;

export const CodexOAuthClientOperation = Schema.Literals([
  "startLogin",
  "completeLogin",
  "refresh",
  "revoke",
]);

export type CodexOAuthClientOperation = typeof CodexOAuthClientOperation.Type;

export const CodexResponsesSchemaBoundary = Schema.Literals([
  "CodexResponsesRequest",
  "CodexResponsesProofInput",
  "CodexResponsesProofResult",
]);

export type CodexResponsesSchemaBoundary =
  typeof CodexResponsesSchemaBoundary.Type;

export const CodexHttpClientOperation = Schema.Literals([
  "fetch",
  "postResponses",
  "postResponsesStream",
  "readResponseBody",
]);

export type CodexHttpClientOperation = typeof CodexHttpClientOperation.Type;

export const CodexRequestMapperOperation = Schema.Literals([
  "toCodexResponses",
]);

export type CodexRequestMapperOperation =
  typeof CodexRequestMapperOperation.Type;

export const CodexStreamMapperOperation = Schema.Literals([
  "toOpenAICompatibleStream",
]);

export type CodexStreamMapperOperation = typeof CodexStreamMapperOperation.Type;

export const CodexResponsesStreamOperation = Schema.Union([
  CodexHttpClientOperation,
  CodexStreamMapperOperation,
]);

export type CodexResponsesStreamOperation =
  typeof CodexResponsesStreamOperation.Type;

export const OpenAICompatibleProxyOperation = Schema.Literals([
  "handleChatCompletions",
]);

export type OpenAICompatibleProxyOperation =
  typeof OpenAICompatibleProxyOperation.Type;

export const UpstashKeyValueStoreConfigBoundary = Schema.Literals([
  "UpstashRedisConfig",
]);

export type UpstashKeyValueStoreConfigBoundary =
  typeof UpstashKeyValueStoreConfigBoundary.Type;

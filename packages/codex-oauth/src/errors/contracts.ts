import { Schema } from "effect";

export const CodexOAuthProfileSchemaBoundary = Schema.Literals([
  "CodexOAuthProfile",
  "CodexOAuthSubject",
  "CodexOAuthTokenRefreshResult",
]);

export type CodexOAuthProfileSchemaBoundary =
  typeof CodexOAuthProfileSchemaBoundary.Type;

export const CodexOAuthProfileStorageOperation = Schema.Literals([
  "deriveProfileStorageKey",
  "getProfile",
  "putProfile",
  "removeProfile",
  "hasProfile",
  "seedProfiles",
]);

export type CodexOAuthProfileStorageOperation =
  typeof CodexOAuthProfileStorageOperation.Type;

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

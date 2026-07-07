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
  "readResponseBody",
]);

export type CodexHttpClientOperation = typeof CodexHttpClientOperation.Type;

import { Schema } from "effect";

import { CodexHttpNetworkError } from "./errors/codex-http-network-error.js";
import { CodexHttpStatusError } from "./errors/codex-http-status-error.js";
import { CodexOAuthTokenExpired } from "./errors/codex-oauth-token-expired.js";
import { CodexOAuthTokenMissing } from "./errors/codex-oauth-token-missing.js";
import { CodexOAuthTokenProviderError } from "./errors/codex-oauth-token-provider-error.js";
import { CodexOAuthUnsupportedRuntimePath } from "./errors/codex-oauth-unsupported-runtime-path.js";
import { CodexResponsesRequestError } from "./errors/codex-responses-request-error.js";
import { CodexResponsesStreamError } from "./errors/codex-responses-stream-error.js";
import { OAuthProfileNotFound } from "./errors/oauth-profile-not-found.js";
import { OAuthProfileSchemaError } from "./errors/oauth-profile-schema-error.js";
import { OAuthProfileStorageError } from "./errors/oauth-profile-storage-error.js";
import { OpenAICompatibleProxyAuthError } from "./errors/openai-compatible-proxy-auth-error.js";
import { OpenAICompatibleProxyRequestError } from "./errors/openai-compatible-proxy-request-error.js";
import { UpstashKeyValueStoreConfigError } from "./errors/upstash-key-value-store-config-error.js";

export {
  CodexHttpClientOperation,
  CodexOAuthClientOperation,
  CodexOAuthProfileSchemaBoundary,
  CodexOAuthProfileStorageOperation,
  CodexRequestMapperOperation,
  CodexResponsesSchemaBoundary,
  CodexResponsesStreamOperation,
  CodexStreamMapperOperation,
  OpenAICompatibleProxyOperation,
  UpstashKeyValueStoreConfigBoundary,
} from "./errors/contracts.js";
export type {
  CodexHttpClientOperation as CodexHttpClientOperationType,
  CodexOAuthClientOperation as CodexOAuthClientOperationType,
  CodexOAuthProfileSchemaBoundary as CodexOAuthProfileSchemaBoundaryType,
  CodexOAuthProfileStorageOperation as CodexOAuthProfileStorageOperationType,
  CodexRequestMapperOperation as CodexRequestMapperOperationType,
  CodexResponsesSchemaBoundary as CodexResponsesSchemaBoundaryType,
  CodexResponsesStreamOperation as CodexResponsesStreamOperationType,
  CodexStreamMapperOperation as CodexStreamMapperOperationType,
  OpenAICompatibleProxyOperation as OpenAICompatibleProxyOperationType,
  UpstashKeyValueStoreConfigBoundary as UpstashKeyValueStoreConfigBoundaryType,
} from "./errors/contracts.js";
export { CodexHttpNetworkError } from "./errors/codex-http-network-error.js";
export { CodexHttpStatusError } from "./errors/codex-http-status-error.js";
export { CodexOAuthTokenExpired } from "./errors/codex-oauth-token-expired.js";
export { CodexOAuthTokenMissing } from "./errors/codex-oauth-token-missing.js";
export { CodexOAuthTokenProviderError } from "./errors/codex-oauth-token-provider-error.js";
export { CodexOAuthUnsupportedRuntimePath } from "./errors/codex-oauth-unsupported-runtime-path.js";
export { CodexResponsesRequestError } from "./errors/codex-responses-request-error.js";
export { CodexResponsesStreamError } from "./errors/codex-responses-stream-error.js";
export { OAuthProfileNotFound } from "./errors/oauth-profile-not-found.js";
export { OAuthProfileSchemaError } from "./errors/oauth-profile-schema-error.js";
export { OAuthProfileStorageError } from "./errors/oauth-profile-storage-error.js";
export { OpenAICompatibleProxyAuthError } from "./errors/openai-compatible-proxy-auth-error.js";
export { OpenAICompatibleProxyRequestError } from "./errors/openai-compatible-proxy-request-error.js";
export { UpstashKeyValueStoreConfigError } from "./errors/upstash-key-value-store-config-error.js";

export const CodexProfileStoreFailure = Schema.Union([
  OAuthProfileSchemaError,
  OAuthProfileStorageError,
  OAuthProfileNotFound,
]);

export type CodexProfileStoreFailure = typeof CodexProfileStoreFailure.Type;

export const CodexOAuthFailure = Schema.Union([
  OAuthProfileSchemaError,
  OAuthProfileStorageError,
  OAuthProfileNotFound,
  CodexOAuthTokenMissing,
  CodexOAuthTokenExpired,
  CodexOAuthTokenProviderError,
  CodexOAuthUnsupportedRuntimePath,
]);

export type CodexOAuthFailure = typeof CodexOAuthFailure.Type;

export const CodexResponsesFailure = Schema.Union([
  CodexResponsesRequestError,
  CodexHttpNetworkError,
  CodexHttpStatusError,
  CodexResponsesStreamError,
]);

export type CodexResponsesFailure = typeof CodexResponsesFailure.Type;

export const OpenAICompatibleProxyFailure = Schema.Union([
  OpenAICompatibleProxyAuthError,
  OpenAICompatibleProxyRequestError,
  CodexResponsesRequestError,
  CodexHttpNetworkError,
  CodexHttpStatusError,
  CodexResponsesStreamError,
]);

export type OpenAICompatibleProxyFailure =
  typeof OpenAICompatibleProxyFailure.Type;

export const UpstashKeyValueStoreFailure = Schema.Union([
  UpstashKeyValueStoreConfigError,
]);

export type UpstashKeyValueStoreFailure =
  typeof UpstashKeyValueStoreFailure.Type;

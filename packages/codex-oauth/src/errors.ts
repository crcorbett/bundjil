import { Schema } from "effect";

import { CodexOAuthTokenExpired } from "./errors/codex-oauth-token-expired.js";
import { CodexOAuthTokenMissing } from "./errors/codex-oauth-token-missing.js";
import { CodexOAuthTokenProviderError } from "./errors/codex-oauth-token-provider-error.js";
import { CodexOAuthUnsupportedRuntimePath } from "./errors/codex-oauth-unsupported-runtime-path.js";
import { OAuthProfileNotFound } from "./errors/oauth-profile-not-found.js";
import { OAuthProfileSchemaError } from "./errors/oauth-profile-schema-error.js";
import { OAuthProfileStorageError } from "./errors/oauth-profile-storage-error.js";

export {
  CodexOAuthClientOperation,
  CodexOAuthProfileSchemaBoundary,
  CodexOAuthProfileStorageOperation,
} from "./errors/contracts.js";
export type {
  CodexOAuthClientOperation as CodexOAuthClientOperationType,
  CodexOAuthProfileSchemaBoundary as CodexOAuthProfileSchemaBoundaryType,
  CodexOAuthProfileStorageOperation as CodexOAuthProfileStorageOperationType,
} from "./errors/contracts.js";
export { CodexOAuthTokenExpired } from "./errors/codex-oauth-token-expired.js";
export { CodexOAuthTokenMissing } from "./errors/codex-oauth-token-missing.js";
export { CodexOAuthTokenProviderError } from "./errors/codex-oauth-token-provider-error.js";
export { CodexOAuthUnsupportedRuntimePath } from "./errors/codex-oauth-unsupported-runtime-path.js";
export { OAuthProfileNotFound } from "./errors/oauth-profile-not-found.js";
export { OAuthProfileSchemaError } from "./errors/oauth-profile-schema-error.js";
export { OAuthProfileStorageError } from "./errors/oauth-profile-storage-error.js";

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

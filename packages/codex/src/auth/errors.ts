import { Schema } from "effect";

import {
  CodexOAuthProfileCipherError,
  CodexOAuthProfileCommitConflict,
  CodexOAuthProfileCommitError,
  CodexOAuthRefreshLockError,
  CodexProfileNotFound,
  CodexProfileSchemaError,
  CodexProfileStorageError,
} from "../profiles/errors.js";
import { CodexAuthTemporarilyUnavailable } from "./errors/codex-auth-temporarily-unavailable.js";
import { CodexLocalProfileImportError } from "./errors/codex-local-profile-import-error.js";
import { CodexOAuthOperationError } from "./errors/codex-oauth-operation-error.js";
import { CodexOAuthTokenExpired } from "./errors/codex-oauth-token-expired.js";
import { CodexOAuthTokenMissing } from "./errors/codex-oauth-token-missing.js";
import { CodexOAuthUnsupportedRuntimePath } from "./errors/codex-oauth-unsupported-runtime-path.js";
import { CodexReauthenticationRequired } from "./errors/codex-reauthentication-required.js";
import { CodexSubscriptionAuthError } from "./errors/codex-subscription-auth-error.js";

export {
  CodexLocalProfileImportOperation,
  CodexOAuthClientOperation,
} from "./error-contracts.js";
export type {
  CodexLocalProfileImportOperation as CodexLocalProfileImportOperationType,
  CodexOAuthClientOperation as CodexOAuthClientOperationType,
} from "./error-contracts.js";
export {
  CodexAuthTemporarilyUnavailable,
  CodexAuthTemporaryFailureReason,
} from "./errors/codex-auth-temporarily-unavailable.js";
export { CodexLocalProfileImportError } from "./errors/codex-local-profile-import-error.js";
export { CodexOAuthOperationError } from "./errors/codex-oauth-operation-error.js";
export { CodexOAuthTokenExpired } from "./errors/codex-oauth-token-expired.js";
export { CodexOAuthTokenMissing } from "./errors/codex-oauth-token-missing.js";
export { CodexOAuthUnsupportedRuntimePath } from "./errors/codex-oauth-unsupported-runtime-path.js";
export { CodexReauthenticationRequired } from "./errors/codex-reauthentication-required.js";
export {
  CodexSubscriptionAuthError,
  CodexSubscriptionAuthFailureReason,
  CodexSubscriptionAuthOperation,
} from "./errors/codex-subscription-auth-error.js";

export const CodexOAuthFailure = Schema.Union([
  CodexProfileSchemaError,
  CodexProfileStorageError,
  CodexProfileNotFound,
  CodexOAuthTokenMissing,
  CodexOAuthTokenExpired,
  CodexOAuthOperationError,
  CodexOAuthUnsupportedRuntimePath,
  CodexOAuthProfileCommitConflict,
  CodexOAuthProfileCommitError,
  CodexOAuthProfileCipherError,
  CodexOAuthRefreshLockError,
  CodexSubscriptionAuthError,
  CodexAuthTemporarilyUnavailable,
  CodexReauthenticationRequired,
]);

export type CodexOAuthFailure = typeof CodexOAuthFailure.Type;

export const CodexSubscriptionAuthFailure = Schema.Union([
  CodexSubscriptionAuthError,
  CodexOAuthProfileCommitConflict,
  CodexOAuthProfileCommitError,
  CodexOAuthUnsupportedRuntimePath,
  CodexProfileSchemaError,
  CodexProfileStorageError,
  CodexProfileNotFound,
  CodexOAuthProfileCipherError,
]);

export type CodexSubscriptionAuthFailure =
  typeof CodexSubscriptionAuthFailure.Type;

export const CodexLocalProfileImportFailure = Schema.Union([
  CodexLocalProfileImportError,
  CodexProfileSchemaError,
  CodexProfileStorageError,
  CodexProfileNotFound,
  CodexOAuthProfileCipherError,
]);

export type CodexLocalProfileImportFailure =
  typeof CodexLocalProfileImportFailure.Type;

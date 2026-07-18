import { Schema } from "effect";

import { CodexOAuthUnsupportedRuntimePath } from "../auth/errors/codex-oauth-unsupported-runtime-path.js";
import { CodexOAuthProfileCipherError } from "./errors/codex-oauth-profile-cipher-error.js";
import { CodexOAuthProfileCommitConflict } from "./errors/codex-oauth-profile-commit-conflict.js";
import { CodexOAuthProfileCommitError } from "./errors/codex-oauth-profile-commit-error.js";
import { CodexOAuthRefreshLockError } from "./errors/codex-oauth-refresh-lock-error.js";
import { CodexProfileNotFound } from "./errors/codex-profile-not-found.js";
import { CodexProfileSchemaError } from "./errors/codex-profile-schema-error.js";
import { CodexProfileStorageError } from "./errors/codex-profile-storage-error.js";

export {
  CodexOAuthProfileCipherOperation,
  CodexOAuthRefreshLockFailureReason,
  CodexOAuthRefreshLockOperation,
  CodexProfileSchemaBoundary,
  CodexProfileStorageOperation,
} from "./error-contracts.js";
export type {
  CodexOAuthProfileCipherOperation as CodexOAuthProfileCipherOperationType,
  CodexOAuthRefreshLockFailureReason as CodexOAuthRefreshLockFailureReasonType,
  CodexOAuthRefreshLockOperation as CodexOAuthRefreshLockOperationType,
  CodexProfileSchemaBoundary as CodexProfileSchemaBoundaryType,
  CodexProfileStorageOperation as CodexProfileStorageOperationType,
} from "./error-contracts.js";
export { CodexOAuthProfileCipherError } from "./errors/codex-oauth-profile-cipher-error.js";
export { CodexOAuthProfileCommitConflict } from "./errors/codex-oauth-profile-commit-conflict.js";
export { CodexOAuthProfileCommitError } from "./errors/codex-oauth-profile-commit-error.js";
export { CodexOAuthRefreshLockError } from "./errors/codex-oauth-refresh-lock-error.js";
export { CodexProfileNotFound } from "./errors/codex-profile-not-found.js";
export { CodexProfileSchemaError } from "./errors/codex-profile-schema-error.js";
export { CodexProfileStorageError } from "./errors/codex-profile-storage-error.js";

export const CodexProfileStoreFailure = Schema.Union([
  CodexProfileSchemaError,
  CodexProfileStorageError,
  CodexProfileNotFound,
  CodexOAuthProfileCipherError,
]);

export type CodexProfileStoreFailure = typeof CodexProfileStoreFailure.Type;

export const CodexOAuthRefreshLockFailure = Schema.Union([
  CodexOAuthRefreshLockError,
]);

export type CodexOAuthRefreshLockFailure =
  typeof CodexOAuthRefreshLockFailure.Type;

export const CodexOAuthProfileCipherFailure = Schema.Union([
  CodexOAuthProfileCipherError,
]);

export type CodexOAuthProfileCipherFailure =
  typeof CodexOAuthProfileCipherFailure.Type;

export const CodexOAuthProfileCommitFailure = Schema.Union([
  CodexOAuthProfileCommitConflict,
  CodexOAuthProfileCommitError,
  CodexOAuthUnsupportedRuntimePath,
  CodexProfileSchemaError,
  CodexProfileStorageError,
  CodexProfileNotFound,
  CodexOAuthProfileCipherError,
]);

export type CodexOAuthProfileCommitFailure =
  typeof CodexOAuthProfileCommitFailure.Type;

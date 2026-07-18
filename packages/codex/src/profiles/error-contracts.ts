import { Schema } from "effect";

export const CodexProfileSchemaBoundary = Schema.Literals([
  "CodexOAuthProfile",
  "CodexAccessTokenImportProfile",
  "CodexSubscriptionProfile",
  "CodexOAuthSubject",
  "CodexOAuthTokenRefreshResult",
]);

export type CodexProfileSchemaBoundary = typeof CodexProfileSchemaBoundary.Type;

export const CodexProfileStorageOperation = Schema.Literals([
  "deriveProfileStorageKey",
  "getProfile",
  "putProfile",
  "putLegacyProfile",
  "removeProfile",
  "hasProfile",
  "seedProfiles",
]);

export type CodexProfileStorageOperation =
  typeof CodexProfileStorageOperation.Type;

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

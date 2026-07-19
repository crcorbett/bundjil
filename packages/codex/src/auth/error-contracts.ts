import { Schema } from "effect";

export const CodexAuthErrorMessage = Schema.NonEmptyString;
export const CodexAuthEpochMillis = Schema.Number.check(Schema.isFinite());
export const CodexAuthTokenName = Schema.Literals([
  "accessToken",
  "refreshToken",
]);
export const CodexSubscriptionAuthStatus = Schema.Int;
export const CodexSubscriptionAuthProviderCode = Schema.NonEmptyString;

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

export const CodexOAuthClientOperation = Schema.Literals([
  "startLogin",
  "completeLogin",
  "refresh",
  "revoke",
]);

export type CodexOAuthClientOperation = typeof CodexOAuthClientOperation.Type;

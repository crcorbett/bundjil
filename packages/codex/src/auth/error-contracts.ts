import { Schema } from "effect";

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

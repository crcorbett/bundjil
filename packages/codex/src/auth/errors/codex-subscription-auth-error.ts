import { Schema } from "effect";

import {
  CodexAuthErrorMessage,
  CodexSubscriptionAuthProviderCode,
  CodexSubscriptionAuthStatus,
} from "../error-contracts.js";

export const CodexSubscriptionAuthOperation = Schema.Literals([
  "createAuthorizationSession",
  "bindCallback",
  "awaitCallback",
  "launchBrowser",
  "exchangeAuthorizationCode",
  "refreshToken",
  "decodeTokenMetadata",
  "completeLogin",
]);

export type CodexSubscriptionAuthOperation =
  typeof CodexSubscriptionAuthOperation.Type;

export const CodexSubscriptionAuthFailureReason = Schema.Literals([
  "cryptoFailure",
  "portConflict",
  "invalidCallback",
  "authorizationDenied",
  "missingCode",
  "stateMismatch",
  "timeout",
  "browserFailure",
  "transportFailure",
  "tokenResponseInvalid",
  "tokenMetadataInvalid",
  "tokenExpired",
  "providerRejected",
  "crossAccountRefresh",
]);

export type CodexSubscriptionAuthFailureReason =
  typeof CodexSubscriptionAuthFailureReason.Type;

export class CodexSubscriptionAuthError extends Schema.TaggedErrorClass<CodexSubscriptionAuthError>()(
  "CodexSubscriptionAuthError",
  {
    operation: CodexSubscriptionAuthOperation,
    reason: CodexSubscriptionAuthFailureReason,
    message: CodexAuthErrorMessage,
    status: Schema.optional(CodexSubscriptionAuthStatus),
    providerCode: Schema.optional(CodexSubscriptionAuthProviderCode),
  }
) {}

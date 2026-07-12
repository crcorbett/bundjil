import { Schema } from "effect";

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
    message: Schema.NonEmptyString,
    status: Schema.optional(Schema.Int),
    providerCode: Schema.optional(Schema.NonEmptyString),
  }
) {}

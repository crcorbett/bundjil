import { Schema } from "effect";

export const CodexOAuthTemporaryFailureReason = Schema.Literals([
  "lockContended",
  "network",
  "timeout",
  "rateLimited",
  "providerUnavailable",
]);

export type CodexOAuthTemporaryFailureReason =
  typeof CodexOAuthTemporaryFailureReason.Type;

export class CodexOAuthAuthTemporarilyUnavailable extends Schema.TaggedErrorClass<CodexOAuthAuthTemporarilyUnavailable>()(
  "CodexOAuthAuthTemporarilyUnavailable",
  {
    reason: CodexOAuthTemporaryFailureReason,
    message: Schema.NonEmptyString,
  }
) {}

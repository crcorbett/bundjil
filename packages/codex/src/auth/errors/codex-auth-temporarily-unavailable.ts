import { Schema } from "effect";

import { CodexAuthErrorMessage } from "../error-contracts.js";

export const CodexAuthTemporaryFailureReason = Schema.Literals([
  "lockContended",
  "network",
  "timeout",
  "rateLimited",
  "providerUnavailable",
]);

export type CodexAuthTemporaryFailureReason =
  typeof CodexAuthTemporaryFailureReason.Type;

export class CodexAuthTemporarilyUnavailable extends Schema.TaggedErrorClass<CodexAuthTemporarilyUnavailable>()(
  "CodexAuthTemporarilyUnavailable",
  {
    reason: CodexAuthTemporaryFailureReason,
    message: CodexAuthErrorMessage,
  }
) {}

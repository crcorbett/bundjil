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

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexAuthTemporarilyUnavailable extends Schema.TaggedError<CodexAuthTemporarilyUnavailable>()(
  "CodexAuthTemporarilyUnavailable",
  {
    reason: CodexAuthTemporaryFailureReason,
    message: CodexAuthErrorMessage,
  }
) {}

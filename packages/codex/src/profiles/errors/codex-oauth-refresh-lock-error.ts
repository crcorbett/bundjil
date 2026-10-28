import { Schema } from "effect";

import { CodexOAuthSubjectHash } from "../../auth/credentials.js";
import {
  CodexOAuthRefreshLockFailureReason,
  CodexOAuthRefreshLockOperation,
  CodexProfileEpochMillis,
  CodexProfileErrorMessage,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexOAuthRefreshLockError extends Schema.TaggedError<CodexOAuthRefreshLockError>()(
  "CodexOAuthRefreshLockError",
  {
    operation: CodexOAuthRefreshLockOperation,
    reason: CodexOAuthRefreshLockFailureReason,
    subjectHash: Schema.optional(CodexOAuthSubjectHash),
    expiresAtEpochMillis: Schema.optional(CodexProfileEpochMillis),
    nowEpochMillis: Schema.optional(CodexProfileEpochMillis),
    message: CodexProfileErrorMessage,
  }
) {}

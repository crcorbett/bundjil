import { Schema } from "effect";

import { CodexOAuthSubjectHash } from "../../auth/credentials.js";
import {
  CodexOAuthRefreshLockFailureReason,
  CodexOAuthRefreshLockOperation,
  CodexProfileEpochMillis,
  CodexProfileErrorMessage,
} from "../error-contracts.js";

export class CodexOAuthRefreshLockError extends Schema.TaggedErrorClass<CodexOAuthRefreshLockError>()(
  "CodexOAuthRefreshLockError",
  {
    operation: CodexOAuthRefreshLockOperation,
    reason: CodexOAuthRefreshLockFailureReason,
    subjectHash: Schema.optional(CodexOAuthSubjectHash),
    expiresAtEpochMillis: Schema.optional(CodexProfileEpochMillis),
    nowEpochMillis: Schema.optional(CodexProfileEpochMillis),
    message: CodexProfileErrorMessage,
    cause: Schema.optional(Schema.Defect),
  }
) {}

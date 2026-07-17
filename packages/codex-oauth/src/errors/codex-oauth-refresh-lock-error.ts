import { Schema } from "effect";

import { CodexOAuthSubjectHash } from "../schemas.js";
import {
  CodexOAuthRefreshLockFailureReason,
  CodexOAuthRefreshLockOperation,
} from "./contracts.js";

export class CodexOAuthRefreshLockError extends Schema.TaggedErrorClass<CodexOAuthRefreshLockError>()(
  "CodexOAuthRefreshLockError",
  {
    operation: CodexOAuthRefreshLockOperation,
    reason: CodexOAuthRefreshLockFailureReason,
    subjectHash: Schema.optional(CodexOAuthSubjectHash),
    expiresAtEpochMillis: Schema.optional(
      Schema.Number.check(Schema.isFinite())
    ),
    nowEpochMillis: Schema.optional(Schema.Number.check(Schema.isFinite())),
    message: Schema.NonEmptyString,
    cause: Schema.optional(Schema.Defect),
  }
) {}

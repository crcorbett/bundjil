import { Schema } from "effect";

import { CodexOAuthProfileCommitOperation } from "../schemas.js";

export class CodexOAuthProfileCommitError extends Schema.TaggedErrorClass<CodexOAuthProfileCommitError>()(
  "CodexOAuthProfileCommitError",
  {
    operation: CodexOAuthProfileCommitOperation,
    profileId: Schema.NonEmptyString,
    subjectHash: Schema.NonEmptyString,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

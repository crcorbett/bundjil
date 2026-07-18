import { Schema } from "effect";

import { CodexOAuthProfileCommitOperation } from "../contracts.js";

export class CodexOAuthProfileCommitConflict extends Schema.TaggedErrorClass<CodexOAuthProfileCommitConflict>()(
  "CodexOAuthProfileCommitConflict",
  {
    operation: CodexOAuthProfileCommitOperation,
    profileId: Schema.NonEmptyString,
    subjectHash: Schema.NonEmptyString,
    message: Schema.NonEmptyString,
  }
) {}

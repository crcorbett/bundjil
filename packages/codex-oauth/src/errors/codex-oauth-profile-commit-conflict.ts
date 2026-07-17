import { Schema } from "effect";

import {
  CodexOAuthProfileCommitOperation,
  CodexOAuthProfileId,
  CodexOAuthSubjectHash,
} from "../schemas.js";

export class CodexOAuthProfileCommitConflict extends Schema.TaggedErrorClass<CodexOAuthProfileCommitConflict>()(
  "CodexOAuthProfileCommitConflict",
  {
    operation: CodexOAuthProfileCommitOperation,
    profileId: CodexOAuthProfileId,
    subjectHash: CodexOAuthSubjectHash,
    message: Schema.NonEmptyString,
  }
) {}

import { Schema } from "effect";

import {
  CodexOAuthProfileCommitOperation,
  CodexOAuthProfileId,
  CodexOAuthSubjectHash,
} from "../schemas.js";

export class CodexOAuthProfileCommitError extends Schema.TaggedErrorClass<CodexOAuthProfileCommitError>()(
  "CodexOAuthProfileCommitError",
  {
    operation: CodexOAuthProfileCommitOperation,
    profileId: CodexOAuthProfileId,
    subjectHash: CodexOAuthSubjectHash,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

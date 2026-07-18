import { Schema } from "effect";

import {
  CodexOAuthProfileId,
  CodexOAuthSubjectHash,
} from "../../auth/credentials.js";
import { CodexOAuthProfileCommitOperation } from "../contracts.js";

export class CodexOAuthProfileCommitConflict extends Schema.TaggedErrorClass<CodexOAuthProfileCommitConflict>()(
  "CodexOAuthProfileCommitConflict",
  {
    operation: CodexOAuthProfileCommitOperation,
    profileId: CodexOAuthProfileId,
    subjectHash: CodexOAuthSubjectHash,
    message: Schema.NonEmptyString,
  }
) {}

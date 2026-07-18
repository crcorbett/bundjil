import { Schema } from "effect";

import {
  CodexOAuthProfileId,
  CodexOAuthSubjectHash,
} from "../../auth/credentials.js";
import { CodexOAuthProfileCommitOperation } from "../contracts.js";

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

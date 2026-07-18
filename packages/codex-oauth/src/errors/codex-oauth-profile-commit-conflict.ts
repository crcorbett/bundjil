import { Schema } from "effect";

import {
  CodexOAuthProfileCommitOperation,
  CodexOAuthProfileId,
  CodexOAuthSubjectHash,
} from "../schemas.js";
import { CodexErrorMessage } from "./contracts.js";

export class CodexOAuthProfileCommitConflict extends Schema.TaggedErrorClass<CodexOAuthProfileCommitConflict>()(
  "CodexOAuthProfileCommitConflict",
  {
    operation: CodexOAuthProfileCommitOperation,
    profileId: CodexOAuthProfileId,
    subjectHash: CodexOAuthSubjectHash,
    message: CodexErrorMessage,
  }
) {}

import { Schema } from "effect";

import {
  CodexOAuthProfileCommitOperation,
  CodexOAuthProfileId,
  CodexOAuthSubjectHash,
} from "../schemas.js";
import { CodexErrorMessage } from "./contracts.js";

export class CodexOAuthProfileCommitError extends Schema.TaggedErrorClass<CodexOAuthProfileCommitError>()(
  "CodexOAuthProfileCommitError",
  {
    operation: CodexOAuthProfileCommitOperation,
    profileId: CodexOAuthProfileId,
    subjectHash: CodexOAuthSubjectHash,
    message: CodexErrorMessage,
    cause: Schema.Defect,
  }
) {}

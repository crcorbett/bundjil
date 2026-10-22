import { Schema } from "effect";

import {
  CodexOAuthProfileId,
  CodexOAuthSubjectHash,
} from "../../auth/credentials.js";
import { CodexProfileErrorMessage } from "../error-contracts.js";

export class CodexProfileNotFound extends Schema.TaggedError<CodexProfileNotFound>()(
  "CodexProfileNotFound",
  {
    profileId: CodexOAuthProfileId,
    subjectHash: CodexOAuthSubjectHash,
    message: CodexProfileErrorMessage,
  }
) {}

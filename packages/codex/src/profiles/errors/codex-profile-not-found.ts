import { Schema } from "effect";

import {
  CodexOAuthProfileId,
  CodexOAuthSubjectHash,
} from "../../auth/credentials.js";
import { CodexProfileErrorMessage } from "../error-contracts.js";

export class CodexProfileNotFound extends Schema.TaggedErrorClass<CodexProfileNotFound>()(
  "CodexProfileNotFound",
  {
    profileId: CodexOAuthProfileId,
    subjectHash: CodexOAuthSubjectHash,
    message: CodexProfileErrorMessage,
  }
) {}

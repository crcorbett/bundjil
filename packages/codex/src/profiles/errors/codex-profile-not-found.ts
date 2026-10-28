import { Schema } from "effect";

import {
  CodexOAuthProfileId,
  CodexOAuthSubjectHash,
} from "../../auth/credentials.js";
import { CodexProfileErrorMessage } from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexProfileNotFound extends Schema.TaggedError<CodexProfileNotFound>()(
  "CodexProfileNotFound",
  {
    profileId: CodexOAuthProfileId,
    subjectHash: CodexOAuthSubjectHash,
    message: CodexProfileErrorMessage,
  }
) {}

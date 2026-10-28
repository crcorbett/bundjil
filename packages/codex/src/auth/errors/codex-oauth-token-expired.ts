import { Schema } from "effect";

import { CodexOAuthProfileId } from "../credentials.js";
import {
  CodexAuthEpochMillis,
  CodexAuthErrorMessage,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexOAuthTokenExpired extends Schema.TaggedError<CodexOAuthTokenExpired>()(
  "CodexOAuthTokenExpired",
  {
    profileId: CodexOAuthProfileId,
    expiresAtEpochMillis: CodexAuthEpochMillis,
    nowEpochMillis: CodexAuthEpochMillis,
    message: CodexAuthErrorMessage,
  }
) {}

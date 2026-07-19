import { Schema } from "effect";

import { CodexOAuthProfileId } from "../credentials.js";
import {
  CodexAuthEpochMillis,
  CodexAuthErrorMessage,
} from "../error-contracts.js";

export class CodexOAuthTokenExpired extends Schema.TaggedErrorClass<CodexOAuthTokenExpired>()(
  "CodexOAuthTokenExpired",
  {
    profileId: CodexOAuthProfileId,
    expiresAtEpochMillis: CodexAuthEpochMillis,
    nowEpochMillis: CodexAuthEpochMillis,
    message: CodexAuthErrorMessage,
  }
) {}

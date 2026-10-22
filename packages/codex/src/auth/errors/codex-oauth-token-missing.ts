import { Schema } from "effect";

import { CodexOAuthProfileId } from "../credentials.js";
import {
  CodexAuthErrorMessage,
  CodexAuthTokenName,
} from "../error-contracts.js";

export class CodexOAuthTokenMissing extends Schema.TaggedError<CodexOAuthTokenMissing>()(
  "CodexOAuthTokenMissing",
  {
    profileId: CodexOAuthProfileId,
    tokenName: CodexAuthTokenName,
    message: CodexAuthErrorMessage,
  }
) {}

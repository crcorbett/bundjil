import { Schema } from "effect";

import { CodexOAuthProfileId } from "../credentials.js";
import {
  CodexAuthErrorMessage,
  CodexAuthTokenName,
} from "../error-contracts.js";

export class CodexOAuthTokenMissing extends Schema.TaggedErrorClass<CodexOAuthTokenMissing>()(
  "CodexOAuthTokenMissing",
  {
    profileId: CodexOAuthProfileId,
    tokenName: CodexAuthTokenName,
    message: CodexAuthErrorMessage,
  }
) {}

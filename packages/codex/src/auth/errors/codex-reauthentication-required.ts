import { Schema } from "effect";

import { CodexOAuthProfileId } from "../credentials.js";
import { CodexAuthErrorMessage } from "../error-contracts.js";

export class CodexReauthenticationRequired extends Schema.TaggedErrorClass<CodexReauthenticationRequired>()(
  "CodexReauthenticationRequired",
  {
    profileId: CodexOAuthProfileId,
    message: CodexAuthErrorMessage,
  }
) {}

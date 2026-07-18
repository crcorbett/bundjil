import { Schema } from "effect";

import { CodexOAuthProfileId } from "../schemas.js";
import { CodexErrorMessage } from "./contracts.js";

export class CodexOAuthReauthenticationRequired extends Schema.TaggedErrorClass<CodexOAuthReauthenticationRequired>()(
  "CodexOAuthReauthenticationRequired",
  {
    profileId: CodexOAuthProfileId,
    message: CodexErrorMessage,
  }
) {}

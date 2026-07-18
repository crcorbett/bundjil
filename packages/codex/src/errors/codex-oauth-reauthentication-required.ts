import { Schema } from "effect";

import { CodexOAuthProfileId } from "../schemas.js";

export class CodexOAuthReauthenticationRequired extends Schema.TaggedErrorClass<CodexOAuthReauthenticationRequired>()(
  "CodexOAuthReauthenticationRequired",
  {
    profileId: CodexOAuthProfileId,
    message: Schema.NonEmptyString,
  }
) {}

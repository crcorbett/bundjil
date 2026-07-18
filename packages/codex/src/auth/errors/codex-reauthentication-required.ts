import { Schema } from "effect";

import { CodexOAuthProfileId } from "../credentials.js";

export class CodexReauthenticationRequired extends Schema.TaggedErrorClass<CodexReauthenticationRequired>()(
  "CodexReauthenticationRequired",
  {
    profileId: CodexOAuthProfileId,
    message: Schema.NonEmptyString,
  }
) {}

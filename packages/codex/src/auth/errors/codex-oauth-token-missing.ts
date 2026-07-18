import { Schema } from "effect";

import { CodexOAuthProfileId } from "../credentials.js";

export class CodexOAuthTokenMissing extends Schema.TaggedErrorClass<CodexOAuthTokenMissing>()(
  "CodexOAuthTokenMissing",
  {
    profileId: CodexOAuthProfileId,
    tokenName: Schema.Literals(["accessToken", "refreshToken"]),
    message: Schema.NonEmptyString,
  }
) {}

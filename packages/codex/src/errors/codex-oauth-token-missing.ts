import { Schema } from "effect";

export class CodexOAuthTokenMissing extends Schema.TaggedErrorClass<CodexOAuthTokenMissing>()(
  "CodexOAuthTokenMissing",
  {
    profileId: Schema.NonEmptyString,
    tokenName: Schema.Literals(["accessToken", "refreshToken"]),
    message: Schema.NonEmptyString,
  }
) {}

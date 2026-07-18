import { Schema } from "effect";

export class CodexOAuthTokenExpired extends Schema.TaggedErrorClass<CodexOAuthTokenExpired>()(
  "CodexOAuthTokenExpired",
  {
    profileId: Schema.NonEmptyString,
    expiresAtEpochMillis: Schema.Number,
    nowEpochMillis: Schema.Number,
    message: Schema.NonEmptyString,
  }
) {}

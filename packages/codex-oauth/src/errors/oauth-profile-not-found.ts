import { Schema } from "effect";

export class OAuthProfileNotFound extends Schema.TaggedErrorClass<OAuthProfileNotFound>()(
  "OAuthProfileNotFound",
  {
    profileId: Schema.NonEmptyString,
    subjectHash: Schema.NonEmptyString,
    message: Schema.NonEmptyString,
  }
) {}

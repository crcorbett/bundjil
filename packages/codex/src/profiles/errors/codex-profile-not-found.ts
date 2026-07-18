import { Schema } from "effect";

export class CodexProfileNotFound extends Schema.TaggedErrorClass<CodexProfileNotFound>()(
  "CodexProfileNotFound",
  {
    profileId: Schema.NonEmptyString,
    subjectHash: Schema.NonEmptyString,
    message: Schema.NonEmptyString,
  }
) {}

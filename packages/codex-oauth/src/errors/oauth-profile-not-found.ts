import { Schema } from "effect";

import { CodexOAuthProfileId, CodexOAuthSubjectHash } from "../schemas.js";

export class OAuthProfileNotFound extends Schema.TaggedErrorClass<OAuthProfileNotFound>()(
  "OAuthProfileNotFound",
  {
    profileId: CodexOAuthProfileId,
    subjectHash: CodexOAuthSubjectHash,
    message: Schema.NonEmptyString,
  }
) {}

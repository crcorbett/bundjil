import { Schema } from "effect";

import { CodexOAuthProfileId, CodexOAuthSubjectHash } from "../schemas.js";
import { CodexErrorMessage } from "./contracts.js";

export class OAuthProfileNotFound extends Schema.TaggedErrorClass<OAuthProfileNotFound>()(
  "OAuthProfileNotFound",
  {
    profileId: CodexOAuthProfileId,
    subjectHash: CodexOAuthSubjectHash,
    message: CodexErrorMessage,
  }
) {}

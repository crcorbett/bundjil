import { Schema } from "effect";

import { CodexOAuthProfileId } from "../schemas.js";
import { CodexErrorMessage } from "./contracts.js";

export class CodexOAuthTokenExpired extends Schema.TaggedErrorClass<CodexOAuthTokenExpired>()(
  "CodexOAuthTokenExpired",
  {
    profileId: CodexOAuthProfileId,
    expiresAtEpochMillis: Schema.Number,
    nowEpochMillis: Schema.Number,
    message: CodexErrorMessage,
  }
) {}

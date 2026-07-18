import { Schema } from "effect";

import { CodexOAuthProfileId } from "../schemas.js";
import { CodexErrorMessage } from "./contracts.js";

export class CodexOAuthTokenMissing extends Schema.TaggedErrorClass<CodexOAuthTokenMissing>()(
  "CodexOAuthTokenMissing",
  {
    profileId: CodexOAuthProfileId,
    tokenName: Schema.Literals(["accessToken", "refreshToken"]),
    message: CodexErrorMessage,
  }
) {}

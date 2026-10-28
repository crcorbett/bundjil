import { Schema } from "effect";

import { CodexOAuthProfileId } from "../credentials.js";
import {
  CodexAuthErrorMessage,
  CodexAuthTokenName,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexOAuthTokenMissing extends Schema.TaggedError<CodexOAuthTokenMissing>()(
  "CodexOAuthTokenMissing",
  {
    profileId: CodexOAuthProfileId,
    tokenName: CodexAuthTokenName,
    message: CodexAuthErrorMessage,
  }
) {}

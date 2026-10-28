import { Schema } from "effect";

import { CodexOAuthProfileId } from "../credentials.js";
import { CodexAuthErrorMessage } from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexReauthenticationRequired extends Schema.TaggedError<CodexReauthenticationRequired>()(
  "CodexReauthenticationRequired",
  {
    profileId: CodexOAuthProfileId,
    message: CodexAuthErrorMessage,
  }
) {}

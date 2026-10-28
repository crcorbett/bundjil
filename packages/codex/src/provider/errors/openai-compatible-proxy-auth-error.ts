import { Schema } from "effect";

import {
  CodexProviderErrorMessage,
  OpenAICompatibleProxyOperation,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class OpenAICompatibleProxyAuthError extends Schema.TaggedError<OpenAICompatibleProxyAuthError>()(
  "OpenAICompatibleProxyAuthError",
  {
    operation: OpenAICompatibleProxyOperation,
    message: CodexProviderErrorMessage,
  }
) {}

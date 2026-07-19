import { Schema } from "effect";

import {
  CodexProviderErrorMessage,
  OpenAICompatibleProxyOperation,
} from "../error-contracts.js";

export class OpenAICompatibleProxyAuthError extends Schema.TaggedErrorClass<OpenAICompatibleProxyAuthError>()(
  "OpenAICompatibleProxyAuthError",
  {
    operation: OpenAICompatibleProxyOperation,
    message: CodexProviderErrorMessage,
  }
) {}

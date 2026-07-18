import { Schema } from "effect";

import {
  CodexErrorMessage,
  OpenAICompatibleProxyOperation,
} from "./contracts.js";

export class OpenAICompatibleProxyAuthError extends Schema.TaggedErrorClass<OpenAICompatibleProxyAuthError>()(
  "OpenAICompatibleProxyAuthError",
  {
    operation: OpenAICompatibleProxyOperation,
    message: CodexErrorMessage,
  }
) {}

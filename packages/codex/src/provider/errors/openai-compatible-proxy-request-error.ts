import { Schema } from "effect";

import {
  CodexProviderErrorMessage,
  OpenAICompatibleProxyOperation,
} from "../error-contracts.js";

export class OpenAICompatibleProxyRequestError extends Schema.TaggedError<OpenAICompatibleProxyRequestError>()(
  "OpenAICompatibleProxyRequestError",
  {
    operation: OpenAICompatibleProxyOperation,
    message: CodexProviderErrorMessage,
  }
) {}

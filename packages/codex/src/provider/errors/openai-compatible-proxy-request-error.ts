import { Schema } from "effect";

import {
  CodexProviderErrorMessage,
  OpenAICompatibleProxyOperation,
} from "../error-contracts.js";

export class OpenAICompatibleProxyRequestError extends Schema.TaggedErrorClass<OpenAICompatibleProxyRequestError>()(
  "OpenAICompatibleProxyRequestError",
  {
    operation: OpenAICompatibleProxyOperation,
    message: CodexProviderErrorMessage,
    cause: Schema.Defect,
  }
) {}

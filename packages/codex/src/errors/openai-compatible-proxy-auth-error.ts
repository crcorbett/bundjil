import { Schema } from "effect";

import { OpenAICompatibleProxyOperation } from "./contracts.js";

export class OpenAICompatibleProxyAuthError extends Schema.TaggedErrorClass<OpenAICompatibleProxyAuthError>()(
  "OpenAICompatibleProxyAuthError",
  {
    operation: OpenAICompatibleProxyOperation,
    message: Schema.NonEmptyString,
  }
) {}

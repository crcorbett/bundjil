import { Schema } from "effect";

import { OpenAICompatibleProxyOperation } from "../error-contracts.js";

export class OpenAICompatibleProxyRequestError extends Schema.TaggedErrorClass<OpenAICompatibleProxyRequestError>()(
  "OpenAICompatibleProxyRequestError",
  {
    operation: OpenAICompatibleProxyOperation,
    message: Schema.NonEmptyString,
    cause: Schema.Defect,
  }
) {}

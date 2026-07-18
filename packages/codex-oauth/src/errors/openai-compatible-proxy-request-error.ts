import { Schema } from "effect";

import {
  CodexErrorMessage,
  OpenAICompatibleProxyOperation,
} from "./contracts.js";

export class OpenAICompatibleProxyRequestError extends Schema.TaggedErrorClass<OpenAICompatibleProxyRequestError>()(
  "OpenAICompatibleProxyRequestError",
  {
    operation: OpenAICompatibleProxyOperation,
    message: CodexErrorMessage,
    cause: Schema.Defect,
  }
) {}

import { Schema } from "effect";

import {
  CodexProviderErrorMessage,
  OpenAICompatibleProxyOperation,
} from "../error-contracts.js";

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class OpenAICompatibleProxyRequestError extends Schema.TaggedError<OpenAICompatibleProxyRequestError>()(
  "OpenAICompatibleProxyRequestError",
  {
    operation: OpenAICompatibleProxyOperation,
    message: CodexProviderErrorMessage,
  }
) {}

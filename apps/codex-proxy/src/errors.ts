import { Schema } from "effect";

import { CodexProxyErrorCode } from "./schemas.js";

export const CodexProxySchemaBoundary = Schema.Literals([
  "CodexProxyRuntimeConfig",
  "CodexProxyMockStream",
  "OpenAICompatibleChatCompletionRequest",
  "OpenAICompatibleProxyInput",
]);

export type CodexProxySchemaBoundary = typeof CodexProxySchemaBoundary.Type;

export class CodexProxyRouteError extends Schema.TaggedErrorClass<CodexProxyRouteError>()(
  "CodexProxyRouteError",
  {
    boundary: Schema.optional(CodexProxySchemaBoundary),
    code: CodexProxyErrorCode,
    message: Schema.NonEmptyString,
    responseMessage: Schema.NonEmptyString,
    status: Schema.Number.check(Schema.isFinite()),
    cause: Schema.optional(Schema.Defect),
  }
) {}

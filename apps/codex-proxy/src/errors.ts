import { Schema } from "effect";

import { CodexProxyDiagnosticMessage, CodexProxyErrorCode } from "./schemas.js";

export const CodexProxySchemaBoundary = Schema.Literals([
  "CodexProxyRuntimeConfig",
  "CodexProxyMockStream",
  "CodexProxyRequestContentLength",
  "OpenAICompatibleChatCompletionRequest",
  "OpenAICompatibleProxyAuthorizationHeader",
  "OpenAICompatibleProxyInput",
]);

export type CodexProxySchemaBoundary = typeof CodexProxySchemaBoundary.Type;

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a curried class factory.
export class CodexProxyRouteError extends Schema.TaggedError<CodexProxyRouteError>()(
  "CodexProxyRouteError",
  {
    boundary: Schema.optional(CodexProxySchemaBoundary),
    code: CodexProxyErrorCode,
    message: CodexProxyDiagnosticMessage,
    responseMessage: CodexProxyDiagnosticMessage,
    status: Schema.Number.check(Schema.isFinite()),
  }
) {}

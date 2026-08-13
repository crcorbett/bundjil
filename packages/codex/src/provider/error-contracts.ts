import { Schema } from "effect";

export const CodexProviderErrorMessage = Schema.NonEmptyString;
export const CodexHttpStatus = Schema.Int.check(
  Schema.isBetween({ minimum: 100, maximum: 599 })
);
export const CodexHttpContentTypeHeader = Schema.String.check(
  Schema.isMaxLength(1024)
).pipe(Schema.brand("CodexHttpContentTypeHeader"));
export type CodexHttpContentTypeHeader = typeof CodexHttpContentTypeHeader.Type;

export const CodexResponsesSchemaBoundary = Schema.Literals([
  "CodexResponsesRequest",
  "CodexResponsesProofInput",
  "CodexResponsesProofResult",
]);

export type CodexResponsesSchemaBoundary =
  typeof CodexResponsesSchemaBoundary.Type;

export const CodexHttpClientOperation = Schema.Literals([
  "fetch",
  "postResponses",
  "postResponsesStream",
  "readResponseBody",
]);

export type CodexHttpClientOperation = typeof CodexHttpClientOperation.Type;

export const CodexRequestMapperOperation = Schema.Literals([
  "toCodexResponses",
]);

export type CodexRequestMapperOperation =
  typeof CodexRequestMapperOperation.Type;

export const CodexStreamMapperOperation = Schema.Literals([
  "toOpenAICompatibleStream",
]);

export type CodexStreamMapperOperation = typeof CodexStreamMapperOperation.Type;

export const CodexResponsesStreamOperation = Schema.Union([
  CodexHttpClientOperation,
  CodexStreamMapperOperation,
]);

export type CodexResponsesStreamOperation =
  typeof CodexResponsesStreamOperation.Type;

export const OpenAICompatibleProxyOperation = Schema.Literals([
  "handleChatCompletions",
]);

export type OpenAICompatibleProxyOperation =
  typeof OpenAICompatibleProxyOperation.Type;

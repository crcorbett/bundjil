import { Schema } from "effect";

export const CodexProviderErrorMessage = Schema.NonEmptyString;
export const CodexHttpStatus = Schema.Number.check(Schema.isFinite());
export const CodexHttpStatusText = Schema.String;
export const CodexHttpContentType = Schema.String;

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

import { Schema } from "effect";

import { CodexHttpNetworkError } from "./errors/codex-http-network-error.js";
import { CodexHttpStatusError } from "./errors/codex-http-status-error.js";
import { CodexResponsesRequestError } from "./errors/codex-responses-request-error.js";
import { CodexResponsesStreamError } from "./errors/codex-responses-stream-error.js";
import { OpenAICompatibleProxyAuthError } from "./errors/openai-compatible-proxy-auth-error.js";
import { OpenAICompatibleProxyRequestError } from "./errors/openai-compatible-proxy-request-error.js";

export {
  CodexHttpClientOperation,
  CodexRequestMapperOperation,
  CodexResponsesSchemaBoundary,
  CodexStreamMapperOperation,
  OpenAICompatibleProxyOperation,
} from "./error-contracts.js";
export { CodexHttpNetworkError } from "./errors/codex-http-network-error.js";
export { CodexHttpStatusError } from "./errors/codex-http-status-error.js";
export { CodexResponsesRequestError } from "./errors/codex-responses-request-error.js";
export { CodexResponsesStreamError } from "./errors/codex-responses-stream-error.js";
export { OpenAICompatibleProxyAuthError } from "./errors/openai-compatible-proxy-auth-error.js";
export { OpenAICompatibleProxyRequestError } from "./errors/openai-compatible-proxy-request-error.js";

export const CodexResponsesFailure = Schema.Union([
  CodexResponsesRequestError,
  CodexHttpNetworkError,
  CodexHttpStatusError,
  CodexResponsesStreamError,
]);

export type CodexResponsesFailure = typeof CodexResponsesFailure.Type;

export const OpenAICompatibleProxyFailure = Schema.Union([
  OpenAICompatibleProxyAuthError,
  OpenAICompatibleProxyRequestError,
  CodexResponsesRequestError,
  CodexHttpNetworkError,
  CodexHttpStatusError,
  CodexResponsesStreamError,
]);

export type OpenAICompatibleProxyFailure =
  typeof OpenAICompatibleProxyFailure.Type;

import {
  CodexOAuthSubject,
  OpenAICompatibleProxyInternalToken,
} from "@bundjil/codex-oauth";
import { Schema } from "effect";

export const CodexProxyMode = Schema.Literals(["mock", "local", "live"]);

export type CodexProxyMode = typeof CodexProxyMode.Type;

export const CodexProxyRuntimeConfig = Schema.Struct({
  mode: CodexProxyMode,
  internalToken: OpenAICompatibleProxyInternalToken,
  subject: CodexOAuthSubject,
  accountId: Schema.optional(Schema.NonEmptyString),
  localProfileStoreDirectory: Schema.optional(Schema.NonEmptyString),
});

export type CodexProxyRuntimeConfig = typeof CodexProxyRuntimeConfig.Type;

export const CodexProxyHealthResponse = Schema.Struct({
  ok: Schema.Boolean,
  service: Schema.Literal("bundjil-codex-proxy"),
  mode: CodexProxyMode,
});

export type CodexProxyHealthResponse = typeof CodexProxyHealthResponse.Type;

export const CodexProxyErrorCode = Schema.Literals([
  "bad_request",
  "codex_auth_temporarily_unavailable",
  "codex_reauthentication_required",
  "not_found",
  "proxy_error",
  "unauthorized",
]);

export type CodexProxyErrorCode = typeof CodexProxyErrorCode.Type;

export const CodexProxyErrorResponse = Schema.Struct({
  error: Schema.Struct({
    code: CodexProxyErrorCode,
    message: Schema.NonEmptyString,
  }),
});

export type CodexProxyErrorResponse = typeof CodexProxyErrorResponse.Type;

export const CodexProxyDevServerConfig = Schema.Struct({
  port: Schema.Number.check(Schema.isFinite()),
});

export type CodexProxyDevServerConfig = typeof CodexProxyDevServerConfig.Type;

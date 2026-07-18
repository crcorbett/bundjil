import {
  CodexOAuthAccountId,
  CodexOAuthSubject,
  CodexFileSystemDirectory,
  OpenAICompatibleProxyInternalToken,
} from "@bundjil/codex-oauth";
import { Schema } from "effect";

export const CodexProxyMode = Schema.Literals(["mock", "local", "live"]);

export type CodexProxyMode = typeof CodexProxyMode.Type;

export const CodexProxyLocalProfileStoreDirectory = CodexFileSystemDirectory;
export type CodexProxyLocalProfileStoreDirectory =
  typeof CodexProxyLocalProfileStoreDirectory.Type;

export const CodexProxyVercelRuntimeMarker = Schema.NonEmptyString.pipe(
  Schema.brand("CodexProxyVercelRuntimeMarker")
);
export type CodexProxyVercelRuntimeMarker =
  typeof CodexProxyVercelRuntimeMarker.Type;

export const CodexProxyVercelProtectionBypass = Schema.RedactedFromValue(
  Schema.NonEmptyString
);
export type CodexProxyVercelProtectionBypass =
  typeof CodexProxyVercelProtectionBypass.Type;

export const CodexProxyHealthService = Schema.Literal("bundjil-codex-proxy");
export type CodexProxyHealthService = typeof CodexProxyHealthService.Type;

export const CodexProxyDiagnosticMessage = Schema.NonEmptyString;
export type CodexProxyDiagnosticMessage =
  typeof CodexProxyDiagnosticMessage.Type;

export const CodexProxyRuntimeConfig = Schema.Struct({
  mode: CodexProxyMode,
  internalToken: OpenAICompatibleProxyInternalToken,
  subject: CodexOAuthSubject,
  accountId: Schema.optional(CodexOAuthAccountId),
  localProfileStoreDirectory: Schema.optional(
    CodexProxyLocalProfileStoreDirectory
  ),
});

export type CodexProxyRuntimeConfig = typeof CodexProxyRuntimeConfig.Type;

export const CodexProxyHealthResponse = Schema.Struct({
  ok: Schema.Boolean,
  service: CodexProxyHealthService,
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
    message: CodexProxyDiagnosticMessage,
  }),
});

export type CodexProxyErrorResponse = typeof CodexProxyErrorResponse.Type;

export const CodexProxyDevServerConfig = Schema.Struct({
  port: Schema.Number.check(Schema.isFinite()),
});

export type CodexProxyDevServerConfig = typeof CodexProxyDevServerConfig.Type;

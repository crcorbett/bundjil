import { Context, Effect } from "effect";

import { CodexOAuthUnsupportedRuntimePath } from "./errors.js";
import type {
  CodexOAuthClientOperation,
  CodexOAuthFailure,
  CodexSubscriptionAuthError,
} from "./errors.js";
import type {
  CodexOAuthLoginCallback,
  CodexOAuthLoginStart,
  CodexOAuthLoginStartResult,
  CodexOAuthProfile,
  CodexOAuthRefreshInput,
  CodexOAuthRevokeInput,
  CodexOAuthTokenRefreshResult,
} from "./schemas.js";

export interface CodexOAuthClientShape {
  readonly startLogin: (
    input: CodexOAuthLoginStart
  ) => Effect.Effect<CodexOAuthLoginStartResult, CodexOAuthFailure>;
  readonly completeLogin: (
    input: CodexOAuthLoginCallback
  ) => Effect.Effect<CodexOAuthProfile, CodexOAuthFailure>;
  readonly refresh: (
    input: CodexOAuthRefreshInput
  ) => Effect.Effect<
    CodexOAuthTokenRefreshResult,
    CodexOAuthFailure | CodexSubscriptionAuthError
  >;
  readonly revoke: (
    input: CodexOAuthRevokeInput
  ) => Effect.Effect<void, CodexOAuthFailure>;
}

export class CodexOAuthClient extends Context.Service<
  CodexOAuthClient,
  CodexOAuthClientShape
>()("@bundjil/codex/CodexOAuthClient") {}

export const unsupportedCodexOAuthClientOperation = (
  operation: CodexOAuthClientOperation
) =>
  Effect.fail(
    new CodexOAuthUnsupportedRuntimePath({
      operation,
      message:
        "Live Codex OAuth endpoint exchange is not implemented in this package slice.",
    })
  );

export const CodexOAuthClientUnsupported = CodexOAuthClient.of({
  startLogin: () => unsupportedCodexOAuthClientOperation("startLogin"),
  completeLogin: () => unsupportedCodexOAuthClientOperation("completeLogin"),
  refresh: () => unsupportedCodexOAuthClientOperation("refresh"),
  revoke: () => unsupportedCodexOAuthClientOperation("revoke"),
});

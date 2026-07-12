import { Context, Effect, Layer } from "effect";

import type { CodexOAuthProfileCommitFailure } from "./errors.js";
import { CodexOAuthUnsupportedRuntimePath } from "./errors.js";
import type {
  CodexOAuthProfileCommitReplacementInput,
  CodexOAuthProfileCommitLegacyReplacementInput,
  CodexOAuthProfileCommitReauthenticationInput,
  CodexOAuthProfileCommitRefreshInput,
  CodexSubscriptionProfile,
} from "./schemas.js";

export interface CodexOAuthProfileCommitShape {
  readonly initialWrite: (
    profile: CodexSubscriptionProfile
  ) => Effect.Effect<CodexSubscriptionProfile, CodexOAuthProfileCommitFailure>;
  readonly replace: (
    input: CodexOAuthProfileCommitReplacementInput
  ) => Effect.Effect<CodexSubscriptionProfile, CodexOAuthProfileCommitFailure>;
  readonly replaceLegacy: (
    input: CodexOAuthProfileCommitLegacyReplacementInput
  ) => Effect.Effect<CodexSubscriptionProfile, CodexOAuthProfileCommitFailure>;
  readonly refresh: (
    input: CodexOAuthProfileCommitRefreshInput
  ) => Effect.Effect<CodexSubscriptionProfile, CodexOAuthProfileCommitFailure>;
  readonly markReauthenticationRequired: (
    input: CodexOAuthProfileCommitReauthenticationInput
  ) => Effect.Effect<CodexSubscriptionProfile, CodexOAuthProfileCommitFailure>;
}

export class CodexOAuthProfileCommit extends Context.Service<
  CodexOAuthProfileCommit,
  CodexOAuthProfileCommitShape
>()("@bundjil/codex-oauth/CodexOAuthProfileCommit") {}

const unsupportedCommit = (operation: "completeLogin" | "refresh") => () =>
  Effect.fail(
    new CodexOAuthUnsupportedRuntimePath({
      operation,
      message: "Codex OAuth profile commits are unavailable in this runtime.",
    })
  );

export const CodexOAuthProfileCommitUnsupported = Layer.succeed(
  CodexOAuthProfileCommit,
  CodexOAuthProfileCommit.of({
    initialWrite: unsupportedCommit("completeLogin"),
    replaceLegacy: unsupportedCommit("completeLogin"),
    replace: unsupportedCommit("completeLogin"),
    refresh: unsupportedCommit("refresh"),
    markReauthenticationRequired: unsupportedCommit("refresh"),
  })
);

export const commitInitialCodexSubscriptionProfile = (
  profile: CodexSubscriptionProfile
) =>
  Effect.gen(function* commitInitialCodexSubscriptionProfileOperation() {
    const commit = yield* CodexOAuthProfileCommit;

    return yield* commit.initialWrite(profile);
  });

export const commitRefreshedCodexSubscriptionProfile = (
  input: CodexOAuthProfileCommitRefreshInput
) =>
  Effect.gen(function* commitRefreshedCodexSubscriptionProfileOperation() {
    const commit = yield* CodexOAuthProfileCommit;

    return yield* commit.refresh(input);
  });

export const replaceCodexSubscriptionProfile = (
  input: CodexOAuthProfileCommitReplacementInput
) =>
  Effect.gen(function* replaceCodexSubscriptionProfileOperation() {
    const commit = yield* CodexOAuthProfileCommit;

    return yield* commit.replace(input);
  });

export const replaceLegacyCodexOAuthProfile = (
  input: CodexOAuthProfileCommitLegacyReplacementInput
) =>
  Effect.gen(function* replaceLegacyCodexOAuthProfileOperation() {
    const commit = yield* CodexOAuthProfileCommit;

    return yield* commit.replaceLegacy(input);
  });

export const markCodexSubscriptionReauthenticationRequired = (
  input: CodexOAuthProfileCommitReauthenticationInput
) =>
  Effect.gen(
    function* markCodexSubscriptionReauthenticationRequiredOperation() {
      const commit = yield* CodexOAuthProfileCommit;

      return yield* commit.markReauthenticationRequired(input);
    }
  );

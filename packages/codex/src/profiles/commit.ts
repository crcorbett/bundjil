import { Context, Effect, Layer } from "effect";

import { CodexOAuthUnsupportedRuntimePath } from "../auth/errors.js";
import type {
  CodexOAuthProfileCommitReplacementInput,
  CodexOAuthProfileCommitLegacyReplacementInput,
  CodexOAuthProfileCommitReauthenticationInput,
  CodexOAuthProfileCommitRefreshInput,
  CodexSubscriptionProfile,
} from "./contracts.js";
import type { CodexOAuthProfileCommitFailure } from "./errors.js";

export interface CodexOAuthProfileCommitContract {
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
  CodexOAuthProfileCommitContract
>()("@bundjil/codex/CodexOAuthProfileCommit") {}

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

export const commitInitialCodexSubscriptionProfile = Effect.fnUntraced(
  function* commitInitialCodexSubscriptionProfileOperation(
    profile: CodexSubscriptionProfile
  ) {
    const commit = yield* CodexOAuthProfileCommit;

    return yield* commit.initialWrite(profile);
  }
);

export const commitRefreshedCodexSubscriptionProfile = Effect.fnUntraced(
  function* commitRefreshedCodexSubscriptionProfileOperation(
    input: CodexOAuthProfileCommitRefreshInput
  ) {
    const commit = yield* CodexOAuthProfileCommit;

    return yield* commit.refresh(input);
  }
);

export const replaceCodexSubscriptionProfile = Effect.fnUntraced(
  function* replaceCodexSubscriptionProfileOperation(
    input: CodexOAuthProfileCommitReplacementInput
  ) {
    const commit = yield* CodexOAuthProfileCommit;

    return yield* commit.replace(input);
  }
);

export const replaceLegacyCodexOAuthProfile = Effect.fnUntraced(
  function* replaceLegacyCodexOAuthProfileOperation(
    input: CodexOAuthProfileCommitLegacyReplacementInput
  ) {
    const commit = yield* CodexOAuthProfileCommit;

    return yield* commit.replaceLegacy(input);
  }
);

export const markCodexSubscriptionReauthenticationRequired = Effect.fnUntraced(
  function* markCodexSubscriptionReauthenticationRequiredOperation(
    input: CodexOAuthProfileCommitReauthenticationInput
  ) {
    const commit = yield* CodexOAuthProfileCommit;

    return yield* commit.markReauthenticationRequired(input);
  }
);

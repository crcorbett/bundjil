import { Context, Effect, Schema } from "effect";

import type { CodexOAuthRefreshLockFailure } from "./errors.js";
import { CodexOAuthRefreshLockTtlMillis } from "./schemas.js";
import type {
  CodexOAuthRefreshLockAcquireInput as CodexOAuthRefreshLockAcquireInputType,
  CodexOAuthRefreshLockLease as CodexOAuthRefreshLockLeaseType,
} from "./schemas.js";

export interface CodexOAuthRefreshLockShape {
  readonly acquire: (
    input: CodexOAuthRefreshLockAcquireInputType
  ) => Effect.Effect<
    CodexOAuthRefreshLockLeaseType,
    CodexOAuthRefreshLockFailure
  >;
  readonly release: (
    lease: CodexOAuthRefreshLockLeaseType
  ) => Effect.Effect<void, CodexOAuthRefreshLockFailure>;
}

export class CodexOAuthRefreshLock extends Context.Service<
  CodexOAuthRefreshLock,
  CodexOAuthRefreshLockShape
>()("@bundjil/codex-oauth/CodexOAuthRefreshLock") {}

export const defaultCodexOAuthRefreshLockTtlMillis = Schema.decodeUnknownSync(
  CodexOAuthRefreshLockTtlMillis
)(5000);

export const withCodexOAuthRefreshLock = Effect.fn(
  "CodexOAuthRefreshLock.withLock"
)(function* <A, E, R>(
  input: CodexOAuthRefreshLockAcquireInputType,
  effect: Effect.Effect<A, E, R>
) {
  const lock = yield* CodexOAuthRefreshLock;

  return yield* Effect.acquireUseRelease(
    lock.acquire(input),
    () => effect,
    (lease) => lock.release(lease)
  );
});

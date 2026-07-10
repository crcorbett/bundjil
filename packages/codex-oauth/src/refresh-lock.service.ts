import { Clock, Context, Effect, Redacted, Schema } from "effect";

import { CodexOAuthRefreshLockError } from "./errors.js";
import type { CodexOAuthRefreshLockFailure } from "./errors.js";
import {
  CodexOAuthRefreshLockLease,
  CodexOAuthRefreshLockOwner,
  CodexOAuthRefreshLockTtlMillis,
} from "./schemas.js";
import type {
  CodexOAuthRefreshLockAcquireInput as CodexOAuthRefreshLockAcquireInputType,
  CodexOAuthRefreshLockLease as CodexOAuthRefreshLockLeaseType,
} from "./schemas.js";
import { codexOAuthProfileSubjectHash } from "./storage-keys.js";

export interface CodexOAuthRefreshLockProvider {
  readonly acquire: (
    lease: CodexOAuthRefreshLockLeaseType,
    nowEpochMillis: number
  ) => Effect.Effect<boolean, CodexOAuthRefreshLockFailure>;
  readonly release: (
    lease: CodexOAuthRefreshLockLeaseType
  ) => Effect.Effect<boolean, CodexOAuthRefreshLockFailure>;
}

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

export const makeCodexOAuthRefreshLock = (
  provider: CodexOAuthRefreshLockProvider
) =>
  Effect.succeed(
    CodexOAuthRefreshLock.of({
      acquire: Effect.fn("CodexOAuthRefreshLock.acquire")(function* (
        input: CodexOAuthRefreshLockAcquireInputType
      ) {
        const subjectHash = yield* codexOAuthProfileSubjectHash(
          input.subject
        ).pipe(
          Effect.mapError(
            (cause) =>
              new CodexOAuthRefreshLockError({
                operation: "acquire",
                reason: "acquisition",
                message: "Unable to derive the Codex OAuth refresh-lock key.",
                cause,
              })
          )
        );
        const owner = yield* Effect.try({
          try: () => Redacted.make(globalThis.crypto.randomUUID()),
          catch: (cause) =>
            new CodexOAuthRefreshLockError({
              operation: "acquire",
              reason: "acquisition",
              subjectHash,
              message: "Unable to create a Codex OAuth refresh-lock owner.",
              cause,
            }),
        });
        const nowEpochMillis = yield* Clock.currentTimeMillis;
        const encodedOwner = yield* Schema.encodeEffect(
          CodexOAuthRefreshLockOwner
        )(owner).pipe(
          Effect.mapError(
            (cause) =>
              new CodexOAuthRefreshLockError({
                operation: "acquire",
                reason: "acquisition",
                subjectHash,
                message: "Unable to encode a Codex OAuth refresh-lock owner.",
                cause,
              })
          )
        );
        const lease = yield* Schema.decodeUnknownEffect(
          CodexOAuthRefreshLockLease
        )({
          subject: input.subject,
          subjectHash,
          owner: encodedOwner,
          expiresAtEpochMillis: nowEpochMillis + input.ttlMillis,
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CodexOAuthRefreshLockError({
                operation: "acquire",
                reason: "acquisition",
                subjectHash,
                message:
                  "Unable to construct a Codex OAuth refresh-lock lease.",
                cause,
              })
          )
        );
        const acquired = yield* provider.acquire(lease, nowEpochMillis);

        if (!acquired) {
          return yield* new CodexOAuthRefreshLockError({
            operation: "acquire",
            reason: "contended",
            subjectHash,
            message: "Codex OAuth refresh is already in progress.",
          });
        }

        return lease;
      }),
      release: Effect.fn("CodexOAuthRefreshLock.release")(function* (
        lease: CodexOAuthRefreshLockLeaseType
      ) {
        const nowEpochMillis = yield* Clock.currentTimeMillis;

        if (lease.expiresAtEpochMillis <= nowEpochMillis) {
          return yield* new CodexOAuthRefreshLockError({
            operation: "release",
            reason: "expired",
            subjectHash: lease.subjectHash,
            expiresAtEpochMillis: lease.expiresAtEpochMillis,
            nowEpochMillis,
            message: "Codex OAuth refresh-lock lease expired before release.",
          });
        }

        const released = yield* provider.release(lease);

        if (!released) {
          return yield* new CodexOAuthRefreshLockError({
            operation: "release",
            reason: "release",
            subjectHash: lease.subjectHash,
            message:
              "Codex OAuth refresh-lock lease is not owned by this invocation.",
          });
        }

        return yield* Effect.void;
      }),
    })
  );

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

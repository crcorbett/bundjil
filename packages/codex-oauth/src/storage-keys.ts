import { AtomicKeyValueStoreKey } from "@bundjil/effect-persistence";
import { Effect, Schema } from "effect";

import { OAuthProfileStorageError } from "./errors.js";
import { CodexOAuthSubjectHash } from "./schemas.js";
import type { CodexOAuthSubject } from "./schemas.js";

export const codexOAuthProfileStoragePrefix =
  "bundjil/oauth/v1/provider/codex/profile";

export const codexOAuthRefreshLockStoragePrefix =
  "bundjil/oauth/v1/provider/codex/refresh-lock";

export const codexOAuthProfileRevisionStoragePrefix =
  "bundjil/oauth/v1/provider/codex/profile-revision";

export const codexOAuthProfileSubjectHash = (subject: CodexOAuthSubject) =>
  Effect.tryPromise({
    try: async () => {
      const digest = await globalThis.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(
          [
            subject.provider,
            subject.principal.type,
            subject.principal.id,
            subject.principal.issuer,
            subject.connectorId,
            subject.installationId,
            subject.profileId,
          ].join("\u001F")
        )
      );

      return Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
    },
    catch: (cause) =>
      new OAuthProfileStorageError({
        operation: "deriveProfileStorageKey",
        message: "Unable to derive Codex OAuth profile storage key.",
        cause,
      }),
  }).pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(CodexOAuthSubjectHash)),
    Effect.mapError(
      (cause) =>
        new OAuthProfileStorageError({
          operation: "deriveProfileStorageKey",
          message: "Unable to derive Codex OAuth profile storage key.",
          cause,
        })
    )
  );

export const codexOAuthProfileStorageKey = Effect.fn(
  "CodexOAuthProfileStorageKey.derive"
)(function* (subject: CodexOAuthSubject) {
  const subjectHash = yield* codexOAuthProfileSubjectHash(subject);

  return yield* Schema.decodeUnknownEffect(AtomicKeyValueStoreKey)(
    `${codexOAuthProfileStoragePrefix}/${subjectHash}`
  ).pipe(
    Effect.mapError(
      (cause) =>
        new OAuthProfileStorageError({
          operation: "deriveProfileStorageKey",
          message: "Unable to derive Codex OAuth profile storage key.",
          cause,
        })
    )
  );
});

export const codexOAuthRefreshLockStorageKey = Effect.fn(
  "CodexOAuthRefreshLockStorageKey.derive"
)(function* (subject: CodexOAuthSubject) {
  const subjectHash = yield* codexOAuthProfileSubjectHash(subject);

  return yield* Schema.decodeUnknownEffect(AtomicKeyValueStoreKey)(
    `${codexOAuthRefreshLockStoragePrefix}/${subjectHash}`
  ).pipe(
    Effect.mapError(
      (cause) =>
        new OAuthProfileStorageError({
          operation: "deriveProfileStorageKey",
          message: "Unable to derive Codex OAuth profile storage key.",
          cause,
        })
    )
  );
});

export const codexOAuthProfileRevisionStorageKey = Effect.fn(
  "CodexOAuthProfileRevisionStorageKey.derive"
)(function* (subject: CodexOAuthSubject) {
  const subjectHash = yield* codexOAuthProfileSubjectHash(subject);

  return yield* Schema.decodeUnknownEffect(AtomicKeyValueStoreKey)(
    `${codexOAuthProfileRevisionStoragePrefix}/${subjectHash}`
  ).pipe(
    Effect.mapError(
      (cause) =>
        new OAuthProfileStorageError({
          operation: "deriveProfileStorageKey",
          message: "Unable to derive Codex OAuth profile storage key.",
          cause,
        })
    )
  );
});

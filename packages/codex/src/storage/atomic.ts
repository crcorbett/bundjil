import {
  AtomicKeyValueStore,
  AtomicKeyValueStoreTransaction,
} from "@bundjil/store";
import { Clock, Effect, Layer, Match, Option, Random, Schema } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import type { CodexOAuthSubjectHash } from "../auth/credentials.js";
import { CodexOAuthProfileCipher } from "../profiles/cipher.js";
import type { CodexOAuthProfileCipherShape } from "../profiles/cipher.js";
import { CodexOAuthProfileCommit } from "../profiles/commit.js";
import {
  CodexAccessTokenImportProfile,
  EncryptedCodexOAuthProfile,
  EncryptedCodexOAuthProfileV2,
  CodexOAuthRefreshLockLease,
  CodexOAuthRefreshLockOwner,
} from "../profiles/contracts.js";
import type {
  CodexOAuthProfileCommitLegacyReplacementInput,
  CodexOAuthProfileCommitOperation,
  CodexOAuthProfileCommitReauthenticationInput,
  CodexOAuthProfileCommitRefreshInput,
  CodexOAuthProfileCommitReplacementInput,
  CodexSubscriptionProfile,
} from "../profiles/contracts.js";
import {
  CodexOAuthProfileCommitConflict,
  CodexOAuthProfileCommitError,
  CodexOAuthRefreshLockError,
} from "../profiles/errors.js";
import {
  codexOAuthProfileRevisionStorageKey,
  codexOAuthProfileStorageKey,
  codexOAuthProfileSubjectHash,
  codexOAuthRefreshLockStorageKey,
} from "../profiles/keys.js";
import { CodexOAuthObserver } from "../profiles/observer.js";
import type { CodexOAuthObserverShape } from "../profiles/observer.js";
import { CodexOAuthRefreshLock } from "../profiles/refresh-lock.js";

const encryptedCodexOAuthProfileV2Json = Schema.fromJsonString(
  Schema.toCodecJson(EncryptedCodexOAuthProfileV2)
);
const encryptedCodexOAuthProfileJson = Schema.fromJsonString(
  Schema.toCodecJson(EncryptedCodexOAuthProfile)
);
const codexAccessTokenImportProfileJson = Schema.fromJsonString(
  Schema.toCodecJson(CodexAccessTokenImportProfile)
);

const profileCommitConflict = (
  operation: CodexOAuthProfileCommitOperation,
  profile: CodexSubscriptionProfile,
  subjectHash: CodexOAuthSubjectHash
) =>
  new CodexOAuthProfileCommitConflict({
    operation,
    profileId: profile.subject.profileId,
    subjectHash,
    message:
      "The stored Codex OAuth profile no longer matches the fenced commit precondition.",
  });

const profileCommitError = (
  operation: CodexOAuthProfileCommitOperation,
  profile: CodexSubscriptionProfile,
  subjectHash: CodexOAuthSubjectHash,
  message: string
) =>
  new CodexOAuthProfileCommitError({
    operation,
    profileId: profile.subject.profileId,
    subjectHash,
    message,
  });

const transactProfileCommit = (
  atomic: AtomicKeyValueStore["Service"],
  cipher: CodexOAuthProfileCipherShape,
  observer: Option.Option<CodexOAuthObserverShape>,
  operation: CodexOAuthProfileCommitOperation,
  profile: CodexSubscriptionProfile,
  expectedRevision?: string,
  expectedLegacyProfile?: string
) =>
  Effect.gen(function* transactProfileCommitOperation() {
    const profileKey = yield* codexOAuthProfileStorageKey(profile.subject);
    const revisionKey = yield* codexOAuthProfileRevisionStorageKey(
      profile.subject
    );
    const subjectHash = yield* codexOAuthProfileSubjectHash(profile.subject);
    const encryptedProfile = yield* cipher.encrypt(profile);
    const encodedProfile = yield* Schema.encodeEffect(
      encryptedCodexOAuthProfileV2Json
    )(encryptedProfile).pipe(
      Effect.mapError(() =>
        profileCommitError(
          operation,
          profile,
          subjectHash,
          "Unable to encode the encrypted Codex OAuth profile commit payload."
        )
      )
    );
    const conditions = Match.value(operation).pipe(
      Match.when(
        "initialWrite",
        () =>
          [
            { _tag: "Absent", key: profileKey },
            { _tag: "Absent", key: revisionKey },
          ] as const
      ),
      Match.when(
        "replaceLegacy",
        () =>
          [
            {
              _tag: "Equals",
              key: profileKey,
              value: expectedLegacyProfile ?? "",
            },
            { _tag: "Absent", key: revisionKey },
          ] as const
      ),
      Match.when(
        "replace",
        () =>
          [
            {
              _tag: "Equals",
              key: revisionKey,
              value: expectedRevision ?? "",
            },
          ] as const
      ),
      Match.when(
        "refresh",
        () =>
          [
            {
              _tag: "Equals",
              key: revisionKey,
              value: expectedRevision ?? "",
            },
          ] as const
      ),
      Match.when(
        "markReauthenticationRequired",
        () =>
          [
            {
              _tag: "Equals",
              key: revisionKey,
              value: expectedRevision ?? "",
            },
          ] as const
      ),
      Match.exhaustive
    );
    const transaction = yield* Schema.decodeUnknownEffect(
      AtomicKeyValueStoreTransaction
    )({
      conditions,
      mutations: [
        { _tag: "Set", key: profileKey, value: encodedProfile },
        {
          _tag: "Set",
          key: revisionKey,
          value: profile.credentialRevision,
        },
      ],
    }).pipe(
      Effect.mapError(() =>
        profileCommitError(
          operation,
          profile,
          subjectHash,
          "Unable to construct the fenced Codex OAuth profile commit."
        )
      )
    );
    const outcome = yield* atomic
      .transact(transaction)
      .pipe(
        Effect.mapError(() =>
          profileCommitError(
            operation,
            profile,
            subjectHash,
            "Unable to apply the fenced Codex OAuth profile commit."
          )
        )
      );
    if (outcome === "conflict") {
      return yield* profileCommitConflict(operation, profile, subjectHash);
    }
    if (
      operation === "markReauthenticationRequired" &&
      profile.requiresReauthentication &&
      Option.isSome(observer)
    ) {
      yield* observer.value.record({
        type: "reauthenticationMarked",
        operation,
        profileKind: "subscription",
        requiresReauthentication: true,
      });
    }
    return profile;
  });

export const CodexOAuthProfileCommitAtomicLive = Layer.effect(
  CodexOAuthProfileCommit,
  Effect.gen(function* makeCodexOAuthProfileCommitAtomic() {
    const atomic = yield* AtomicKeyValueStore;
    const keyValueStore = yield* KeyValueStore.KeyValueStore;
    const cipher = yield* CodexOAuthProfileCipher;
    const observer = yield* Effect.serviceOption(CodexOAuthObserver);

    return CodexOAuthProfileCommit.of({
      initialWrite: Effect.fn("CodexOAuthProfileCommitAtomic.initialWrite")(
        (profile: CodexSubscriptionProfile) =>
          transactProfileCommit(
            atomic,
            cipher,
            observer,
            "initialWrite",
            profile
          )
      ),
      replace: Effect.fn("CodexOAuthProfileCommitAtomic.replace")(
        (input: CodexOAuthProfileCommitReplacementInput) =>
          transactProfileCommit(
            atomic,
            cipher,
            observer,
            "replace",
            input.profile,
            input.expectedRevision
          )
      ),
      replaceLegacy: Effect.fn("CodexOAuthProfileCommitAtomic.replaceLegacy")(
        function* (input: CodexOAuthProfileCommitLegacyReplacementInput) {
          const profileKey = yield* codexOAuthProfileStorageKey(
            input.profile.subject
          );
          const subjectHash = yield* codexOAuthProfileSubjectHash(
            input.profile.subject
          );
          const conflict = new CodexOAuthProfileCommitConflict({
            operation: "replaceLegacy",
            profileId: input.profile.subject.profileId,
            subjectHash,
            message:
              "The stored Codex OAuth legacy profile no longer matches the fenced migration precondition.",
          });
          const encodedProfile = yield* keyValueStore
            .get(profileKey)
            .pipe(
              Effect.catchTag("KeyValueStoreError", () =>
                Effect.fail(
                  profileCommitError(
                    "replaceLegacy",
                    input.profile,
                    subjectHash,
                    "Unable to read the encrypted legacy profile fence."
                  )
                )
              )
            );
          if (encodedProfile === undefined) {
            return yield* conflict;
          }
          const encryptedProfile = yield* Schema.decodeUnknownEffect(
            encryptedCodexOAuthProfileJson
          )(encodedProfile).pipe(
            Effect.mapError(() =>
              profileCommitError(
                "replaceLegacy",
                input.profile,
                subjectHash,
                "Unable to decode the encrypted legacy profile fence."
              )
            )
          );
          const currentProfile = yield* cipher.decrypt(encryptedProfile);
          if (currentProfile.profileKind !== "access-token-import") {
            return yield* conflict;
          }
          const [currentCanonical, expectedCanonical] = yield* Effect.all([
            Schema.encodeEffect(codexAccessTokenImportProfileJson)(
              currentProfile
            ),
            Schema.encodeEffect(codexAccessTokenImportProfileJson)(
              input.expectedLegacyProfile
            ),
          ]).pipe(
            Effect.mapError(() =>
              profileCommitError(
                "replaceLegacy",
                input.profile,
                subjectHash,
                "Unable to compare the legacy profile fence."
              )
            )
          );
          if (currentCanonical !== expectedCanonical) {
            return yield* conflict;
          }
          return yield* transactProfileCommit(
            atomic,
            cipher,
            observer,
            "replaceLegacy",
            input.profile,
            undefined,
            encodedProfile
          );
        }
      ),
      refresh: Effect.fn("CodexOAuthProfileCommitAtomic.refresh")(
        (input: CodexOAuthProfileCommitRefreshInput) =>
          transactProfileCommit(
            atomic,
            cipher,
            observer,
            "refresh",
            input.profile,
            input.expectedRevision
          )
      ),
      markReauthenticationRequired: Effect.fn(
        "CodexOAuthProfileCommitAtomic.markReauthenticationRequired"
      )((input: CodexOAuthProfileCommitReauthenticationInput) =>
        transactProfileCommit(
          atomic,
          cipher,
          observer,
          "markReauthenticationRequired",
          input.profile,
          input.expectedRevision
        )
      ),
    });
  }).pipe(Effect.withSpan("CodexOAuthProfileCommitAtomicLive"))
);

export const CodexOAuthRefreshLockAtomicLive = Layer.effect(
  CodexOAuthRefreshLock,
  Effect.gen(function* makeCodexOAuthRefreshLockAtomic() {
    const atomic = yield* AtomicKeyValueStore;

    return CodexOAuthRefreshLock.of({
      acquire: Effect.fn("CodexOAuthRefreshLock.acquire")(function* (input) {
        const subjectHash = yield* codexOAuthProfileSubjectHash(
          input.subject
        ).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthRefreshLockError({
                operation: "acquire",
                reason: "acquisition",
                message: "Unable to derive the Codex OAuth refresh-lock key.",
              })
          )
        );
        const [ownerHigh, ownerLow] = yield* Effect.all([
          Random.nextInt,
          Random.nextInt,
        ]);
        const owner = yield* Schema.decodeUnknownEffect(
          CodexOAuthRefreshLockOwner
        )(`${ownerHigh.toString(36)}-${ownerLow.toString(36)}`).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthRefreshLockError({
                operation: "acquire",
                reason: "acquisition",
                subjectHash,
                message: "Unable to create a Codex OAuth refresh-lock owner.",
              })
          )
        );
        const nowEpochMillis = yield* Clock.currentTimeMillis;
        const encodedOwner = yield* Schema.encodeEffect(
          CodexOAuthRefreshLockOwner
        )(owner).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthRefreshLockError({
                operation: "acquire",
                reason: "acquisition",
                subjectHash,
                message: "Unable to encode a Codex OAuth refresh-lock owner.",
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
            () =>
              new CodexOAuthRefreshLockError({
                operation: "acquire",
                reason: "acquisition",
                subjectHash,
                message:
                  "Unable to construct a Codex OAuth refresh-lock lease.",
              })
          )
        );
        const key = yield* codexOAuthRefreshLockStorageKey(input.subject).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthRefreshLockError({
                operation: "acquire",
                reason: "acquisition",
                subjectHash,
                message: "Unable to derive the Codex OAuth refresh-lock key.",
              })
          )
        );
        const transaction = yield* Schema.decodeUnknownEffect(
          AtomicKeyValueStoreTransaction
        )({
          conditions: [{ _tag: "Absent", key }],
          mutations: [
            {
              _tag: "Set",
              key,
              value: encodedOwner,
              ttl: lease.expiresAtEpochMillis - nowEpochMillis,
            },
          ],
        }).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthRefreshLockError({
                operation: "acquire",
                reason: "acquisition",
                subjectHash,
                message:
                  "Unable to construct the Codex OAuth refresh-lock transaction.",
              })
          )
        );
        const outcome = yield* atomic.transact(transaction).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthRefreshLockError({
                operation: "acquire",
                reason: "acquisition",
                subjectHash,
                message: "Unable to acquire the Codex OAuth refresh lock.",
              })
          )
        );
        if (outcome === "conflict") {
          return yield* new CodexOAuthRefreshLockError({
            operation: "acquire",
            reason: "contended",
            subjectHash,
            message: "Codex OAuth refresh is already in progress.",
          });
        }
        return lease;
      }),
      release: Effect.fn("CodexOAuthRefreshLock.release")(function* (lease) {
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
        const key = yield* codexOAuthRefreshLockStorageKey(lease.subject).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthRefreshLockError({
                operation: "release",
                reason: "release",
                subjectHash: lease.subjectHash,
                message: "Unable to derive the Codex OAuth refresh-lock key.",
              })
          )
        );
        const encodedOwner = yield* Schema.encodeEffect(
          CodexOAuthRefreshLockOwner
        )(lease.owner).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthRefreshLockError({
                operation: "release",
                reason: "release",
                subjectHash: lease.subjectHash,
                message: "Unable to encode the Codex OAuth refresh-lock owner.",
              })
          )
        );
        const transaction = yield* Schema.decodeUnknownEffect(
          AtomicKeyValueStoreTransaction
        )({
          conditions: [{ _tag: "Equals", key, value: encodedOwner }],
          mutations: [{ _tag: "Remove", key }],
        }).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthRefreshLockError({
                operation: "release",
                reason: "release",
                subjectHash: lease.subjectHash,
                message:
                  "Unable to construct the Codex OAuth refresh-lock release transaction.",
              })
          )
        );
        const outcome = yield* atomic.transact(transaction).pipe(
          Effect.mapError(
            () =>
              new CodexOAuthRefreshLockError({
                operation: "release",
                reason: "release",
                subjectHash: lease.subjectHash,
                message: "Unable to release the Codex OAuth refresh lock.",
              })
          )
        );
        if (outcome === "conflict") {
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
    });
  }).pipe(Effect.withSpan("CodexOAuthRefreshLockAtomicLive"))
);

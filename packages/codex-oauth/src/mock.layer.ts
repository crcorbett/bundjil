import {
  Context,
  Effect,
  Equal,
  Layer,
  Option,
  Redacted,
  Ref,
  Schema,
} from "effect";

import { CodexDirectProvider } from "./codex-direct-provider.service.js";
import { CodexHttpClient } from "./codex-http-client.service.js";
import { CodexResponsesFetch } from "./codex-responses-fetch.service.js";
import { CodexOAuthProfileCommit } from "./commit.service.js";
import {
  CodexHttpNetworkError,
  CodexOAuthProfileCommitConflict,
  OAuthProfileNotFound,
  OAuthProfileSchemaError,
  OAuthProfileStorageError,
} from "./errors.js";
import {
  CodexOAuthProfileCipherLive,
  CodexOAuthServiceLive,
} from "./live.layer.js";
import { CodexOAuthClient } from "./oauth-client.service.js";
import { CodexOAuthObserver } from "./observer.service.js";
import { CodexOAuthProfileCipherConfigService } from "./profile-cipher.config.js";
import { CodexProfileStore } from "./profile-store.service.js";
import {
  CodexOAuthRefreshLock,
  makeCodexOAuthRefreshLock,
} from "./refresh-lock.service.js";
import { CodexOAuthObserverSnapshot, CodexOAuthProfile } from "./schemas.js";
import type {
  CodexAccessTokenImportProfile as CodexAccessTokenImportProfileType,
  CodexOAuthLoginStartResult,
  CodexOAuthObserverEvent as CodexOAuthObserverEventType,
  CodexOAuthProfile as CodexOAuthProfileType,
  CodexOAuthProfileCipherConfig as CodexOAuthProfileCipherConfigType,
  CodexOAuthTokenRefreshResult,
  CodexResponsesProofResult,
  CodexResponsesStreamResult,
  CodexOAuthProfileCommitOperation,
  CodexSubscriptionProfile,
  OpenAICompatibleChatCompletionStream,
} from "./schemas.js";
import {
  codexOAuthProfileStorageKey,
  codexOAuthProfileSubjectHash,
} from "./storage-keys.js";

export interface CodexOAuthClientMockOptions {
  readonly loginStart?: CodexOAuthLoginStartResult;
  readonly loginProfile?: CodexOAuthProfileType;
  readonly refreshResult?: CodexOAuthTokenRefreshResult;
}

export interface CodexResponsesFetchMockOptions {
  readonly fetch: (request: Request) => Effect.Effect<Response>;
}

export const CodexResponsesFetchMock = (
  options: CodexResponsesFetchMockOptions
) =>
  Layer.succeed(CodexResponsesFetch, {
    fetch: options.fetch,
  });

export interface CodexHttpClientMockOptions {
  readonly postResponses?: CodexResponsesProofResult;
  readonly postResponsesStream?: CodexResponsesStreamResult;
}

export const CodexHttpClientMock = (options: CodexHttpClientMockOptions = {}) =>
  Layer.succeed(CodexHttpClient, {
    postResponses: () =>
      options.postResponses === undefined
        ? Effect.fail(
            new CodexHttpNetworkError({
              operation: "postResponses",
              message: "CodexHttpClientMock.postResponses is not seeded.",
              cause: "missing mock postResponses result",
            })
          )
        : Effect.succeed(options.postResponses),
    postResponsesStream: () =>
      options.postResponsesStream === undefined
        ? Effect.fail(
            new CodexHttpNetworkError({
              operation: "postResponsesStream",
              message: "CodexHttpClientMock.postResponsesStream is not seeded.",
              cause: "missing mock postResponsesStream result",
            })
          )
        : Effect.succeed(options.postResponsesStream),
  });

export interface CodexDirectProviderMockOptions {
  readonly stream: OpenAICompatibleChatCompletionStream;
}

export const CodexDirectProviderMock = (
  options: CodexDirectProviderMockOptions
) =>
  Layer.succeed(CodexDirectProvider, {
    streamChatCompletion: () => Effect.succeed(options.stream),
  });

export const CodexOAuthClientMock = (
  options: CodexOAuthClientMockOptions = {}
) =>
  Layer.succeed(CodexOAuthClient, {
    startLogin: () =>
      options.loginStart === undefined
        ? Effect.succeed({
            authorizationUrl: "https://auth.openai.com/oauth/authorize",
            state: Redacted.make("mock-state"),
            codeVerifier: Redacted.make("mock-code-verifier"),
          })
        : Effect.succeed(options.loginStart),
    completeLogin: () =>
      options.loginProfile === undefined
        ? Effect.fail(
            new OAuthProfileStorageError({
              operation: "seedProfiles",
              message: "Mock completeLogin requires a seeded login profile.",
              cause: "missing mock profile",
            })
          )
        : Effect.succeed(options.loginProfile),
    refresh: () =>
      options.refreshResult === undefined
        ? Effect.fail(
            new OAuthProfileStorageError({
              operation: "seedProfiles",
              message: "Mock refresh requires a seeded refresh result.",
              cause: "missing mock refresh result",
            })
          )
        : Effect.succeed(options.refreshResult),
    revoke: () => Effect.void,
  });

class CodexOAuthMemoryProfiles extends Context.Service<
  CodexOAuthMemoryProfiles,
  Ref.Ref<Map<string, CodexOAuthProfileType>>
>()("@bundjil/codex-oauth/CodexOAuthMemoryProfiles") {}

const encodeSeedProfile = (profile: CodexOAuthProfileType) =>
  Schema.encodeEffect(CodexOAuthProfile)(profile).pipe(
    Effect.mapError(
      (cause) =>
        new OAuthProfileSchemaError({
          boundary: "CodexOAuthProfile",
          message: "Unable to encode seeded Codex OAuth profile.",
          cause,
        })
    )
  );

const CodexOAuthMemoryProfilesLive = (
  profiles: readonly CodexOAuthProfileType[] = []
) =>
  Layer.effect(
    CodexOAuthMemoryProfiles,
    Effect.gen(function* makeCodexOAuthMemoryProfiles() {
      const entries: (readonly [string, CodexOAuthProfileType])[] = [];

      for (const profile of profiles) {
        const key = yield* codexOAuthProfileStorageKey(profile.subject);
        yield* encodeSeedProfile(profile);
        entries.push([key, profile]);
      }

      const state = yield* Ref.make(new Map(entries));

      return CodexOAuthMemoryProfiles.of(state);
    })
  );

const CodexProfileStoreMemoryLive = Layer.effect(
  CodexProfileStore,
  Effect.gen(function* makeCodexProfileStoreMemory() {
    const state = yield* CodexOAuthMemoryProfiles;

    return CodexProfileStore.of({
      getProfile: Effect.fn("CodexProfileStoreMemory.getProfile")(
        function* (subject) {
          const key = yield* codexOAuthProfileStorageKey(subject);
          const subjectHash = yield* codexOAuthProfileSubjectHash(subject);
          const profiles = yield* Ref.get(state);
          const profile = profiles.get(key);

          if (profile === undefined) {
            return yield* new OAuthProfileNotFound({
              profileId: subject.profileId,
              subjectHash,
              message: "Codex OAuth profile was not found.",
            });
          }

          return profile;
        }
      ),
      putProfile: Effect.fn("CodexProfileStoreMemory.putProfile")(function* (
        profile: CodexAccessTokenImportProfileType
      ) {
        const key = yield* codexOAuthProfileStorageKey(profile.subject);
        yield* Schema.encodeEffect(CodexOAuthProfile)(profile).pipe(
          Effect.mapError(
            (cause) =>
              new OAuthProfileSchemaError({
                boundary: "CodexOAuthProfile",
                message: "Unable to encode Codex OAuth profile.",
                cause,
              })
          )
        );
        yield* Ref.update(
          state,
          (profiles) => new Map([...profiles, [key, profile] as const])
        );
      }),
      removeProfile: Effect.fn("CodexProfileStoreMemory.removeProfile")(
        function* (subject) {
          const key = yield* codexOAuthProfileStorageKey(subject);
          yield* Ref.update(state, (profiles) => {
            const nextProfiles = new Map(profiles);
            nextProfiles.delete(key);
            return nextProfiles;
          });
        }
      ),
      hasProfile: Effect.fn("CodexProfileStoreMemory.hasProfile")(
        function* (subject) {
          const key = yield* codexOAuthProfileStorageKey(subject);
          const profiles = yield* Ref.get(state);

          return profiles.has(key);
        }
      ),
    });
  }).pipe(Effect.withSpan("CodexProfileStoreMemory"))
);

export const CodexProfileStoreMemory = (
  profiles: readonly CodexOAuthProfileType[] = []
) =>
  CodexProfileStoreMemoryLive.pipe(
    Layer.provide(CodexOAuthMemoryProfilesLive(profiles))
  );

export const CodexOAuthProfileCommitMemory = Layer.effect(
  CodexOAuthProfileCommit,
  Effect.gen(function* makeCodexOAuthProfileCommitMemory() {
    const state = yield* CodexOAuthMemoryProfiles;
    const observer = yield* Effect.serviceOption(CodexOAuthObserver);

    const writeProfile = (
      operation: CodexOAuthProfileCommitOperation,
      profile: CodexSubscriptionProfile,
      expectedRevision?: CodexSubscriptionProfile["credentialRevision"]
    ) =>
      Effect.gen(function* writeProfileCommit() {
        const key = yield* codexOAuthProfileStorageKey(profile.subject);
        const subjectHash = yield* codexOAuthProfileSubjectHash(
          profile.subject
        );
        yield* Schema.encodeEffect(CodexOAuthProfile)(profile).pipe(
          Effect.mapError(
            (cause) =>
              new OAuthProfileSchemaError({
                boundary: "CodexOAuthProfile",
                message: "Unable to encode committed Codex OAuth profile.",
                cause,
              })
          )
        );
        const conflict = yield* Ref.modify(state, (profiles) => {
          const currentProfile = profiles.get(key);
          const currentRevision =
            currentProfile?.profileKind === "subscription"
              ? currentProfile.credentialRevision
              : undefined;
          const initialConflict =
            operation === "initialWrite" && currentProfile !== undefined;
          const casConflict =
            operation !== "initialWrite" &&
            currentRevision !== expectedRevision;

          if (initialConflict || casConflict) {
            return [
              new CodexOAuthProfileCommitConflict({
                operation,
                profileId: profile.subject.profileId,
                subjectHash,
                message:
                  "The stored Codex OAuth profile no longer matches the fenced commit precondition.",
              }),
              profiles,
            ] as const;
          }

          return [
            undefined,
            new Map([...profiles, [key, profile] as const]),
          ] as const;
        });

        if (conflict !== undefined) {
          return yield* conflict;
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

    return CodexOAuthProfileCommit.of({
      initialWrite: Effect.fn("CodexOAuthProfileCommitMemory.initialWrite")(
        (profile: CodexSubscriptionProfile) =>
          writeProfile("initialWrite", profile)
      ),
      replace: Effect.fn("CodexOAuthProfileCommitMemory.replace")((input) =>
        writeProfile("replace", input.profile, input.expectedRevision)
      ),
      refresh: Effect.fn("CodexOAuthProfileCommitMemory.refresh")((input) =>
        writeProfile("refresh", input.profile, input.expectedRevision)
      ),
      markReauthenticationRequired: Effect.fn(
        "CodexOAuthProfileCommitMemory.markReauthenticationRequired"
      )((input) =>
        writeProfile(
          "markReauthenticationRequired",
          input.profile,
          input.expectedRevision
        )
      ),
    });
  }).pipe(Effect.withSpan("CodexOAuthProfileCommitMemory"))
);

export const CodexOAuthObserverMemory = Layer.effect(
  CodexOAuthObserver,
  Effect.gen(function* makeCodexOAuthObserverMemory() {
    const state = yield* Ref.make(
      Schema.decodeUnknownSync(CodexOAuthObserverSnapshot)({
        counters: {
          refreshStarted: 0,
          refreshSucceeded: 0,
          refreshConflict: 0,
          refreshWinnerUsed: 0,
          reauthenticationMarked: 0,
        },
        events: [],
      })
    );

    return CodexOAuthObserver.of({
      record: Effect.fn("CodexOAuthObserverMemory.record")(
        (event: CodexOAuthObserverEventType) =>
          Ref.update(state, (snapshot) => ({
            counters: {
              refreshStarted:
                snapshot.counters.refreshStarted +
                (event.type === "refreshStarted" ? 1 : 0),
              refreshSucceeded:
                snapshot.counters.refreshSucceeded +
                (event.type === "refreshSucceeded" ? 1 : 0),
              refreshConflict:
                snapshot.counters.refreshConflict +
                (event.type === "refreshConflict" ? 1 : 0),
              refreshWinnerUsed:
                snapshot.counters.refreshWinnerUsed +
                (event.type === "refreshWinnerUsed" ? 1 : 0),
              reauthenticationMarked:
                snapshot.counters.reauthenticationMarked +
                (event.type === "reauthenticationMarked" ? 1 : 0),
            },
            events: [...snapshot.events, event],
          }))
      ),
      snapshot: Ref.get(state),
    });
  }).pipe(Effect.withSpan("CodexOAuthObserverMemory"))
);

export const CodexOAuthProfileCipherTest = (
  config: CodexOAuthProfileCipherConfigType
) =>
  CodexOAuthProfileCipherLive.pipe(
    Layer.provide(
      Layer.succeed(
        CodexOAuthProfileCipherConfigService,
        CodexOAuthProfileCipherConfigService.of(config)
      )
    )
  );

export const CodexOAuthRefreshLockMemory = Layer.effect(
  CodexOAuthRefreshLock,
  Effect.gen(function* makeCodexOAuthRefreshLockMemory() {
    const leases = yield* Ref.make(
      new Map<
        string,
        {
          readonly owner: ReturnType<typeof Redacted.make<string>>;
          readonly expiresAtEpochMillis: number;
        }
      >()
    );

    return yield* makeCodexOAuthRefreshLock({
      acquire: (lease, nowEpochMillis) =>
        Ref.modify(leases, (currentLeases) => {
          const existingLease = currentLeases.get(lease.subjectHash);

          if (
            existingLease !== undefined &&
            existingLease.expiresAtEpochMillis > nowEpochMillis
          ) {
            return [false, currentLeases] as const;
          }

          const nextLeases = new Map([
            ...currentLeases,
            [
              lease.subjectHash,
              {
                owner: lease.owner,
                expiresAtEpochMillis: lease.expiresAtEpochMillis,
              },
            ],
          ]);

          return [true, nextLeases] as const;
        }),
      release: (lease) =>
        Ref.modify(leases, (currentLeases) => {
          const existingLease = currentLeases.get(lease.subjectHash);

          if (
            existingLease === undefined ||
            !Equal.equals(existingLease.owner, lease.owner)
          ) {
            return [false, currentLeases] as const;
          }

          const nextLeases = new Map(currentLeases);
          nextLeases.delete(lease.subjectHash);

          return [true, nextLeases] as const;
        }),
    });
  }).pipe(Effect.withSpan("CodexOAuthRefreshLockMemory"))
);

export const CodexOAuthMemory = (
  profiles: readonly CodexOAuthProfileType[] = [],
  clientOptions: CodexOAuthClientMockOptions = {}
) => {
  const state = CodexOAuthMemoryProfilesLive(profiles);
  const observer = CodexOAuthObserverMemory;
  const client = CodexOAuthClientMock(clientOptions);
  const refreshLock = CodexOAuthRefreshLockMemory;
  const store = CodexProfileStoreMemoryLive.pipe(Layer.provide(state));
  const commit = CodexOAuthProfileCommitMemory.pipe(
    Layer.provideMerge(Layer.merge(state, observer))
  );
  const service = CodexOAuthServiceLive.pipe(
    Layer.provideMerge(
      Layer.mergeAll(store, commit, client, observer, refreshLock)
    )
  );

  return Layer.mergeAll(store, commit, client, observer, refreshLock, service);
};

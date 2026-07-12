import { Clock, Context, Effect, Option, Redacted, Schema } from "effect";

import { CodexOAuthProfileCommit } from "./commit.service.js";
import {
  CodexOAuthTokenExpired,
  CodexOAuthTokenMissing,
  CodexOAuthTokenProviderError,
} from "./errors.js";
import type { CodexOAuthFailure } from "./errors.js";
import { CodexOAuthClient } from "./oauth-client.service.js";
import { CodexOAuthObserver } from "./observer.service.js";
import type { CodexOAuthObserverShape } from "./observer.service.js";
import { generateCodexOAuthCredentialRevision } from "./profile-cipher.service.js";
import { CodexProfileStore } from "./profile-store.service.js";
import {
  CodexOAuthRefreshLock,
  defaultCodexOAuthRefreshLockTtlMillis,
  withCodexOAuthRefreshLock,
} from "./refresh-lock.service.js";
import { CodexSubscriptionProfile } from "./schemas.js";
import type {
  CodexOAuthAccessToken,
  CodexOAuthLoginCallback,
  CodexOAuthLoginStart,
  CodexOAuthLoginStartResult,
  CodexOAuthSubject,
  CodexSubscriptionProfile as CodexSubscriptionProfileType,
  CodexOAuthTokenRefreshResult as CodexOAuthTokenRefreshResultType,
} from "./schemas.js";

const buildRefreshedProfile = (
  profile: CodexSubscriptionProfileType,
  refreshResult: CodexOAuthTokenRefreshResultType
) =>
  Effect.gen(function* buildRefreshedProfileOperation() {
    const nextRevision = yield* generateCodexOAuthCredentialRevision();

    return yield* Schema.decodeUnknownEffect(CodexSubscriptionProfile)({
      ...profile,
      accessToken: Redacted.value(refreshResult.accessToken),
      refreshToken:
        refreshResult.refreshToken === undefined
          ? Redacted.value(profile.refreshToken)
          : Redacted.value(refreshResult.refreshToken),
      accountId:
        refreshResult.accountId === undefined
          ? Redacted.value(profile.accountId)
          : Redacted.value(refreshResult.accountId),
      expiresAtEpochMillis: refreshResult.expiresAtEpochMillis,
      updatedAtEpochMillis: refreshResult.updatedAtEpochMillis,
      lastRefreshedAtEpochMillis: refreshResult.updatedAtEpochMillis,
      credentialRevision: nextRevision,
      requiresReauthentication: false,
    }).pipe(
      Effect.mapError(
        (cause) =>
          new CodexOAuthTokenProviderError({
            operation: "refresh",
            message:
              "Unable to construct the refreshed Codex subscription profile.",
            cause,
          })
      )
    );
  });

const recordObserverEvent = (
  observer: Option.Option<CodexOAuthObserverShape>,
  event: Parameters<CodexOAuthObserverShape["record"]>[0]
) => (Option.isSome(observer) ? observer.value.record(event) : Effect.void);

export interface CodexOAuthServiceShape {
  readonly startLogin: (
    input: CodexOAuthLoginStart
  ) => Effect.Effect<CodexOAuthLoginStartResult, CodexOAuthFailure>;
  readonly completeLogin: (
    input: CodexOAuthLoginCallback
  ) => Effect.Effect<void, CodexOAuthFailure>;
  readonly getValidToken: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<CodexOAuthAccessToken, CodexOAuthFailure>;
  readonly refreshAccessToken: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<CodexOAuthAccessToken, CodexOAuthFailure>;
  readonly revokeToken: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<void, CodexOAuthFailure>;
}

export class CodexOAuthService extends Context.Service<
  CodexOAuthService,
  CodexOAuthServiceShape
>()("@bundjil/codex-oauth/CodexOAuthService") {}

export const makeCodexOAuthService = Effect.gen(function* makeService() {
  const profileStore = yield* CodexProfileStore;
  const oauthClient = yield* CodexOAuthClient;
  const refreshLock = yield* CodexOAuthRefreshLock;
  const commit = yield* CodexOAuthProfileCommit;
  const observer = yield* Effect.serviceOption(CodexOAuthObserver);

  return CodexOAuthService.of({
    startLogin: Effect.fn("CodexOAuthService.startLogin")(
      (input: CodexOAuthLoginStart) => oauthClient.startLogin(input)
    ),
    completeLogin: Effect.fn("CodexOAuthService.completeLogin")(function* (
      input: CodexOAuthLoginCallback
    ) {
      const profile = yield* oauthClient.completeLogin(input);

      if (profile.profileKind === "subscription") {
        yield* commit.initialWrite(profile);
        return;
      }

      yield* profileStore.putProfile(profile);
    }),
    getValidToken: Effect.fn("CodexOAuthService.getValidToken")(function* (
      subject: CodexOAuthSubject
    ) {
      const profile = yield* profileStore.getProfile(subject);
      const nowEpochMillis = yield* Clock.currentTimeMillis;

      if (profile.expiresAtEpochMillis <= nowEpochMillis) {
        return yield* new CodexOAuthTokenExpired({
          profileId: subject.profileId,
          expiresAtEpochMillis: profile.expiresAtEpochMillis,
          nowEpochMillis,
          message: "Codex OAuth access token is expired.",
        });
      }

      return profile.accessToken;
    }),
    refreshAccessToken: Effect.fn("CodexOAuthService.refreshAccessToken")(
      function* (subject: CodexOAuthSubject) {
        return yield* withCodexOAuthRefreshLock(
          {
            subject,
            ttlMillis: defaultCodexOAuthRefreshLockTtlMillis,
          },
          Effect.gen(function* refreshUnderLock() {
            const profile = yield* profileStore.getProfile(subject);
            const nowEpochMillis = yield* Clock.currentTimeMillis;

            if (profile.expiresAtEpochMillis > nowEpochMillis) {
              yield* recordObserverEvent(observer, {
                type: "refreshWinnerUsed",
                profileKind: profile.profileKind,
              });
              return profile.accessToken;
            }

            if (profile.profileKind !== "subscription") {
              return yield* new CodexOAuthTokenMissing({
                profileId: subject.profileId,
                tokenName: "refreshToken",
                message:
                  "Codex OAuth legacy import profiles cannot refresh and require a new local login.",
              });
            }

            yield* recordObserverEvent(observer, {
              type: "refreshStarted",
              profileKind: "subscription",
            });

            const refreshResult = yield* oauthClient.refresh({
              subject,
              refreshToken: profile.refreshToken,
            });

            const refreshedProfile = yield* buildRefreshedProfile(
              profile,
              refreshResult
            );
            const committedProfile = yield* commit
              .refresh({
                expectedRevision: profile.credentialRevision,
                profile: refreshedProfile,
              })
              .pipe(
                Effect.catchTag("CodexOAuthProfileCommitConflict", () =>
                  Effect.gen(function* useWinnerAfterConflict() {
                    yield* recordObserverEvent(observer, {
                      type: "refreshConflict",
                      operation: "refresh",
                      profileKind: "subscription",
                    });
                    const winnerProfile =
                      yield* profileStore.getProfile(subject);

                    if (winnerProfile.profileKind !== "subscription") {
                      return yield* new CodexOAuthTokenProviderError({
                        operation: "refresh",
                        message:
                          "A newer non-refresh-capable profile replaced the subscription profile during refresh.",
                        cause: "stale refresh lost fenced commit",
                      });
                    }

                    yield* recordObserverEvent(observer, {
                      type: "refreshWinnerUsed",
                      profileKind: "subscription",
                    });

                    return winnerProfile;
                  })
                )
              );

            yield* recordObserverEvent(observer, {
              type: "refreshSucceeded",
              operation: "refresh",
              profileKind: "subscription",
            });

            return committedProfile.accessToken;
          })
        ).pipe(Effect.provideService(CodexOAuthRefreshLock, refreshLock));
      }
    ),
    revokeToken: Effect.fn("CodexOAuthService.revokeToken")(function* (
      subject: CodexOAuthSubject
    ) {
      const profile = yield* profileStore.getProfile(subject);

      yield* oauthClient.revoke({
        subject,
        accessToken: profile.accessToken,
        ...(profile.profileKind === "subscription"
          ? { refreshToken: profile.refreshToken }
          : {}),
      });

      return yield* profileStore.removeProfile(subject);
    }),
  });
}).pipe(Effect.withSpan("CodexOAuthServiceLive"));

export const startLogin = (input: CodexOAuthLoginStart) =>
  Effect.gen(function* startLoginOperation() {
    const service = yield* CodexOAuthService;

    return yield* service.startLogin(input);
  });

export const completeLogin = (input: CodexOAuthLoginCallback) =>
  Effect.gen(function* completeLoginOperation() {
    const service = yield* CodexOAuthService;

    return yield* service.completeLogin(input);
  });

export const getValidToken = (subject: CodexOAuthSubject) =>
  Effect.gen(function* getValidTokenOperation() {
    const service = yield* CodexOAuthService;

    return yield* service.getValidToken(subject);
  });

export const refreshAccessToken = (subject: CodexOAuthSubject) =>
  Effect.gen(function* refreshAccessTokenOperation() {
    const service = yield* CodexOAuthService;

    return yield* service.refreshAccessToken(subject);
  });

export const revokeToken = (subject: CodexOAuthSubject) =>
  Effect.gen(function* revokeTokenOperation() {
    const service = yield* CodexOAuthService;

    return yield* service.revokeToken(subject);
  });

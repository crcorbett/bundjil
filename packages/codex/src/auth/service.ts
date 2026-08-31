import { Clock, Context, Effect, Equal, Option } from "effect";

import { generateCodexOAuthCredentialRevision } from "../profiles/cipher.js";
import { CodexOAuthProfileCommit } from "../profiles/commit.js";
import { CodexSubscriptionProfile } from "../profiles/contracts.js";
import type {
  CodexOAuthLoginCallback,
  CodexOAuthLoginStart,
  CodexOAuthLoginStartResult,
  CodexSubscriptionProfile as CodexSubscriptionProfileType,
} from "../profiles/contracts.js";
import { CodexOAuthObserver } from "../profiles/observer.js";
import type { CodexOAuthObserverContract } from "../profiles/observer.js";
import {
  CodexOAuthRefreshLock,
  withCodexOAuthRefreshLock,
} from "../profiles/refresh-lock.js";
import { CodexProfileStore } from "../profiles/store.js";
import { CodexOAuthClient } from "./client.js";
import { CodexOAuthCredential } from "./credentials.js";
import type {
  CodexOAuthAccessToken,
  CodexOAuthCredential as CodexOAuthCredentialType,
  CodexOAuthCredentialRevision,
  CodexOAuthRecoverAfterUnauthorizedInput,
  CodexOAuthSubject,
} from "./credentials.js";
import {
  CodexAuthTemporarilyUnavailable,
  CodexReauthenticationRequired,
  CodexOAuthTokenExpired,
  CodexOAuthOperationError,
} from "./errors.js";
import type {
  CodexOAuthFailure,
  CodexSubscriptionAuthError,
} from "./errors.js";
import { CodexOAuthRefreshPolicyService } from "./refresh-config.js";

const recordObserverEvent = (
  observer: Option.Option<CodexOAuthObserverContract>,
  event: Parameters<CodexOAuthObserverContract["record"]>[0]
) => (Option.isSome(observer) ? observer.value.record(event) : Effect.void);

export interface CodexOAuthServiceContract {
  readonly startLogin: (
    input: CodexOAuthLoginStart
  ) => Effect.Effect<CodexOAuthLoginStartResult, CodexOAuthFailure>;
  readonly completeLogin: (
    input: CodexOAuthLoginCallback
  ) => Effect.Effect<void, CodexOAuthFailure>;
  readonly getValidToken: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<CodexOAuthAccessToken, CodexOAuthFailure>;
  readonly getValidCredential: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<CodexOAuthCredentialType, CodexOAuthFailure>;
  readonly refreshAccessToken: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<CodexOAuthAccessToken, CodexOAuthFailure>;
  readonly recoverAfterUnauthorized: (
    input: CodexOAuthRecoverAfterUnauthorizedInput
  ) => Effect.Effect<CodexOAuthCredentialType, CodexOAuthFailure>;
  readonly revokeToken: (
    subject: CodexOAuthSubject
  ) => Effect.Effect<void, CodexOAuthFailure>;
}

export class CodexOAuthService extends Context.Service<
  CodexOAuthService,
  CodexOAuthServiceContract
>()("@bundjil/codex/CodexOAuthService") {}

export const makeCodexOAuthService = Effect.gen(function* makeService() {
  const profileStore = yield* CodexProfileStore;
  const oauthClient = yield* CodexOAuthClient;
  const refreshLock = yield* CodexOAuthRefreshLock;
  const refreshPolicy = yield* CodexOAuthRefreshPolicyService;
  const commit = yield* CodexOAuthProfileCommit;
  const observer = yield* Effect.serviceOption(CodexOAuthObserver);

  const credentialFromProfile = Effect.fn(
    "CodexOAuthService.credentialFromProfile"
  )(function* (profile: CodexSubscriptionProfileType) {
    return yield* CodexOAuthCredential.makeEffect({
      accessToken: profile.accessToken,
      accountId: profile.accountId,
      credentialRevision: profile.credentialRevision,
    }).pipe(
      Effect.mapError(
        () =>
          new CodexOAuthOperationError({
            operation: "refresh",
            message: "Unable to construct the atomic Codex OAuth credential.",
          })
      )
    );
  });

  const requireSubscriptionProfile = Effect.fn(
    "CodexOAuthService.requireSubscriptionProfile"
  )(function* (subject: CodexOAuthSubject) {
    const profile = yield* profileStore.getProfile(subject);

    if (
      profile.profileKind !== "subscription" ||
      profile.requiresReauthentication
    ) {
      return yield* new CodexReauthenticationRequired({
        profileId: subject.profileId,
        message:
          "Codex subscription authorization requires a new trusted-local login.",
      });
    }

    return profile;
  });

  const markReauthenticationRequired = Effect.fn(
    "CodexOAuthService.markReauthenticationRequired"
  )(function* (profile: CodexSubscriptionProfileType) {
    const nowEpochMillis = yield* Clock.currentTimeMillis;
    const credentialRevision = yield* generateCodexOAuthCredentialRevision();
    const markedProfile = yield* CodexSubscriptionProfile.makeEffect({
      ...profile,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
      accountId: profile.accountId,
      credentialRevision,
      requiresReauthentication: true,
      updatedAtEpochMillis: nowEpochMillis,
    }).pipe(
      Effect.mapError(
        () =>
          new CodexOAuthOperationError({
            operation: "refresh",
            message: "Unable to construct the Codex reauthentication marker.",
          })
      )
    );

    yield* commit
      .markReauthenticationRequired({
        expectedRevision: profile.credentialRevision,
        profile: markedProfile,
      })
      .pipe(
        Effect.catchTag("CodexOAuthProfileCommitConflict", () => Effect.void)
      );

    return yield* new CodexReauthenticationRequired({
      profileId: profile.subject.profileId,
      message:
        "Codex subscription authorization requires a new trusted-local login.",
    });
  });

  const classifyRefreshFailure = Effect.fn(
    "CodexOAuthService.classifyRefreshFailure"
  )(function* (
    profile: CodexSubscriptionProfileType,
    error: CodexSubscriptionAuthError
  ) {
    if (error.reason === "transportFailure") {
      return yield* new CodexAuthTemporarilyUnavailable({
        reason: "network",
        message: "Codex authorization is temporarily unavailable.",
      });
    }

    if (error.reason === "timeout") {
      return yield* new CodexAuthTemporarilyUnavailable({
        reason: "timeout",
        message: "Codex authorization is temporarily unavailable.",
      });
    }

    if (error.reason === "providerRejected" && error.status === 429) {
      return yield* new CodexAuthTemporarilyUnavailable({
        reason: "rateLimited",
        message: "Codex authorization is temporarily unavailable.",
      });
    }

    if (
      error.reason === "providerRejected" &&
      error.status !== undefined &&
      error.status >= 500
    ) {
      return yield* new CodexAuthTemporarilyUnavailable({
        reason: "providerUnavailable",
        message: "Codex authorization is temporarily unavailable.",
      });
    }

    if (
      error.reason === "providerRejected" &&
      (error.providerCode === "invalid_grant" ||
        error.status === 400 ||
        error.status === 401 ||
        error.status === 403)
    ) {
      return yield* markReauthenticationRequired(profile);
    }

    return yield* new CodexReauthenticationRequired({
      profileId: profile.subject.profileId,
      message:
        "Codex subscription authorization requires a new trusted-local login.",
    });
  });

  const awaitContendedRefreshWinner: (
    subject: CodexOAuthSubject,
    deadlineEpochMillis: number
  ) => Effect.Effect<CodexOAuthCredentialType, CodexOAuthFailure> = Effect.fn(
    "CodexOAuthService.awaitContendedRefreshWinner"
  )(function* (subject: CodexOAuthSubject, deadlineEpochMillis: number) {
    const profile = yield* requireSubscriptionProfile(subject);
    const nowEpochMillis = yield* Clock.currentTimeMillis;

    if (profile.expiresAtEpochMillis > nowEpochMillis) {
      yield* recordObserverEvent(observer, {
        type: "refreshWinnerUsed",
        profileKind: "subscription",
      });
      return yield* credentialFromProfile(profile);
    }

    if (nowEpochMillis >= deadlineEpochMillis) {
      return yield* new CodexAuthTemporarilyUnavailable({
        reason: "lockContended",
        message: "Codex authorization is temporarily unavailable.",
      });
    }

    yield* Effect.sleep("50 millis");
    return yield* awaitContendedRefreshWinner(subject, deadlineEpochMillis);
  });

  const refreshCredential = Effect.fn("CodexOAuthService.refreshCredential")(
    function* (
      subject: CodexOAuthSubject,
      observedCredentialRevision?: CodexOAuthCredentialRevision
    ) {
      return yield* withCodexOAuthRefreshLock(
        {
          subject,
          ttlMillis: refreshPolicy.lockTtlMillis,
        },
        Effect.gen(function* refreshCredentialUnderLock() {
          const profile = yield* requireSubscriptionProfile(subject);
          const nowEpochMillis = yield* Clock.currentTimeMillis;

          if (
            observedCredentialRevision !== undefined &&
            profile.credentialRevision !== observedCredentialRevision &&
            profile.expiresAtEpochMillis > nowEpochMillis
          ) {
            yield* recordObserverEvent(observer, {
              type: "refreshWinnerUsed",
              profileKind: "subscription",
            });
            return yield* credentialFromProfile(profile);
          }

          if (
            observedCredentialRevision === undefined &&
            profile.expiresAtEpochMillis >
              nowEpochMillis + refreshPolicy.refreshSkewMillis
          ) {
            yield* recordObserverEvent(observer, {
              type: "refreshWinnerUsed",
              profileKind: "subscription",
            });
            return yield* credentialFromProfile(profile);
          }

          yield* recordObserverEvent(observer, {
            type: "refreshStarted",
            profileKind: "subscription",
          });

          const refreshResult = yield* oauthClient
            .refresh({
              subject,
              refreshToken: profile.refreshToken,
            })
            .pipe(
              Effect.catchTag("CodexSubscriptionAuthError", (error) =>
                classifyRefreshFailure(profile, error)
              )
            );
          const afterRefreshEpochMillis = yield* Clock.currentTimeMillis;

          if (refreshResult.expiresAtEpochMillis <= afterRefreshEpochMillis) {
            return yield* new CodexReauthenticationRequired({
              profileId: subject.profileId,
              message:
                "Codex subscription authorization requires a new trusted-local login.",
            });
          }

          if (
            refreshResult.accountId !== undefined &&
            !Equal.equals(refreshResult.accountId, profile.accountId)
          ) {
            return yield* new CodexReauthenticationRequired({
              profileId: subject.profileId,
              message:
                "Codex subscription authorization requires a new trusted-local login.",
            });
          }

          const credentialRevision =
            yield* generateCodexOAuthCredentialRevision();
          const refreshedProfile = yield* CodexSubscriptionProfile.makeEffect({
            ...profile,
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken ?? profile.refreshToken,
            accountId: profile.accountId,
            expiresAtEpochMillis: refreshResult.expiresAtEpochMillis,
            updatedAtEpochMillis: refreshResult.updatedAtEpochMillis,
            lastRefreshedAtEpochMillis: refreshResult.updatedAtEpochMillis,
            credentialRevision,
            requiresReauthentication: false,
          }).pipe(
            Effect.mapError(
              () =>
                new CodexOAuthOperationError({
                  operation: "refresh",
                  message:
                    "Unable to construct the refreshed Codex subscription profile.",
                })
            )
          );
          const committedProfile = yield* commit
            .refresh({
              expectedRevision: profile.credentialRevision,
              profile: refreshedProfile,
            })
            .pipe(
              Effect.catchTag("CodexOAuthProfileCommitConflict", () =>
                Effect.gen(function* readRefreshWinner() {
                  yield* recordObserverEvent(observer, {
                    type: "refreshConflict",
                    operation: "refresh",
                    profileKind: "subscription",
                  });
                  return yield* requireSubscriptionProfile(subject);
                })
              )
            );
          const committedAtEpochMillis = yield* Clock.currentTimeMillis;

          if (committedProfile.expiresAtEpochMillis <= committedAtEpochMillis) {
            return yield* new CodexAuthTemporarilyUnavailable({
              reason: "lockContended",
              message: "Codex authorization is temporarily unavailable.",
            });
          }

          yield* recordObserverEvent(observer, {
            type: "refreshSucceeded",
            operation: "refresh",
            profileKind: "subscription",
          });

          return yield* credentialFromProfile(committedProfile);
        })
      ).pipe(
        Effect.provideService(CodexOAuthRefreshLock, refreshLock),
        Effect.catchTags({
          CodexOAuthRefreshLockError: (error) =>
            error.reason === "contended"
              ? Effect.gen(function* readContendedWinner() {
                  const nowEpochMillis = yield* Clock.currentTimeMillis;

                  return yield* awaitContendedRefreshWinner(
                    subject,
                    nowEpochMillis + refreshPolicy.lockTtlMillis
                  );
                })
              : Effect.fail(error),
        })
      );
    }
  );

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
    getValidCredential: Effect.fn("CodexOAuthService.getValidCredential")(
      function* (subject: CodexOAuthSubject) {
        const profile = yield* requireSubscriptionProfile(subject);
        const nowEpochMillis = yield* Clock.currentTimeMillis;

        return profile.expiresAtEpochMillis >
          nowEpochMillis + refreshPolicy.refreshSkewMillis
          ? yield* credentialFromProfile(profile)
          : yield* refreshCredential(subject);
      }
    ),
    refreshAccessToken: Effect.fn("CodexOAuthService.refreshAccessToken")(
      function* (subject: CodexOAuthSubject) {
        return (yield* refreshCredential(subject)).accessToken;
      }
    ),
    recoverAfterUnauthorized: Effect.fn(
      "CodexOAuthService.recoverAfterUnauthorized"
    )((input: CodexOAuthRecoverAfterUnauthorizedInput) =>
      refreshCredential(input.subject, input.observedCredentialRevision)
    ),
    revokeToken: Effect.fn("CodexOAuthService.revokeToken")(function* (
      subject: CodexOAuthSubject
    ) {
      const profile = yield* profileStore.getProfile(subject);

      yield* oauthClient.revoke(
        profile.profileKind === "subscription"
          ? {
              subject,
              accessToken: profile.accessToken,
              refreshToken: profile.refreshToken,
            }
          : { subject, accessToken: profile.accessToken }
      );

      return yield* profileStore.removeProfile(subject);
    }),
  });
}).pipe(Effect.withSpan("CodexOAuthServiceLive"));

export const startLogin = Effect.fnUntraced(function* startLoginOperation(
  input: CodexOAuthLoginStart
) {
  const service = yield* CodexOAuthService;
  return yield* service.startLogin(input);
});

export const completeLogin = Effect.fnUntraced(function* completeLoginOperation(
  input: CodexOAuthLoginCallback
) {
  const service = yield* CodexOAuthService;
  return yield* service.completeLogin(input);
});

export const getValidToken = Effect.fnUntraced(function* getValidTokenOperation(
  subject: CodexOAuthSubject
) {
  const service = yield* CodexOAuthService;
  return yield* service.getValidToken(subject);
});

export const getValidCredential = Effect.fnUntraced(
  function* getValidCredentialOperation(subject: CodexOAuthSubject) {
    const service = yield* CodexOAuthService;
    return yield* service.getValidCredential(subject);
  }
);

export const refreshAccessToken = Effect.fnUntraced(
  function* refreshAccessTokenOperation(subject: CodexOAuthSubject) {
    const service = yield* CodexOAuthService;
    return yield* service.refreshAccessToken(subject);
  }
);

export const recoverAfterUnauthorized = Effect.fnUntraced(
  function* recoverAfterUnauthorizedOperation(
    input: CodexOAuthRecoverAfterUnauthorizedInput
  ) {
    const service = yield* CodexOAuthService;
    return yield* service.recoverAfterUnauthorized(input);
  }
);

export const revokeToken = Effect.fnUntraced(function* revokeTokenOperation(
  subject: CodexOAuthSubject
) {
  const service = yield* CodexOAuthService;
  return yield* service.revokeToken(subject);
});

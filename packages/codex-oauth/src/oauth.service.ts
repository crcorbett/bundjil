import { Clock, Context, Effect } from "effect";

import { CodexOAuthTokenExpired, CodexOAuthTokenMissing } from "./errors.js";
import type { CodexOAuthFailure } from "./errors.js";
import { CodexOAuthClient } from "./oauth-client.service.js";
import { CodexProfileStore } from "./profile-store.service.js";
import type {
  CodexOAuthAccessToken,
  CodexOAuthLoginCallback,
  CodexOAuthLoginStart,
  CodexOAuthLoginStartResult,
  CodexOAuthSubject,
} from "./schemas.js";

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

  return CodexOAuthService.of({
    startLogin: Effect.fn("CodexOAuthService.startLogin")(
      (input: CodexOAuthLoginStart) => oauthClient.startLogin(input)
    ),
    completeLogin: Effect.fn("CodexOAuthService.completeLogin")(function* (
      input: CodexOAuthLoginCallback
    ) {
      const profile = yield* oauthClient.completeLogin(input);

      return yield* profileStore.putProfile(profile);
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
        const profile = yield* profileStore.getProfile(subject);

        if (profile.refreshToken === undefined) {
          return yield* new CodexOAuthTokenMissing({
            profileId: subject.profileId,
            tokenName: "refreshToken",
            message: "Codex OAuth profile has no refresh token.",
          });
        }

        const refreshResult = yield* oauthClient.refresh({
          subject,
          refreshToken: profile.refreshToken,
        });

        yield* profileStore.putProfile({
          ...profile,
          accessToken: refreshResult.accessToken,
          ...(refreshResult.refreshToken === undefined
            ? {}
            : { refreshToken: refreshResult.refreshToken }),
          expiresAtEpochMillis: refreshResult.expiresAtEpochMillis,
          updatedAtEpochMillis: refreshResult.updatedAtEpochMillis,
          requiresReauthentication: false,
        });

        return refreshResult.accessToken;
      }
    ),
    revokeToken: Effect.fn("CodexOAuthService.revokeToken")(function* (
      subject: CodexOAuthSubject
    ) {
      const profile = yield* profileStore.getProfile(subject);

      yield* oauthClient.revoke({
        subject,
        accessToken: profile.accessToken,
        ...(profile.refreshToken === undefined
          ? {}
          : { refreshToken: profile.refreshToken }),
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

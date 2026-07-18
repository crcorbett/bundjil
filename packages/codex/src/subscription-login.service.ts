import {
  Clock,
  Context,
  Effect,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";

import { CodexBrowserLauncher } from "./browser-launcher.service.js";
import { CodexOAuthProfileCommit } from "./commit.service.js";
import type { CodexSubscriptionAuthFailure } from "./errors.js";
import { CodexSubscriptionAuthError } from "./errors.js";
import { CodexLoopbackCallback } from "./loopback-callback.service.js";
import { CodexOAuthHttpClient } from "./oauth-http-client.service.js";
import {
  decodeCodexAccessTokenExpiry,
  decodeCodexAccountMetadata,
} from "./oauth-token-metadata.js";
import { generateCodexOAuthCredentialRevision } from "./profile-cipher.service.js";
import { CodexProfileStore } from "./profile-store.service.js";
import {
  CodexSubscriptionLoginResult,
  CodexSubscriptionProfile,
} from "./schemas.js";
import type {
  CodexOAuthProfile,
  CodexSubscriptionLoginInput,
  CodexSubscriptionLoginResult as CodexSubscriptionLoginResultType,
} from "./schemas.js";
import {
  buildCodexOAuthAuthorizationSession,
  CodexSubscriptionAuthProtocolConfigService,
  createCodexOAuthAuthorizationMaterial,
} from "./subscription-auth-protocol.service.js";

export interface CodexSubscriptionLoginShape {
  readonly run: (
    input: CodexSubscriptionLoginInput
  ) => Effect.Effect<
    CodexSubscriptionLoginResultType,
    CodexSubscriptionAuthFailure
  >;
}

export class CodexSubscriptionLogin extends Context.Service<
  CodexSubscriptionLogin,
  CodexSubscriptionLoginShape
>()("@bundjil/codex/CodexSubscriptionLogin") {}

export const makeCodexSubscriptionLogin = Effect.gen(
  function* makeCodexSubscriptionLoginOperation() {
    const browser = yield* CodexBrowserLauncher;
    const callback = yield* CodexLoopbackCallback;
    const commit = yield* CodexOAuthProfileCommit;
    const http = yield* CodexOAuthHttpClient;
    const protocol = yield* CodexSubscriptionAuthProtocolConfigService;
    const store = yield* CodexProfileStore;

    return CodexSubscriptionLogin.of({
      run: Effect.fn("CodexSubscriptionLogin.run")((input) =>
        Effect.gen(function* runCodexSubscriptionLogin() {
          const existingProfile = yield* store.getProfile(input.subject).pipe(
            Effect.map(Option.some),
            Effect.catchTag("OAuthProfileNotFound", () =>
              Effect.succeed(Option.none<CodexOAuthProfile>())
            )
          );
          const material = yield* createCodexOAuthAuthorizationMaterial();
          const callbackSession = yield* callback.open(material.state);
          const authorizationSession =
            yield* buildCodexOAuthAuthorizationSession(
              material,
              callbackSession.redirectUri
            ).pipe(
              Effect.provideService(
                CodexSubscriptionAuthProtocolConfigService,
                protocol
              )
            );

          yield* browser.open(authorizationSession.authorizationUrl);

          const authorizationCallback = yield* callbackSession.awaitCallback(
            input.callbackTimeoutMillis
          );
          const tokens = yield* http.exchangeAuthorizationCode({
            code: authorizationCallback.code,
            codeVerifier: authorizationSession.codeVerifier,
            redirectUri: authorizationCallback.redirectUri,
          });
          const expiry = yield* decodeCodexAccessTokenExpiry(
            tokens.access_token
          );
          const now = yield* Clock.currentTimeMillis;

          if (expiry.expiresAtEpochMillis <= now) {
            return yield* new CodexSubscriptionAuthError({
              operation: "decodeTokenMetadata",
              reason: "tokenExpired",
              message: "The exchanged Codex OAuth access token is expired.",
            });
          }

          const account = yield* decodeCodexAccountMetadata(tokens.id_token);
          const credentialRevision =
            yield* generateCodexOAuthCredentialRevision();
          const profile = yield* Schema.decodeUnknownEffect(
            CodexSubscriptionProfile
          )({
            profileVersion: 2,
            profileKind: "subscription",
            subject: input.subject,
            accessToken: Redacted.value(tokens.access_token),
            refreshToken: Redacted.value(tokens.refresh_token),
            expiresAtEpochMillis: expiry.expiresAtEpochMillis,
            accountId: Redacted.value(account.accountId),
            protocolScopeVersion: protocol.config.protocolScopeVersion,
            scopes: [...protocol.config.scopes],
            createdAtEpochMillis: Option.isSome(existingProfile)
              ? existingProfile.value.createdAtEpochMillis
              : now,
            updatedAtEpochMillis: now,
            lastRefreshedAtEpochMillis: now,
            credentialRevision,
            requiresReauthentication: false,
          }).pipe(
            Effect.mapError(
              () =>
                new CodexSubscriptionAuthError({
                  operation: "completeLogin",
                  reason: "tokenMetadataInvalid",
                  message:
                    "Unable to construct the subscription OAuth profile.",
                })
            )
          );

          yield* Option.match(existingProfile, {
            onNone: () => commit.initialWrite(profile),
            onSome: (storedProfile) =>
              storedProfile.profileKind === "subscription"
                ? commit.replace({
                    profile,
                    expectedRevision: storedProfile.credentialRevision,
                  })
                : commit.replaceLegacy({
                    expectedLegacyProfile: storedProfile,
                    profile,
                  }),
          });

          return yield* Schema.decodeUnknownEffect(
            CodexSubscriptionLoginResult
          )({
            profileId: input.subject.profileId,
            mode: "chatgpt",
            expiryCategory: "valid",
            refreshCapable: true,
            encryptedStore: "stored",
          }).pipe(
            Effect.mapError(
              () =>
                new CodexSubscriptionAuthError({
                  operation: "completeLogin",
                  reason: "tokenMetadataInvalid",
                  message: "Unable to encode the sanitized login result.",
                })
            )
          );
        }).pipe(Effect.scoped)
      ),
    });
  }
).pipe(Effect.withSpan("CodexSubscriptionLoginLive"));

export const CodexSubscriptionLoginLive = Layer.effect(
  CodexSubscriptionLogin,
  makeCodexSubscriptionLogin
);

export const runCodexSubscriptionLogin = (input: CodexSubscriptionLoginInput) =>
  Effect.gen(function* runCodexSubscriptionLoginOperation() {
    const login = yield* CodexSubscriptionLogin;

    return yield* login.run(input);
  });

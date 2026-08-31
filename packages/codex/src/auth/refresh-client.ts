import { Clock, Effect, Layer } from "effect";

import {
  CodexOAuthClient,
  unsupportedCodexOAuthClientOperation,
} from "./client.js";
import { CodexOAuthTokenRefreshResult } from "./credentials.js";
import { CodexSubscriptionAuthError } from "./errors.js";
import { CodexOAuthHttpClient } from "./http-client.js";
import {
  decodeCodexAccessTokenExpiry,
  decodeCodexAccountMetadata,
} from "./token-metadata.js";

export const makeCodexOAuthRefreshClient = Effect.gen(
  function* makeCodexOAuthRefreshClientOperation() {
    const http = yield* CodexOAuthHttpClient;

    return CodexOAuthClient.of({
      startLogin: () => unsupportedCodexOAuthClientOperation("startLogin"),
      completeLogin: () =>
        unsupportedCodexOAuthClientOperation("completeLogin"),
      revoke: () => unsupportedCodexOAuthClientOperation("revoke"),
      refresh: Effect.fn("CodexOAuthRefreshClient.refresh")(function* (input) {
        const response = yield* http.refresh({
          refreshToken: input.refreshToken,
        });

        if (response.access_token === undefined) {
          return yield* new CodexSubscriptionAuthError({
            operation: "refreshToken",
            reason: "tokenResponseInvalid",
            message:
              "The Codex OAuth refresh response omitted an access token.",
          });
        }

        const expiry = yield* decodeCodexAccessTokenExpiry(
          response.access_token
        );
        const account =
          response.id_token === undefined
            ? undefined
            : yield* decodeCodexAccountMetadata(response.id_token);
        const updatedAtEpochMillis = yield* Clock.currentTimeMillis;

        const requiredResult = {
          subject: input.subject,
          accessToken: response.access_token,
          expiresAtEpochMillis: expiry.expiresAtEpochMillis,
          updatedAtEpochMillis,
        };
        const refreshResult =
          response.refresh_token === undefined
            ? requiredResult
            : { ...requiredResult, refreshToken: response.refresh_token };
        const result =
          account === undefined
            ? refreshResult
            : { ...refreshResult, accountId: account.accountId };
        return yield* CodexOAuthTokenRefreshResult.makeEffect(result).pipe(
          Effect.mapError(
            () =>
              new CodexSubscriptionAuthError({
                operation: "refreshToken",
                reason: "tokenResponseInvalid",
                message: "The Codex OAuth refresh response was invalid.",
              })
          )
        );
      }),
    });
  }
).pipe(Effect.withSpan("CodexOAuthRefreshClientLive"));

export const CodexOAuthRefreshClientLive = Layer.effect(
  CodexOAuthClient,
  makeCodexOAuthRefreshClient
);

import { Clock, Effect, Layer, Redacted, Schema } from "effect";

import { CodexSubscriptionAuthError } from "./errors.js";
import {
  CodexOAuthClient,
  unsupportedCodexOAuthClientOperation,
} from "./oauth-client.service.js";
import { CodexOAuthHttpClient } from "./oauth-http-client.service.js";
import {
  decodeCodexAccessTokenExpiry,
  decodeCodexAccountMetadata,
} from "./oauth-token-metadata.js";
import { CodexOAuthTokenRefreshResult } from "./schemas.js";

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

        return yield* Schema.decodeUnknownEffect(CodexOAuthTokenRefreshResult)({
          subject: input.subject,
          accessToken: Redacted.value(response.access_token),
          ...(response.refresh_token === undefined
            ? {}
            : { refreshToken: Redacted.value(response.refresh_token) }),
          ...(account === undefined
            ? {}
            : { accountId: Redacted.value(account.accountId) }),
          expiresAtEpochMillis: expiry.expiresAtEpochMillis,
          updatedAtEpochMillis,
        }).pipe(
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

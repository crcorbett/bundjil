import { Effect, Equal, Redacted, Schema } from "effect";

import { CodexSubscriptionAuthError } from "./errors.js";
import { CodexOAuthAccountMetadata, CodexOAuthJwtExpiry } from "./schemas.js";
import type {
  CodexOAuthAccessToken,
  CodexOAuthAccountMetadata as CodexOAuthAccountMetadataType,
  CodexOAuthIdToken,
} from "./schemas.js";

const JwtParts = Schema.TemplateLiteral([
  Schema.String,
  Schema.Literal("."),
  Schema.String,
  Schema.Literal("."),
  Schema.String,
]);

const JwtExpiryClaims = Schema.Struct({
  exp: Schema.Int,
});

const IdTokenClaims = Schema.Struct({
  "https://api.openai.com/auth": Schema.Struct({
    chatgpt_account_id: Schema.NonEmptyString,
  }),
});

const decodeJwtPayload = Effect.fn("CodexSubscriptionAuth.decodeJwtPayload")(
  function* (token: string) {
    const jwt = yield* Schema.decodeUnknownEffect(JwtParts)(token).pipe(
      Effect.mapError(
        () =>
          new CodexSubscriptionAuthError({
            operation: "decodeTokenMetadata",
            reason: "tokenMetadataInvalid",
            message: "The OAuth token is not a valid JWT.",
          })
      )
    );
    const [, payload] = jwt.split(".");

    if (payload === undefined) {
      return yield* new CodexSubscriptionAuthError({
        operation: "decodeTokenMetadata",
        reason: "tokenMetadataInvalid",
        message: "The OAuth token has no JWT payload.",
      });
    }

    const bytes = yield* Schema.decodeUnknownEffect(
      Schema.Uint8ArrayFromBase64Url
    )(payload).pipe(
      Effect.mapError(
        () =>
          new CodexSubscriptionAuthError({
            operation: "decodeTokenMetadata",
            reason: "tokenMetadataInvalid",
            message: "The OAuth token payload is not valid base64url.",
          })
      )
    );

    return new TextDecoder().decode(bytes);
  }
);

export const decodeCodexAccessTokenExpiry = Effect.fn(
  "CodexSubscriptionAuth.decodeAccessTokenExpiry"
)(function* (accessToken: CodexOAuthAccessToken) {
  const payload = yield* decodeJwtPayload(Redacted.value(accessToken));
  const claims = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(JwtExpiryClaims)
  )(payload).pipe(
    Effect.mapError(
      () =>
        new CodexSubscriptionAuthError({
          operation: "decodeTokenMetadata",
          reason: "tokenMetadataInvalid",
          message: "The OAuth access token has no valid expiry claim.",
        })
    )
  );

  return yield* Schema.decodeUnknownEffect(CodexOAuthJwtExpiry)({
    expiresAtEpochMillis: claims.exp * 1000,
  }).pipe(
    Effect.mapError(
      () =>
        new CodexSubscriptionAuthError({
          operation: "decodeTokenMetadata",
          reason: "tokenMetadataInvalid",
          message: "The OAuth access token expiry is invalid.",
        })
    )
  );
});

export const decodeCodexAccountMetadata = Effect.fn(
  "CodexSubscriptionAuth.decodeAccountMetadata"
)(function* (idToken: CodexOAuthIdToken) {
  const payload = yield* decodeJwtPayload(Redacted.value(idToken));
  const claims = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(IdTokenClaims)
  )(payload).pipe(
    Effect.mapError(
      () =>
        new CodexSubscriptionAuthError({
          operation: "decodeTokenMetadata",
          reason: "tokenMetadataInvalid",
          message:
            "The OAuth ID token has no canonical ChatGPT account metadata.",
        })
    )
  );

  return yield* Schema.decodeUnknownEffect(CodexOAuthAccountMetadata)({
    accountId: claims["https://api.openai.com/auth"].chatgpt_account_id,
  }).pipe(
    Effect.mapError(
      () =>
        new CodexSubscriptionAuthError({
          operation: "decodeTokenMetadata",
          reason: "tokenMetadataInvalid",
          message: "The OAuth account metadata is invalid.",
        })
    )
  );
});

export const ensureCodexRefreshAccount = Effect.fn(
  "CodexSubscriptionAuth.ensureRefreshAccount"
)(function* (
  expected: CodexOAuthAccountMetadataType,
  received: CodexOAuthAccountMetadataType
) {
  if (!Equal.equals(expected.accountId, received.accountId)) {
    return yield* new CodexSubscriptionAuthError({
      operation: "decodeTokenMetadata",
      reason: "crossAccountRefresh",
      message: "The refreshed credential belongs to another ChatGPT account.",
    });
  }

  return received;
});

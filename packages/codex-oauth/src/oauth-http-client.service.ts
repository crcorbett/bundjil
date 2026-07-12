import { Context, Effect, Layer, Redacted, Schema } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import { CodexSubscriptionAuthError } from "./errors.js";
import {
  CodexOAuthProviderErrorResponse,
  CodexOAuthRefreshResponse,
  CodexOAuthTokenResponse,
} from "./schemas.js";
import type {
  CodexOAuthCodeExchangeInput,
  CodexOAuthRefreshResponse as CodexOAuthRefreshResponseType,
  CodexOAuthRefreshTransportInput,
  CodexOAuthTokenResponse as CodexOAuthTokenResponseType,
} from "./schemas.js";
import { CodexSubscriptionAuthProtocolConfigService } from "./subscription-auth-protocol.service.js";

export interface CodexOAuthHttpClientShape {
  readonly exchangeAuthorizationCode: (
    input: CodexOAuthCodeExchangeInput
  ) => Effect.Effect<CodexOAuthTokenResponseType, CodexSubscriptionAuthError>;
  readonly refresh: (
    input: CodexOAuthRefreshTransportInput
  ) => Effect.Effect<CodexOAuthRefreshResponseType, CodexSubscriptionAuthError>;
}

export class CodexOAuthHttpClient extends Context.Service<
  CodexOAuthHttpClient,
  CodexOAuthHttpClientShape
>()("@bundjil/codex-oauth/CodexOAuthHttpClient") {}

const RefreshRequest = Schema.Struct({
  client_id: Schema.NonEmptyString,
  grant_type: Schema.Literal("refresh_token"),
  refresh_token: Schema.NonEmptyString,
});

const mapTransportFailure = (
  operation: "exchangeAuthorizationCode" | "refreshToken"
) =>
  new CodexSubscriptionAuthError({
    operation,
    reason: "transportFailure",
    message: "The Codex OAuth token endpoint request failed.",
  });

const mapResponseFailure = (
  operation: "exchangeAuthorizationCode" | "refreshToken"
) =>
  new CodexSubscriptionAuthError({
    operation,
    reason: "tokenResponseInvalid",
    message: "The Codex OAuth token endpoint returned an invalid response.",
  });

const decodeProviderRejection = Effect.fn(
  "CodexOAuthHttpClient.decodeProviderRejection"
)(function* (
  response: HttpClientResponse.HttpClientResponse,
  operation: "exchangeAuthorizationCode" | "refreshToken"
) {
  yield* HttpClientResponse.schemaBodyJson(CodexOAuthProviderErrorResponse)(
    response
  ).pipe(Effect.mapError(() => mapResponseFailure(operation)));

  return yield* new CodexSubscriptionAuthError({
    operation,
    reason: "providerRejected",
    message: "The Codex OAuth token endpoint rejected the request.",
  });
});

export const makeCodexOAuthHttpClient = Effect.gen(
  function* makeCodexOAuthHttpClientOperation() {
    const client = yield* HttpClient.HttpClient;
    const protocol = yield* CodexSubscriptionAuthProtocolConfigService;

    return CodexOAuthHttpClient.of({
      exchangeAuthorizationCode: Effect.fn(
        "CodexOAuthHttpClient.exchangeAuthorizationCode"
      )(function* (input) {
        const request = HttpClientRequest.post(
          protocol.config.tokenEndpoint
        ).pipe(
          HttpClientRequest.bodyUrlParams([
            ["grant_type", "authorization_code"],
            ["code", Redacted.value(input.code)],
            ["redirect_uri", input.redirectUri],
            ["client_id", protocol.config.clientId],
            ["code_verifier", Redacted.value(input.codeVerifier)],
          ])
        );
        const response = yield* client
          .execute(request)
          .pipe(
            Effect.mapError(() =>
              mapTransportFailure("exchangeAuthorizationCode")
            )
          );

        if (response.status < 200 || response.status >= 300) {
          return yield* decodeProviderRejection(
            response,
            "exchangeAuthorizationCode"
          );
        }

        return yield* HttpClientResponse.schemaBodyJson(
          CodexOAuthTokenResponse
        )(response).pipe(
          Effect.mapError(() => mapResponseFailure("exchangeAuthorizationCode"))
        );
      }),
      refresh: Effect.fn("CodexOAuthHttpClient.refresh")(function* (input) {
        const body = yield* Schema.decodeUnknownEffect(RefreshRequest)({
          client_id: protocol.config.clientId,
          grant_type: "refresh_token",
          refresh_token: Redacted.value(input.refreshToken),
        }).pipe(Effect.mapError(() => mapResponseFailure("refreshToken")));
        const request = yield* HttpClientRequest.post(
          protocol.config.tokenEndpoint
        ).pipe(
          HttpClientRequest.schemaBodyJson(RefreshRequest)(body),
          Effect.mapError(() => mapResponseFailure("refreshToken"))
        );
        const response = yield* client
          .execute(request)
          .pipe(Effect.mapError(() => mapTransportFailure("refreshToken")));

        if (response.status < 200 || response.status >= 300) {
          return yield* decodeProviderRejection(response, "refreshToken");
        }

        return yield* HttpClientResponse.schemaBodyJson(
          CodexOAuthRefreshResponse
        )(response).pipe(
          Effect.mapError(() => mapResponseFailure("refreshToken"))
        );
      }),
    });
  }
).pipe(Effect.withSpan("CodexOAuthHttpClientLive"));

export const CodexOAuthHttpClientLive = Layer.effect(
  CodexOAuthHttpClient,
  makeCodexOAuthHttpClient
);

export interface CodexOAuthHttpClientMockOptions {
  readonly exchangeAuthorizationCode?: CodexOAuthHttpClientShape["exchangeAuthorizationCode"];
  readonly refresh?: CodexOAuthHttpClientShape["refresh"];
}

const unseededMock = (
  operation: "exchangeAuthorizationCode" | "refreshToken"
) =>
  Effect.fail(
    new CodexSubscriptionAuthError({
      operation,
      reason: "transportFailure",
      message: "The Codex OAuth HTTP mock is not seeded for this operation.",
    })
  );

export const CodexOAuthHttpClientMock = (
  options: CodexOAuthHttpClientMockOptions = {}
) =>
  Layer.succeed(
    CodexOAuthHttpClient,
    CodexOAuthHttpClient.of({
      exchangeAuthorizationCode:
        options.exchangeAuthorizationCode ??
        (() => unseededMock("exchangeAuthorizationCode")),
      refresh: options.refresh ?? (() => unseededMock("refreshToken")),
    })
  );

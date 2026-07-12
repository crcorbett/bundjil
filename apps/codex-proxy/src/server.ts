import {
  OpenAICompatibleChatCompletionRequest,
  OpenAICompatibleProxy,
  OpenAICompatibleProxyInput,
} from "@bundjil/codex-oauth";
import { Effect, Layer, Match, Redacted, Schema } from "effect";
import type { HttpServerRequest } from "effect/unstable/http";
import { HttpRouter, HttpServerResponse } from "effect/unstable/http";

import { CodexProxyConfig, CodexProxyConfigLive } from "./env.js";
import { CodexProxyRouteError } from "./errors.js";
import { CodexProxyOpenAICompatibleProxyLiveOrUnavailable } from "./live.layer.js";
import {
  CodexProxyOpenAICompatibleProxyLocalUnavailableLive,
  makeCodexProxyOpenAICompatibleProxyLocal,
} from "./local.layer.js";
import { CodexProxyOpenAICompatibleProxyMockLive } from "./mock.layer.js";
import { CodexProxyReadiness } from "./readiness.service.js";
import {
  CodexProxyErrorResponse,
  CodexProxyHealthResponse,
} from "./schemas.js";
import type { CodexProxyErrorCode } from "./schemas.js";

const healthJson = HttpServerResponse.schemaJson(CodexProxyHealthResponse);
const errorJson = HttpServerResponse.schemaJson(CodexProxyErrorResponse);

const errorResponse = (
  code: CodexProxyErrorCode,
  message: string,
  status: number
) =>
  errorJson(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  ).pipe(Effect.orDie);

const reauthenticationRequiredResponse = errorResponse(
  "codex_reauthentication_required",
  "Codex authorization requires a new trusted-local login.",
  502
);

const authTemporarilyUnavailableResponse = errorResponse(
  "codex_auth_temporarily_unavailable",
  "Codex authorization is temporarily unavailable.",
  503
);

const healthRoute = Effect.gen(function* healthRoute() {
  const config = yield* CodexProxyConfig;
  const readiness = yield* CodexProxyReadiness;

  return yield* healthJson(
    {
      mode: config.mode,
      ok: readiness.ready,
      service: "bundjil-codex-proxy",
    },
    { status: readiness.ready ? 200 : 503 }
  ).pipe(Effect.orDie);
});

const chatCompletionsRoute = (request: HttpServerRequest.HttpServerRequest) =>
  Effect.gen(function* chatCompletionsRoute() {
    const config = yield* CodexProxyConfig;

    const body = yield* request.text.pipe(
      Effect.mapError(
        (cause) =>
          new CodexProxyRouteError({
            cause,
            code: "bad_request",
            message: "Unable to read Codex proxy request body.",
            responseMessage: "The request body could not be read.",
            status: 400,
          })
      )
    );
    const completion = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(OpenAICompatibleChatCompletionRequest)
    )(body).pipe(
      Effect.mapError(
        (cause) =>
          new CodexProxyRouteError({
            boundary: "OpenAICompatibleChatCompletionRequest",
            cause,
            code: "bad_request",
            message:
              "Unable to decode OpenAI-compatible chat completion request.",
            responseMessage:
              "The request does not match the Codex proxy contract.",
            status: 400,
          })
      )
    );
    const proxyInput = yield* Schema.decodeUnknownEffect(
      OpenAICompatibleProxyInput
    )({
      ...(request.headers["authorization"] === undefined
        ? {}
        : { authorization: request.headers["authorization"] }),
      completion: {
        ...(config.accountId === undefined
          ? {}
          : { accountId: config.accountId }),
        request: completion,
        subject: config.subject,
      },
      internalToken: Redacted.value(config.internalToken),
    }).pipe(
      Effect.mapError(
        (cause) =>
          new CodexProxyRouteError({
            boundary: "OpenAICompatibleProxyInput",
            cause,
            code: "bad_request",
            message: "Unable to decode Codex proxy request envelope.",
            responseMessage:
              "The request does not match the Codex proxy contract.",
            status: 400,
          })
      )
    );
    const proxy = yield* OpenAICompatibleProxy;
    const stream = yield* proxy.handleChatCompletions(proxyInput);

    return HttpServerResponse.raw(stream.body, {
      contentType: stream.contentType,
      headers: {
        "cache-control": "no-cache, no-transform",
        "x-accel-buffering": "no",
        "x-bundjil-codex-proxy-mode": config.mode,
      },
      status: 200,
    });
  }).pipe(
    Effect.catchTags({
      CodexProxyRouteError: (error) =>
        errorResponse(error.code, error.responseMessage, error.status),
      OpenAICompatibleProxyAuthError: () =>
        errorResponse("unauthorized", "Unauthorized.", 401),
      CodexResponsesRequestError: () =>
        errorResponse("proxy_error", "The proxy request failed.", 502),
      CodexHttpNetworkError: () =>
        errorResponse("proxy_error", "The proxy request failed.", 502),
      CodexHttpStatusError: () =>
        errorResponse("proxy_error", "The proxy request failed.", 502),
      CodexResponsesStreamError: () =>
        errorResponse("proxy_error", "The proxy stream failed.", 502),
      OAuthProfileNotFound: () => reauthenticationRequiredResponse,
      OAuthProfileSchemaError: () => reauthenticationRequiredResponse,
      OAuthProfileStorageError: () => authTemporarilyUnavailableResponse,
      CodexOAuthTokenMissing: () => reauthenticationRequiredResponse,
      CodexOAuthTokenExpired: () => reauthenticationRequiredResponse,
      CodexOAuthTokenProviderError: () => reauthenticationRequiredResponse,
      CodexOAuthReauthenticationRequired: () =>
        reauthenticationRequiredResponse,
      CodexOAuthAuthTemporarilyUnavailable: () =>
        authTemporarilyUnavailableResponse,
      CodexOAuthRefreshLockError: () => authTemporarilyUnavailableResponse,
      CodexSubscriptionAuthError: () => authTemporarilyUnavailableResponse,
      CodexOAuthProfileCommitConflict: () => authTemporarilyUnavailableResponse,
      CodexOAuthProfileCommitError: () => authTemporarilyUnavailableResponse,
      CodexOAuthProfileCipherError: () => reauthenticationRequiredResponse,
      CodexOAuthUnsupportedRuntimePath: () =>
        authTemporarilyUnavailableResponse,
    })
  );

const notFoundRoute = errorResponse("not_found", "Not found.", 404);

export const CodexProxyRoutesLive = Layer.effectDiscard(
  Effect.gen(function* registerCodexProxyRoutes() {
    const router = yield* HttpRouter.HttpRouter;

    yield* router.add("GET", "/health", healthRoute);
    yield* router.add("POST", "/v1/chat/completions", chatCompletionsRoute);
    yield* router.add("*", "/*", notFoundRoute);
  })
);

const makeCodexProxyModeLayer = (
  liveProxyLayer = CodexProxyOpenAICompatibleProxyLiveOrUnavailable,
  makeLocalProxyLayer = makeCodexProxyOpenAICompatibleProxyLocal
) =>
  Layer.unwrap(
    Effect.gen(function* makeCodexProxyModeLayer() {
      const config = yield* CodexProxyConfig;

      return Match.value(config.mode).pipe(
        Match.when("mock", () => CodexProxyOpenAICompatibleProxyMockLive),
        Match.when("local", () => {
          if (config.localProfileStoreDirectory === undefined) {
            return CodexProxyOpenAICompatibleProxyLocalUnavailableLive;
          }

          return makeLocalProxyLayer(config.localProfileStoreDirectory);
        }),
        Match.when("live", () => liveProxyLayer),
        Match.exhaustive
      );
    })
  );

export const makeCodexProxyAppLayer = (
  configLayer = CodexProxyConfigLive,
  liveProxyLayer = CodexProxyOpenAICompatibleProxyLiveOrUnavailable,
  makeLocalProxyLayer = makeCodexProxyOpenAICompatibleProxyLocal
) =>
  Layer.mergeAll(
    makeCodexProxyModeLayer(liveProxyLayer, makeLocalProxyLayer),
    CodexProxyRoutesLive
  ).pipe(Layer.provideMerge(configLayer));

export const CodexProxyAppLive = makeCodexProxyAppLayer();

export const makeCodexProxyWebHandler = (appLayer = CodexProxyAppLive) =>
  HttpRouter.toWebHandler(appLayer, {
    disableLogger: true,
  });

export const codexProxyWebHandler = makeCodexProxyWebHandler();

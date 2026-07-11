import {
  OpenAICompatibleChatCompletionRequest,
  OpenAICompatibleProxy,
  OpenAICompatibleProxyInput,
} from "@bundjil/codex-oauth";
import { Effect, Layer, Redacted, Schema } from "effect";
import type { HttpServerRequest } from "effect/unstable/http";
import { HttpRouter, HttpServerResponse } from "effect/unstable/http";

import { CodexProxyConfig, CodexProxyConfigLive } from "./env.js";
import { CodexProxyRouteError } from "./errors.js";
import { CodexProxyOpenAICompatibleProxyLiveOrUnavailable } from "./live.layer.js";
import { CodexProxyOpenAICompatibleProxyMockLive } from "./mock.layer.js";
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

const reimportRequiredResponse = errorResponse(
  "proxy_error",
  "Codex authorization is unavailable. Re-import the local Codex profile and try again.",
  502
);

const healthRoute = Effect.gen(function* healthRoute() {
  const config = yield* CodexProxyConfig;

  return yield* healthJson({
    mode: config.mode,
    ok: true,
    service: "bundjil-codex-proxy",
  }).pipe(Effect.orDie);
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
      OAuthProfileNotFound: () => reimportRequiredResponse,
      OAuthProfileSchemaError: () => reimportRequiredResponse,
      OAuthProfileStorageError: () => reimportRequiredResponse,
      CodexOAuthTokenMissing: () => reimportRequiredResponse,
      CodexOAuthTokenExpired: () => reimportRequiredResponse,
      CodexOAuthTokenProviderError: () => reimportRequiredResponse,
      CodexOAuthUnsupportedRuntimePath: () => reimportRequiredResponse,
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
  liveProxyLayer = CodexProxyOpenAICompatibleProxyLiveOrUnavailable
) =>
  Layer.unwrap(
    Effect.gen(function* makeCodexProxyModeLayer() {
      const config = yield* CodexProxyConfig;

      return config.mode === "mock"
        ? CodexProxyOpenAICompatibleProxyMockLive
        : liveProxyLayer;
    })
  );

export const makeCodexProxyAppLayer = (
  configLayer = CodexProxyConfigLive,
  liveProxyLayer = CodexProxyOpenAICompatibleProxyLiveOrUnavailable
) =>
  Layer.mergeAll(
    makeCodexProxyModeLayer(liveProxyLayer),
    CodexProxyRoutesLive
  ).pipe(Layer.provideMerge(configLayer));

export const CodexProxyAppLive = makeCodexProxyAppLayer();

export const makeCodexProxyWebHandler = (appLayer = CodexProxyAppLive) =>
  HttpRouter.toWebHandler(appLayer, {
    disableLogger: true,
  });

export const codexProxyWebHandler = makeCodexProxyWebHandler();

import * as BunHttpServer from "@effect/platform-bun/BunHttpServer";
import type { Scope } from "effect";
import {
  Cause,
  Context,
  Deferred,
  Effect,
  Exit,
  Layer,
  Option,
  Redacted,
  Result,
  Schema,
} from "effect";
import {
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/unstable/http";

import { CodexSubscriptionAuthError } from "./errors.js";
import {
  CodexOAuthAuthorizationCallback,
  CodexOAuthCallbackRequest,
  CodexOAuthRedirectUri,
} from "./schemas.js";
import type {
  CodexOAuthAuthorizationCallback as CodexOAuthAuthorizationCallbackType,
  CodexOAuthCallbackPath,
  CodexOAuthCallbackRequestMethod,
  CodexOAuthCallbackRequestUrl,
  CodexOAuthRedirectUri as CodexOAuthRedirectUriType,
  CodexOAuthState,
  CodexSubscriptionAuthProtocolConfig,
} from "./schemas.js";
import { CodexSubscriptionAuthProtocolConfigService } from "./subscription-auth-protocol.service.js";

export interface CodexLoopbackCallbackShape {
  readonly open: (
    expectedState: CodexOAuthState
  ) => Effect.Effect<
    CodexLoopbackCallbackSession,
    CodexSubscriptionAuthError,
    Scope.Scope
  >;
}

export interface CodexLoopbackCallbackSession {
  readonly redirectUri: CodexOAuthRedirectUriType;
  readonly awaitCallback: (
    timeoutMillis: number
  ) => Effect.Effect<
    CodexOAuthAuthorizationCallbackType,
    CodexSubscriptionAuthError
  >;
}

export class CodexLoopbackCallback extends Context.Service<
  CodexLoopbackCallback,
  CodexLoopbackCallbackShape
>()("@bundjil/codex-oauth/CodexLoopbackCallback") {}

export const decodeCodexOAuthCallbackRequest = Effect.fn(
  "CodexLoopbackCallback.decodeRequest"
)(function* (
  method: CodexOAuthCallbackRequestMethod,
  requestUrl: CodexOAuthCallbackRequestUrl,
  expectedState: CodexOAuthState,
  redirectUri: CodexOAuthRedirectUriType,
  callbackPath: CodexOAuthCallbackPath = "/auth/callback"
) {
  const url = new URL(requestUrl, redirectUri);

  if (method !== "GET" || url.pathname !== callbackPath) {
    return yield* new CodexSubscriptionAuthError({
      operation: "awaitCallback",
      reason: "invalidCallback",
      message: "The OAuth callback request method or path is invalid.",
    });
  }

  if (url.searchParams.has("error")) {
    return yield* new CodexSubscriptionAuthError({
      operation: "awaitCallback",
      reason: "authorizationDenied",
      message: "Codex authorization was denied or cancelled.",
    });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (code === null || code.length === 0) {
    return yield* new CodexSubscriptionAuthError({
      operation: "awaitCallback",
      reason: "missingCode",
      message: "The OAuth callback did not include an authorization code.",
    });
  }

  if (state === null || state !== Redacted.value(expectedState)) {
    return yield* new CodexSubscriptionAuthError({
      operation: "awaitCallback",
      reason: "stateMismatch",
      message: "The OAuth callback state did not match the login session.",
    });
  }

  return yield* Schema.decodeUnknownEffect(CodexOAuthAuthorizationCallback)({
    code,
    state,
    redirectUri,
  }).pipe(
    Effect.mapError(
      () =>
        new CodexSubscriptionAuthError({
          operation: "awaitCallback",
          reason: "invalidCallback",
          message: "The OAuth callback values are invalid.",
        })
    )
  );
});

export interface LoopbackServer {
  readonly port: number;
  readonly redirectUri: CodexOAuthRedirectUriType;
  readonly server: HttpServer.HttpServer["Service"];
}

const BunBindConflict = Schema.Struct({
  code: Schema.Literal("EADDRINUSE"),
});

const bindConflictError = new CodexSubscriptionAuthError({
  operation: "bindCallback",
  reason: "portConflict",
  message: "The Codex login callback port is unavailable.",
});

const mapExpectedBindConflict = <A>(
  effect: Effect.Effect<A, never, Scope.Scope>
) =>
  effect.pipe(
    Effect.catchCause((cause) =>
      Result.match(Cause.findDefect(cause), {
        onFailure: () => Effect.failCause(cause),
        onSuccess: (defect) =>
          Schema.decodeUnknownEffect(BunBindConflict)(defect).pipe(
            Effect.flatMap(() => Effect.fail(bindConflictError)),
            Effect.catchTag("SchemaError", () => Effect.failCause(cause))
          ),
      })
    )
  );

export const bindFirstAvailableCodexCallbackPort = Effect.fn(
  "CodexLoopbackCallback.bindFirstAvailablePort"
)(function* (
  ports: readonly number[],
  bind: (
    port: number
  ) => Effect.Effect<LoopbackServer, CodexSubscriptionAuthError, Scope.Scope>
) {
  for (const port of ports) {
    const result = yield* Effect.result(bind(port));

    if (Result.isSuccess(result)) {
      return result.success;
    }

    if (result.failure.reason !== "portConflict") {
      return yield* result.failure;
    }
  }

  return yield* new CodexSubscriptionAuthError({
    operation: "bindCallback",
    reason: "portConflict",
    message: "Codex login callback ports 1455 and 1457 are unavailable.",
  });
});

const bindCallbackServer = Effect.fn("CodexLoopbackCallback.bind")(function* (
  protocol: CodexSubscriptionAuthProtocolConfig,
  expectedState: CodexOAuthState,
  deferred: Deferred.Deferred<
    CodexOAuthAuthorizationCallbackType,
    CodexSubscriptionAuthError
  >
) {
  return yield* bindFirstAvailableCodexCallbackPort(
    protocol.callbackPorts,
    (port) =>
      Effect.gen(function* bindCodexCallbackPort() {
        const redirectUri = yield* Schema.decodeUnknownEffect(
          CodexOAuthRedirectUri
        )(`http://localhost:${port}${protocol.callbackPath}`).pipe(
          Effect.mapError(
            () =>
              new CodexSubscriptionAuthError({
                operation: "bindCallback",
                reason: "invalidCallback",
                message: "Unable to construct the Codex callback redirect URI.",
              })
          )
        );
        const callbackApp = Effect.gen(function* handleCodexOAuthCallback() {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const callbackRequest = yield* Schema.decodeEffect(
            CodexOAuthCallbackRequest
          )({ method: request.method, requestUrl: request.url }).pipe(
            Effect.mapError(
              () =>
                new CodexSubscriptionAuthError({
                  operation: "awaitCallback",
                  reason: "invalidCallback",
                  message: "The OAuth callback request is invalid.",
                })
            )
          );
          const callback = decodeCodexOAuthCallbackRequest(
            callbackRequest.method,
            callbackRequest.requestUrl,
            expectedState,
            redirectUri,
            protocol.callbackPath
          );
          const exit = yield* Effect.exit(callback);
          yield* Deferred.done(deferred, exit);

          return HttpServerResponse.text(
            Exit.isSuccess(exit)
              ? "Codex authorization completed. You can close this window."
              : "Codex authorization did not complete.",
            { status: Exit.isSuccess(exit) ? 200 : 400 }
          );
        });

        return yield* mapExpectedBindConflict(
          Effect.gen(function* bindEffectPlatformCallbackServer() {
            const server = yield* BunHttpServer.make({
              hostname: protocol.callbackHost,
              port,
            });
            yield* HttpServer.serveEffect(callbackApp).pipe(
              Effect.provideService(HttpServer.HttpServer, server)
            );

            return { port, redirectUri, server } satisfies LoopbackServer;
          })
        );
      })
  );
});

export const CodexLoopbackCallbackBunLive = Layer.effect(
  CodexLoopbackCallback,
  Effect.gen(function* makeCodexLoopbackCallbackBun() {
    const protocol = yield* CodexSubscriptionAuthProtocolConfigService;

    return CodexLoopbackCallback.of({
      open: Effect.fn("CodexLoopbackCallback.open")(function* (expectedState) {
        const deferred = yield* Deferred.make<
          CodexOAuthAuthorizationCallbackType,
          CodexSubscriptionAuthError
        >();
        const server = yield* bindCallbackServer(
          protocol.config,
          expectedState,
          deferred
        );

        return {
          redirectUri: server.redirectUri,
          awaitCallback: Effect.fn("CodexLoopbackCallbackSession.await")(
            function* (timeoutMillis) {
              const callback = yield* Deferred.await(deferred).pipe(
                Effect.timeoutOption(timeoutMillis)
              );

              if (Option.isNone(callback)) {
                return yield* new CodexSubscriptionAuthError({
                  operation: "awaitCallback",
                  reason: "timeout",
                  message: "Timed out waiting for the Codex OAuth callback.",
                });
              }

              return callback.value;
            }
          ),
        } satisfies CodexLoopbackCallbackSession;
      }),
    });
  })
);

export interface CodexLoopbackCallbackMemoryOptions {
  readonly redirectUri?: CodexOAuthRedirectUriType;
  readonly callback: Effect.Effect<
    CodexOAuthAuthorizationCallbackType,
    CodexSubscriptionAuthError
  >;
  readonly onAcquire?: Effect.Effect<void>;
  readonly onRelease?: Effect.Effect<void>;
}

export const CodexLoopbackCallbackMemory = (
  options: CodexLoopbackCallbackMemoryOptions
) =>
  Layer.succeed(
    CodexLoopbackCallback,
    CodexLoopbackCallback.of({
      open: () =>
        Effect.acquireRelease(
          options.onAcquire ?? Effect.void,
          () => options.onRelease ?? Effect.void
        ).pipe(
          Effect.as({
            redirectUri:
              options.redirectUri ??
              CodexOAuthRedirectUri.make("http://localhost:1455/auth/callback"),
            awaitCallback: (timeoutMillis) =>
              options.callback.pipe(
                Effect.timeoutOption(timeoutMillis),
                Effect.flatMap(
                  Option.match({
                    onNone: () =>
                      Effect.fail(
                        new CodexSubscriptionAuthError({
                          operation: "awaitCallback",
                          reason: "timeout",
                          message:
                            "Timed out waiting for the Codex OAuth callback.",
                        })
                      ),
                    onSome: Effect.succeed,
                  })
                )
              ),
          })
        ),
    })
  );

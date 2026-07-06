import { createMiddleware } from "@tanstack/react-start";
import { Effect, Option } from "effect";
import type { ManagedRuntime, Scope } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/unstable/http";

import {
  StartMiddlewareNextError,
  StartMiddlewareOptionalResponseError,
} from "./errors.js";

export {
  StartMiddlewareNextError,
  StartMiddlewareOptionalResponseError,
} from "./errors.js";

export interface StartOptionalResponseMiddlewareOptions<R, ER, E> {
  readonly onPassThroughResponse?:
    | ((response: Response) => Response)
    | undefined;
  readonly program: Effect.Effect<
    Option.Option<HttpServerResponse.HttpServerResponse>,
    E,
    HttpServerRequest.HttpServerRequest | Scope.Scope | R
  >;
  readonly runtime: ManagedRuntime.ManagedRuntime<R, ER>;
}

export interface StartOptionalResponseHandlerMiddlewareOptions {
  readonly onPassThroughResponse?:
    | ((response: Response) => Response)
    | undefined;
  readonly optionalResponse: (
    request: Request
  ) => Promise<Option.Option<Response>>;
}

export interface StartOptionalWebResponseProgramOptions<R, E> {
  readonly program: Effect.Effect<
    Option.Option<HttpServerResponse.HttpServerResponse>,
    E,
    HttpServerRequest.HttpServerRequest | Scope.Scope | R
  >;
  readonly request: Request;
}

export interface StartPassThroughProgramOptions<A> {
  readonly next: Effect.Effect<A, StartMiddlewareNextError>;
  readonly onPassThroughResponse?:
    | ((response: Response) => Response)
    | undefined;
}

export const startOptionalWebResponseProgram = <R, E>({
  program,
  request,
}: StartOptionalWebResponseProgramOptions<R, E>) =>
  Effect.gen(function* startOptionalWebResponseProgram() {
    const handled = yield* Effect.scoped(
      program.pipe(
        Effect.provideService(
          HttpServerRequest.HttpServerRequest,
          HttpServerRequest.fromWeb(request)
        )
      )
    );

    return handled.pipe(
      Option.map((response) =>
        HttpServerResponse.toWeb(response, {
          withoutBody: request.method === "HEAD",
        })
      )
    );
  });

export const startPassThroughProgram = <
  A extends { readonly response: Response },
>({
  next,
  onPassThroughResponse,
}: StartPassThroughProgramOptions<A>) =>
  next.pipe(
    Effect.map((result) =>
      Option.fromUndefinedOr(onPassThroughResponse).pipe(
        Option.match({
          onNone: () => result,
          onSome: (mutateResponse) => ({
            ...result,
            response: mutateResponse(result.response),
          }),
        })
      )
    )
  );

export const makeStartOptionalResponseMiddleware = <R, ER, E>({
  onPassThroughResponse,
  program,
  runtime,
}: StartOptionalResponseMiddlewareOptions<R, ER, E>) =>
  createMiddleware().server(({ next, request }) =>
    runtime.runPromise(
      Effect.gen(function* startOptionalResponseMiddleware() {
        const handled = yield* startOptionalWebResponseProgram({
          program,
          request,
        });

        return yield* Option.match(handled, {
          onNone: () =>
            startPassThroughProgram({
              next: Effect.tryPromise({
                catch: (cause) => new StartMiddlewareNextError({ cause }),
                try: () => Promise.resolve(next()),
              }),
              onPassThroughResponse,
            }),
          onSome: (response) => Effect.succeed(response),
        });
      })
    )
  );

export const makeStartOptionalResponseHandlerMiddleware = ({
  onPassThroughResponse,
  optionalResponse,
}: StartOptionalResponseHandlerMiddlewareOptions) =>
  createMiddleware().server(({ next, request }) =>
    Effect.runPromise(
      Effect.gen(function* startOptionalResponseHandlerMiddleware() {
        const handled = yield* Effect.tryPromise({
          catch: (cause) => new StartMiddlewareOptionalResponseError({ cause }),
          try: () => optionalResponse(request),
        });

        return yield* Option.match(handled, {
          onNone: () =>
            startPassThroughProgram({
              next: Effect.tryPromise({
                catch: (cause) => new StartMiddlewareNextError({ cause }),
                try: () => Promise.resolve(next()),
              }),
              onPassThroughResponse,
            }),
          onSome: (response) => Effect.succeed(response),
        });
      })
    )
  );

export type StartOptionalResponseMiddleware = ReturnType<
  typeof makeStartOptionalResponseMiddleware
>;

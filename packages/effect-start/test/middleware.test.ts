import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { describe } from "vitest";

import {
  makeStartOptionalResponseHandlerMiddleware,
  makeStartOptionalResponseMiddleware,
  startOptionalWebResponseProgram,
  startPassThroughProgram,
} from "../src";
import { testRuntime } from "./runtime";

const handledProgram = Effect.gen(function* handledProgram() {
  const request = yield* HttpServerRequest.HttpServerRequest;
  return Option.some(
    HttpServerResponse.text(request.url, {
      headers: {
        "x-effect-start": "handled",
      },
    })
  );
});

const passThroughProgram = Effect.succeed(
  Option.none<HttpServerResponse.HttpServerResponse>()
);

const nextResult = (request: Request, response = new Response("next")) => ({
  pathname: new URL(request.url).pathname,
  request,
  response,
});

describe("@bundjil/effect-start TanStack request middleware adapter", () => {
  it.effect("returns an Effect HTTP response without calling next", () =>
    Effect.gen(function* testHandledResponse() {
      const request = new Request("https://bundjil.local/handled");
      const response = yield* startOptionalWebResponseProgram({
        program: handledProgram,
        request,
      }).pipe(Effect.map(Option.getOrThrow));

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get("x-effect-start"), "handled");
      assert.strictEqual(
        yield* Effect.promise(() => response.text()),
        "/handled"
      );
    })
  );

  it.effect(
    "falls through to TanStack next when the program returns none",
    () =>
      Effect.gen(function* testPassThrough() {
        const request = new Request("https://bundjil.local/pass");
        const result = yield* startPassThroughProgram({
          next: Effect.succeed(
            nextResult(
              request,
              new Response("next", {
                headers: {
                  "x-next": "called",
                },
              })
            )
          ),
        });

        assert.strictEqual(result.response.headers.get("x-next"), "called");
        assert.strictEqual(
          yield* Effect.promise(() => result.response.text()),
          "next"
        );
      })
  );

  it.effect("omits handled response bodies for HEAD requests", () =>
    Effect.gen(function* testHeadWithoutBody() {
      const request = new Request("https://bundjil.local/handled", {
        method: "HEAD",
      });
      const response = yield* startOptionalWebResponseProgram({
        program: handledProgram,
        request,
      }).pipe(Effect.map(Option.getOrThrow));

      assert.strictEqual(yield* Effect.promise(() => response.text()), "");
    })
  );

  it.effect("mutates pass-through responses with the configured policy", () =>
    Effect.gen(function* testPassThroughMutation() {
      const request = new Request("https://bundjil.local/pass");
      const result = yield* startPassThroughProgram({
        next: Effect.succeed(
          nextResult(
            request,
            new Response("next", {
              headers: {
                "content-type": "text/html; charset=utf-8",
              },
            })
          )
        ),
        onPassThroughResponse: (response) => {
          const headers = new Headers(response.headers);
          headers.set("vary", "Accept, User-Agent");
          return new Response(response.body, {
            headers,
            status: response.status,
            statusText: response.statusText,
          });
        },
      });

      assert.strictEqual(
        result.response.headers.get("vary"),
        "Accept, User-Agent"
      );
      assert.strictEqual(
        yield* Effect.promise(() => result.response.text()),
        "next"
      );
    })
  );

  it.effect(
    "constructs a TanStack middleware backed by the provided runtime",
    () =>
      Effect.sync(() => {
        const middleware = makeStartOptionalResponseMiddleware({
          program: passThroughProgram,
          runtime: testRuntime,
        });

        assert.isFunction(middleware.options.server);
      })
  );

  it.effect(
    "constructs a TanStack middleware backed by a server-only response handler",
    () =>
      Effect.sync(() => {
        const middleware = makeStartOptionalResponseHandlerMiddleware({
          optionalResponse: () => Promise.resolve(Option.none()),
        });

        assert.isFunction(middleware.options.server);
      })
  );
});

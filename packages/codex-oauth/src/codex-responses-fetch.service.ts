import { Context, Effect } from "effect";
import { HttpClient } from "effect/unstable/http";
import type {
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import { CodexHttpNetworkError } from "./errors.js";

export interface CodexResponsesFetchShape {
  readonly fetch: (
    request: HttpClientRequest.HttpClientRequest
  ) => Effect.Effect<
    HttpClientResponse.HttpClientResponse,
    CodexHttpNetworkError
  >;
}

export class CodexResponsesFetch extends Context.Service<
  CodexResponsesFetch,
  CodexResponsesFetchShape
>()("@bundjil/codex-oauth/CodexResponsesFetch") {}

export const makeCodexResponsesFetch = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  return CodexResponsesFetch.of({
    fetch: Effect.fn("CodexResponsesFetch.fetch")((request) =>
      client.execute(request).pipe(
        Effect.mapError(
          (cause) =>
            new CodexHttpNetworkError({
              operation: "fetch",
              message: "Unable to reach Codex Responses endpoint.",
              cause,
            })
        )
      )
    ),
  });
});

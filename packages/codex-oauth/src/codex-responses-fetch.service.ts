import { Context, Effect } from "effect";

import { CodexHttpNetworkError } from "./errors.js";

export interface CodexResponsesFetchShape {
  readonly fetch: (
    request: Request
  ) => Effect.Effect<Response, CodexHttpNetworkError>;
}

export class CodexResponsesFetch extends Context.Service<
  CodexResponsesFetch,
  CodexResponsesFetchShape
>()("@bundjil/codex-oauth/CodexResponsesFetch") {}

export const makeCodexResponsesFetch = CodexResponsesFetch.of({
  fetch: Effect.fn("CodexResponsesFetch.fetch")((request: Request) =>
    Effect.tryPromise({
      try: () => globalThis.fetch(request),
      catch: (cause) =>
        new CodexHttpNetworkError({
          operation: "fetch",
          message: "Unable to reach Codex Responses endpoint.",
          cause,
        }),
    })
  ),
});

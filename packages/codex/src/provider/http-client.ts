import { Context, Effect, Redacted, Schema } from "effect";

import { codexResponsesEndpointConfig } from "./config.js";
import {
  CodexResponsesProofResult,
  CodexResponsesRequest,
} from "./contracts.js";
import type {
  CodexResponsesPostInput,
  CodexResponsesProofResult as CodexResponsesProofResultType,
  CodexResponsesStreamResult,
} from "./contracts.js";
import type { CodexHttpNetworkError } from "./errors.js";
import {
  CodexHttpStatusError,
  CodexResponsesRequestError,
  CodexResponsesStreamError,
} from "./errors.js";
import { CodexResponsesFetch } from "./fetch.js";

export type CodexHttpClientFailure =
  | CodexResponsesRequestError
  | CodexHttpNetworkError
  | CodexHttpStatusError
  | CodexResponsesStreamError;

export interface CodexHttpClientShape {
  readonly postResponses: (
    input: CodexResponsesPostInput
  ) => Effect.Effect<CodexResponsesProofResultType, CodexHttpClientFailure>;
  readonly postResponsesStream: (
    input: CodexResponsesPostInput
  ) => Effect.Effect<CodexResponsesStreamResult, CodexHttpClientFailure>;
}

export class CodexHttpClient extends Context.Service<
  CodexHttpClient,
  CodexHttpClientShape
>()("@bundjil/codex/CodexHttpClient") {}

export const makeCodexHttpClient = Effect.gen(function* makeCodexHttpClient() {
  const fetcher = yield* CodexResponsesFetch;
  const endpoint = yield* codexResponsesEndpointConfig;

  return CodexHttpClient.of({
    postResponses: Effect.fn("CodexHttpClient.postResponses")(function* (
      input: CodexResponsesPostInput
    ) {
      const encodedRequestBody = yield* Schema.encodeEffect(
        Schema.fromJsonString(CodexResponsesRequest)
      )(input.request).pipe(
        Effect.mapError(
          (cause) =>
            new CodexResponsesRequestError({
              boundary: "CodexResponsesRequest",
              message: "Unable to encode Codex Responses request.",
              cause,
            })
        )
      );
      const headers = new Headers({
        Authorization: `Bearer ${Redacted.value(input.accessToken)}`,
        "Content-Type": "application/json",
      });

      if (input.accountId !== undefined) {
        headers.set("chatgpt-account-id", Redacted.value(input.accountId));
      }

      const upstreamRequest = new Request(endpoint, {
        body: encodedRequestBody,
        headers,
        method: "POST",
      });
      const response = yield* fetcher.fetch(upstreamRequest);
      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        return yield* new CodexHttpStatusError({
          operation: "postResponses",
          status: response.status,
          statusText: response.statusText,
          contentType,
          message: "Codex Responses endpoint returned an unsuccessful status.",
        });
      }

      const body = yield* Effect.tryPromise({
        try: () => response.text(),
        catch: (cause) =>
          new CodexResponsesStreamError({
            operation: "readResponseBody",
            message: "Unable to read Codex Responses body.",
            cause,
          }),
      });
      const receivedStreamLines =
        body.length === 0
          ? 0
          : body.split(/\r?\n/).filter((line) => line.trim().length > 0).length;

      return yield* Schema.decodeUnknownEffect(CodexResponsesProofResult)({
        transport: "direct-codex-responses",
        endpoint,
        status: response.status,
        contentType,
        receivedBodyBytes: body.length,
        receivedStreamLines,
        usedAccountHeader: input.accountId !== undefined,
      }).pipe(
        Effect.mapError(
          (cause) =>
            new CodexResponsesRequestError({
              boundary: "CodexResponsesProofResult",
              message: "Unable to decode sanitized Codex Responses result.",
              cause,
            })
        )
      );
    }),
    postResponsesStream: Effect.fn("CodexHttpClient.postResponsesStream")(
      function* (input: CodexResponsesPostInput) {
        const encodedRequestBody = yield* Schema.encodeEffect(
          Schema.fromJsonString(CodexResponsesRequest)
        )(input.request).pipe(
          Effect.mapError(
            (cause) =>
              new CodexResponsesRequestError({
                boundary: "CodexResponsesRequest",
                message: "Unable to encode Codex Responses request.",
                cause,
              })
          )
        );
        const headers = new Headers({
          Authorization: `Bearer ${Redacted.value(input.accessToken)}`,
          "Content-Type": "application/json",
        });

        if (input.accountId !== undefined) {
          headers.set("chatgpt-account-id", Redacted.value(input.accountId));
        }

        const upstreamRequest = new Request(endpoint, {
          body: encodedRequestBody,
          headers,
          method: "POST",
        });
        const response = yield* fetcher.fetch(upstreamRequest);
        const contentType = response.headers.get("content-type") ?? "";

        if (!response.ok) {
          return yield* new CodexHttpStatusError({
            operation: "postResponsesStream",
            status: response.status,
            statusText: response.statusText,
            contentType,
            message:
              "Codex Responses endpoint returned an unsuccessful status.",
          });
        }

        const body = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: (cause) =>
            new CodexResponsesStreamError({
              operation: "readResponseBody",
              message: "Unable to read Codex Responses body.",
              cause,
            }),
        });

        return {
          status: response.status,
          contentType,
          body: Redacted.make(body),
        };
      }
    ),
  });
}).pipe(Effect.withSpan("CodexHttpClientLive"));

export const postResponses = (input: CodexResponsesPostInput) =>
  Effect.gen(function* postResponsesOperation() {
    const client = yield* CodexHttpClient;

    return yield* client.postResponses(input);
  });

export const postResponsesStream = (input: CodexResponsesPostInput) =>
  Effect.gen(function* postResponsesStreamOperation() {
    const client = yield* CodexHttpClient;

    return yield* client.postResponsesStream(input);
  });

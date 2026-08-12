import { Context, Effect, Redacted, Schema, Stream } from "effect";
import { HttpClient, HttpClientRequest } from "effect/unstable/http";

import { codexResponsesEndpointConfig } from "./config.js";
import {
  CodexResponsesProofResult,
  CodexResponsesRequest,
  CodexResponsesStreamMetadata,
} from "./contracts.js";
import type {
  CodexResponsesPostInput,
  CodexResponsesProofResult as CodexResponsesProofResultType,
  CodexResponsesStreamResult,
} from "./contracts.js";
import {
  CodexHttpNetworkError,
  CodexHttpStatusError,
  CodexResponsesRequestError,
  CodexResponsesStreamError,
} from "./errors.js";

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
  const client = yield* HttpClient.HttpClient;
  const endpoint = yield* codexResponsesEndpointConfig;

  return CodexHttpClient.of({
    postResponses: Effect.fn("CodexHttpClient.postResponses")(function* (
      input: CodexResponsesPostInput
    ) {
      const encodedRequestBody = yield* Schema.encodeEffect(
        Schema.fromJsonString(CodexResponsesRequest)
      )(input.request).pipe(
        Effect.mapError(
          () =>
            new CodexResponsesRequestError({
              boundary: "CodexResponsesRequest",
              message: "Unable to encode Codex Responses request.",
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

      const upstreamRequest = HttpClientRequest.post(endpoint).pipe(
        HttpClientRequest.setHeaders(headers),
        HttpClientRequest.bodyText(encodedRequestBody, "application/json")
      );
      const response = yield* client.execute(upstreamRequest).pipe(
        Effect.mapError(
          () =>
            new CodexHttpNetworkError({
              operation: "fetch",
              message: "Unable to reach Codex Responses endpoint.",
            })
        )
      );
      const contentType = response.headers["content-type"] ?? "";

      if (response.status < 200 || response.status >= 300) {
        return yield* new CodexHttpStatusError({
          operation: "postResponses",
          status: response.status,
          statusText: "",
          contentType,
          message: "Codex Responses endpoint returned an unsuccessful status.",
        });
      }

      const body = yield* response.text.pipe(
        Effect.mapError(
          () =>
            new CodexResponsesStreamError({
              operation: "readResponseBody",
              message: "Unable to read Codex Responses body.",
            })
        )
      );
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
          () =>
            new CodexResponsesRequestError({
              boundary: "CodexResponsesProofResult",
              message: "Unable to decode sanitized Codex Responses result.",
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
            () =>
              new CodexResponsesRequestError({
                boundary: "CodexResponsesRequest",
                message: "Unable to encode Codex Responses request.",
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

        const upstreamRequest = HttpClientRequest.post(endpoint).pipe(
          HttpClientRequest.setHeaders(headers),
          HttpClientRequest.bodyText(encodedRequestBody, "application/json")
        );
        const response = yield* client.execute(upstreamRequest).pipe(
          Effect.mapError(
            () =>
              new CodexHttpNetworkError({
                operation: "fetch",
                message: "Unable to reach Codex Responses endpoint.",
              })
          )
        );
        const contentType = response.headers["content-type"] ?? "";

        if (response.status < 200 || response.status >= 300) {
          return yield* new CodexHttpStatusError({
            operation: "postResponsesStream",
            status: response.status,
            statusText: "",
            contentType,
            message:
              "Codex Responses endpoint returned an unsuccessful status.",
          });
        }

        const metadata = yield* Schema.decodeUnknownEffect(
          CodexResponsesStreamMetadata
        )({ status: response.status, contentType }).pipe(
          Effect.mapError(
            () =>
              new CodexResponsesStreamError({
                operation: "postResponsesStream",
                message: "Unable to decode Codex Responses stream metadata.",
              })
          )
        );

        return {
          ...metadata,
          body: response.stream.pipe(
            Stream.mapError(
              () =>
                new CodexResponsesStreamError({
                  operation: "readResponseBody",
                  message: "Unable to read Codex Responses body.",
                })
            )
          ),
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

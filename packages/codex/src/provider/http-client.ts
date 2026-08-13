import {
  Context,
  Deferred,
  Duration,
  Effect,
  Exit,
  Redacted,
  Ref,
  Schema,
  Scope,
  Stream,
} from "effect";
import { HttpClient, HttpClientRequest } from "effect/unstable/http";

import {
  codexResponsesEndpointConfig,
  loadCodexResponsesTransportPolicy,
} from "./config.js";
import {
  CodexResponsesProofResult,
  CodexResponsesRequest,
  CodexResponsesStreamMetadata,
} from "./contracts.js";
import type {
  CodexResponsesPostInput,
  CodexResponsesProofResult as CodexResponsesProofResultType,
  CodexResponsesStreamResult,
  CodexResponsesTransportPolicy,
} from "./contracts.js";
import {
  CodexHttpContentTypeHeader,
  CodexHttpStatus,
} from "./error-contracts.js";
import {
  CodexHttpNetworkError,
  CodexHttpStatusError,
  CodexResponsesRequestError,
  CodexResponsesStreamError,
} from "./errors.js";
import { codexResponsesSseData, isCodexResponsesEventStream } from "./sse.js";
import {
  advanceCodexResponsesStreamSequence,
  decodeCodexResponsesStreamData,
  initialCodexResponsesStreamSequenceState,
} from "./stream-events.js";

export type CodexHttpClientFailure =
  | CodexResponsesRequestError
  | CodexHttpNetworkError
  | CodexHttpStatusError
  | CodexResponsesStreamError;

const makeCodexResponsesHeaders = (
  input: Pick<CodexResponsesPostInput, "accessToken" | "accountId">
) =>
  Effect.try({
    try: () => {
      const headers = new Headers({
        Authorization: `Bearer ${Redacted.value(input.accessToken)}`,
        "Content-Type": "application/json",
      });
      if (input.accountId !== undefined) {
        headers.set("chatgpt-account-id", Redacted.value(input.accountId));
      }
      return headers;
    },
    catch: () =>
      new CodexResponsesRequestError({
        boundary: "CodexResponsesRequest",
        message: "Unable to construct Codex Responses request headers.",
      }),
  });

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

const boundedResponseBody = (
  source: Stream.Stream<Uint8Array, unknown>,
  policy: CodexResponsesTransportPolicy
) =>
  source.pipe(
    Stream.mapError(
      () =>
        new CodexResponsesStreamError({
          operation: "readResponseBody",
          message: "Unable to read Codex Responses body.",
        })
    ),
    Stream.filter((bytes) => bytes.byteLength > 0),
    Stream.timeoutOrElse({
      duration: Duration.millis(policy.streamIdleTimeoutMillis),
      orElse: () =>
        Stream.fail(
          new CodexResponsesStreamError({
            operation: "readResponseBody",
            message: "Codex Responses body exceeded the idle timeout.",
          })
        ),
    }),
    Stream.mapAccumEffect(
      () => 0,
      (receivedBytes, bytes) => {
        const nextReceivedBytes = receivedBytes + bytes.byteLength;
        return nextReceivedBytes > policy.maximumBodyBytes
          ? Effect.fail(
              new CodexResponsesStreamError({
                operation: "readResponseBody",
                message:
                  "Codex Responses body exceeded the configured byte limit.",
              })
            )
          : Effect.succeed([nextReceivedBytes, [bytes]] as const);
      }
    )
  );

export const makeCodexHttpClient = Effect.gen(function* makeCodexHttpClient() {
  const client = yield* HttpClient.HttpClient;
  const scopedClient = HttpClient.withScope(client);
  const endpoint = yield* codexResponsesEndpointConfig;
  const transportPolicy = yield* loadCodexResponsesTransportPolicy;

  return CodexHttpClient.of({
    postResponses: Effect.fn("CodexHttpClient.postResponses")((input) =>
      Effect.gen(function* postCodexResponses() {
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
        const headers = yield* makeCodexResponsesHeaders(input);

        const upstreamRequest = HttpClientRequest.post(endpoint).pipe(
          HttpClientRequest.setHeaders(headers),
          HttpClientRequest.bodyText(encodedRequestBody, "application/json")
        );
        const response = yield* scopedClient.execute(upstreamRequest).pipe(
          Effect.mapError(
            () =>
              new CodexHttpNetworkError({
                operation: "fetch",
                message: "Unable to reach Codex Responses endpoint.",
              })
          ),
          Effect.timeoutOrElse({
            duration: Duration.millis(transportPolicy.headerTimeoutMillis),
            orElse: () =>
              Effect.fail(
                new CodexHttpNetworkError({
                  operation: "fetch",
                  message:
                    "Codex Responses endpoint exceeded the header timeout.",
                })
              ),
          })
        );
        const contentType = response.headers["content-type"] ?? "";
        const status = yield* Schema.decodeUnknownEffect(CodexHttpStatus)(
          response.status
        ).pipe(
          Effect.mapError(
            () =>
              new CodexResponsesStreamError({
                operation: "postResponses",
                message: "Codex Responses endpoint returned an invalid status.",
              })
          )
        );

        if (status < 200 || status >= 300) {
          return yield* new CodexHttpStatusError({
            operation: "postResponses",
            status,
            message:
              "Codex Responses endpoint returned an unsuccessful status.",
          });
        }

        const contentTypeHeader = yield* Schema.decodeUnknownEffect(
          CodexHttpContentTypeHeader
        )(contentType).pipe(
          Effect.mapError(
            () =>
              new CodexResponsesStreamError({
                operation: "postResponses",
                message: "Codex Responses endpoint returned invalid metadata.",
              })
          )
        );

        if (!isCodexResponsesEventStream(contentTypeHeader)) {
          return yield* new CodexResponsesStreamError({
            operation: "postResponses",
            message: "Codex Responses proof requires an SSE response.",
          });
        }

        const receivedBodyBytes = yield* Ref.make(0);
        const eventSummary = yield* codexResponsesSseData(
          boundedResponseBody(response.stream, transportPolicy).pipe(
            Stream.tap((bytes) =>
              Ref.update(
                receivedBodyBytes,
                (current) => current + bytes.byteLength
              )
            )
          ),
          "postResponses",
          transportPolicy.maximumEvents
        ).pipe(
          Stream.mapEffect((data) =>
            decodeCodexResponsesStreamData("postResponses", data)
          ),
          Stream.runFoldEffect(
            () => initialCodexResponsesStreamSequenceState,
            (state, streamInput) =>
              advanceCodexResponsesStreamSequence(
                "postResponses",
                state,
                streamInput
              ).pipe(Effect.map((advanced) => advanced.state))
          )
        );

        if (!eventSummary.completed) {
          return yield* new CodexResponsesStreamError({
            operation: "postResponses",
            message: "Codex Responses proof stream did not complete.",
          });
        }
        const receivedBodyByteCount = yield* Ref.get(receivedBodyBytes);

        return yield* Schema.decodeUnknownEffect(CodexResponsesProofResult)({
          transport: "direct-codex-responses",
          endpoint,
          status,
          contentType: "text/event-stream",
          receivedBodyBytes: receivedBodyByteCount,
          receivedStreamEvents: eventSummary.eventCount,
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
      }).pipe(Effect.scoped)
    ),
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
        const headers = yield* makeCodexResponsesHeaders(input);

        const upstreamRequest = HttpClientRequest.post(endpoint).pipe(
          HttpClientRequest.setHeaders(headers),
          HttpClientRequest.bodyText(encodedRequestBody, "application/json")
        );
        const responseScope = yield* Scope.make();
        const bodyOwnershipClaimed = yield* Deferred.make<null>();
        yield* Scope.addFinalizer(
          responseScope,
          Deferred.succeed(bodyOwnershipClaimed, null).pipe(Effect.asVoid)
        );
        return yield* Effect.gen(function* acquireCodexResponsesStream() {
          const response = yield* scopedClient.execute(upstreamRequest).pipe(
            Effect.provideService(Scope.Scope, responseScope),
            Effect.mapError(
              () =>
                new CodexHttpNetworkError({
                  operation: "fetch",
                  message: "Unable to reach Codex Responses endpoint.",
                })
            ),
            Effect.timeoutOrElse({
              duration: Duration.millis(transportPolicy.headerTimeoutMillis),
              orElse: () =>
                Effect.fail(
                  new CodexHttpNetworkError({
                    operation: "fetch",
                    message:
                      "Codex Responses endpoint exceeded the header timeout.",
                  })
                ),
            })
          );
          const contentType = response.headers["content-type"] ?? "";
          const status = yield* Schema.decodeUnknownEffect(CodexHttpStatus)(
            response.status
          ).pipe(
            Effect.mapError(
              () =>
                new CodexResponsesStreamError({
                  operation: "postResponsesStream",
                  message:
                    "Codex Responses endpoint returned an invalid status.",
                })
            )
          );

          if (status < 200 || status >= 300) {
            return yield* new CodexHttpStatusError({
              operation: "postResponsesStream",
              status,
              message:
                "Codex Responses endpoint returned an unsuccessful status.",
            });
          }

          const contentTypeHeader = yield* Schema.decodeUnknownEffect(
            CodexHttpContentTypeHeader
          )(contentType).pipe(
            Effect.mapError(
              () =>
                new CodexResponsesStreamError({
                  operation: "postResponsesStream",
                  message:
                    "Codex Responses endpoint returned invalid metadata.",
                })
            )
          );

          if (!isCodexResponsesEventStream(contentTypeHeader)) {
            return yield* new CodexResponsesStreamError({
              operation: "postResponsesStream",
              message: "Codex Responses stream requires an SSE response.",
            });
          }

          const metadata = yield* Schema.decodeUnknownEffect(
            CodexResponsesStreamMetadata
          )({ status, contentType: "text/event-stream" }).pipe(
            Effect.mapError(
              () =>
                new CodexResponsesStreamError({
                  operation: "postResponsesStream",
                  message: "Unable to decode Codex Responses stream metadata.",
                })
            )
          );

          yield* Effect.raceFirst(
            Deferred.await(bodyOwnershipClaimed),
            Effect.sleep(
              Duration.millis(transportPolicy.streamIdleTimeoutMillis)
            ).pipe(Effect.andThen(Scope.close(responseScope, Exit.void)))
          ).pipe(Effect.forkDetach({ startImmediately: true }));

          return {
            ...metadata,
            body: Stream.unwrap(
              Deferred.succeed(bodyOwnershipClaimed, null).pipe(
                Effect.map((claimed) =>
                  claimed
                    ? boundedResponseBody(
                        response.stream,
                        transportPolicy
                      ).pipe(
                        Stream.ensuring(Scope.close(responseScope, Exit.void))
                      )
                    : Stream.fail(
                        new CodexResponsesStreamError({
                          operation: "readResponseBody",
                          message:
                            "Codex Responses body ownership is unavailable.",
                        })
                      )
                )
              )
            ),
            transportPolicy,
          };
        }).pipe(
          Effect.onExit((exit) =>
            Exit.isFailure(exit)
              ? Scope.close(responseScope, exit)
              : Effect.void
          )
        );
      }
    ),
  });
}).pipe(Effect.withSpan("CodexHttpClientLive"));

export const postResponses = Effect.fnUntraced(function* postResponsesOperation(
  input: CodexResponsesPostInput
) {
  const client = yield* CodexHttpClient;

  return yield* client.postResponses(input);
});

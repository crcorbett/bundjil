import {
  CodexDirectProvider,
  CodexResponsesStreamError,
  makeOpenAICompatibleProxy,
  OpenAICompatibleChatCompletionChunk,
  OpenAICompatibleProxy,
} from "@bundjil/codex";
import type {
  CodexDirectProviderInputType,
  OpenAICompatibleChatCompletionStreamType,
} from "@bundjil/codex";
import { Effect, Layer, Schema, Stream } from "effect";

import { CodexProxyReadyLive } from "./readiness.service.js";

export const CodexProxyMockDirectProviderLive = Layer.succeed(
  CodexDirectProvider,
  {
    streamChatCompletion: Effect.fn(
      "CodexProxyMockDirectProvider.streamChatCompletion"
    )(function* (input: CodexDirectProviderInputType) {
      const chunk = yield* Schema.decodeUnknownEffect(
        OpenAICompatibleChatCompletionChunk
      )({
        choices: [
          {
            delta: {
              content: "Bundjil Codex proxy mock response.",
            },
            index: 0,
          },
        ],
        created: 1_700_000_000,
        id: "chatcmpl-bundjil-codex-proxy-mock",
        model: input.request.model,
        object: "chat.completion.chunk",
      }).pipe(
        Effect.mapError(
          (cause) =>
            new CodexResponsesStreamError({
              operation: "toOpenAICompatibleStream",
              message: "Unable to decode mock OpenAI-compatible stream chunk.",
              cause,
            })
        )
      );
      const encodedChunk = yield* Schema.encodeEffect(
        Schema.fromJsonString(OpenAICompatibleChatCompletionChunk)
      )(chunk).pipe(
        Effect.mapError(
          (cause) =>
            new CodexResponsesStreamError({
              operation: "toOpenAICompatibleStream",
              message: "Unable to encode mock OpenAI-compatible stream chunk.",
              cause,
            })
        )
      );

      const stream: OpenAICompatibleChatCompletionStreamType = {
        body: Stream.make(`data: ${encodedChunk}\n\ndata: [DONE]\n\n`).pipe(
          Stream.encodeText
        ),
        contentType: "text/event-stream",
      };
      return stream;
    }),
  }
);

export const CodexProxyOpenAICompatibleProxyMockLive = Layer.effect(
  OpenAICompatibleProxy,
  makeOpenAICompatibleProxy
).pipe(
  Layer.provide(CodexProxyMockDirectProviderLive),
  Layer.merge(CodexProxyReadyLive)
);

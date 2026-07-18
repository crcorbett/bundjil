import {
  CodexDirectProvider,
  CodexResponsesStreamError,
  makeOpenAICompatibleProxy,
  OpenAICompatibleChatCompletionChunk,
  OpenAICompatibleChatCompletionStream,
  OpenAICompatibleProxy,
} from "@bundjil/codex";
import type { CodexDirectProviderInputType } from "@bundjil/codex";
import { Effect, Layer, Schema } from "effect";

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

      return yield* Schema.decodeUnknownEffect(
        OpenAICompatibleChatCompletionStream
      )({
        body: `data: ${encodedChunk}\n\ndata: [DONE]\n\n`,
        contentType: "text/event-stream",
      }).pipe(
        Effect.mapError(
          (cause) =>
            new CodexResponsesStreamError({
              operation: "toOpenAICompatibleStream",
              message: "Unable to decode mock OpenAI-compatible stream body.",
              cause,
            })
        )
      );
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

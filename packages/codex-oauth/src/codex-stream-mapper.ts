import { Context, Effect, Option, Redacted, Schema } from "effect";

import { CodexResponsesStreamError } from "./errors.js";
import {
  CodexResponsesStreamEvent,
  OpenAICompatibleChatCompletionChunk,
  OpenAICompatibleChatCompletionStream,
} from "./schemas.js";
import type {
  CodexResponsesStreamMapInput,
  OpenAICompatibleChatCompletionStream as OpenAICompatibleChatCompletionStreamType,
} from "./schemas.js";

export interface CodexStreamMapperShape {
  readonly toOpenAICompatibleStream: (
    input: CodexResponsesStreamMapInput
  ) => Effect.Effect<
    OpenAICompatibleChatCompletionStreamType,
    CodexResponsesStreamError
  >;
}

export class CodexStreamMapper extends Context.Service<
  CodexStreamMapper,
  CodexStreamMapperShape
>()("@bundjil/codex-oauth/CodexStreamMapper") {}

const decodeCodexStreamLine = (line: string) => {
  const data = line.startsWith("data: ") ? line.slice("data: ".length) : "";

  if (data.length === 0 || data === "[DONE]") {
    return Effect.succeed(Option.none<typeof CodexResponsesStreamEvent.Type>());
  }

  return Schema.decodeUnknownEffect(
    Schema.fromJsonString(CodexResponsesStreamEvent)
  )(data).pipe(
    Effect.map(Option.some),
    Effect.mapError(
      (cause) =>
        new CodexResponsesStreamError({
          operation: "toOpenAICompatibleStream",
          message: "Unable to decode Codex Responses stream event.",
          cause,
        })
    )
  );
};

export const makeCodexStreamMapper = CodexStreamMapper.of({
  toOpenAICompatibleStream: Effect.fn(
    "CodexStreamMapper.toOpenAICompatibleStream"
  )(function* (input: CodexResponsesStreamMapInput) {
    const decodedEvents = yield* Effect.forEach(
      Redacted.value(input.body)
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0),
      decodeCodexStreamLine
    );
    const chunks: string[] = [];

    for (const decodedEvent of decodedEvents) {
      if (Option.isNone(decodedEvent)) {
        continue;
      }

      const event = decodedEvent.value;

      if (
        event.type !== "response.output_text.delta" ||
        event.delta === undefined
      ) {
        continue;
      }

      const chunk = yield* Schema.decodeUnknownEffect(
        OpenAICompatibleChatCompletionChunk
      )({
        id: "bundjil-codex",
        object: "chat.completion.chunk",
        created: 0,
        model: input.model,
        choices: [
          {
            index: 0,
            delta: { content: event.delta },
            finish_reason: null,
          },
        ],
      }).pipe(
        Effect.mapError(
          (cause) =>
            new CodexResponsesStreamError({
              operation: "toOpenAICompatibleStream",
              message: "Unable to encode OpenAI-compatible stream chunk.",
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
              message: "Unable to encode OpenAI-compatible stream chunk.",
              cause,
            })
        )
      );

      chunks.push(encodedChunk);
    }

    const body = `${chunks
      .map((chunk) => `data: ${chunk}\n\n`)
      .join("")}data: [DONE]\n\n`;

    return yield* Schema.decodeUnknownEffect(
      OpenAICompatibleChatCompletionStream
    )({
      contentType: "text/event-stream",
      body,
    }).pipe(
      Effect.mapError(
        (cause) =>
          new CodexResponsesStreamError({
            operation: "toOpenAICompatibleStream",
            message: "Unable to decode OpenAI-compatible stream result.",
            cause,
          })
      )
    );
  }),
});

export const toOpenAICompatibleStream = (input: CodexResponsesStreamMapInput) =>
  Effect.gen(function* toOpenAICompatibleStreamOperation() {
    const mapper = yield* CodexStreamMapper;

    return yield* mapper.toOpenAICompatibleStream(input);
  });

import { Context, Effect, HashMap, Option, Redacted, Schema } from "effect";

import { CodexResponsesStreamError } from "./errors.js";
import {
  CodexResponsesFunctionArgumentsDeltaEvent,
  CodexResponsesFunctionCallAddedEvent,
  CodexResponsesOutputItemDiscriminator,
  CodexResponsesStreamEvent,
  OpenAICompatibleChatCompletionChunk,
  OpenAICompatibleChatCompletionStream,
} from "./schemas.js";
import type {
  CodexResponsesStreamMapInput,
  OpenAICompatibleChatCompletionChunk as OpenAICompatibleChatCompletionChunkType,
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
    const chunks: OpenAICompatibleChatCompletionChunkType[] = [];
    let functionCallIndexes = HashMap.empty<number, number>();
    let nextFunctionCallIndex = 0;
    let hasFunctionCall = false;

    for (const decodedEvent of decodedEvents) {
      if (Option.isNone(decodedEvent)) {
        continue;
      }

      const event = decodedEvent.value;

      if (
        event.type === "response.output_text.delta" &&
        event.delta !== undefined
      ) {
        chunks.push({
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
        });
        continue;
      }

      if (event.type === "response.output_item.added") {
        const item = yield* Schema.decodeUnknownEffect(
          CodexResponsesOutputItemDiscriminator
        )(event.item).pipe(
          Effect.mapError(
            (cause) =>
              new CodexResponsesStreamError({
                operation: "toOpenAICompatibleStream",
                message: "Unable to decode Codex Responses output item.",
                cause,
              })
          )
        );

        if (item.type !== "function_call") {
          continue;
        }

        const functionCall = yield* Schema.decodeUnknownEffect(
          CodexResponsesFunctionCallAddedEvent
        )(event).pipe(
          Effect.mapError(
            (cause) =>
              new CodexResponsesStreamError({
                operation: "toOpenAICompatibleStream",
                message: "Unable to decode Codex function-call output item.",
                cause,
              })
          )
        );
        hasFunctionCall = true;
        const functionCallIndex = nextFunctionCallIndex;
        functionCallIndexes = HashMap.set(
          functionCallIndexes,
          functionCall.output_index,
          functionCallIndex
        );
        nextFunctionCallIndex += 1;
        chunks.push({
          id: "bundjil-codex",
          object: "chat.completion.chunk",
          created: 0,
          model: input.model,
          choices: [
            {
              index: 0,
              delta: {
                tool_calls: [
                  {
                    index: functionCallIndex,
                    id: functionCall.item.call_id,
                    type: "function",
                    function: {
                      name: functionCall.item.name,
                      arguments: functionCall.item.arguments,
                    },
                  },
                ],
              },
              finish_reason: null,
            },
          ],
        });
        continue;
      }

      if (event.type === "response.function_call_arguments.delta") {
        const functionArguments = yield* Schema.decodeUnknownEffect(
          CodexResponsesFunctionArgumentsDeltaEvent
        )(event).pipe(
          Effect.mapError(
            (cause) =>
              new CodexResponsesStreamError({
                operation: "toOpenAICompatibleStream",
                message: "Unable to decode Codex function-call arguments.",
                cause,
              })
          )
        );
        const functionCallIndex = HashMap.get(
          functionCallIndexes,
          functionArguments.output_index
        );

        if (Option.isNone(functionCallIndex)) {
          return yield* new CodexResponsesStreamError({
            operation: "toOpenAICompatibleStream",
            message:
              "Codex function-call arguments arrived before their output item.",
            cause: "Missing function-call output index.",
          });
        }

        hasFunctionCall = true;
        chunks.push({
          id: "bundjil-codex",
          object: "chat.completion.chunk",
          created: 0,
          model: input.model,
          choices: [
            {
              index: 0,
              delta: {
                tool_calls: [
                  {
                    index: functionCallIndex.value,
                    function: { arguments: functionArguments.delta },
                  },
                ],
              },
              finish_reason: null,
            },
          ],
        });
      }
    }

    chunks.push({
      id: "bundjil-codex",
      object: "chat.completion.chunk",
      created: 0,
      model: input.model,
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: hasFunctionCall ? "tool_calls" : "stop",
        },
      ],
    });

    const encodedChunks = yield* Effect.all(
      chunks.map((chunk) =>
        Schema.encodeEffect(
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
        )
      )
    );

    const body = `${encodedChunks
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

import {
  Context,
  Effect,
  HashMap,
  Match,
  Option,
  Ref,
  Schema,
  Stream,
} from "effect";

import {
  CodexResponsesFunctionArgumentsDeltaEvent,
  CodexResponsesFunctionCallAddedEvent,
  CodexResponsesOutputItemDiscriminator,
  CodexResponsesRecognizedStreamEventType,
  CodexResponsesStreamEvent,
  OpenAICompatibleChatCompletionChunk,
  OpenAICompatibleChatCompletionId,
} from "./contracts.js";
import type {
  CodexResponsesModelId,
  CodexResponsesStreamEvent as CodexResponsesStreamEventType,
  CodexResponsesStreamMapInput,
  OpenAICompatibleChatCompletionChunk as OpenAICompatibleChatCompletionChunkType,
  OpenAICompatibleChatCompletionStream,
} from "./contracts.js";
import { CodexResponsesStreamError } from "./errors.js";

export interface CodexStreamMapperShape {
  readonly toOpenAICompatibleStream: (
    input: CodexResponsesStreamMapInput
  ) => Effect.Effect<
    OpenAICompatibleChatCompletionStream,
    CodexResponsesStreamError
  >;
}

export class CodexStreamMapper extends Context.Service<
  CodexStreamMapper,
  CodexStreamMapperShape
>()("@bundjil/codex/CodexStreamMapper") {}

const codexResponsesSseLineMaxBytes = 1024 * 1024;
const lineFeed = Uint8Array.of(10);

type LineAccumulator = Readonly<{
  byteLength: number;
  parts: readonly Uint8Array[];
}>;

type MapperState = Readonly<{
  functionCallIndexes: HashMap.HashMap<number, number>;
  hasFunctionCall: boolean;
  nextFunctionCallIndex: number;
}>;

const initialMapperState: MapperState = {
  functionCallIndexes: HashMap.empty(),
  hasFunctionCall: false,
  nextFunctionCallIndex: 0,
};

const streamError = (message: string) =>
  new CodexResponsesStreamError({
    operation: "toOpenAICompatibleStream",
    message,
  });

const decodeLine = (parts: readonly Uint8Array[], byteLength: number) =>
  Effect.try({
    try: () => {
      const bytes = new Uint8Array(byteLength);
      let offset = 0;
      for (const part of parts) {
        bytes.set(part, offset);
        offset += part.byteLength;
      }
      const contentLength =
        bytes.at(-1) === 13 ? bytes.byteLength - 1 : bytes.byteLength;
      return new TextDecoder("utf-8", { fatal: true }).decode(
        bytes.subarray(0, contentLength)
      );
    },
    catch: () => streamError("Unable to decode a Codex Responses SSE line."),
  });

const boundedSseLines = (
  source: Stream.Stream<Uint8Array, CodexResponsesStreamError>
) =>
  source.pipe(
    Stream.concat(Stream.succeed(lineFeed)),
    Stream.mapAccumEffect(
      (): LineAccumulator => ({ byteLength: 0, parts: [] }),
      (state, bytes) =>
        Effect.gen(function* splitSseChunk() {
          const lines: string[] = [];
          let { parts } = state;
          let { byteLength } = state;
          let segmentStart = 0;

          for (let index = 0; index < bytes.byteLength; index += 1) {
            if (bytes[index] !== 10) {
              continue;
            }
            const segment = bytes.subarray(segmentStart, index);
            const completeLineBytes = byteLength + segment.byteLength;
            if (completeLineBytes > codexResponsesSseLineMaxBytes) {
              return yield* streamError(
                "Codex Responses SSE line exceeded the configured byte limit."
              );
            }
            lines.push(
              yield* decodeLine([...parts, segment], completeLineBytes)
            );
            parts = [];
            byteLength = 0;
            segmentStart = index + 1;
          }

          if (segmentStart < bytes.byteLength) {
            const residual = bytes.subarray(segmentStart);
            byteLength += residual.byteLength;
            if (byteLength > codexResponsesSseLineMaxBytes) {
              return yield* streamError(
                "Codex Responses SSE line exceeded the configured byte limit."
              );
            }
            parts = [...parts, residual];
          }

          return [{ byteLength, parts }, lines] as const;
        })
    )
  );

const decodeCodexStreamLine = (line: string) => {
  if (!line.startsWith("data:")) {
    return Effect.succeed(Option.none<CodexResponsesStreamEventType>());
  }
  const data = line.startsWith("data: ")
    ? line.slice("data: ".length)
    : line.slice("data:".length);

  if (data.length === 0 || data === "[DONE]") {
    return Effect.succeed(Option.none<CodexResponsesStreamEventType>());
  }

  return Schema.decodeUnknownEffect(
    Schema.fromJsonString(CodexResponsesStreamEvent)
  )(data).pipe(
    Effect.map(Option.some),
    Effect.mapError(() =>
      streamError("Unable to decode Codex Responses stream event.")
    )
  );
};

const encodeChunk = (chunk: OpenAICompatibleChatCompletionChunkType) =>
  Schema.encodeEffect(
    Schema.fromJsonString(OpenAICompatibleChatCompletionChunk)
  )(chunk).pipe(
    Effect.map((encoded) => `data: ${encoded}\n\n`),
    Effect.mapError(() =>
      streamError("Unable to encode OpenAI-compatible stream chunk.")
    )
  );

const chunk = (
  completionId: typeof OpenAICompatibleChatCompletionId.Type,
  model: CodexResponsesModelId,
  delta: OpenAICompatibleChatCompletionChunkType["choices"][number]["delta"],
  finishReason: OpenAICompatibleChatCompletionChunkType["choices"][number]["finish_reason"] = null
): OpenAICompatibleChatCompletionChunkType => ({
  id: completionId,
  object: "chat.completion.chunk",
  created: 0,
  model,
  choices: [
    {
      index: 0,
      delta,
      finish_reason: finishReason,
    },
  ],
});

const mapEvent = (
  completionId: typeof OpenAICompatibleChatCompletionId.Type,
  model: CodexResponsesModelId,
  state: Ref.Ref<MapperState>,
  event: CodexResponsesStreamEventType
) =>
  Effect.gen(function* mapCodexStreamEvent() {
    const recognizedEventType = yield* Schema.decodeUnknownEffect(
      CodexResponsesRecognizedStreamEventType
    )(event.type).pipe(Effect.option);

    if (Option.isNone(recognizedEventType)) {
      return Option.none<string>();
    }

    return yield* Match.value(recognizedEventType.value).pipe(
      Match.when("response.output_text.delta", () =>
        event.delta === undefined
          ? Effect.succeed(Option.none<string>())
          : encodeChunk(
              chunk(completionId, model, { content: event.delta })
            ).pipe(Effect.map(Option.some))
      ),
      Match.when("response.output_item.added", () =>
        Effect.gen(function* mapFunctionCallOutputItem() {
          const item = yield* Schema.decodeUnknownEffect(
            CodexResponsesOutputItemDiscriminator
          )(event.item).pipe(
            Effect.mapError(() =>
              streamError("Unable to decode Codex Responses output item.")
            )
          );

          if (item.type !== "function_call") {
            return Option.none<string>();
          }

          const functionCall = yield* Schema.decodeUnknownEffect(
            CodexResponsesFunctionCallAddedEvent
          )(event).pipe(
            Effect.mapError(() =>
              streamError("Unable to decode Codex function-call output item.")
            )
          );
          const current = yield* Ref.get(state);
          const functionCallIndex = current.nextFunctionCallIndex;
          yield* Ref.set(state, {
            functionCallIndexes: HashMap.set(
              current.functionCallIndexes,
              functionCall.output_index,
              functionCallIndex
            ),
            hasFunctionCall: true,
            nextFunctionCallIndex: functionCallIndex + 1,
          });

          return Option.some(
            yield* encodeChunk(
              chunk(completionId, model, {
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
              })
            )
          );
        })
      ),
      Match.when("response.function_call_arguments.delta", () =>
        Effect.gen(function* mapFunctionCallArguments() {
          const functionArguments = yield* Schema.decodeUnknownEffect(
            CodexResponsesFunctionArgumentsDeltaEvent
          )(event).pipe(
            Effect.mapError(() =>
              streamError("Unable to decode Codex function-call arguments.")
            )
          );
          const current = yield* Ref.get(state);
          const functionCallIndex = HashMap.get(
            current.functionCallIndexes,
            functionArguments.output_index
          );

          if (Option.isNone(functionCallIndex)) {
            return yield* streamError(
              "Codex function-call arguments arrived before their output item."
            );
          }

          yield* Ref.set(state, { ...current, hasFunctionCall: true });
          return Option.some(
            yield* encodeChunk(
              chunk(completionId, model, {
                tool_calls: [
                  {
                    index: functionCallIndex.value,
                    function: { arguments: functionArguments.delta },
                  },
                ],
              })
            )
          );
        })
      ),
      Match.exhaustive
    );
  });

export const makeCodexStreamMapper = CodexStreamMapper.of({
  toOpenAICompatibleStream: Effect.fn(
    "CodexStreamMapper.toOpenAICompatibleStream"
  )(function* (input: CodexResponsesStreamMapInput) {
    const completionId = yield* Schema.decodeUnknownEffect(
      OpenAICompatibleChatCompletionId
    )("bundjil-codex").pipe(
      Effect.mapError(() =>
        streamError("Unable to construct OpenAI-compatible completion ID.")
      )
    );
    const state = yield* Ref.make(initialMapperState);
    const mapped = boundedSseLines(input.body).pipe(
      Stream.mapEffect(decodeCodexStreamLine),
      Stream.mapEffect((event) =>
        Option.match(event, {
          onNone: () => Effect.succeed(Option.none<string>()),
          onSome: (value) => mapEvent(completionId, input.model, state, value),
        })
      ),
      Stream.filter(Option.isSome),
      Stream.map((event) => event.value)
    );
    const completed = Stream.fromEffect(
      Ref.get(state).pipe(
        Effect.flatMap((current) =>
          encodeChunk(
            chunk(
              completionId,
              input.model,
              {},
              current.hasFunctionCall ? "tool_calls" : "stop"
            )
          )
        ),
        Effect.map((encoded) => `${encoded}data: [DONE]\n\n`)
      )
    );

    return {
      contentType: "text/event-stream",
      body: Stream.encodeText(Stream.concat(mapped, completed)),
    };
  }),
});

export const toOpenAICompatibleStream = Effect.fnUntraced(
  function* toOpenAICompatibleStreamOperation(
    input: CodexResponsesStreamMapInput
  ) {
    const mapper = yield* CodexStreamMapper;

    return yield* mapper.toOpenAICompatibleStream(input);
  }
);

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
  OpenAICompatibleChatCompletionChunk,
  OpenAICompatibleChatCompletionId,
} from "./contracts.js";
import type {
  CodexResponsesModelId,
  CodexResponsesStreamMapInput,
  OpenAICompatibleChatCompletionChunk as OpenAICompatibleChatCompletionChunkType,
  OpenAICompatibleChatCompletionStream,
} from "./contracts.js";
import { CodexResponsesStreamError } from "./errors.js";
import { codexResponsesSseData } from "./sse.js";
import {
  advanceCodexResponsesStreamSequence,
  decodeCodexResponsesStreamData,
  initialCodexResponsesStreamSequenceState,
} from "./stream-events.js";
import type {
  CodexResponsesRecognizedStreamEvent,
  CodexResponsesStreamSequenceState,
} from "./stream-events.js";

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

type MapperState = Readonly<{
  functionCallIndexes: HashMap.HashMap<number, number>;
  hasFunctionCall: boolean;
  nextFunctionCallIndex: number;
  sequence: CodexResponsesStreamSequenceState;
}>;

const initialMapperState: MapperState = {
  functionCallIndexes: HashMap.empty(),
  hasFunctionCall: false,
  nextFunctionCallIndex: 0,
  sequence: initialCodexResponsesStreamSequenceState,
};

const streamError = (message: string) =>
  new CodexResponsesStreamError({
    operation: "toOpenAICompatibleStream",
    message,
  });

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
  event: CodexResponsesRecognizedStreamEvent
) =>
  Match.value(event).pipe(
    Match.tag("Ignored", () => Effect.succeed(Option.none<string>())),
    Match.tag("OutputTextDelta", ({ value }) =>
      encodeChunk(chunk(completionId, model, { content: value.delta })).pipe(
        Effect.map(Option.some)
      )
    ),
    Match.tag("FunctionCallAdded", ({ value: functionCall }) =>
      Effect.gen(function* mapFunctionCallOutputItem() {
        const current = yield* Ref.get(state);
        if (
          HashMap.has(current.functionCallIndexes, functionCall.output_index)
        ) {
          return yield* streamError(
            "Codex function-call output index was added more than once."
          );
        }
        const functionCallIndex = current.nextFunctionCallIndex;
        yield* Ref.set(state, {
          ...current,
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
    Match.tag("FunctionArgumentsDelta", ({ value: functionArguments }) =>
      Effect.gen(function* mapFunctionCallArguments() {
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
    const mapped = codexResponsesSseData(
      input.body,
      "toOpenAICompatibleStream",
      input.transportPolicy.maximumEvents
    ).pipe(
      Stream.mapEffect((data) =>
        decodeCodexResponsesStreamData("toOpenAICompatibleStream", data)
      ),
      Stream.mapEffect((streamInput) =>
        Effect.gen(function* sequenceCodexStreamEvent() {
          const current = yield* Ref.get(state);
          const advanced = yield* advanceCodexResponsesStreamSequence(
            "toOpenAICompatibleStream",
            current.sequence,
            streamInput
          );
          yield* Ref.set(state, { ...current, sequence: advanced.state });

          return yield* Match.value(advanced.disposition).pipe(
            Match.tag("Continue", ({ event }) =>
              mapEvent(completionId, input.model, state, event)
            ),
            Match.tag("Completed", () => Effect.succeed(Option.none<string>())),
            Match.tag("Done", () => Effect.succeed(Option.none<string>())),
            Match.exhaustive
          );
        })
      ),
      Stream.filter(Option.isSome),
      Stream.map((event) => event.value)
    );
    const completed = Stream.fromEffect(
      Ref.get(state).pipe(
        Effect.flatMap((current) =>
          current.sequence.completed
            ? encodeChunk(
                chunk(
                  completionId,
                  input.model,
                  {},
                  current.hasFunctionCall ? "tool_calls" : "stop"
                )
              )
            : streamError(
                "Codex Responses stream ended before response.completed."
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

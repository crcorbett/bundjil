import { Chunk, Effect, Schema, Stream } from "effect";

import type {
  CodexHttpContentTypeHeader,
  CodexResponsesStreamOperation,
} from "./error-contracts.js";
import { CodexResponsesStreamError } from "./errors.js";

const codexResponsesSseLineMaxBytes = 1024 * 1024;
const codexResponsesSseLineFragmentMaxCount = 4096;
const codexResponsesSseEventMaxBytes = 1024 * 1024;
const codexResponsesSseEventFieldMaxCount = 4096;

type ByteInput =
  | Readonly<{ _tag: "Bytes"; value: Uint8Array }>
  | Readonly<{ _tag: "End" }>;

type LineInput =
  | Readonly<{
      _tag: "Line";
      value: string;
      wireByteLength: number;
    }>
  | Readonly<{ _tag: "End" }>;

type PendingCarriageReturnLine = Readonly<{
  value: string;
  contentByteLength: number;
}>;

type LineAccumulator = Readonly<{
  byteLength: number;
  fragmentCount: number;
  isFirstLine: boolean;
  parts: Chunk.Chunk<Uint8Array>;
  pendingCarriageReturn: PendingCarriageReturnLine | undefined;
}>;

type LineStep = readonly [LineAccumulator, readonly LineInput[]];

export const CodexResponsesSseDataPayload = Schema.String.pipe(
  Schema.brand("CodexResponsesSseDataPayload")
);
export type CodexResponsesSseDataPayload =
  typeof CodexResponsesSseDataPayload.Type;

type DataAccumulator = Readonly<{
  byteLength: number;
  fieldCount: number;
  parts: Chunk.Chunk<CodexResponsesSseDataPayload>;
}>;

type DataStep = readonly [
  DataAccumulator,
  readonly CodexResponsesSseDataPayload[],
];

const streamError = (
  operation: CodexResponsesStreamOperation,
  message: string
) => new CodexResponsesStreamError({ operation, message });

const decodeLine = (
  operation: CodexResponsesStreamOperation,
  parts: Chunk.Chunk<Uint8Array>,
  byteLength: number,
  isFirstLine: boolean
) =>
  Effect.try({
    try: () => {
      const bytes = new Uint8Array(byteLength);
      let offset = 0;
      for (const part of parts) {
        bytes.set(part, offset);
        offset += part.byteLength;
      }
      const value = new TextDecoder("utf-8", {
        fatal: true,
        ignoreBOM: true,
      }).decode(bytes);
      return isFirstLine && value.startsWith("\uFEFF") ? value.slice(1) : value;
    },
    catch: () =>
      streamError(operation, "Unable to decode a Codex Responses SSE line."),
  });

const finishSseLines = (
  operation: CodexResponsesStreamOperation,
  state: LineAccumulator
) =>
  Effect.gen(function* finishSseLineFraming() {
    if (state.byteLength > 0) {
      return yield* streamError(
        operation,
        "Codex Responses SSE stream ended with an incomplete line."
      );
    }
    const emitted: LineInput[] = [];
    if (state.pendingCarriageReturn !== undefined) {
      emitted.push({
        _tag: "Line",
        value: state.pendingCarriageReturn.value,
        wireByteLength: state.pendingCarriageReturn.contentByteLength + 1,
      });
    }
    emitted.push({ _tag: "End" });
    const step: LineStep = [
      { ...state, pendingCarriageReturn: undefined },
      emitted,
    ];
    return step;
  });

const splitSseBytes = (
  operation: CodexResponsesStreamOperation,
  state: LineAccumulator,
  input: Uint8Array
) =>
  Effect.gen(function* splitSseByteChunk() {
    const emitted: LineInput[] = [];
    let { parts } = state;
    let { byteLength } = state;
    let { fragmentCount } = state;
    let { isFirstLine } = state;
    let segmentStart = 0;
    let { pendingCarriageReturn } = state;

    if (pendingCarriageReturn !== undefined && input.byteLength > 0) {
      const isCarriageReturnLineFeed = input[0] === 10;
      emitted.push({
        _tag: "Line",
        value: pendingCarriageReturn.value,
        wireByteLength:
          pendingCarriageReturn.contentByteLength +
          (isCarriageReturnLineFeed ? 2 : 1),
      });
      pendingCarriageReturn = undefined;
      segmentStart = isCarriageReturnLineFeed ? 1 : 0;
    }

    for (let index = segmentStart; index < input.byteLength; index += 1) {
      const delimiter = input[index];
      if (delimiter !== 10 && delimiter !== 13) {
        continue;
      }

      const segment = input.subarray(segmentStart, index);
      const completeLineBytes = byteLength + segment.byteLength;
      if (completeLineBytes > codexResponsesSseLineMaxBytes) {
        return yield* streamError(
          operation,
          "Codex Responses SSE line exceeded the configured byte limit."
        );
      }
      const completeParts =
        segment.byteLength === 0 ? parts : Chunk.append(parts, segment);
      const completeFragmentCount =
        segment.byteLength === 0 ? fragmentCount : fragmentCount + 1;
      if (completeFragmentCount > codexResponsesSseLineFragmentMaxCount) {
        return yield* streamError(
          operation,
          "Codex Responses SSE line exceeded the configured fragment limit."
        );
      }
      const value = yield* decodeLine(
        operation,
        completeParts,
        completeLineBytes,
        isFirstLine
      );
      isFirstLine = false;

      parts = Chunk.empty();
      byteLength = 0;
      fragmentCount = 0;
      segmentStart = index + 1;

      if (delimiter === 13 && index + 1 === input.byteLength) {
        pendingCarriageReturn = {
          value,
          contentByteLength: completeLineBytes,
        };
        continue;
      }

      const isCarriageReturnLineFeed =
        delimiter === 13 && input[index + 1] === 10;
      emitted.push({
        _tag: "Line",
        value,
        wireByteLength: completeLineBytes + (isCarriageReturnLineFeed ? 2 : 1),
      });
      if (isCarriageReturnLineFeed) {
        index += 1;
        segmentStart = index + 1;
      }
    }

    if (segmentStart < input.byteLength) {
      const residual = input.subarray(segmentStart);
      byteLength += residual.byteLength;
      fragmentCount += 1;
      if (byteLength > codexResponsesSseLineMaxBytes) {
        return yield* streamError(
          operation,
          "Codex Responses SSE line exceeded the configured byte limit."
        );
      }
      if (fragmentCount > codexResponsesSseLineFragmentMaxCount) {
        return yield* streamError(
          operation,
          "Codex Responses SSE line exceeded the configured fragment limit."
        );
      }
      parts = Chunk.append(parts, residual);
    }

    const step: LineStep = [
      {
        byteLength,
        fragmentCount,
        isFirstLine,
        parts,
        pendingCarriageReturn,
      },
      emitted,
    ];
    return step;
  });

export const isCodexResponsesEventStream = (
  contentType: CodexHttpContentTypeHeader
) => contentType.split(";", 1)[0]?.trim().toLowerCase() === "text/event-stream";

export const codexResponsesSseData = (
  source: Stream.Stream<Uint8Array, CodexResponsesStreamError>,
  operation: CodexResponsesStreamOperation,
  maximumEvents: number
) => {
  const lines = source.pipe(
    Stream.map(
      (value): ByteInput => ({
        _tag: "Bytes",
        value,
      })
    ),
    Stream.concat(Stream.succeed<ByteInput>({ _tag: "End" })),
    Stream.mapAccumEffect(
      (): LineAccumulator => ({
        byteLength: 0,
        fragmentCount: 0,
        isFirstLine: true,
        parts: Chunk.empty(),
        pendingCarriageReturn: undefined,
      }),
      (state, input) =>
        input._tag === "End"
          ? finishSseLines(operation, state)
          : splitSseBytes(operation, state, input.value)
    )
  );

  const data = lines.pipe(
    Stream.mapAccumEffect(
      (): DataAccumulator => ({
        byteLength: 0,
        fieldCount: 0,
        parts: Chunk.empty(),
      }),
      (state, input) =>
        Effect.gen(function* frameSseEvent() {
          if (input._tag === "End") {
            if (state.byteLength > 0) {
              return yield* streamError(
                operation,
                "Codex Responses SSE stream ended with an incomplete event."
              );
            }
            const step: DataStep = [state, []];
            return step;
          }

          const byteLength = state.byteLength + input.wireByteLength;
          if (byteLength > codexResponsesSseEventMaxBytes) {
            return yield* streamError(
              operation,
              "Codex Responses SSE event exceeded the configured byte limit."
            );
          }

          if (input.value.length === 0) {
            const eventData =
              Chunk.size(state.parts) === 0
                ? []
                : [
                    yield* Schema.decodeUnknownEffect(
                      CodexResponsesSseDataPayload
                    )(Chunk.toReadonlyArray(state.parts).join("\n")).pipe(
                      Effect.mapError(() =>
                        streamError(
                          operation,
                          "Unable to decode Codex Responses SSE data."
                        )
                      )
                    ),
                  ];
            const step: DataStep = [
              { byteLength: 0, fieldCount: 0, parts: Chunk.empty() },
              eventData,
            ];
            return step;
          }

          const fieldCount = state.fieldCount + 1;
          if (fieldCount > codexResponsesSseEventFieldMaxCount) {
            return yield* streamError(
              operation,
              "Codex Responses SSE event exceeded the configured field limit."
            );
          }
          if (input.value !== "data" && !input.value.startsWith("data:")) {
            const step: DataStep = [{ ...state, byteLength, fieldCount }, []];
            return step;
          }
          let value = "";
          if (input.value !== "data") {
            value = input.value.startsWith("data: ")
              ? input.value.slice("data: ".length)
              : input.value.slice("data:".length);
          }
          const decodedValue = yield* Schema.decodeUnknownEffect(
            CodexResponsesSseDataPayload
          )(value).pipe(
            Effect.mapError(() =>
              streamError(
                operation,
                "Unable to decode Codex Responses SSE data."
              )
            )
          );
          const step: DataStep = [
            {
              byteLength,
              fieldCount,
              parts: Chunk.append(state.parts, decodedValue),
            },
            [],
          ];
          return step;
        })
    )
  );

  return data.pipe(
    Stream.mapAccumEffect(
      () => 0,
      (eventCount, value) => {
        const nextEventCount = eventCount + 1;
        return nextEventCount > maximumEvents
          ? Effect.fail(
              streamError(
                operation,
                "Codex Responses SSE stream exceeded the configured event limit."
              )
            )
          : Effect.succeed<
              readonly [number, readonly CodexResponsesSseDataPayload[]]
            >([nextEventCount, [value]]);
      }
    )
  );
};

import { Effect, Match, Schema } from "effect";

import {
  CodexJsonValue,
  CodexResponsesCompletedEvent,
  CodexResponsesErrorEvent,
  CodexResponsesFailedEvent,
  CodexResponsesFunctionArgumentsDeltaEvent,
  CodexResponsesFunctionCallAddedEvent,
  CodexResponsesIncompleteEvent,
  CodexResponsesOutputItemAddedDiscriminatorEvent,
  CodexResponsesOutputTextDeltaEvent,
  CodexResponsesStreamEventDiscriminator,
} from "./contracts.js";
import type {
  CodexResponsesFunctionArgumentsDeltaEvent as CodexResponsesFunctionArgumentsDeltaEventType,
  CodexResponsesFunctionCallAddedEvent as CodexResponsesFunctionCallAddedEventType,
  CodexResponsesOutputTextDeltaEvent as CodexResponsesOutputTextDeltaEventType,
  CodexResponsesSequenceNumber,
  CodexResponsesStreamEventKind,
} from "./contracts.js";
import type { CodexResponsesStreamOperation } from "./error-contracts.js";
import { CodexResponsesStreamError } from "./errors.js";
import type { CodexResponsesSseDataPayload } from "./sse.js";

type CodexResponsesDecodedStreamEvent = Readonly<{
  type: CodexResponsesStreamEventKind;
  sequenceNumber: CodexResponsesSequenceNumber;
  raw: CodexJsonValue;
}>;

export type CodexResponsesRecognizedStreamEvent =
  | Readonly<{
      _tag: "OutputTextDelta";
      value: CodexResponsesOutputTextDeltaEventType;
    }>
  | Readonly<{
      _tag: "FunctionCallAdded";
      value: CodexResponsesFunctionCallAddedEventType;
    }>
  | Readonly<{
      _tag: "FunctionArgumentsDelta";
      value: CodexResponsesFunctionArgumentsDeltaEventType;
    }>
  | Readonly<{ _tag: "Ignored" }>;

export type CodexResponsesStreamInput =
  | Readonly<{
      _tag: "Event";
      event: CodexResponsesDecodedStreamEvent;
    }>
  | Readonly<{ _tag: "Done" }>;

export type CodexResponsesStreamSequenceState = Readonly<{
  completed: boolean;
  done: boolean;
  eventCount: number;
  nextSequenceNumber: number;
}>;

export const initialCodexResponsesStreamSequenceState: CodexResponsesStreamSequenceState =
  {
    completed: false,
    done: false,
    eventCount: 0,
    nextSequenceNumber: 0,
  };

export type CodexResponsesStreamDisposition =
  | Readonly<{
      _tag: "Continue";
      event: CodexResponsesRecognizedStreamEvent;
    }>
  | Readonly<{ _tag: "Completed" }>
  | Readonly<{ _tag: "Done" }>;

const streamError = (
  operation: CodexResponsesStreamOperation,
  message: string
) => new CodexResponsesStreamError({ operation, message });

export const decodeCodexResponsesStreamData = Effect.fn(
  "CodexResponsesStreamEvents.decode"
)(function* (
  operation: CodexResponsesStreamOperation,
  data: CodexResponsesSseDataPayload
) {
  const done = yield* Schema.decodeUnknownEffect(Schema.Literal("[DONE]"))(
    data
  ).pipe(Effect.option);
  if (done._tag === "Some") {
    const input: CodexResponsesStreamInput = { _tag: "Done" };
    return input;
  }

  const raw = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(CodexJsonValue)
  )(data).pipe(
    Effect.mapError(() =>
      streamError(operation, "Unable to decode Codex Responses stream JSON.")
    )
  );
  const discriminator = yield* Schema.decodeUnknownEffect(
    CodexResponsesStreamEventDiscriminator
  )(raw).pipe(
    Effect.mapError(() =>
      streamError(operation, "Unable to decode Codex Responses stream event.")
    )
  );

  const input: CodexResponsesStreamInput = {
    _tag: "Event",
    event: {
      type: discriminator.type,
      sequenceNumber: discriminator.sequence_number,
      raw,
    },
  };
  return input;
});

const decodeStreamEvent = <A, I>(
  operation: CodexResponsesStreamOperation,
  schema: Schema.Codec<A, I>,
  raw: CodexJsonValue,
  message: string
) =>
  Schema.decodeUnknownEffect(schema)(raw).pipe(
    Effect.mapError(() => streamError(operation, message))
  );

const continueWith = (
  state: CodexResponsesStreamSequenceState,
  event: CodexResponsesRecognizedStreamEvent
) => {
  const disposition: CodexResponsesStreamDisposition = {
    _tag: "Continue",
    event,
  };
  return { state, disposition };
};

export const advanceCodexResponsesStreamSequence = Effect.fn(
  "CodexResponsesStreamEvents.advance"
)(function* (
  operation: CodexResponsesStreamOperation,
  state: CodexResponsesStreamSequenceState,
  input: CodexResponsesStreamInput
) {
  if (input._tag === "Done") {
    if (!state.completed || state.done) {
      return yield* streamError(
        operation,
        "Codex Responses stream contained an out-of-order done marker."
      );
    }
    const disposition: CodexResponsesStreamDisposition = { _tag: "Done" };
    return {
      state: { ...state, done: true },
      disposition,
    };
  }

  if (state.completed) {
    return yield* streamError(
      operation,
      "Codex Responses stream contained an event after completion."
    );
  }
  if (input.event.sequenceNumber !== state.nextSequenceNumber) {
    return yield* streamError(
      operation,
      "Codex Responses stream contained an out-of-order sequence number."
    );
  }

  const nextState = {
    ...state,
    eventCount: state.eventCount + 1,
    nextSequenceNumber: state.nextSequenceNumber + 1,
  };
  return yield* Match.value(input.event.type).pipe(
    Match.when("response.completed", () =>
      decodeStreamEvent(
        operation,
        CodexResponsesCompletedEvent,
        input.event.raw,
        "Unable to decode Codex Responses terminal event."
      ).pipe(
        Effect.map(() => {
          const disposition: CodexResponsesStreamDisposition = {
            _tag: "Completed",
          };
          return {
            state: { ...nextState, completed: true },
            disposition,
          };
        })
      )
    ),
    Match.when("response.failed", () =>
      decodeStreamEvent(
        operation,
        CodexResponsesFailedEvent,
        input.event.raw,
        "Unable to decode Codex Responses terminal event."
      ).pipe(
        Effect.andThen(
          streamError(operation, "Codex Responses stream reported failure.")
        )
      )
    ),
    Match.when("response.incomplete", () =>
      decodeStreamEvent(
        operation,
        CodexResponsesIncompleteEvent,
        input.event.raw,
        "Unable to decode Codex Responses terminal event."
      ).pipe(
        Effect.andThen(
          streamError(operation, "Codex Responses stream was incomplete.")
        )
      )
    ),
    Match.when("error", () =>
      decodeStreamEvent(
        operation,
        CodexResponsesErrorEvent,
        input.event.raw,
        "Unable to decode Codex Responses terminal event."
      ).pipe(
        Effect.andThen(
          streamError(operation, "Codex Responses stream reported an error.")
        )
      )
    ),
    Match.when("response.output_text.delta", () =>
      decodeStreamEvent(
        operation,
        CodexResponsesOutputTextDeltaEvent,
        input.event.raw,
        "Unable to decode Codex output-text delta."
      ).pipe(
        Effect.map((value) =>
          continueWith(nextState, { _tag: "OutputTextDelta", value })
        )
      )
    ),
    Match.when("response.output_item.added", () =>
      Effect.gen(function* decodeCodexOutputItem() {
        const item = yield* decodeStreamEvent(
          operation,
          CodexResponsesOutputItemAddedDiscriminatorEvent,
          input.event.raw,
          "Unable to decode Codex Responses output item."
        );
        if (item.item.type !== "function_call") {
          return continueWith(nextState, { _tag: "Ignored" });
        }
        const value = yield* decodeStreamEvent(
          operation,
          CodexResponsesFunctionCallAddedEvent,
          input.event.raw,
          "Unable to decode Codex function-call output item."
        );
        return continueWith(nextState, { _tag: "FunctionCallAdded", value });
      })
    ),
    Match.when("response.function_call_arguments.delta", () =>
      decodeStreamEvent(
        operation,
        CodexResponsesFunctionArgumentsDeltaEvent,
        input.event.raw,
        "Unable to decode Codex function-call arguments."
      ).pipe(
        Effect.map((value) =>
          continueWith(nextState, { _tag: "FunctionArgumentsDelta", value })
        )
      )
    ),
    Match.orElse(() =>
      Effect.succeed(continueWith(nextState, { _tag: "Ignored" }))
    )
  );
});

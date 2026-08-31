import { Effect, Option, Schema, SchemaGetter, SchemaIssue } from "effect";
import type { Stream } from "effect";

import {
  CodexOAuthAccessToken,
  CodexOAuthAccountId,
  CodexOAuthSubject,
} from "../auth/credentials.js";
import { CodexHttpStatus } from "./error-contracts.js";
import type { CodexResponsesStreamError } from "./errors.js";

export const CodexResponsesModelId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesModelId")
);

export type CodexResponsesModelId = typeof CodexResponsesModelId.Type;

export const CodexResponsesEndpoint = Schema.Literal(
  "https://chatgpt.com/backend-api/codex/responses"
);

export type CodexResponsesEndpoint = typeof CodexResponsesEndpoint.Type;

export const CodexResponsesContent = Schema.String;
export type CodexResponsesContent = typeof CodexResponsesContent.Type;

export const CodexResponsesNonEmptyContent = Schema.NonEmptyString;
export type CodexResponsesNonEmptyContent =
  typeof CodexResponsesNonEmptyContent.Type;

export const CodexResponsesFunctionName = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesFunctionName")
);
export type CodexResponsesFunctionName = typeof CodexResponsesFunctionName.Type;

export const CodexResponsesFunctionCallId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesFunctionCallId")
);
export type CodexResponsesFunctionCallId =
  typeof CodexResponsesFunctionCallId.Type;

export const CodexResponsesOutputItemId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesOutputItemId")
);
export type CodexResponsesOutputItemId = typeof CodexResponsesOutputItemId.Type;

export const CodexResponsesFunctionArguments = Schema.String;
export type CodexResponsesFunctionArguments =
  typeof CodexResponsesFunctionArguments.Type;

export const CodexResponsesStreamContentType =
  Schema.Literal("text/event-stream");
export type CodexResponsesStreamContentType =
  typeof CodexResponsesStreamContentType.Type;

export const CodexResponsesStreamMetadata = Schema.Struct({
  status: CodexHttpStatus,
  contentType: CodexResponsesStreamContentType,
});
export type CodexResponsesStreamMetadata =
  typeof CodexResponsesStreamMetadata.Type;

export const CodexResponsesStreamEventKind = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesStreamEventKind")
);
export type CodexResponsesStreamEventKind =
  typeof CodexResponsesStreamEventKind.Type;

export const CodexResponsesCount = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(0)
);
export type CodexResponsesCount = typeof CodexResponsesCount.Type;

export const CodexResponsesOutputIndex = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(0)
);
export type CodexResponsesOutputIndex = typeof CodexResponsesOutputIndex.Type;

export const CodexResponsesSequenceNumber = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(0)
);
export type CodexResponsesSequenceNumber =
  typeof CodexResponsesSequenceNumber.Type;

export const CodexResponsesRecognizedStreamEventType = Schema.Literals([
  "response.output_text.delta",
  "response.output_item.added",
  "response.function_call_arguments.delta",
]);
export type CodexResponsesRecognizedStreamEventType =
  typeof CodexResponsesRecognizedStreamEventType.Type;

export const CodexResponsesInputTextContent = Schema.Struct({
  type: Schema.Literal("input_text"),
  text: CodexResponsesNonEmptyContent,
});

export type CodexResponsesInputTextContent =
  typeof CodexResponsesInputTextContent.Type;

export const CodexResponsesOutputTextContent = Schema.Struct({
  type: Schema.Literal("output_text"),
  text: CodexResponsesNonEmptyContent,
});

export type CodexResponsesOutputTextContent =
  typeof CodexResponsesOutputTextContent.Type;

export const CodexResponsesTextContent = Schema.Union([
  CodexResponsesInputTextContent,
  CodexResponsesOutputTextContent,
]);

export type CodexResponsesTextContent = typeof CodexResponsesTextContent.Type;

export const CodexResponsesInputMessage = Schema.Struct({
  role: Schema.Literals(["user", "system", "assistant"]),
  content: Schema.Array(CodexResponsesTextContent),
});

export type CodexResponsesInputMessage = typeof CodexResponsesInputMessage.Type;

const CodexResponsesFunctionCallFields = {
  type: Schema.Literal("function_call"),
  call_id: CodexResponsesFunctionCallId,
  name: CodexResponsesFunctionName,
  arguments: CodexResponsesFunctionArguments,
};

export const CodexResponsesFunctionCall = Schema.Struct({
  ...CodexResponsesFunctionCallFields,
});

export type CodexResponsesFunctionCall = typeof CodexResponsesFunctionCall.Type;

export const CodexResponsesFunctionCallOutputItem = Schema.Struct({
  id: CodexResponsesOutputItemId,
  ...CodexResponsesFunctionCallFields,
});

export type CodexResponsesFunctionCallOutputItem =
  typeof CodexResponsesFunctionCallOutputItem.Type;

export const CodexResponsesFunctionCallOutput = Schema.Struct({
  type: Schema.Literal("function_call_output"),
  call_id: CodexResponsesFunctionCallId,
  output: CodexResponsesContent,
});

export type CodexResponsesFunctionCallOutput =
  typeof CodexResponsesFunctionCallOutput.Type;

export const CodexResponsesInput = Schema.Union([
  CodexResponsesInputMessage,
  CodexResponsesFunctionCall,
  CodexResponsesFunctionCallOutput,
]);

export type CodexResponsesInput = typeof CodexResponsesInput.Type;

type CanonicalCodexJsonArray = readonly CanonicalCodexJsonValue[];

interface CanonicalCodexJsonObject {
  readonly [key: string]: CanonicalCodexJsonValue;
}

type CanonicalCodexJsonValue =
  | null
  | boolean
  | number
  | string
  | CanonicalCodexJsonArray
  | CanonicalCodexJsonObject;

const maximumCodexJsonDepth = 32;
const ownedCanonicalCodexJsonContainers = new WeakSet<object>();

function canonicalizeCodexJsonArray(
  input: readonly unknown[],
  depth: number,
  canonicalize: (
    input: unknown,
    depth: number
  ) => CanonicalCodexJsonValue | undefined
): CanonicalCodexJsonArray | undefined {
  const lengthDescriptor = Object.getOwnPropertyDescriptor(input, "length");
  if (
    lengthDescriptor === undefined ||
    !Object.hasOwn(lengthDescriptor, "value") ||
    typeof lengthDescriptor.value !== "number" ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0 ||
    Reflect.ownKeys(input).length !== lengthDescriptor.value + 1
  ) {
    return undefined;
  }
  const output: CanonicalCodexJsonValue[] = [];
  for (let index = 0; index < lengthDescriptor.value; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
    if (
      descriptor === undefined ||
      !descriptor.enumerable ||
      !Object.hasOwn(descriptor, "value")
    ) {
      return undefined;
    }
    const value = canonicalize(descriptor.value, depth + 1);
    if (value === undefined) {
      return undefined;
    }
    output.push(value);
  }
  const frozen = Object.freeze(output);
  ownedCanonicalCodexJsonContainers.add(frozen);
  return frozen;
}

function canonicalizeCodexJsonObject(
  input: object,
  depth: number,
  canonicalize: (
    input: unknown,
    depth: number
  ) => CanonicalCodexJsonValue | undefined
): CanonicalCodexJsonObject | undefined {
  const prototype = Reflect.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    return undefined;
  }

  const output: Record<string, CanonicalCodexJsonValue> = {};
  for (const key of Reflect.ownKeys(input)) {
    if (typeof key !== "string") {
      return undefined;
    }
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (
      descriptor === undefined ||
      !descriptor.enumerable ||
      !Object.hasOwn(descriptor, "value")
    ) {
      return undefined;
    }
    const value = canonicalize(descriptor.value, depth + 1);
    if (value === undefined) {
      return undefined;
    }
    Object.defineProperty(output, key, {
      configurable: false,
      enumerable: true,
      value,
      writable: false,
    });
  }
  const frozen = Object.freeze(output);
  ownedCanonicalCodexJsonContainers.add(frozen);
  return frozen;
}

function canonicalizeCodexJsonValueAtDepth(
  input: unknown,
  depth: number
): CanonicalCodexJsonValue | undefined {
  if (
    input === null ||
    typeof input === "boolean" ||
    typeof input === "string"
  ) {
    return input;
  }
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : undefined;
  }
  if (typeof input !== "object" || depth >= maximumCodexJsonDepth) {
    return undefined;
  }
  return Array.isArray(input)
    ? canonicalizeCodexJsonArray(
        input,
        depth,
        canonicalizeCodexJsonValueAtDepth
      )
    : canonicalizeCodexJsonObject(
        input,
        depth,
        canonicalizeCodexJsonValueAtDepth
      );
}

const canonicalizeCodexJsonValue = Option.liftThrowable((input: unknown) =>
  canonicalizeCodexJsonValueAtDepth(input, 0)
);

const canonicalCodexJsonIssue = (input: unknown) =>
  new SchemaIssue.InvalidValue(Option.some(input), {
    message: "Expected canonical bounded JSON",
  });

const decodeCanonicalCodexJson = (input: unknown) =>
  Option.match(canonicalizeCodexJsonValue(input), {
    onNone: () => Effect.fail(canonicalCodexJsonIssue(input)),
    onSome: (value) =>
      value === undefined
        ? Effect.fail(canonicalCodexJsonIssue(input))
        : Effect.succeed(value),
  });

function isOwnedCanonicalCodexJsonValueAtDepth(
  input: unknown,
  depth: number
): boolean {
  if (
    input === null ||
    typeof input === "boolean" ||
    typeof input === "string"
  ) {
    return true;
  }
  if (typeof input === "number") {
    return Number.isFinite(input);
  }
  if (
    typeof input !== "object" ||
    depth >= maximumCodexJsonDepth ||
    !Object.isFrozen(input) ||
    !ownedCanonicalCodexJsonContainers.has(input)
  ) {
    return false;
  }
  const isArray = Array.isArray(input);
  if (
    Reflect.getPrototypeOf(input) !==
    (isArray ? Array.prototype : Object.prototype)
  ) {
    return false;
  }
  const canonical = canonicalizeCodexJsonValueAtDepth(input, depth);
  if (canonical === undefined) {
    return false;
  }
  const keys = isArray
    ? Array.from({ length: input.length }, (_, index) => String(index))
    : Reflect.ownKeys(input);
  return keys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    return (
      descriptor !== undefined &&
      Object.hasOwn(descriptor, "value") &&
      isOwnedCanonicalCodexJsonValueAtDepth(descriptor.value, depth + 1)
    );
  });
}

const isOwnedCanonicalCodexJsonValue = Option.liftThrowable((input: unknown) =>
  isOwnedCanonicalCodexJsonValueAtDepth(input, 0)
);

const CodexJsonValueDeclaration = Schema.declare<unknown>(
  (input): input is unknown =>
    Option.match(isOwnedCanonicalCodexJsonValue(input), {
      onNone: () => false,
      onSome: (isOwned) => isOwned,
    }),
  { identifier: "CodexJsonValue" }
);

export const CodexJsonValue = Schema.Unknown.pipe(
  Schema.decodeTo(CodexJsonValueDeclaration, {
    decode: SchemaGetter.transformOrFail(decodeCanonicalCodexJson),
    encode: SchemaGetter.transformOrFail(decodeCanonicalCodexJson),
  }),
  Schema.brand("CodexJsonValue")
);

export type CodexJsonValue = typeof CodexJsonValue.Type;

const isCodexJsonObject = (input: unknown): input is CanonicalCodexJsonObject =>
  typeof input === "object" && input !== null && !Array.isArray(input);

const decodeCodexFunctionParameters = (input: unknown) =>
  Effect.gen(function* decodeCanonicalCodexFunctionParameters() {
    const value = yield* decodeCanonicalCodexJson(input);
    if (isCodexJsonObject(value)) {
      return value;
    }
    return yield* Effect.fail(
      new SchemaIssue.InvalidValue(Option.some(input), {
        message: "Expected a canonical bounded JSON object",
      })
    );
  });

const CodexFunctionParametersDeclaration = Schema.declare<unknown>(
  (input): input is unknown =>
    isCodexJsonObject(input) &&
    Option.match(isOwnedCanonicalCodexJsonValue(input), {
      onNone: () => false,
      onSome: (isOwned) => isOwned,
    }),
  { identifier: "CodexFunctionParameters" }
);

export const CodexFunctionParameters = Schema.Unknown.pipe(
  Schema.decodeTo(CodexFunctionParametersDeclaration, {
    decode: SchemaGetter.transformOrFail(decodeCodexFunctionParameters),
    encode: SchemaGetter.transformOrFail(decodeCodexFunctionParameters),
  }),
  Schema.brand("CodexFunctionParameters")
);

export type CodexFunctionParameters = typeof CodexFunctionParameters.Type;

export const CodexResponsesFunctionTool = Schema.Struct({
  type: Schema.Literal("function"),
  name: CodexResponsesFunctionName,
  description: Schema.optional(CodexResponsesContent),
  parameters: CodexFunctionParameters,
  strict: Schema.optional(Schema.Boolean),
});

export type CodexResponsesFunctionTool = typeof CodexResponsesFunctionTool.Type;

export const CodexResponsesToolChoice = Schema.Union([
  Schema.Literals(["auto", "none", "required"]),
  Schema.Struct({
    type: Schema.Literal("function"),
    name: CodexResponsesFunctionName,
  }),
]);

export type CodexResponsesToolChoice = typeof CodexResponsesToolChoice.Type;

export const CodexResponsesReasoningEffort = Schema.Literals([
  "low",
  "medium",
  "high",
  "xhigh",
]);

export type CodexResponsesReasoningEffort =
  typeof CodexResponsesReasoningEffort.Type;
export type CodexResponsesReasoningEffortEncoded =
  typeof CodexResponsesReasoningEffort.Encoded;

export const CodexResponsesReasoning = Schema.Struct({
  effort: CodexResponsesReasoningEffort,
});

export type CodexResponsesReasoning = typeof CodexResponsesReasoning.Type;

export const CodexResponsesRequestPolicy = Schema.Struct({
  reasoningEffort: CodexResponsesReasoningEffort,
});

export type CodexResponsesRequestPolicy =
  typeof CodexResponsesRequestPolicy.Type;
export type CodexResponsesRequestPolicyEncoded =
  typeof CodexResponsesRequestPolicy.Encoded;

export const CodexResponsesRequest = Schema.Struct({
  model: CodexResponsesModelId,
  input: Schema.Array(CodexResponsesInput),
  store: Schema.Boolean,
  instructions: Schema.optional(CodexResponsesNonEmptyContent),
  stream: Schema.Boolean,
  reasoning: Schema.optional(CodexResponsesReasoning),
  tools: Schema.optional(Schema.Array(CodexResponsesFunctionTool)),
  tool_choice: Schema.optional(CodexResponsesToolChoice),
  parallel_tool_calls: Schema.optional(Schema.Boolean),
});

export type CodexResponsesRequest = typeof CodexResponsesRequest.Type;

export interface CodexResponsesStreamResult extends CodexResponsesStreamMetadata {
  readonly body: Stream.Stream<Uint8Array, CodexResponsesStreamError>;
  readonly transportPolicy: CodexResponsesTransportPolicy;
}

export const CodexResponsesStreamEventDiscriminator = Schema.Struct({
  type: CodexResponsesStreamEventKind,
  sequence_number: CodexResponsesSequenceNumber,
});

export type CodexResponsesStreamEventDiscriminator =
  typeof CodexResponsesStreamEventDiscriminator.Type;

const CodexResponsesTerminalEventFields = {
  sequence_number: CodexResponsesSequenceNumber,
};

export const CodexResponsesCompletedEvent = Schema.Struct({
  type: Schema.Literal("response.completed"),
  ...CodexResponsesTerminalEventFields,
  response: Schema.Struct({ status: Schema.Literal("completed") }),
});
export type CodexResponsesCompletedEvent =
  typeof CodexResponsesCompletedEvent.Type;

export const CodexResponsesFailedEvent = Schema.Struct({
  type: Schema.Literal("response.failed"),
  ...CodexResponsesTerminalEventFields,
  response: Schema.Struct({ status: Schema.Literal("failed") }),
});

export const CodexResponsesIncompleteEvent = Schema.Struct({
  type: Schema.Literal("response.incomplete"),
  ...CodexResponsesTerminalEventFields,
  response: Schema.Struct({ status: Schema.Literal("incomplete") }),
});

export const CodexResponsesErrorEvent = Schema.Struct({
  type: Schema.Literal("error"),
  ...CodexResponsesTerminalEventFields,
});

export const CodexResponsesOutputItemKind = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesOutputItemKind")
);
export type CodexResponsesOutputItemKind =
  typeof CodexResponsesOutputItemKind.Type;

export const CodexResponsesOutputItemDiscriminator = Schema.Struct({
  type: CodexResponsesOutputItemKind,
});

export type CodexResponsesOutputItemDiscriminator =
  typeof CodexResponsesOutputItemDiscriminator.Type;

export const CodexResponsesOutputItemAddedDiscriminatorEvent = Schema.Struct({
  type: Schema.Literal("response.output_item.added"),
  sequence_number: CodexResponsesSequenceNumber,
  item: CodexResponsesOutputItemDiscriminator,
});

export const CodexResponsesFunctionCallAddedEvent = Schema.Struct({
  type: Schema.Literal("response.output_item.added"),
  sequence_number: CodexResponsesSequenceNumber,
  output_index: CodexResponsesOutputIndex,
  item: CodexResponsesFunctionCallOutputItem,
});

export type CodexResponsesFunctionCallAddedEvent =
  typeof CodexResponsesFunctionCallAddedEvent.Type;

export const CodexResponsesFunctionArgumentsDeltaEvent = Schema.Struct({
  type: Schema.Literal("response.function_call_arguments.delta"),
  sequence_number: CodexResponsesSequenceNumber,
  output_index: CodexResponsesOutputIndex,
  delta: CodexResponsesFunctionArguments,
});

export type CodexResponsesFunctionArgumentsDeltaEvent =
  typeof CodexResponsesFunctionArgumentsDeltaEvent.Type;

export const CodexResponsesOutputTextDeltaEvent = Schema.Struct({
  type: Schema.Literal("response.output_text.delta"),
  sequence_number: CodexResponsesSequenceNumber,
  output_index: CodexResponsesOutputIndex,
  delta: CodexResponsesContent,
});

export type CodexResponsesOutputTextDeltaEvent =
  typeof CodexResponsesOutputTextDeltaEvent.Type;

export interface CodexResponsesStreamMapInput {
  readonly model: CodexResponsesModelId;
  readonly body: Stream.Stream<Uint8Array, CodexResponsesStreamError>;
  readonly transportPolicy: CodexResponsesTransportPolicy;
}

export const CodexResponsesPostInput = Schema.Struct({
  accessToken: CodexOAuthAccessToken,
  accountId: Schema.optional(CodexOAuthAccountId),
  request: CodexResponsesRequest,
}).pipe(Schema.redact);

export type CodexResponsesPostInput = typeof CodexResponsesPostInput.Type;

export const OpenAICompatibleChatRole = Schema.Literals([
  "system",
  "user",
  "assistant",
  "tool",
]);

export type OpenAICompatibleChatRole = typeof OpenAICompatibleChatRole.Type;

export const OpenAICompatibleMessageToolCall = Schema.Struct({
  type: Schema.Literal("function"),
  id: CodexResponsesFunctionCallId,
  function: Schema.Struct({
    arguments: CodexResponsesFunctionArguments,
    name: CodexResponsesFunctionName,
  }),
});

export type OpenAICompatibleMessageToolCall =
  typeof OpenAICompatibleMessageToolCall.Type;

export const OpenAICompatibleChatMessage = Schema.Union([
  Schema.Struct({
    role: Schema.Literal("system"),
    content: CodexResponsesContent,
  }),
  Schema.Struct({
    role: Schema.Literal("user"),
    content: CodexResponsesContent,
  }),
  Schema.Struct({
    role: Schema.Literal("assistant"),
    content: Schema.optional(Schema.NullOr(CodexResponsesContent)),
    tool_calls: Schema.optional(Schema.Array(OpenAICompatibleMessageToolCall)),
  }),
  Schema.Struct({
    role: Schema.Literal("tool"),
    content: CodexResponsesContent,
    tool_call_id: CodexResponsesFunctionCallId,
  }),
]);

export type OpenAICompatibleChatMessage =
  typeof OpenAICompatibleChatMessage.Type;

export const OpenAICompatibleFunctionTool = Schema.Struct({
  type: Schema.Literal("function"),
  function: Schema.Struct({
    name: CodexResponsesFunctionName,
    description: Schema.optional(CodexResponsesContent),
    parameters: CodexFunctionParameters,
    strict: Schema.optional(Schema.Boolean),
  }),
});

export type OpenAICompatibleFunctionTool =
  typeof OpenAICompatibleFunctionTool.Type;

export const OpenAICompatibleToolChoice = Schema.Union([
  Schema.Literals(["auto", "none", "required"]),
  Schema.Struct({
    type: Schema.Literal("function"),
    function: Schema.Struct({ name: CodexResponsesFunctionName }),
  }),
]);

export type OpenAICompatibleToolChoice = typeof OpenAICompatibleToolChoice.Type;

export const OpenAICompatibleChatCompletionRequest = Schema.Struct({
  model: CodexResponsesModelId,
  messages: Schema.Array(OpenAICompatibleChatMessage),
  stream: Schema.optional(Schema.Literal(true)),
  tools: Schema.optional(Schema.Array(OpenAICompatibleFunctionTool)),
  tool_choice: Schema.optional(OpenAICompatibleToolChoice),
});

export type OpenAICompatibleChatCompletionRequest =
  typeof OpenAICompatibleChatCompletionRequest.Type;

export const OpenAICompatibleChatCompletionDelta = Schema.Struct({
  content: Schema.optional(CodexResponsesContent),
  tool_calls: Schema.optional(
    Schema.Array(
      Schema.Struct({
        index: CodexResponsesOutputIndex,
        id: Schema.optional(CodexResponsesFunctionCallId),
        type: Schema.optional(Schema.Literal("function")),
        function: Schema.Struct({
          name: Schema.optional(CodexResponsesFunctionName),
          arguments: Schema.optional(CodexResponsesFunctionArguments),
        }),
      })
    )
  ),
});

export type OpenAICompatibleChatCompletionDelta =
  typeof OpenAICompatibleChatCompletionDelta.Type;

export const OpenAICompatibleChatCompletionFinishReason = Schema.Literals([
  "stop",
  "tool_calls",
]);
export type OpenAICompatibleChatCompletionFinishReason =
  typeof OpenAICompatibleChatCompletionFinishReason.Type;

export const OpenAICompatibleChatCompletionChoice = Schema.Struct({
  index: CodexResponsesOutputIndex,
  delta: OpenAICompatibleChatCompletionDelta,
  finish_reason: Schema.optional(
    Schema.NullOr(OpenAICompatibleChatCompletionFinishReason)
  ),
});

export type OpenAICompatibleChatCompletionChoice =
  typeof OpenAICompatibleChatCompletionChoice.Type;

export const OpenAICompatibleChatCompletionId = Schema.NonEmptyString.pipe(
  Schema.brand("OpenAICompatibleChatCompletionId")
);
export type OpenAICompatibleChatCompletionId =
  typeof OpenAICompatibleChatCompletionId.Type;

export const OpenAICompatibleChatCompletionChunk = Schema.Struct({
  id: OpenAICompatibleChatCompletionId,
  object: Schema.Literal("chat.completion.chunk"),
  created: CodexResponsesCount,
  model: CodexResponsesModelId,
  choices: Schema.Array(OpenAICompatibleChatCompletionChoice),
});

export type OpenAICompatibleChatCompletionChunk =
  typeof OpenAICompatibleChatCompletionChunk.Type;

export interface OpenAICompatibleChatCompletionStream {
  readonly contentType: "text/event-stream";
  readonly body: Stream.Stream<Uint8Array, CodexResponsesStreamError>;
}

export const CodexDirectProviderInput = Schema.Struct({
  subject: CodexOAuthSubject,
  accountId: Schema.optional(CodexOAuthAccountId),
  request: OpenAICompatibleChatCompletionRequest,
});

export type CodexDirectProviderInput = typeof CodexDirectProviderInput.Type;

const OpenAICompatibleProxyHeaderSecret = Schema.NonEmptyString.check(
  Schema.isMaxLength(16_384),
  Schema.isPattern(/^[\u0021-\u007E]+$/u)
);

export const OpenAICompatibleProxyInternalToken = Schema.RedactedFromValue(
  OpenAICompatibleProxyHeaderSecret.pipe(
    Schema.brand("OpenAICompatibleProxyInternalToken")
  )
);

export type OpenAICompatibleProxyInternalToken =
  typeof OpenAICompatibleProxyInternalToken.Type;

export const OpenAICompatibleProxyAuthorizationHeader =
  Schema.RedactedFromValue(
    Schema.NonEmptyString.check(
      Schema.isMaxLength(16_391),
      Schema.isPattern(/^[\u0020-\u007E]+$/u)
    ).pipe(Schema.brand("OpenAICompatibleProxyAuthorizationHeader"))
  );
export type OpenAICompatibleProxyAuthorizationHeader =
  typeof OpenAICompatibleProxyAuthorizationHeader.Type;

export const OpenAICompatibleProxyInput = Schema.Struct({
  authorization: Schema.optional(OpenAICompatibleProxyAuthorizationHeader),
  completion: CodexDirectProviderInput,
});

export type OpenAICompatibleProxyInput = typeof OpenAICompatibleProxyInput.Type;

const CodexResponsesTransportLimit = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(1)
);

export const CodexResponsesTransportPolicy = Schema.Struct({
  headerTimeoutMillis: CodexResponsesTransportLimit,
  streamIdleTimeoutMillis: CodexResponsesTransportLimit,
  maximumBodyBytes: CodexResponsesTransportLimit,
  maximumEvents: CodexResponsesTransportLimit,
});

export type CodexResponsesTransportPolicy =
  typeof CodexResponsesTransportPolicy.Type;

export const UpstashRedisRestUrl = Schema.URL;

export type UpstashRedisRestUrl = typeof UpstashRedisRestUrl.Type;

export const UpstashRedisRestToken = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type UpstashRedisRestToken = typeof UpstashRedisRestToken.Type;

export const UpstashRedisKeyPrefix = Schema.NonEmptyString.pipe(
  Schema.brand("UpstashRedisKeyPrefix")
);

export type UpstashRedisKeyPrefix = typeof UpstashRedisKeyPrefix.Type;

export const UpstashRedisConfig = Schema.Struct({
  keyPrefix: UpstashRedisKeyPrefix,
  restUrl: UpstashRedisRestUrl,
  restToken: UpstashRedisRestToken,
});

export type UpstashRedisConfig = typeof UpstashRedisConfig.Type;

export const CodexResponsesProofInput = Schema.Struct({
  accessToken: CodexOAuthAccessToken,
  accountId: Schema.optional(CodexOAuthAccountId),
  model: CodexResponsesModelId,
  prompt: CodexResponsesNonEmptyContent,
}).pipe(Schema.redact);

export type CodexResponsesProofInput = typeof CodexResponsesProofInput.Type;

export const CodexResponsesProofResult = Schema.Struct({
  transport: Schema.Literal("direct-codex-responses"),
  endpoint: CodexResponsesEndpoint,
  status: CodexHttpStatus,
  contentType: CodexResponsesStreamContentType,
  receivedBodyBytes: CodexResponsesCount,
  receivedStreamEvents: CodexResponsesCount,
  usedAccountHeader: Schema.Boolean,
});

export type CodexResponsesProofResult = typeof CodexResponsesProofResult.Type;

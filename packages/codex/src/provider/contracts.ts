import { Schema } from "effect";

import {
  CodexOAuthAccessToken,
  CodexOAuthAccountId,
  CodexOAuthSubject,
} from "../auth/credentials.js";

export const CodexResponsesModelId = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesModelId")
);

export type CodexResponsesModelId = typeof CodexResponsesModelId.Type;

export const CodexResponsesEndpoint = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesEndpoint")
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

export const CodexResponsesStreamContentType = Schema.String;
export type CodexResponsesStreamContentType =
  typeof CodexResponsesStreamContentType.Type;

export const CodexResponsesStreamEventKind = Schema.NonEmptyString.pipe(
  Schema.brand("CodexResponsesStreamEventKind")
);
export type CodexResponsesStreamEventKind =
  typeof CodexResponsesStreamEventKind.Type;

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

export const CodexResponsesFunctionTool = Schema.Struct({
  type: Schema.Literal("function"),
  name: CodexResponsesFunctionName,
  description: Schema.optional(CodexResponsesContent),
  parameters: Schema.Unknown,
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

export const CodexResponsesStreamBody = Schema.RedactedFromValue(Schema.String);

export type CodexResponsesStreamBody = typeof CodexResponsesStreamBody.Type;

export const CodexResponsesStreamResult = Schema.Struct({
  status: Schema.Number.check(Schema.isFinite()),
  contentType: CodexResponsesStreamContentType,
  body: CodexResponsesStreamBody,
});

export type CodexResponsesStreamResult = typeof CodexResponsesStreamResult.Type;

export const CodexResponsesStreamEvent = Schema.Struct({
  type: CodexResponsesStreamEventKind,
  delta: Schema.optional(CodexResponsesContent),
  output_index: Schema.optional(Schema.Number.check(Schema.isFinite())),
  item: Schema.optional(Schema.Unknown),
});

export type CodexResponsesStreamEvent = typeof CodexResponsesStreamEvent.Type;

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

export const CodexResponsesFunctionCallAddedEvent = Schema.Struct({
  type: Schema.Literal("response.output_item.added"),
  output_index: Schema.Number.check(Schema.isFinite()),
  item: CodexResponsesFunctionCallOutputItem,
});

export type CodexResponsesFunctionCallAddedEvent =
  typeof CodexResponsesFunctionCallAddedEvent.Type;

export const CodexResponsesFunctionArgumentsDeltaEvent = Schema.Struct({
  type: Schema.Literal("response.function_call_arguments.delta"),
  output_index: Schema.Number.check(Schema.isFinite()),
  delta: CodexResponsesFunctionArguments,
});

export type CodexResponsesFunctionArgumentsDeltaEvent =
  typeof CodexResponsesFunctionArgumentsDeltaEvent.Type;

export const CodexResponsesStreamMapInput = Schema.Struct({
  model: CodexResponsesModelId,
  body: CodexResponsesStreamBody,
});

export type CodexResponsesStreamMapInput =
  typeof CodexResponsesStreamMapInput.Type;

export const CodexResponsesPostInput = Schema.Struct({
  accessToken: CodexOAuthAccessToken,
  accountId: Schema.optional(CodexOAuthAccountId),
  request: CodexResponsesRequest,
});

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
    parameters: Schema.Unknown,
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
  stream: Schema.optional(Schema.Boolean),
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
        index: Schema.Number.check(Schema.isFinite()),
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
  index: Schema.Number.check(Schema.isFinite()),
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
  created: Schema.Number.check(Schema.isFinite()),
  model: CodexResponsesModelId,
  choices: Schema.Array(OpenAICompatibleChatCompletionChoice),
});

export type OpenAICompatibleChatCompletionChunk =
  typeof OpenAICompatibleChatCompletionChunk.Type;

export const OpenAICompatibleChatCompletionStreamBody = Schema.String;
export type OpenAICompatibleChatCompletionStreamBody =
  typeof OpenAICompatibleChatCompletionStreamBody.Type;

export const OpenAICompatibleChatCompletionStream = Schema.Struct({
  contentType: Schema.Literal("text/event-stream"),
  body: OpenAICompatibleChatCompletionStreamBody,
});

export type OpenAICompatibleChatCompletionStream =
  typeof OpenAICompatibleChatCompletionStream.Type;

export const CodexDirectProviderInput = Schema.Struct({
  subject: CodexOAuthSubject,
  accountId: Schema.optional(CodexOAuthAccountId),
  request: OpenAICompatibleChatCompletionRequest,
});

export type CodexDirectProviderInput = typeof CodexDirectProviderInput.Type;

export const OpenAICompatibleProxyInternalToken = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type OpenAICompatibleProxyInternalToken =
  typeof OpenAICompatibleProxyInternalToken.Type;

export const OpenAICompatibleProxyAuthorizationHeader = Schema.String;
export type OpenAICompatibleProxyAuthorizationHeader =
  typeof OpenAICompatibleProxyAuthorizationHeader.Type;

export const OpenAICompatibleProxyInput = Schema.Struct({
  authorization: Schema.optional(OpenAICompatibleProxyAuthorizationHeader),
  internalToken: OpenAICompatibleProxyInternalToken,
  completion: CodexDirectProviderInput,
});

export type OpenAICompatibleProxyInput = typeof OpenAICompatibleProxyInput.Type;

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
});

export type CodexResponsesProofInput = typeof CodexResponsesProofInput.Type;

export const CodexResponsesProofResult = Schema.Struct({
  transport: Schema.Literal("direct-codex-responses"),
  endpoint: CodexResponsesEndpoint,
  status: Schema.Number.check(Schema.isFinite()),
  contentType: CodexResponsesStreamContentType,
  receivedBodyBytes: Schema.Number.check(Schema.isFinite()),
  receivedStreamLines: Schema.Number.check(Schema.isFinite()),
  usedAccountHeader: Schema.Boolean,
});

export type CodexResponsesProofResult = typeof CodexResponsesProofResult.Type;

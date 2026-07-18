import { Schema } from "effect";

import {
  CodexOAuthAccessToken,
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

export const CodexResponsesInputTextContent = Schema.Struct({
  type: Schema.Literal("input_text"),
  text: Schema.NonEmptyString,
});

export type CodexResponsesInputTextContent =
  typeof CodexResponsesInputTextContent.Type;

export const CodexResponsesOutputTextContent = Schema.Struct({
  type: Schema.Literal("output_text"),
  text: Schema.NonEmptyString,
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
  call_id: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
  arguments: Schema.String,
};

export const CodexResponsesFunctionCall = Schema.Struct({
  ...CodexResponsesFunctionCallFields,
});

export type CodexResponsesFunctionCall = typeof CodexResponsesFunctionCall.Type;

export const CodexResponsesFunctionCallOutputItem = Schema.Struct({
  id: Schema.NonEmptyString,
  ...CodexResponsesFunctionCallFields,
});

export type CodexResponsesFunctionCallOutputItem =
  typeof CodexResponsesFunctionCallOutputItem.Type;

export const CodexResponsesFunctionCallOutput = Schema.Struct({
  type: Schema.Literal("function_call_output"),
  call_id: Schema.NonEmptyString,
  output: Schema.String,
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
  name: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
  parameters: Schema.Unknown,
  strict: Schema.optional(Schema.Boolean),
});

export type CodexResponsesFunctionTool = typeof CodexResponsesFunctionTool.Type;

export const CodexResponsesToolChoice = Schema.Union([
  Schema.Literals(["auto", "none", "required"]),
  Schema.Struct({
    type: Schema.Literal("function"),
    name: Schema.NonEmptyString,
  }),
]);

export type CodexResponsesToolChoice = typeof CodexResponsesToolChoice.Type;

export const CodexResponsesReasoning = Schema.Struct({
  effort: Schema.Literals(["low", "medium", "high", "xhigh"]),
});

export type CodexResponsesReasoning = typeof CodexResponsesReasoning.Type;

export const CodexResponsesRequest = Schema.Struct({
  model: CodexResponsesModelId,
  input: Schema.Array(CodexResponsesInput),
  store: Schema.Boolean,
  instructions: Schema.optional(Schema.NonEmptyString),
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
  contentType: Schema.String,
  body: CodexResponsesStreamBody,
});

export type CodexResponsesStreamResult = typeof CodexResponsesStreamResult.Type;

export const CodexResponsesStreamEvent = Schema.Struct({
  type: Schema.NonEmptyString,
  delta: Schema.optional(Schema.String),
  output_index: Schema.optional(Schema.Number.check(Schema.isFinite())),
  item: Schema.optional(Schema.Unknown),
});

export type CodexResponsesStreamEvent = typeof CodexResponsesStreamEvent.Type;

export const CodexResponsesOutputItemDiscriminator = Schema.Struct({
  type: Schema.NonEmptyString,
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
  delta: Schema.String,
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
  accountId: Schema.optional(Schema.NonEmptyString),
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
  id: Schema.NonEmptyString,
  function: Schema.Struct({
    arguments: Schema.String,
    name: Schema.NonEmptyString,
  }),
});

export type OpenAICompatibleMessageToolCall =
  typeof OpenAICompatibleMessageToolCall.Type;

export const OpenAICompatibleChatMessage = Schema.Union([
  Schema.Struct({
    role: Schema.Literal("system"),
    content: Schema.String,
  }),
  Schema.Struct({
    role: Schema.Literal("user"),
    content: Schema.String,
  }),
  Schema.Struct({
    role: Schema.Literal("assistant"),
    content: Schema.optional(Schema.NullOr(Schema.String)),
    tool_calls: Schema.optional(Schema.Array(OpenAICompatibleMessageToolCall)),
  }),
  Schema.Struct({
    role: Schema.Literal("tool"),
    content: Schema.String,
    tool_call_id: Schema.NonEmptyString,
  }),
]);

export type OpenAICompatibleChatMessage =
  typeof OpenAICompatibleChatMessage.Type;

export const OpenAICompatibleFunctionTool = Schema.Struct({
  type: Schema.Literal("function"),
  function: Schema.Struct({
    name: Schema.NonEmptyString,
    description: Schema.optional(Schema.String),
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
    function: Schema.Struct({ name: Schema.NonEmptyString }),
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
  content: Schema.optional(Schema.String),
  tool_calls: Schema.optional(
    Schema.Array(
      Schema.Struct({
        index: Schema.Number.check(Schema.isFinite()),
        id: Schema.optional(Schema.NonEmptyString),
        type: Schema.optional(Schema.Literal("function")),
        function: Schema.Struct({
          name: Schema.optional(Schema.NonEmptyString),
          arguments: Schema.optional(Schema.String),
        }),
      })
    )
  ),
});

export type OpenAICompatibleChatCompletionDelta =
  typeof OpenAICompatibleChatCompletionDelta.Type;

export const OpenAICompatibleChatCompletionChoice = Schema.Struct({
  index: Schema.Number.check(Schema.isFinite()),
  delta: OpenAICompatibleChatCompletionDelta,
  finish_reason: Schema.optional(Schema.NullOr(Schema.String)),
});

export type OpenAICompatibleChatCompletionChoice =
  typeof OpenAICompatibleChatCompletionChoice.Type;

export const OpenAICompatibleChatCompletionChunk = Schema.Struct({
  id: Schema.NonEmptyString,
  object: Schema.Literal("chat.completion.chunk"),
  created: Schema.Number.check(Schema.isFinite()),
  model: CodexResponsesModelId,
  choices: Schema.Array(OpenAICompatibleChatCompletionChoice),
});

export type OpenAICompatibleChatCompletionChunk =
  typeof OpenAICompatibleChatCompletionChunk.Type;

export const OpenAICompatibleChatCompletionStream = Schema.Struct({
  contentType: Schema.Literal("text/event-stream"),
  body: Schema.String,
});

export type OpenAICompatibleChatCompletionStream =
  typeof OpenAICompatibleChatCompletionStream.Type;

export const CodexDirectProviderInput = Schema.Struct({
  subject: CodexOAuthSubject,
  accountId: Schema.optional(Schema.NonEmptyString),
  request: OpenAICompatibleChatCompletionRequest,
});

export type CodexDirectProviderInput = typeof CodexDirectProviderInput.Type;

export const OpenAICompatibleProxyInternalToken = Schema.RedactedFromValue(
  Schema.NonEmptyString
);

export type OpenAICompatibleProxyInternalToken =
  typeof OpenAICompatibleProxyInternalToken.Type;

export const OpenAICompatibleProxyInput = Schema.Struct({
  authorization: Schema.optional(Schema.String),
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
  accountId: Schema.optional(Schema.NonEmptyString),
  model: CodexResponsesModelId,
  prompt: Schema.NonEmptyString,
});

export type CodexResponsesProofInput = typeof CodexResponsesProofInput.Type;

export const CodexResponsesProofResult = Schema.Struct({
  transport: Schema.Literal("direct-codex-responses"),
  endpoint: CodexResponsesEndpoint,
  status: Schema.Number.check(Schema.isFinite()),
  contentType: Schema.String,
  receivedBodyBytes: Schema.Number.check(Schema.isFinite()),
  receivedStreamLines: Schema.Number.check(Schema.isFinite()),
  usedAccountHeader: Schema.Boolean,
});

export type CodexResponsesProofResult = typeof CodexResponsesProofResult.Type;

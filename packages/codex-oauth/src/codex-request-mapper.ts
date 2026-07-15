import { Context, Effect, Schema } from "effect";

import { CodexResponsesRequestError } from "./errors.js";
import { CodexResponsesRequest } from "./schemas.js";
import type {
  CodexResponsesFunctionTool as CodexResponsesFunctionToolType,
  CodexResponsesInput as CodexResponsesInputType,
  CodexResponsesRequest as CodexResponsesRequestType,
  CodexResponsesToolChoice as CodexResponsesToolChoiceType,
  OpenAICompatibleChatCompletionRequest,
} from "./schemas.js";

export interface CodexRequestMapperShape {
  readonly toCodexResponses: (
    input: OpenAICompatibleChatCompletionRequest
  ) => Effect.Effect<CodexResponsesRequestType, CodexResponsesRequestError>;
}

export class CodexRequestMapper extends Context.Service<
  CodexRequestMapper,
  CodexRequestMapperShape
>()("@bundjil/codex-oauth/CodexRequestMapper") {}

export const makeCodexRequestMapper = CodexRequestMapper.of({
  toCodexResponses: Effect.fn("CodexRequestMapper.toCodexResponses")(function* (
    input: OpenAICompatibleChatCompletionRequest
  ) {
    const instructionParts: string[] = [];
    const responsesInput: CodexResponsesInputType[] = [];

    for (const message of input.messages) {
      if (message.role === "system") {
        if (message.content.length > 0) {
          instructionParts.push(message.content);
        }
        continue;
      }

      if (message.role === "user") {
        if (message.content.length > 0) {
          responsesInput.push({
            role: "user",
            content: [{ type: "input_text", text: message.content }],
          });
        }
        continue;
      }

      if (message.role === "tool") {
        responsesInput.push({
          type: "function_call_output",
          call_id: message.tool_call_id,
          output: message.content,
        });
        continue;
      }

      if (
        message.content !== undefined &&
        message.content !== null &&
        message.content.length > 0
      ) {
        responsesInput.push({
          role: "assistant",
          content: [{ type: "output_text", text: message.content }],
        });
      }

      for (const toolCall of message.tool_calls ?? []) {
        responsesInput.push({
          type: "function_call",
          call_id: toolCall.id,
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        });
      }
    }

    const instructions = instructionParts.join("\n");
    const tools: CodexResponsesFunctionToolType[] | undefined =
      input.tools?.map((tool) => ({
        type: "function",
        name: tool.function.name,
        ...(tool.function.description === undefined
          ? {}
          : { description: tool.function.description }),
        parameters: tool.function.parameters,
        ...(tool.function.strict === undefined
          ? {}
          : { strict: tool.function.strict }),
      }));
    const toolChoice: CodexResponsesToolChoiceType | undefined =
      typeof input.tool_choice === "object"
        ? { type: "function", name: input.tool_choice.function.name }
        : input.tool_choice;

    return yield* Schema.decodeUnknownEffect(CodexResponsesRequest)({
      model: input.model,
      input: responsesInput,
      store: false,
      ...(instructions.length === 0 ? {} : { instructions }),
      stream: input.stream ?? true,
      reasoning: { effort: "low" },
      ...(tools === undefined ? {} : { tools, parallel_tool_calls: false }),
      ...(toolChoice === undefined ? {} : { tool_choice: toolChoice }),
    }).pipe(
      Effect.mapError(
        (cause) =>
          new CodexResponsesRequestError({
            boundary: "CodexResponsesRequest",
            message: "Unable to map OpenAI-compatible request to Codex.",
            cause,
          })
      )
    );
  }),
});

export const toCodexResponses = (
  input: OpenAICompatibleChatCompletionRequest
) =>
  Effect.gen(function* toCodexResponsesOperation() {
    const mapper = yield* CodexRequestMapper;

    return yield* mapper.toCodexResponses(input);
  });

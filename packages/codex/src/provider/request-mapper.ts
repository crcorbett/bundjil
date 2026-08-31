import { Context, Effect, Schema } from "effect";

import { CodexResponsesRequest } from "./contracts.js";
import type {
  CodexResponsesFunctionTool as CodexResponsesFunctionToolType,
  CodexResponsesInput as CodexResponsesInputType,
  CodexResponsesRequest as CodexResponsesRequestType,
  CodexResponsesToolChoice as CodexResponsesToolChoiceType,
  OpenAICompatibleChatCompletionRequest,
} from "./contracts.js";
import { CodexResponsesRequestError } from "./errors.js";
import { CodexResponsesRequestPolicyService } from "./request-policy.js";

export interface CodexRequestMapperContract {
  readonly toCodexResponses: (
    input: OpenAICompatibleChatCompletionRequest
  ) => Effect.Effect<CodexResponsesRequestType, CodexResponsesRequestError>;
}

export class CodexRequestMapper extends Context.Service<
  CodexRequestMapper,
  CodexRequestMapperContract
>()("@bundjil/codex/CodexRequestMapper") {}

export const makeCodexRequestMapper = Effect.gen(
  function* makeCodexRequestMapperService() {
    const requestPolicy = yield* CodexResponsesRequestPolicyService;

    return CodexRequestMapper.of({
      toCodexResponses: Effect.fn("CodexRequestMapper.toCodexResponses")(
        function* (input: OpenAICompatibleChatCompletionRequest) {
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
            input.tools?.map((tool) => {
              const requiredTool = {
                type: "function",
                name: tool.function.name,
                parameters: tool.function.parameters,
              } satisfies CodexResponsesFunctionToolType;
              const describedTool =
                tool.function.description === undefined
                  ? requiredTool
                  : {
                      ...requiredTool,
                      description: tool.function.description,
                    };
              return tool.function.strict === undefined
                ? describedTool
                : { ...describedTool, strict: tool.function.strict };
            });
          const toolChoice: CodexResponsesToolChoiceType | undefined =
            typeof input.tool_choice === "object"
              ? { type: "function", name: input.tool_choice.function.name }
              : input.tool_choice;

          const requiredRequest = {
            model: input.model,
            input: responsesInput,
            store: false,
            stream: input.stream ?? true,
            reasoning: { effort: requestPolicy.policy.reasoningEffort },
          };
          const instructedRequest =
            instructions.length === 0
              ? requiredRequest
              : { ...requiredRequest, instructions };
          const tooledRequest =
            tools === undefined
              ? instructedRequest
              : {
                  ...instructedRequest,
                  tools,
                  parallel_tool_calls: false,
                };
          const request =
            toolChoice === undefined
              ? tooledRequest
              : { ...tooledRequest, tool_choice: toolChoice };
          return yield* Schema.decodeUnknownEffect(CodexResponsesRequest)(
            request
          ).pipe(
            Effect.mapError(
              () =>
                new CodexResponsesRequestError({
                  boundary: "CodexResponsesRequest",
                  message: "Unable to map OpenAI-compatible request to Codex.",
                })
            )
          );
        }
      ),
    });
  }
);

export const toCodexResponses = Effect.fnUntraced(
  function* toCodexResponsesOperation(
    input: OpenAICompatibleChatCompletionRequest
  ) {
    const mapper = yield* CodexRequestMapper;

    return yield* mapper.toCodexResponses(input);
  }
);

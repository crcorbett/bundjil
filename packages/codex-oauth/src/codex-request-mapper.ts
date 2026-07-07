import { Context, Effect, Schema } from "effect";

import { CodexResponsesRequestError } from "./errors.js";
import { CodexResponsesRequest } from "./schemas.js";
import type {
  CodexResponsesRequest as CodexResponsesRequestType,
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
    const instructions = input.messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n");
    const messages = input.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role,
        content: [
          {
            type: message.role === "assistant" ? "output_text" : "input_text",
            text: message.content,
          },
        ],
      }));

    return yield* Schema.decodeUnknownEffect(CodexResponsesRequest)({
      model: input.model,
      input: messages,
      store: false,
      ...(instructions.length === 0 ? {} : { instructions }),
      stream: input.stream ?? true,
      reasoning: { effort: "low" },
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

import { Context, Effect, Redacted } from "effect";

import type {
  OpenAICompatibleChatCompletionStream,
  OpenAICompatibleProxyInput,
} from "./contracts.js";
import type { CodexDirectProviderFailure } from "./direct.js";
import { CodexDirectProvider } from "./direct.js";
import { OpenAICompatibleProxyAuthError } from "./errors.js";

export type OpenAICompatibleProxyFailure =
  | OpenAICompatibleProxyAuthError
  | CodexDirectProviderFailure;

export interface OpenAICompatibleProxyShape {
  readonly handleChatCompletions: (
    input: OpenAICompatibleProxyInput
  ) => Effect.Effect<
    OpenAICompatibleChatCompletionStream,
    OpenAICompatibleProxyFailure
  >;
}

export class OpenAICompatibleProxy extends Context.Service<
  OpenAICompatibleProxy,
  OpenAICompatibleProxyShape
>()("@bundjil/codex/OpenAICompatibleProxy") {}

export const makeOpenAICompatibleProxy = Effect.gen(
  function* makeOpenAICompatibleProxyService() {
    const directProvider = yield* CodexDirectProvider;

    return OpenAICompatibleProxy.of({
      handleChatCompletions: Effect.fn(
        "OpenAICompatibleProxy.handleChatCompletions"
      )(function* (input: OpenAICompatibleProxyInput) {
        const expectedAuthorization = `Bearer ${Redacted.value(
          input.internalToken
        )}`;

        if (input.authorization !== expectedAuthorization) {
          return yield* new OpenAICompatibleProxyAuthError({
            operation: "handleChatCompletions",
            message: "Codex proxy request is not authorized.",
          });
        }

        return yield* directProvider.streamChatCompletion(input.completion);
      }),
    });
  }
).pipe(Effect.withSpan("OpenAICompatibleProxyLive"));

export const handleChatCompletions = (input: OpenAICompatibleProxyInput) =>
  Effect.gen(function* handleChatCompletionsOperation() {
    const proxy = yield* OpenAICompatibleProxy;

    return yield* proxy.handleChatCompletions(input);
  });

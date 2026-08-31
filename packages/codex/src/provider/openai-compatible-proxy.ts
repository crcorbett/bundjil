import { Context, Effect, Redacted } from "effect";

import type {
  OpenAICompatibleChatCompletionStream,
  OpenAICompatibleProxyInput,
  OpenAICompatibleProxyInternalToken,
} from "./contracts.js";
import type { CodexDirectProviderFailure } from "./direct.js";
import { CodexDirectProvider } from "./direct.js";
import { OpenAICompatibleProxyAuthError } from "./errors.js";

export type OpenAICompatibleProxyFailure =
  | OpenAICompatibleProxyAuthError
  | CodexDirectProviderFailure;

export interface OpenAICompatibleProxyContract {
  readonly handleChatCompletions: (
    input: OpenAICompatibleProxyInput
  ) => Effect.Effect<
    OpenAICompatibleChatCompletionStream,
    OpenAICompatibleProxyFailure
  >;
}

export class OpenAICompatibleProxy extends Context.Service<
  OpenAICompatibleProxy,
  OpenAICompatibleProxyContract
>()("@bundjil/codex/OpenAICompatibleProxy") {}

const authorizationPrefix = "Bearer ";
const authorizationComparisonWidth = 16_391;

const equalAuthorization = (left: string, right: string) => {
  const leftPadded = left.padEnd(authorizationComparisonWidth, "\0");
  const rightPadded = right.padEnd(authorizationComparisonWidth, "\0");
  let difference = Number(left.length !== right.length);
  for (let index = 0; index < authorizationComparisonWidth; index += 1) {
    difference += Number(
      leftPadded.codePointAt(index) !== rightPadded.codePointAt(index)
    );
  }
  return difference === 0;
};

export const makeOpenAICompatibleProxy = Effect.fn(
  "OpenAICompatibleProxy.make"
)(function* (internalToken: OpenAICompatibleProxyInternalToken) {
  const directProvider = yield* CodexDirectProvider;
  const expectedAuthorization = `${authorizationPrefix}${Redacted.value(
    internalToken
  )}`;

  return OpenAICompatibleProxy.of({
    handleChatCompletions: Effect.fn(
      "OpenAICompatibleProxy.handleChatCompletions"
    )(function* (input: OpenAICompatibleProxyInput) {
      if (
        input.authorization === undefined ||
        !equalAuthorization(
          Redacted.value(input.authorization),
          expectedAuthorization
        )
      ) {
        return yield* new OpenAICompatibleProxyAuthError({
          operation: "handleChatCompletions",
          message: "Codex proxy request is not authorized.",
        });
      }

      return yield* directProvider.streamChatCompletion(input.completion);
    }),
  });
});

export const handleChatCompletions = Effect.fnUntraced(
  function* handleChatCompletionsOperation(input: OpenAICompatibleProxyInput) {
    const proxy = yield* OpenAICompatibleProxy;

    return yield* proxy.handleChatCompletions(input);
  }
);

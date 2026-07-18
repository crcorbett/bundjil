import { Context, Effect } from "effect";

import { CodexReauthenticationRequired } from "../auth/errors.js";
import type { CodexOAuthFailure } from "../auth/errors.js";
import { CodexOAuthService } from "../auth/service.js";
import type {
  CodexDirectProviderInput,
  OpenAICompatibleChatCompletionStream,
} from "./contracts.js";
import type {
  CodexResponsesRequestError,
  CodexResponsesStreamError,
} from "./errors.js";
import type { CodexHttpClientFailure } from "./http-client.js";
import { CodexHttpClient } from "./http-client.js";
import { CodexRequestMapper } from "./request-mapper.js";
import { CodexStreamMapper } from "./stream-mapper.js";

export type CodexDirectProviderFailure =
  | CodexOAuthFailure
  | CodexResponsesRequestError
  | CodexHttpClientFailure
  | CodexResponsesStreamError;

export interface CodexDirectProviderShape {
  readonly streamChatCompletion: (
    input: CodexDirectProviderInput
  ) => Effect.Effect<
    OpenAICompatibleChatCompletionStream,
    CodexDirectProviderFailure
  >;
}

export class CodexDirectProvider extends Context.Service<
  CodexDirectProvider,
  CodexDirectProviderShape
>()("@bundjil/codex/CodexDirectProvider") {}

export const makeCodexDirectProvider = Effect.gen(
  function* makeCodexDirectProviderService() {
    const oauth = yield* CodexOAuthService;
    const requestMapper = yield* CodexRequestMapper;
    const httpClient = yield* CodexHttpClient;
    const streamMapper = yield* CodexStreamMapper;

    return CodexDirectProvider.of({
      streamChatCompletion: Effect.fn(
        "CodexDirectProvider.streamChatCompletion"
      )(function* (input: CodexDirectProviderInput) {
        const request = yield* requestMapper.toCodexResponses(input.request);
        const credential = yield* oauth.getValidCredential(input.subject);
        const response = yield* httpClient
          .postResponsesStream({
            accessToken: credential.accessToken,
            accountId: credential.accountId,
            request,
          })
          .pipe(
            Effect.catchTags({
              CodexHttpStatusError: (error) =>
                error.status !== 401
                  ? Effect.fail(error)
                  : Effect.gen(function* recoverRejectedCredential() {
                      const recovered = yield* oauth.recoverAfterUnauthorized({
                        subject: input.subject,
                        observedCredentialRevision:
                          credential.credentialRevision,
                      });

                      return yield* httpClient
                        .postResponsesStream({
                          accessToken: recovered.accessToken,
                          accountId: recovered.accountId,
                          request,
                        })
                        .pipe(
                          Effect.catchTags({
                            CodexHttpStatusError: (retryError) =>
                              retryError.status === 401
                                ? Effect.fail(
                                    new CodexReauthenticationRequired({
                                      profileId: input.subject.profileId,
                                      message:
                                        "Codex subscription authorization requires a new trusted-local login.",
                                    })
                                  )
                                : Effect.fail(retryError),
                          })
                        );
                    }),
            })
          );

        return yield* streamMapper.toOpenAICompatibleStream({
          model: input.request.model,
          body: response.body,
        });
      }),
    });
  }
).pipe(Effect.withSpan("CodexDirectProviderLive"));

export const makeCodexLegacyDirectProvider = Effect.gen(
  function* makeCodexLegacyDirectProviderService() {
    const oauth = yield* CodexOAuthService;
    const requestMapper = yield* CodexRequestMapper;
    const httpClient = yield* CodexHttpClient;
    const streamMapper = yield* CodexStreamMapper;

    return CodexDirectProvider.of({
      streamChatCompletion: Effect.fn(
        "CodexLegacyDirectProvider.streamChatCompletion"
      )(function* (input: CodexDirectProviderInput) {
        const accessToken = yield* oauth.getValidToken(input.subject);
        const request = yield* requestMapper.toCodexResponses(input.request);
        const response = yield* httpClient.postResponsesStream({
          accessToken,
          ...(input.accountId === undefined
            ? {}
            : { accountId: input.accountId }),
          request,
        });

        return yield* streamMapper.toOpenAICompatibleStream({
          model: input.request.model,
          body: response.body,
        });
      }),
    });
  }
).pipe(Effect.withSpan("CodexLegacyDirectProviderLive"));

export const streamChatCompletion = (input: CodexDirectProviderInput) =>
  Effect.gen(function* streamChatCompletionOperation() {
    const provider = yield* CodexDirectProvider;

    return yield* provider.streamChatCompletion(input);
  });

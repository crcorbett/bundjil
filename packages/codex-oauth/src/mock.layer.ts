import { Effect, Layer, Redacted } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import { CodexDirectProvider } from "./codex-direct-provider.service.js";
import { CodexHttpClient } from "./codex-http-client.service.js";
import { CodexResponsesFetch } from "./codex-responses-fetch.service.js";
import { CodexHttpNetworkError, OAuthProfileStorageError } from "./errors.js";
import {
  CodexOAuthServiceLive,
  CodexProfileStoreKeyValueLive,
} from "./live.layer.js";
import { CodexOAuthClient } from "./oauth-client.service.js";
import { CodexOAuthProfile } from "./schemas.js";
import type {
  CodexOAuthLoginStartResult,
  CodexOAuthProfile as CodexOAuthProfileType,
  CodexOAuthTokenRefreshResult,
  CodexResponsesProofResult,
  CodexResponsesStreamResult,
  OpenAICompatibleChatCompletionStream,
} from "./schemas.js";
import { codexOAuthProfileStorageKey } from "./storage-keys.js";

export interface CodexOAuthClientMockOptions {
  readonly loginStart?: CodexOAuthLoginStartResult;
  readonly loginProfile?: CodexOAuthProfileType;
  readonly refreshResult?: CodexOAuthTokenRefreshResult;
}

export interface CodexResponsesFetchMockOptions {
  readonly fetch: (request: Request) => Effect.Effect<Response>;
}

export const CodexResponsesFetchMock = (
  options: CodexResponsesFetchMockOptions
) =>
  Layer.succeed(CodexResponsesFetch, {
    fetch: options.fetch,
  });

export interface CodexHttpClientMockOptions {
  readonly postResponses?: CodexResponsesProofResult;
  readonly postResponsesStream?: CodexResponsesStreamResult;
}

export const CodexHttpClientMock = (options: CodexHttpClientMockOptions = {}) =>
  Layer.succeed(CodexHttpClient, {
    postResponses: () =>
      options.postResponses === undefined
        ? Effect.fail(
            new CodexHttpNetworkError({
              operation: "postResponses",
              message: "CodexHttpClientMock.postResponses is not seeded.",
              cause: "missing mock postResponses result",
            })
          )
        : Effect.succeed(options.postResponses),
    postResponsesStream: () =>
      options.postResponsesStream === undefined
        ? Effect.fail(
            new CodexHttpNetworkError({
              operation: "postResponsesStream",
              message: "CodexHttpClientMock.postResponsesStream is not seeded.",
              cause: "missing mock postResponsesStream result",
            })
          )
        : Effect.succeed(options.postResponsesStream),
  });

export interface CodexDirectProviderMockOptions {
  readonly stream: OpenAICompatibleChatCompletionStream;
}

export const CodexDirectProviderMock = (
  options: CodexDirectProviderMockOptions
) =>
  Layer.succeed(CodexDirectProvider, {
    streamChatCompletion: () => Effect.succeed(options.stream),
  });

export const CodexOAuthClientMock = (
  options: CodexOAuthClientMockOptions = {}
) =>
  Layer.succeed(CodexOAuthClient, {
    startLogin: () =>
      options.loginStart === undefined
        ? Effect.succeed({
            authorizationUrl: "https://auth.openai.com/oauth/authorize",
            state: Redacted.make("mock-state"),
            codeVerifier: Redacted.make("mock-code-verifier"),
          })
        : Effect.succeed(options.loginStart),
    completeLogin: () =>
      options.loginProfile === undefined
        ? Effect.fail(
            new OAuthProfileStorageError({
              operation: "seedProfiles",
              message: "Mock completeLogin requires a seeded login profile.",
              cause: "missing mock profile",
            })
          )
        : Effect.succeed(options.loginProfile),
    refresh: () =>
      options.refreshResult === undefined
        ? Effect.fail(
            new OAuthProfileStorageError({
              operation: "seedProfiles",
              message: "Mock refresh requires a seeded refresh result.",
              cause: "missing mock refresh result",
            })
          )
        : Effect.succeed(options.refreshResult),
    revoke: () => Effect.void,
  });

export const CodexProfileStoreMemory = (
  profiles: readonly CodexOAuthProfileType[] = []
) =>
  Layer.mergeAll(
    CodexProfileStoreKeyValueLive,
    Layer.effectDiscard(
      Effect.gen(function* seedProfiles() {
        const keyValueStore = yield* KeyValueStore.KeyValueStore;
        const schemaStore = KeyValueStore.toSchemaStore(
          keyValueStore,
          CodexOAuthProfile
        );

        for (const profile of profiles) {
          const key = yield* codexOAuthProfileStorageKey(profile.subject);

          yield* schemaStore.set(key, profile).pipe(
            Effect.catchTag("KeyValueStoreError", (cause) =>
              Effect.fail(
                new OAuthProfileStorageError({
                  operation: "seedProfiles",
                  key,
                  message: "Unable to seed Codex OAuth profile.",
                  cause,
                })
              )
            ),
            Effect.catchTag("SchemaError", (cause) =>
              Effect.fail(
                new OAuthProfileStorageError({
                  operation: "seedProfiles",
                  key,
                  message: "Unable to encode seeded Codex OAuth profile.",
                  cause,
                })
              )
            )
          );
        }
      })
    )
  ).pipe(Layer.provide(KeyValueStore.layerMemory));

export const CodexOAuthMemory = (
  profiles: readonly CodexOAuthProfileType[] = [],
  clientOptions: CodexOAuthClientMockOptions = {}
) =>
  CodexOAuthServiceLive.pipe(
    Layer.provideMerge(
      Layer.merge(
        CodexProfileStoreMemory(profiles),
        CodexOAuthClientMock(clientOptions)
      )
    )
  );

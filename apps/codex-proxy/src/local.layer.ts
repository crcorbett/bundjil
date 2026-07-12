import {
  CodexOAuthUnsupportedRuntimePath,
  OpenAICompatibleProxy,
} from "@bundjil/codex-oauth";
import { CodexFileSystemKeyValueStoreLive } from "@bundjil/codex-oauth/filesystem-key-value-store.layer";
import {
  CodexDirectProviderLive,
  CodexHttpClientLive,
  CodexOAuthClientLive,
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexOAuthServiceLive,
  CodexProfileStoreEncryptedKeyValueLive,
  CodexResponsesFetchLive,
  OpenAICompatibleProxyLive,
} from "@bundjil/codex-oauth/live.layer";
import { CodexOAuthRefreshLockMemory } from "@bundjil/codex-oauth/mock.layer";
import { ConfigProvider, Effect, Layer } from "effect";

export const CodexProxyOpenAICompatibleProxyLocalUnavailableLive =
  Layer.succeed(
    OpenAICompatibleProxy,
    OpenAICompatibleProxy.of({
      handleChatCompletions: Effect.fn(
        "CodexProxyOpenAICompatibleProxyLocalUnavailable.handleChatCompletions"
      )(function* handleUnavailableLocalRequest() {
        return yield* new CodexOAuthUnsupportedRuntimePath({
          operation: "startLogin",
          message: "Local Codex proxy configuration is unavailable.",
        });
      }),
    })
  );

const makeCodexProxyEncryptedFileSystemProfileStoreLive = (
  directory: string,
  configProviderLayer = ConfigProvider.layer(ConfigProvider.fromEnv())
) =>
  CodexProfileStoreEncryptedKeyValueLive.pipe(
    Layer.provideMerge(
      Layer.merge(
        CodexOAuthProfileCipherLive.pipe(
          Layer.provide(
            CodexOAuthProfileCipherConfigLive.pipe(
              Layer.provide(configProviderLayer)
            )
          )
        ),
        CodexFileSystemKeyValueStoreLive(directory)
      )
    )
  );

const makeCodexProxyOAuthServiceLocal = (
  directory: string,
  configProviderLayer = ConfigProvider.layer(ConfigProvider.fromEnv())
) =>
  CodexOAuthServiceLive.pipe(
    Layer.provideMerge(
      Layer.mergeAll(
        makeCodexProxyEncryptedFileSystemProfileStoreLive(
          directory,
          configProviderLayer
        ),
        CodexOAuthClientLive,
        CodexOAuthRefreshLockMemory
      )
    )
  );

export const makeCodexProxyOpenAICompatibleProxyLocal = (
  directory: string,
  configProviderLayer = ConfigProvider.layer(ConfigProvider.fromEnv()),
  responsesFetchLayer = CodexResponsesFetchLive
) =>
  OpenAICompatibleProxyLive.pipe(
    Layer.provide(
      CodexDirectProviderLive.pipe(
        Layer.provideMerge(
          Layer.merge(
            makeCodexProxyOAuthServiceLocal(directory, configProviderLayer),
            CodexHttpClientLive.pipe(Layer.provide(responsesFetchLayer))
          )
        )
      )
    ),
    Layer.catchCause(() => CodexProxyOpenAICompatibleProxyLocalUnavailableLive)
  );

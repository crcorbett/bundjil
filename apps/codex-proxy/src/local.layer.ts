import {
  CodexOAuthProfileCommitUnsupported,
  CodexOAuthUnsupportedRuntimePath,
  OpenAICompatibleProxy,
} from "@bundjil/codex";
import type { CodexResponsesRequestPolicy } from "@bundjil/codex";
import { CodexFileSystemKeyValueStoreLive } from "@bundjil/codex/filesystem-store";
import {
  makeCodexLegacyDirectProviderLive,
  CodexOAuthClientLive,
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexOAuthRefreshPolicyLive,
  CodexOAuthServiceLive,
  CodexProfileStoreEncryptedKeyValueLive,
  makeOpenAICompatibleProxyLive,
} from "@bundjil/codex/runtime";
import { CodexOAuthRefreshLockMemory } from "@bundjil/codex/testing";
import { ConfigProvider, Effect, Layer } from "effect";

import {
  CodexProxyReadyLive,
  CodexProxyUnavailableLive,
} from "./readiness.service.js";
import type { CodexProxyLocalProfileStoreDirectory } from "./schemas.js";

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
  ).pipe(Layer.merge(CodexProxyUnavailableLive));

const makeCodexProxyEncryptedFileSystemProfileStoreLive = (
  directory: CodexProxyLocalProfileStoreDirectory,
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
  directory: CodexProxyLocalProfileStoreDirectory,
  configProviderLayer = ConfigProvider.layer(ConfigProvider.fromEnv())
) =>
  CodexOAuthServiceLive.pipe(
    Layer.provide(CodexOAuthProfileCommitUnsupported),
    Layer.provideMerge(
      Layer.mergeAll(
        makeCodexProxyEncryptedFileSystemProfileStoreLive(
          directory,
          configProviderLayer
        ),
        CodexOAuthClientLive,
        CodexOAuthRefreshLockMemory,
        CodexOAuthRefreshPolicyLive
      )
    )
  );

export const makeCodexProxyOpenAICompatibleProxyLocal = (
  directory: CodexProxyLocalProfileStoreDirectory,
  policy: CodexResponsesRequestPolicy,
  internalToken: Parameters<typeof makeOpenAICompatibleProxyLive>[0],
  configProviderLayer = ConfigProvider.layer(ConfigProvider.fromEnv()),
  codexDirectProviderLayer: ReturnType<
    typeof makeCodexLegacyDirectProviderLive
  > = makeCodexLegacyDirectProviderLive(policy)
) =>
  Layer.merge(
    makeOpenAICompatibleProxyLive(internalToken).pipe(
      Layer.provide(
        codexDirectProviderLayer.pipe(
          Layer.provideMerge(
            makeCodexProxyOAuthServiceLocal(directory, configProviderLayer)
          )
        )
      )
    ),
    CodexProxyReadyLive
  ).pipe(
    /* oxlint-disable-next-line eslint-plugin-promise/prefer-await-to-then -- Layer.catch recovers the typed Effect Layer error channel, not a Promise callback. */
    Layer.catch(() => CodexProxyOpenAICompatibleProxyLocalUnavailableLive)
  );

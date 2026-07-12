import {
  CodexOAuthProfileCommitUnsupported,
  CodexOAuthUnsupportedRuntimePath,
  OpenAICompatibleProxy,
} from "@bundjil/codex-oauth";
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
import {
  UpstashCodexOAuthRefreshLockLive,
  UpstashKeyValueStoreLive,
} from "@bundjil/codex-oauth/upstash-key-value-store.layer";
import { Effect, Layer } from "effect";

const CodexProxyEncryptedProfileStoreLive =
  CodexProfileStoreEncryptedKeyValueLive.pipe(
    Layer.provideMerge(
      Layer.merge(
        CodexOAuthProfileCipherLive.pipe(
          Layer.provide(CodexOAuthProfileCipherConfigLive)
        ),
        UpstashKeyValueStoreLive
      )
    )
  );

const CodexProxyOAuthServiceLive = CodexOAuthServiceLive.pipe(
  Layer.provide(CodexOAuthProfileCommitUnsupported),
  Layer.provideMerge(
    Layer.mergeAll(
      CodexProxyEncryptedProfileStoreLive,
      CodexOAuthClientLive,
      UpstashCodexOAuthRefreshLockLive
    )
  )
);

const CodexProxyHttpClientLive = CodexHttpClientLive.pipe(
  Layer.provide(CodexResponsesFetchLive)
);

const CodexProxyDirectProviderLive = CodexDirectProviderLive.pipe(
  Layer.provideMerge(
    Layer.merge(CodexProxyOAuthServiceLive, CodexProxyHttpClientLive)
  )
);

export const CodexProxyOpenAICompatibleProxyLive =
  OpenAICompatibleProxyLive.pipe(Layer.provide(CodexProxyDirectProviderLive));

export const CodexProxyOpenAICompatibleProxyUnavailableLive = Layer.succeed(
  OpenAICompatibleProxy,
  OpenAICompatibleProxy.of({
    handleChatCompletions: Effect.fn(
      "CodexProxyOpenAICompatibleProxyUnavailable.handleChatCompletions"
    )(function* handleUnavailableLiveRequest() {
      return yield* new CodexOAuthUnsupportedRuntimePath({
        operation: "startLogin",
        message: "Live Codex proxy configuration is unavailable.",
      });
    }),
  })
);

export const CodexProxyOpenAICompatibleProxyLiveOrUnavailable =
  CodexProxyOpenAICompatibleProxyLive.pipe(
    Layer.catchCause(() => CodexProxyOpenAICompatibleProxyUnavailableLive)
  );

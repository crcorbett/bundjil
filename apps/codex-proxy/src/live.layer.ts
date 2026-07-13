import {
  CodexOAuthUnsupportedRuntimePath,
  OpenAICompatibleProxy,
} from "@bundjil/codex-oauth";
import {
  CodexDirectProviderLive,
  CodexHttpClientLive,
  CodexOAuthHttpClientLive,
  CodexOAuthProfileCipherLive,
  CodexOAuthRefreshClientLive,
  CodexOAuthRefreshPolicyLive,
  CodexOAuthServiceLive,
  CodexProfileStoreEncryptedKeyValueLive,
  CodexResponsesFetchLive,
  CodexSubscriptionAuthProtocolConfigLive,
  OpenAICompatibleProxyLive,
} from "@bundjil/codex-oauth/live.layer";
import {
  UpstashCodexOAuthProfileCommitLive,
  UpstashCodexOAuthRefreshLockLive,
  UpstashKeyValueStoreLive,
} from "@bundjil/codex-oauth/upstash-key-value-store.layer";
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { Effect, Layer } from "effect";

import { CodexProxyProfileCipherConfigLive } from "./proof-cipher-config.layer.js";
import {
  CodexProxyReadyLive,
  CodexProxyUnavailableLive,
} from "./readiness.service.js";

const CodexProxyProfileCipherLive = CodexOAuthProfileCipherLive.pipe(
  Layer.provide(CodexProxyProfileCipherConfigLive)
);

const CodexProxyEncryptedProfileStoreLive =
  CodexProfileStoreEncryptedKeyValueLive.pipe(
    Layer.provideMerge(
      Layer.merge(CodexProxyProfileCipherLive, UpstashKeyValueStoreLive)
    )
  );

const CodexProxyOAuthServiceLive = CodexOAuthServiceLive.pipe(
  Layer.provideMerge(
    Layer.mergeAll(
      CodexProxyEncryptedProfileStoreLive,
      UpstashCodexOAuthProfileCommitLive.pipe(
        Layer.provide(CodexProxyProfileCipherLive)
      ),
      UpstashCodexOAuthRefreshLockLive,
      CodexOAuthRefreshPolicyLive,
      CodexOAuthRefreshClientLive.pipe(
        Layer.provide(
          CodexOAuthHttpClientLive.pipe(
            Layer.provideMerge(
              Layer.merge(
                CodexSubscriptionAuthProtocolConfigLive,
                BunHttpClient.layer
              )
            )
          )
        )
      )
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

export const CodexProxyOpenAICompatibleProxyLive = Layer.merge(
  OpenAICompatibleProxyLive.pipe(Layer.provide(CodexProxyDirectProviderLive)),
  CodexProxyReadyLive
);

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
).pipe(Layer.merge(CodexProxyUnavailableLive));

export const CodexProxyOpenAICompatibleProxyLiveOrUnavailable =
  CodexProxyOpenAICompatibleProxyLive.pipe(
    Layer.catchCause(() => CodexProxyOpenAICompatibleProxyUnavailableLive)
  );

import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import * as BunServices from "@effect/platform-bun/BunServices";
import { ConfigProvider, Effect, Exit, Layer, Schema } from "effect";

import { CodexBrowserLauncherCommandLive } from "../src/browser-launcher.service.js";
import { CodexLoopbackCallbackBunLive } from "../src/loopback-callback.service.js";
import { CodexOAuthHttpClientLive } from "../src/oauth-http-client.service.js";
import {
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexOAuthProfileCommitAtomicLive,
  CodexProfileStoreEncryptedKeyValueLive,
} from "../src/runtime.js";
import { CodexSubscriptionLoginResult } from "../src/schemas.js";
import { CodexSubscriptionAuthProtocolConfigLive } from "../src/subscription-auth-protocol.service.js";
import {
  CodexSubscriptionLoginConfigLive,
  CodexSubscriptionLoginConfigService,
} from "../src/subscription-login.config.js";
import {
  CodexSubscriptionLoginLive,
  runCodexSubscriptionLogin,
} from "../src/subscription-login.service.js";
import { CodexUpstashPersistenceLive } from "../src/upstash-persistence.layer.js";

declare const process: {
  exitCode: number | undefined;
};

const configProviderLayer = ConfigProvider.layer(ConfigProvider.fromEnv());
const cipherConfigLayer = CodexOAuthProfileCipherConfigLive.pipe(
  Layer.provide(configProviderLayer)
);
const cipherLayer = CodexOAuthProfileCipherLive.pipe(
  Layer.provide(cipherConfigLayer)
);
const persistenceLayer = CodexUpstashPersistenceLive;
const protocolLayer = CodexSubscriptionAuthProtocolConfigLive;
const callbackLayer = CodexLoopbackCallbackBunLive.pipe(
  Layer.provide(protocolLayer)
);
const browserLayer = CodexBrowserLauncherCommandLive.pipe(
  Layer.provide(BunServices.layer)
);
const oauthHttpLayer = CodexOAuthHttpClientLive.pipe(
  Layer.provideMerge(Layer.merge(protocolLayer, BunHttpClient.layer))
);
const profileStoreLayer = CodexProfileStoreEncryptedKeyValueLive.pipe(
  Layer.provideMerge(Layer.merge(cipherLayer, persistenceLayer))
);
const profileCommitLayer = CodexOAuthProfileCommitAtomicLive.pipe(
  Layer.provideMerge(Layer.merge(cipherLayer, persistenceLayer))
);
const loginLayer = CodexSubscriptionLoginLive.pipe(
  Layer.provideMerge(
    Layer.mergeAll(
      browserLayer,
      callbackLayer,
      oauthHttpLayer,
      profileStoreLayer,
      profileCommitLayer,
      protocolLayer
    )
  )
);
const loginConfigLayer = CodexSubscriptionLoginConfigLive.pipe(
  Layer.provide(configProviderLayer)
);

const program = Effect.gen(function* loginSubscriptionCli() {
  const input = yield* CodexSubscriptionLoginConfigService;

  return yield* runCodexSubscriptionLogin(input);
}).pipe(Effect.provide(Layer.merge(loginLayer, loginConfigLayer)));

const LoginSuccessOutput = Schema.Struct({
  status: Schema.Literal("stored"),
  result: CodexSubscriptionLoginResult,
});

const LoginBlockedOutput = Schema.Struct({
  status: Schema.Literal("blocked"),
  message: Schema.NonEmptyString,
});

const encodeLoginSuccessOutput = Schema.encodeSync(
  Schema.fromJsonString(LoginSuccessOutput)
);

const encodeLoginBlockedOutput = Schema.encodeSync(
  Schema.fromJsonString(LoginBlockedOutput)
);

const exit = await Effect.runPromiseExit(program);

if (Exit.isSuccess(exit)) {
  console.log(
    encodeLoginSuccessOutput({ status: "stored", result: exit.value })
  );
} else {
  console.error(
    encodeLoginBlockedOutput({
      status: "blocked",
      message:
        "Codex subscription login did not complete. No callback URL, authorization code, OAuth state, verifier, token, account identifier, or provider response was printed.",
    })
  );
  process.exitCode = 1;
}

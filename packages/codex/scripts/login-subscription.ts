import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import * as BunServices from "@effect/platform-bun/BunServices";
import { ConfigProvider, Console, Effect, Exit, Layer, Schema } from "effect";

import { CodexBrowserLauncherCommandLive } from "../src/auth/browser.js";
import { CodexSubscriptionLoginResult } from "../src/auth/contracts.js";
import { CodexOAuthHttpClientLive } from "../src/auth/http-client.js";
import {
  CodexSubscriptionLoginConfigLive,
  CodexSubscriptionLoginConfigService,
} from "../src/auth/login-config.js";
import {
  CodexSubscriptionLoginLive,
  runCodexSubscriptionLogin,
} from "../src/auth/login.js";
import { CodexLoopbackCallbackBunLive } from "../src/auth/loopback-callback.js";
import { CodexSubscriptionAuthProtocolConfigLive } from "../src/auth/protocol.js";
import {
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexOAuthProfileCommitAtomicLive,
  CodexProfileStoreEncryptedKeyValueLive,
} from "../src/runtime.js";
import { CodexUpstashPersistenceLive } from "../src/storage/upstash.js";

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

const main = Effect.gen(function* renderSubscriptionLogin() {
  const exit = yield* Effect.exit(program);

  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(LoginSuccessOutput)
    )({ status: "stored", result: exit.value });
    return yield* Console.log(output);
  }

  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(LoginBlockedOutput)
  )({
    status: "blocked",
    message:
      "Codex subscription login did not complete. No callback URL, authorization code, OAuth state, verifier, token, account identifier, or provider response was printed.",
  });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

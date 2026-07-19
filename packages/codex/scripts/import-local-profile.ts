import { ConfigProvider, Console, Effect, Exit, Layer, Schema } from "effect";

import { CodexLocalProfileImportResult } from "../src/auth/contracts.js";
import { CodexLocalAuthCacheSourceLive } from "../src/auth/local-cache.js";
import { CodexLocalProfileImportConfigLive } from "../src/auth/local-import-config.js";
import {
  CodexLocalProfileImportServiceLive,
  importCodexLocalProfile,
} from "../src/auth/local-import.js";
import {
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexProfileStoreEncryptedKeyValueLive,
} from "../src/runtime.js";
import { CodexUpstashPersistenceLive } from "../src/storage/upstash.js";

declare const process: {
  exitCode: number | undefined;
};

const configProviderLayer = ConfigProvider.layer(ConfigProvider.fromEnv());
const importConfigLayer = CodexLocalProfileImportConfigLive.pipe(
  Layer.provide(configProviderLayer)
);
const sourceLayer = CodexLocalAuthCacheSourceLive.pipe(
  Layer.provide(importConfigLayer)
);
const cipherConfigLayer = CodexOAuthProfileCipherConfigLive.pipe(
  Layer.provide(configProviderLayer)
);
const cipherLayer = CodexOAuthProfileCipherLive.pipe(
  Layer.provide(cipherConfigLayer)
);
const persistenceLayer = CodexUpstashPersistenceLive;
const storeLayer = CodexProfileStoreEncryptedKeyValueLive.pipe(
  Layer.provideMerge(Layer.merge(cipherLayer, persistenceLayer))
);
const importLayer = CodexLocalProfileImportServiceLive.pipe(
  Layer.provideMerge(Layer.mergeAll(importConfigLayer, sourceLayer, storeLayer))
);

const program = importCodexLocalProfile.pipe(Effect.provide(importLayer));

const ImportSuccessOutput = Schema.Struct({
  status: Schema.Literal("imported"),
  result: CodexLocalProfileImportResult,
});

const ImportBlockedOutput = Schema.Struct({
  status: Schema.Literal("blocked"),
  message: Schema.NonEmptyString,
});

const main = Effect.gen(function* renderImportLocalProfile() {
  const exit = yield* Effect.exit(program);

  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(ImportSuccessOutput)
    )({ status: "imported", result: exit.value });
    return yield* Console.log(output);
  }

  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(ImportBlockedOutput)
  )({
    status: "blocked",
    message:
      "Codex local profile import requires valid local config, encrypted storage configuration, and a fresh ChatGPT-mode Codex login. No cache path, account id, token, or cache contents were printed.",
  });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

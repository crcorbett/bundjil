import { ConfigProvider, Effect, Exit, Layer, Schema } from "effect";

import {
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexProfileStoreEncryptedKeyValueLive,
} from "../src/live.layer.js";
import { CodexLocalAuthCacheSourceLive } from "../src/local-auth-cache-source.service.js";
import { CodexLocalProfileImportConfigLive } from "../src/local-profile-import.config.js";
import {
  CodexLocalProfileImportServiceLive,
  importCodexLocalProfile,
} from "../src/local-profile-import.service.js";
import { CodexLocalProfileImportResult } from "../src/schemas.js";
import { CodexUpstashPersistenceLive } from "../src/upstash-persistence.layer.js";

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

const encodeImportSuccessOutput = Schema.encodeSync(
  Schema.fromJsonString(ImportSuccessOutput)
);

const encodeImportBlockedOutput = Schema.encodeSync(
  Schema.fromJsonString(ImportBlockedOutput)
);

const exit = await Effect.runPromiseExit(program);

if (Exit.isSuccess(exit)) {
  console.log(
    encodeImportSuccessOutput({ status: "imported", result: exit.value })
  );
} else {
  console.error(
    encodeImportBlockedOutput({
      status: "blocked",
      message:
        "Codex local profile import requires valid local config, encrypted storage configuration, and a fresh ChatGPT-mode Codex login. No cache path, account id, token, or cache contents were printed.",
    })
  );
  process.exitCode = 1;
}

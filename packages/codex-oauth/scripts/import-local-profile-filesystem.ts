import {
  Cause,
  Config,
  ConfigProvider,
  Effect,
  Exit,
  Layer,
  Option,
  Schema,
} from "effect";

import {
  CodexLocalProfileImportError,
  CodexOAuthProfileCipherError,
  OAuthProfileStorageError,
} from "../src/errors.js";
import { CodexFileSystemKeyValueStoreLive } from "../src/filesystem-key-value-store.layer.js";
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

declare const process: {
  exitCode: number | undefined;
};

const localProfileStoreDirectoryConfig = Config.nonEmptyString(
  "BUNDJIL_CODEX_LOCAL_PROFILE_STORE_DIR"
);

const ImportSuccessOutput = Schema.Struct({
  status: Schema.Literal("imported"),
  result: CodexLocalProfileImportResult,
});

const ImportBlockedOutput = Schema.Struct({
  status: Schema.Literal("blocked"),
  operation: Schema.Union([
    Schema.Literal("unavailable"),
    Schema.Literal("profileCipher"),
    Schema.Literal("storage"),
    Schema.Literal("loadConfig"),
    Schema.Literal("readCache"),
    Schema.Literal("decodeCache"),
    Schema.Literal("validateExpiry"),
    Schema.Literal("buildProfile"),
    Schema.Literal("putProfile"),
    Schema.Literal("encodeResult"),
  ]),
  message: Schema.NonEmptyString,
});

const encodeImportSuccessOutput = Schema.encodeSync(
  Schema.fromJsonString(ImportSuccessOutput)
);

const encodeImportBlockedOutput = Schema.encodeSync(
  Schema.fromJsonString(ImportBlockedOutput)
);

const configProviderLayer = ConfigProvider.layer(ConfigProvider.fromEnv());

const program = Effect.gen(function* importLocalProfileToFileSystem() {
  const directory = yield* localProfileStoreDirectoryConfig;
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
  const storeLayer = CodexProfileStoreEncryptedKeyValueLive.pipe(
    Layer.provideMerge(
      Layer.merge(cipherLayer, CodexFileSystemKeyValueStoreLive(directory))
    )
  );
  const importLayer = CodexLocalProfileImportServiceLive.pipe(
    Layer.provideMerge(
      Layer.mergeAll(importConfigLayer, sourceLayer, storeLayer)
    )
  );

  return yield* importCodexLocalProfile.pipe(Effect.provide(importLayer));
}).pipe(Effect.provide(configProviderLayer));

const exit = await Effect.runPromiseExit(program);

if (Exit.isSuccess(exit)) {
  console.log(
    encodeImportSuccessOutput({ status: "imported", result: exit.value })
  );
} else {
  const operation: (typeof ImportBlockedOutput.Type)["operation"] =
    Option.match(Cause.findErrorOption(exit.cause), {
      onNone: () => "unavailable",
      onSome: (failure) => {
        if (Schema.is(CodexLocalProfileImportError)(failure)) {
          return failure.operation;
        }

        if (Schema.is(CodexOAuthProfileCipherError)(failure)) {
          return "profileCipher";
        }

        if (Schema.is(OAuthProfileStorageError)(failure)) {
          return "storage";
        }

        return "unavailable";
      },
    });

  console.error(
    encodeImportBlockedOutput({
      status: "blocked",
      operation,
      message:
        "Codex filesystem profile import requires valid local config, an encrypted local store directory, and a fresh ChatGPT-mode Codex login. No cache path, account id, token, or cache contents were printed.",
    })
  );
  process.exitCode = 1;
}

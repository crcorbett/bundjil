import {
  Cause,
  Console,
  Config,
  ConfigProvider,
  Effect,
  Exit,
  Layer,
  Option,
  Schema,
} from "effect";

import { CodexLocalProfileImportResult } from "../src/auth/contracts.js";
import { CodexFileSystemDirectory } from "../src/auth/credentials.js";
import { CodexLocalProfileImportError } from "../src/auth/errors.js";
import { CodexLocalAuthCacheSourceLive } from "../src/auth/local-cache.js";
import { CodexLocalProfileImportConfigLive } from "../src/auth/local-import-config.js";
import {
  CodexLocalProfileImportServiceLive,
  importCodexLocalProfile,
} from "../src/auth/local-import.js";
import {
  CodexOAuthProfileCipherError,
  CodexProfileStorageError,
} from "../src/profiles/errors.js";
import {
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexProfileStoreEncryptedKeyValueLive,
} from "../src/runtime.js";
import { CodexFileSystemKeyValueStoreLive } from "../src/storage/filesystem.js";

declare const process: {
  exitCode: number | undefined;
};

const localProfileStoreDirectoryConfig = Config.schema(
  CodexFileSystemDirectory,
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

const main = Effect.gen(function* renderImportLocalProfileToFileSystem() {
  const exit = yield* Effect.exit(program);

  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(ImportSuccessOutput)
    )({ status: "imported", result: exit.value });
    return yield* Console.log(output);
  }

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

        if (Schema.is(CodexProfileStorageError)(failure)) {
          return "storage";
        }

        return "unavailable";
      },
    });

  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(ImportBlockedOutput)
  )({
    status: "blocked",
    operation,
    message:
      "Codex filesystem profile import requires valid local config, an encrypted local store directory, and a fresh ChatGPT-mode Codex login. No cache path, account id, token, or cache contents were printed.",
  });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

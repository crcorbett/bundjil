import { ConfigProvider, Effect, Exit, Schema } from "effect";

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
import { UpstashKeyValueStoreLive } from "../src/upstash-key-value-store.layer.js";

declare const Bun: {
  readonly exit: (code: number) => never;
};

const program = importCodexLocalProfile.pipe(
  Effect.provide(CodexLocalProfileImportServiceLive),
  Effect.provide(CodexLocalAuthCacheSourceLive),
  Effect.provide(CodexLocalProfileImportConfigLive),
  Effect.provide(CodexProfileStoreEncryptedKeyValueLive),
  Effect.provide(CodexOAuthProfileCipherLive),
  Effect.provide(CodexOAuthProfileCipherConfigLive),
  Effect.provide(UpstashKeyValueStoreLive),
  Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
);

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
  Bun.exit(1);
}

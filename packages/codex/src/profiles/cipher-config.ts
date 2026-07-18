import { Config, Context, Effect, Layer, Schema } from "effect";

import type { CodexOAuthProfileCipherConfig } from "./contracts.js";
import { CodexOAuthProfileCipherError } from "./errors.js";

const encryptionAlgorithmConfig = Config.schema(
  Schema.Literal("AES-GCM"),
  "BUNDJIL_CODEX_PROFILE_ENCRYPTION_ALGORITHM"
).pipe(Config.withDefault("AES-GCM"));

const encryptionKeyIdConfig = Config.schema(
  Schema.NonEmptyString.pipe(Schema.brand("CodexOAuthProfileCipherKeyId")),
  "BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID"
);

const encryptionKeyMaterialConfig = Config.redacted(
  "BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY"
);

export class CodexOAuthProfileCipherConfigService extends Context.Service<
  CodexOAuthProfileCipherConfigService,
  CodexOAuthProfileCipherConfig
>()("@bundjil/codex/CodexOAuthProfileCipherConfig") {}

export const loadCodexOAuthProfileCipherConfig = Effect.gen(
  function* loadCodexOAuthProfileCipherConfigFromProvider() {
    const algorithm = yield* encryptionAlgorithmConfig;
    const keyId = yield* encryptionKeyIdConfig;
    const keyMaterial = yield* encryptionKeyMaterialConfig;

    return {
      algorithm,
      keyId,
      keyMaterial,
    } satisfies CodexOAuthProfileCipherConfig;
  }
).pipe(
  Effect.mapError(
    () =>
      new CodexOAuthProfileCipherError({
        operation: "loadKey",
        message: "Unable to load Codex OAuth profile encryption config.",
      })
  ),
  Effect.withSpan("CodexOAuthProfileCipherConfig.load")
);

export const CodexOAuthProfileCipherConfigLive = Layer.effect(
  CodexOAuthProfileCipherConfigService,
  loadCodexOAuthProfileCipherConfig
);

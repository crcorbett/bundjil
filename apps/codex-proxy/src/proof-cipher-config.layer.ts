import {
  CodexOAuthProfileCipherConfig,
  CodexOAuthProfileCipherConfigService,
} from "@bundjil/codex";
import { CodexOAuthProfileCipherConfigLive } from "@bundjil/codex/runtime";
import {
  Config,
  ConfigProvider,
  Effect,
  Layer,
  Redacted,
  Schema,
} from "effect";

const proofModeConfig = Config.schema(
  Schema.Boolean,
  "BUNDJIL_CODEX_PROXY_PROOF_MODE"
).pipe(Config.withDefault(false));

const proofCipherKeyConfig = Config.redacted(
  "BUNDJIL_CODEX_PROOF_PROFILE_ENCRYPTION_KEY"
);

const proofCipherKeyIdConfig = Config.nonEmptyString(
  "BUNDJIL_CODEX_PROOF_PROFILE_ENCRYPTION_KEY_ID"
);

const makeCodexProxyProfileCipherConfigLayer = (
  configProvider: ConfigProvider.ConfigProvider
) =>
  Layer.unwrap(
    Effect.gen(function* makeCodexProxyProfileCipherConfigLayer() {
      const proofMode = yield* proofModeConfig;

      if (!proofMode) {
        return CodexOAuthProfileCipherConfigLive;
      }

      const keyMaterial = yield* proofCipherKeyConfig;
      const keyId = yield* proofCipherKeyIdConfig;
      const config = yield* Schema.decodeUnknownEffect(
        CodexOAuthProfileCipherConfig
      )({
        algorithm: "AES-GCM",
        keyId,
        keyMaterial: Redacted.value(keyMaterial),
      });

      return Layer.succeed(
        CodexOAuthProfileCipherConfigService,
        CodexOAuthProfileCipherConfigService.of(config)
      );
    })
  ).pipe(Layer.provide(ConfigProvider.layer(configProvider)));

export const CodexProxyProfileCipherConfigLive =
  makeCodexProxyProfileCipherConfigLayer(ConfigProvider.fromEnv());

export { makeCodexProxyProfileCipherConfigLayer };

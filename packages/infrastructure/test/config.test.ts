import { assert, it } from "@effect/vitest";
import { State } from "alchemy/State";
import { ConfigProvider, Effect, Exit, Inspectable, Redacted } from "effect";

import {
  loadInfrastructureCommandConfig,
  loadInfrastructurePhotonCredentials,
} from "../src/config.js";
import {
  SyntheticProviderCredentials,
  SyntheticProviderCredentialsLive,
} from "../src/live.layer.js";
import {
  layerAlchemyR2State,
  loadAlchemyR2StateConfig,
} from "../src/state/r2-state.js";

it.effect("decodes semantic command config at its executable ingress", () =>
  Effect.gen(function* testInfrastructureCommandConfig() {
    const input = yield* loadInfrastructureCommandConfig;
    assert.strictEqual(input.stack, "BundjilInfrastructure");
    assert.strictEqual(input.stage, "preview");
    assert.strictEqual(input.mode, "offline");
    assert.strictEqual(input.manifestPath, "tmp/adoption-preview.json");
    assert.strictEqual(
      input.manifestDigest,
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
  }).pipe(
    Effect.provideService(
      ConfigProvider.ConfigProvider,
      ConfigProvider.fromUnknown({
        BUNDJIL_INFRASTRUCTURE_MANIFEST_DIGEST:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        BUNDJIL_INFRASTRUCTURE_MANIFEST_PATH: "tmp/adoption-preview.json",
        BUNDJIL_INFRASTRUCTURE_STAGE: "preview",
      })
    )
  )
);

it.effect(
  "keeps provider credentials lazy and redacted until explicitly resolved",
  () =>
    Effect.gen(function* testLazySyntheticCredential() {
      const credential = yield* SyntheticProviderCredentials;
      const missing = yield* credential.pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(missing), true);
    }).pipe(
      Effect.provide(SyntheticProviderCredentialsLive),
      Effect.provideService(
        ConfigProvider.ConfigProvider,
        ConfigProvider.fromUnknown({})
      )
    )
);

it.effect("does not render a resolved credential value", () =>
  Effect.gen(function* testRedactedSyntheticCredential() {
    const credential = yield* SyntheticProviderCredentials;
    const resolved = yield* credential;
    assert.strictEqual(Redacted.isRedacted(resolved), true);
    assert.strictEqual(
      Inspectable.toStringUnknown(resolved).includes(
        "provider-secret-sentinel"
      ),
      false
    );
  }).pipe(
    Effect.provide(SyntheticProviderCredentialsLive),
    Effect.provideService(
      ConfigProvider.ConfigProvider,
      ConfigProvider.fromUnknown({
        BUNDJIL_INFRASTRUCTURE_SYNTHETIC_CREDENTIAL: "provider-secret-sentinel",
      })
    )
  )
);

it.effect(
  "decodes the dedicated R2 state identity with redacted credentials",
  () =>
    Effect.gen(function* testAlchemyR2StateConfig() {
      const config = yield* loadAlchemyR2StateConfig;
      assert.strictEqual(config.accountId, "f9f94270a4a5af8af7010d891020922d");
      assert.strictEqual(config.bucketName, "bundjil-alchemy-state");
      assert.strictEqual(config.prefix, "bundjil/v1");
      assert.strictEqual(Redacted.isRedacted(config.accessKeyId), true);
      assert.strictEqual(Redacted.isRedacted(config.secretAccessKey), true);
      assert.strictEqual(
        Inspectable.toStringUnknown(config).includes("r2-secret-sentinel"),
        false
      );
    }).pipe(
      Effect.provideService(
        ConfigProvider.ConfigProvider,
        ConfigProvider.fromUnknown({
          BUNDJIL_ALCHEMY_STATE_ACCESS_KEY_ID: "r2-access-sentinel",
          BUNDJIL_ALCHEMY_STATE_SECRET_ACCESS_KEY: "r2-secret-sentinel",
        })
      )
    )
);

it.effect("classifies missing R2 state config without exposing it", () =>
  Effect.gen(function* testMissingAlchemyR2StateConfig() {
    const exit = yield* State.pipe(
      Effect.provide(layerAlchemyR2State),
      Effect.exit
    );
    const rendered = Inspectable.toStringUnknown(exit);
    assert.strictEqual(Exit.isFailure(exit), true);
    assert.strictEqual(rendered.includes("configurationInvalid"), true);
    assert.strictEqual(rendered.includes("ConfigError"), false);
  }).pipe(
    Effect.provideService(
      ConfigProvider.ConfigProvider,
      ConfigProvider.fromUnknown({})
    )
  )
);

it.effect(
  "selects the isolated Preview Photon credential without requiring Production",
  () =>
    Effect.gen(function* testPreviewPhotonCredentials() {
      const config = yield* loadInfrastructurePhotonCredentials("preview");
      assert.strictEqual(config.projectId, "preview-photon-project");
      assert.strictEqual(Redacted.isRedacted(config.projectSecret), true);
      assert.strictEqual(
        Inspectable.toStringUnknown(config).includes(
          "preview-photon-secret-sentinel"
        ),
        false
      );
    }).pipe(
      Effect.provideService(
        ConfigProvider.ConfigProvider,
        ConfigProvider.fromUnknown({
          BUNDJIL_PHOTON_PREVIEW_PROJECT_ID: "preview-photon-project",
          BUNDJIL_PHOTON_PREVIEW_PROJECT_SECRET:
            "preview-photon-secret-sentinel",
        })
      )
    )
);

it.effect(
  "selects the source Production Photon credential without requiring Preview",
  () =>
    Effect.gen(function* testProductionPhotonCredentials() {
      const config = yield* loadInfrastructurePhotonCredentials("prod");
      assert.strictEqual(config.projectId, "production-photon-project");
      assert.strictEqual(Redacted.isRedacted(config.projectSecret), true);
      assert.strictEqual(
        Inspectable.toStringUnknown(config).includes(
          "production-photon-secret-sentinel"
        ),
        false
      );
    }).pipe(
      Effect.provideService(
        ConfigProvider.ConfigProvider,
        ConfigProvider.fromUnknown({
          BUNDJIL_PHOTON_MANAGEMENT_PROJECT_ID: "production-photon-project",
          BUNDJIL_PHOTON_MANAGEMENT_PROJECT_SECRET:
            "production-photon-secret-sentinel",
        })
      )
    )
);

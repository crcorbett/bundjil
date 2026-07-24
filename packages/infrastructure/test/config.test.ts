import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Exit, Inspectable, Redacted } from "effect";

import { loadInfrastructureCommandConfig } from "../src/config.js";
import {
  SyntheticProviderCredentials,
  SyntheticProviderCredentialsLive,
} from "../src/live.layer.js";

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

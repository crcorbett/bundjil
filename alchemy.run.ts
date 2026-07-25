// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */
/* oxlint-disable promise/prefer-await-to-then -- Effect.catch is an Effect combinator, not Promise.catch. */

import {
  AdoptionManifestJson,
  adoptionManifestProviderScopes,
  layerAlchemyR2State,
  layerLiveReadOnlyAdoptionProviders,
  loadInfrastructureCommandConfig,
} from "@bundjil/infrastructure";
import * as Alchemy from "alchemy";
import { Config, Effect, FileSystem, Schema } from "effect";

import { BundjilInfrastructureStack } from "./stacks/bundjil.js";

const failConfiguration = (message: string) =>
  Schema.decodeUnknownEffect(Schema.Never)(message).pipe(
    Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
  );

const loadAdoptionManifest = Effect.gen(
  function* loadAdoptionManifestOperation() {
    const input = yield* loadInfrastructureCommandConfig;
    if (
      input.mode === "offline" ||
      input.mode === "inventory" ||
      input.manifestPath === undefined ||
      input.manifestDigest === undefined
    ) {
      return yield* failConfiguration(
        "Provider-bound Alchemy commands require an adoption mode, manifest path, and observed digest."
      );
    }
    const fileSystem = yield* FileSystem.FileSystem;
    const metadata = yield* fileSystem
      .stat(input.manifestPath)
      .pipe(
        Effect.catch(() =>
          failConfiguration("The adoption manifest could not be inspected.")
        )
      );
    if (
      metadata.mode % 0o1000 !== 0o600 ||
      metadata.size > 2n * 1024n * 1024n
    ) {
      return yield* failConfiguration(
        "The adoption manifest must be an exact mode-0600 bounded artifact."
      );
    }
    const manifestText = yield* fileSystem
      .readFileString(input.manifestPath)
      .pipe(
        Effect.catch(() =>
          failConfiguration("The adoption manifest could not be read.")
        )
      );
    const manifest = yield* Schema.decodeUnknownEffect(AdoptionManifestJson)(
      manifestText,
      { onExcessProperty: "error" }
    ).pipe(
      Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
    );
    if (
      manifest.stage !== input.stage ||
      manifest.digest !== input.manifestDigest
    ) {
      return yield* failConfiguration(
        "The decoded adoption manifest does not match the configured stage and digest."
      );
    }
    return manifest;
  }
).pipe(Effect.withSpan("AdoptionManifest.load"));

export default loadAdoptionManifest.pipe(
  Effect.flatMap((manifest) =>
    adoptionManifestProviderScopes(manifest).pipe(
      Effect.catch(() =>
        failConfiguration(
          "The adoption manifest does not define the exact provider scopes."
        )
      ),
      Effect.flatMap((scopes) =>
        Alchemy.Stack(
          "BundjilInfrastructure",
          {
            providers: layerLiveReadOnlyAdoptionProviders(scopes),
            state: layerAlchemyR2State,
          },
          BundjilInfrastructureStack(manifest)
        )
      )
    )
  )
);

import { Config, Effect, FileSystem, Schema } from "effect";

import { AdoptionManifest, AdoptionManifestJson } from "./adoption-manifest.js";
import { loadInfrastructureCommandConfig } from "./config.js";
import { InfrastructureCommandInput } from "./schemas.js";

export const AdoptionCommand = Schema.Struct({
  input: InfrastructureCommandInput,
  manifest: AdoptionManifest,
});
export type AdoptionCommand = typeof AdoptionCommand.Type;
export type AdoptionCommandEncoded = typeof AdoptionCommand.Encoded;

const failAdoptionCommandConfiguration = (message: string) =>
  Schema.decodeUnknownEffect(Schema.Never)(message).pipe(
    Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
  );

export const loadAdoptionCommand = Effect.gen(
  function* loadAdoptionCommandOperation() {
    const input = yield* loadInfrastructureCommandConfig;
    if (
      input.mode === "offline" ||
      input.mode === "inventory" ||
      input.manifestPath === undefined ||
      input.manifestDigest === undefined
    ) {
      return yield* failAdoptionCommandConfiguration(
        "Provider-bound Alchemy commands require an adoption mode, manifest path, and observed digest."
      );
    }
    const fileSystem = yield* FileSystem.FileSystem;
    const metadata = yield* fileSystem
      .stat(input.manifestPath)
      .pipe(
        Effect.catch(() =>
          failAdoptionCommandConfiguration(
            "The adoption manifest could not be inspected."
          )
        )
      );
    if (
      metadata.mode % 0o1000 !== 0o600 ||
      metadata.size > 2n * 1024n * 1024n
    ) {
      return yield* failAdoptionCommandConfiguration(
        "The adoption manifest must be an exact mode-0600 bounded artifact."
      );
    }
    const manifestText = yield* fileSystem
      .readFileString(input.manifestPath)
      .pipe(
        Effect.catch(() =>
          failAdoptionCommandConfiguration(
            "The adoption manifest could not be read."
          )
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
      return yield* failAdoptionCommandConfiguration(
        "The decoded adoption manifest does not match the configured stage and digest."
      );
    }
    return AdoptionCommand.make({ input, manifest });
  }
).pipe(Effect.withSpan("AdoptionCommand.load"));

import { Config, Effect, Option } from "effect";

import {
  AdoptionManifestDigest,
  InfrastructureCommandInput,
  InfrastructureManifestPath,
  InfrastructureMode,
  InfrastructureStackName,
  InfrastructureStage,
} from "./schemas.js";

const infrastructureStackConfig = Config.schema(
  InfrastructureStackName,
  "BUNDJIL_INFRASTRUCTURE_STACK"
).pipe(
  Config.withDefault(InfrastructureStackName.make("BundjilInfrastructure"))
);

const infrastructureStageConfig = Config.schema(
  InfrastructureStage,
  "BUNDJIL_INFRASTRUCTURE_STAGE"
);

const infrastructureModeConfig = Config.schema(
  InfrastructureMode,
  "BUNDJIL_INFRASTRUCTURE_MODE"
).pipe(Config.withDefault("offline"));

const infrastructureManifestPathConfig = Config.schema(
  InfrastructureManifestPath,
  "BUNDJIL_INFRASTRUCTURE_MANIFEST_PATH"
).pipe(Config.option);

const infrastructureManifestDigestConfig = Config.schema(
  AdoptionManifestDigest,
  "BUNDJIL_INFRASTRUCTURE_MANIFEST_DIGEST"
).pipe(Config.option);

export const loadInfrastructureCommandConfig = Effect.gen(
  function* loadInfrastructureCommandConfigOperation() {
    const stack = yield* infrastructureStackConfig;
    const stage = yield* infrastructureStageConfig;
    const mode = yield* infrastructureModeConfig;
    const manifestPath = yield* infrastructureManifestPathConfig;
    const manifestDigest = yield* infrastructureManifestDigestConfig;

    const withPath = Option.match(manifestPath, {
      onNone: () => ({ stack, stage, mode }),
      onSome: (path) => ({ stack, stage, mode, manifestPath: path }),
    });
    return InfrastructureCommandInput.make({
      ...withPath,
      ...Option.match(manifestDigest, {
        onNone: () => ({}),
        onSome: (digest) => ({ manifestDigest: digest }),
      }),
    });
  }
).pipe(Effect.withSpan("InfrastructureCommandConfig.load"));

import {
  PhotonManagementCredentialsValue,
  PhotonProjectId,
  PhotonProjectSecret,
} from "@bundjil/photon/management";
import { Config, Effect, Match, Option } from "effect";

import {
  AdoptionManifestDigest,
  InfrastructureCommandInput,
  InfrastructureManifestPath,
  InfrastructureMode,
  InfrastructureStackName,
  InfrastructureStage,
} from "./schemas.js";
import type { InfrastructureStage as InfrastructureStageType } from "./schemas.js";

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

const previewPhotonCredentials = Config.all({
  projectId: Config.schema(
    PhotonProjectId,
    "BUNDJIL_PHOTON_PREVIEW_PROJECT_ID"
  ),
  projectSecret: Config.schema(
    PhotonProjectSecret,
    "BUNDJIL_PHOTON_PREVIEW_PROJECT_SECRET"
  ),
});

const productionPhotonCredentials = Config.all({
  projectId: Config.schema(
    PhotonProjectId,
    "BUNDJIL_PHOTON_MANAGEMENT_PROJECT_ID"
  ),
  projectSecret: Config.schema(
    PhotonProjectSecret,
    "BUNDJIL_PHOTON_MANAGEMENT_PROJECT_SECRET"
  ),
});

export const loadInfrastructurePhotonCredentials = Effect.fn(
  "InfrastructurePhotonCredentials.load"
)((stage: InfrastructureStageType) =>
  Match.value(stage).pipe(
    Match.when("preview", () =>
      previewPhotonCredentials.pipe(
        Effect.map((credentials) =>
          PhotonManagementCredentialsValue.make(credentials)
        )
      )
    ),
    Match.when("prod", () =>
      productionPhotonCredentials.pipe(
        Effect.map((credentials) =>
          PhotonManagementCredentialsValue.make(credentials)
        )
      )
    ),
    Match.exhaustive
  )
);

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

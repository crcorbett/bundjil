import { createHash } from "node:crypto";
import { dirname, isAbsolute } from "node:path";

import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  Exit,
  FileSystem,
  HashSet,
  Layer,
  Schema,
} from "effect";

import {
  AdoptionManifestDigest,
  AdoptionManifestJson,
  AlchemyLogicalResourceId,
  InfrastructureInventoryArtifactJson,
  reAdmitAdoptionManifest,
} from "../src/index.js";

declare const process: {
  exitCode: number | undefined;
};

const ReadmissionArtifactPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "Re-admission artifact path must be a safe repository-relative path."
    )
  ),
  Schema.brand("@bundjil/infrastructure/ReadmissionArtifactPath")
);

const ReadmissionEvidence = Schema.Struct({
  schemaVersion: Schema.Literal("1"),
  baseManifestDigest: AdoptionManifestDigest,
  inventoryManifestDigest: Schema.String.pipe(
    Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/))
  ),
  logicalIds: Schema.NonEmptyArray(AlchemyLogicalResourceId),
});

const ReadmissionCommandFailureReason = Schema.Literals([
  "artifactPathConflict",
  "baseArtifactInvalid",
  "inventoryArtifactInvalid",
]);
class ReadmissionCommandError extends Schema.TaggedErrorClass<ReadmissionCommandError>()(
  "ReadmissionCommandError",
  { reason: ReadmissionCommandFailureReason }
) {}

const basePathConfig = Config.schema(
  ReadmissionArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_READMISSION_BASE_PATH"
);
const inventoryPathConfig = Config.schema(
  ReadmissionArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_INVENTORY_PATH"
);
const outputPathConfig = Config.schema(
  ReadmissionArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_READMISSION_OUTPUT_PATH"
);
const logicalIdsConfig = Config.schema(
  Schema.fromJsonString(Schema.NonEmptyArray(AlchemyLogicalResourceId)),
  "BUNDJIL_INFRASTRUCTURE_READMISSION_LOGICAL_IDS_JSON"
);

const reAdmitManifest = Effect.gen(function* reAdmitManifestOperation() {
  const basePath = yield* basePathConfig;
  const inventoryPath = yield* inventoryPathConfig;
  const outputPath = yield* outputPathConfig;
  const logicalIds = yield* Schema.decodeUnknownEffect(
    Schema.NonEmptyArray(AlchemyLogicalResourceId)
  )([...(yield* logicalIdsConfig)].toSorted());
  if (
    HashSet.size(
      HashSet.fromIterable([basePath, inventoryPath, outputPath])
    ) !== 3
  ) {
    return yield* new ReadmissionCommandError({
      reason: "artifactPathConflict",
    });
  }
  const fileSystem = yield* FileSystem.FileSystem;
  const baseMetadata = yield* fileSystem.stat(basePath);
  if (
    baseMetadata.mode % 0o1000 !== 0o600 ||
    baseMetadata.size > 2n * 1024n * 1024n
  ) {
    return yield* new ReadmissionCommandError({
      reason: "baseArtifactInvalid",
    });
  }
  const inventoryMetadata = yield* fileSystem.stat(inventoryPath);
  if (
    inventoryMetadata.mode % 0o1000 !== 0o600 ||
    inventoryMetadata.size > 2n * 1024n * 1024n
  ) {
    return yield* new ReadmissionCommandError({
      reason: "inventoryArtifactInvalid",
    });
  }
  const base = yield* Schema.decodeUnknownEffect(AdoptionManifestJson)(
    yield* fileSystem.readFileString(basePath),
    { onExcessProperty: "error" }
  );
  const inventory = yield* Schema.decodeUnknownEffect(
    InfrastructureInventoryArtifactJson
  )(yield* fileSystem.readFileString(inventoryPath), {
    onExcessProperty: "error",
  });
  const evidence = yield* Schema.encodeEffect(
    Schema.fromJsonString(ReadmissionEvidence)
  )({
    schemaVersion: "1",
    baseManifestDigest: base.digest,
    inventoryManifestDigest: inventory.manifestDigest,
    logicalIds,
  });
  const digest = yield* Schema.decodeUnknownEffect(AdoptionManifestDigest)(
    createHash("sha256").update(evidence).digest("hex")
  );
  const manifest = yield* reAdmitAdoptionManifest(base, inventory, {
    digest,
    logicalIds,
  });
  const manifestText =
    yield* Schema.encodeEffect(AdoptionManifestJson)(manifest);
  yield* fileSystem.makeDirectory(dirname(outputPath), {
    recursive: true,
    mode: 0o700,
  });
  yield* fileSystem.writeFileString(outputPath, manifestText, { mode: 0o600 });
  yield* fileSystem.chmod(outputPath, 0o600);
  return {
    status: "generated",
    stage: manifest.stage,
    digest: manifest.digest,
    resourceCount: manifest.resources.length,
    reAdmittedCount: logicalIds.length,
    providerWrites: 0,
  } as const;
});

const main = Effect.exit(reAdmitManifest).pipe(
  Effect.flatMap((exit) =>
    Exit.isSuccess(exit)
      ? Console.log(exit.value)
      : Console.error('{"status":"blocked"}').pipe(
          Effect.andThen(
            Effect.sync(() => {
              process.exitCode = 1;
            })
          )
        )
  ),
  Effect.provide(
    Layer.mergeAll(
      BunFileSystem.layer,
      ConfigProvider.layer(ConfigProvider.fromEnv())
    )
  )
);

await Effect.runPromise(main);

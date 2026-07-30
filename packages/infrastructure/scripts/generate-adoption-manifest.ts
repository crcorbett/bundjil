import { dirname, isAbsolute } from "node:path";

import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  Exit,
  FileSystem,
  Layer,
  Schema,
} from "effect";

import {
  AdoptionBindingProfile,
  AdoptionManifestJson,
  buildAdoptionManifest,
  InfrastructureInventoryArtifactJson,
} from "../src/index.js";

declare const process: {
  exitCode: number | undefined;
};

const AdoptionArtifactPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "Adoption artifact path must be a safe repository-relative path."
    )
  ),
  Schema.brand("@bundjil/infrastructure/AdoptionArtifactPath")
);

const inventoryPathConfig = Config.schema(
  AdoptionArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_INVENTORY_PATH"
);
const adoptionPathConfig = Config.schema(
  AdoptionArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_ADOPTION_PATH"
);
const bindingProfileConfig = Config.schema(
  AdoptionBindingProfile,
  "BUNDJIL_INFRASTRUCTURE_BINDING_PROFILE"
).pipe(Config.withDefault("observedOnly"));

const generateAdoptionManifest = Effect.gen(
  function* generateAdoptionManifestOperation() {
    const inventoryPath = yield* inventoryPathConfig;
    const adoptionPath = yield* adoptionPathConfig;
    const bindingProfile = yield* bindingProfileConfig;
    if (inventoryPath === adoptionPath) {
      return yield* Effect.fail("adoption-path-conflicts-with-inventory");
    }
    const fileSystem = yield* FileSystem.FileSystem;
    const inventoryMetadata = yield* fileSystem.stat(inventoryPath);
    if (
      inventoryMetadata.mode % 0o1000 !== 0o600 ||
      inventoryMetadata.size > 2n * 1024n * 1024n
    ) {
      return yield* Effect.fail("inventory-artifact-invalid");
    }
    const inventoryText = yield* fileSystem.readFileString(inventoryPath);
    const inventory = yield* Schema.decodeUnknownEffect(
      InfrastructureInventoryArtifactJson
    )(inventoryText, { onExcessProperty: "error" });
    const manifest = yield* buildAdoptionManifest(inventory, bindingProfile);
    const manifestText =
      yield* Schema.encodeEffect(AdoptionManifestJson)(manifest);
    yield* fileSystem.makeDirectory(dirname(adoptionPath), {
      recursive: true,
      mode: 0o700,
    });
    yield* fileSystem.writeFileString(adoptionPath, manifestText, {
      mode: 0o600,
    });
    yield* fileSystem.chmod(adoptionPath, 0o600);
    return {
      status: "generated",
      stage: manifest.stage,
      digest: manifest.digest,
      resourceCount: manifest.resources.length,
      providerWrites: 0,
    } as const;
  }
);

const main = Effect.exit(generateAdoptionManifest).pipe(
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

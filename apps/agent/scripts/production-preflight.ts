import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  FileSystem,
  Schema,
} from "effect";

import {
  preflightProductionPromotion,
  ProductionPreflightEvidence,
  ProductionPreflightError,
  ProductionPreflightSnapshot,
  ProductionPreflightSnapshotPath,
} from "../agent/production-preflight.js";

const snapshotPath = Config.schema(
  ProductionPreflightSnapshotPath,
  "BUNDJIL_PRODUCTION_PREFLIGHT_SNAPSHOT"
);

await Effect.runPromise(
  Effect.gen(function* productionPreflightCommand() {
    const path = yield* snapshotPath;
    const fileSystem = yield* FileSystem.FileSystem;
    const metadata = yield* fileSystem.stat(path).pipe(
      Effect.mapError(
        () =>
          new ProductionPreflightError({
            message:
              "Unable to read the Production preflight metadata snapshot.",
          })
      )
    );

    if (metadata.mode % 0o1000 !== 0o600) {
      return yield* Effect.fail(
        new ProductionPreflightError({
          message: "Production preflight metadata must have mode 0600.",
        })
      );
    }

    const content = yield* fileSystem.readFileString(path).pipe(
      Effect.mapError(
        () =>
          new ProductionPreflightError({
            message:
              "Unable to read the Production preflight metadata snapshot.",
          })
      )
    );
    const snapshot = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(ProductionPreflightSnapshot),
      { onExcessProperty: "error" }
    )(content);
    const evidence = yield* preflightProductionPromotion(snapshot);

    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(ProductionPreflightEvidence)
    )(evidence);
    return yield* Console.log(output);
  }).pipe(
    Effect.provide(BunFileSystem.layer),
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
  )
);

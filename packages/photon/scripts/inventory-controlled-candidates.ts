import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { ConfigProvider, Console, Effect, Exit, Layer, Schema } from "effect";

import {
  layerPhotonCandidateInventoryLive,
  loadSelectedPhotonCandidateFingerprint,
  PhotonCandidateInventory,
  PhotonCandidateInventoryReceipt,
} from "../src/candidate-inventory.js";

declare const process: {
  exitCode: number | undefined;
};

const PhotonCandidateInventorySuccess = Schema.Struct({
  receipt: PhotonCandidateInventoryReceipt,
});

const PhotonCandidateInventoryBlocked = Schema.Struct({
  status: Schema.Literal("blocked"),
});

const command = Effect.gen(function* inventoryControlledPhotonCandidates() {
  const selectedCandidateFingerprint =
    yield* loadSelectedPhotonCandidateFingerprint;
  const inventory = yield* PhotonCandidateInventory;
  return yield* inventory.captureCandidateInventory({
    selectedCandidateFingerprint,
  });
});

const runtime = Layer.merge(
  ConfigProvider.layer(ConfigProvider.fromEnv()),
  layerPhotonCandidateInventoryLive.pipe(Layer.provide(BunHttpClient.layer))
);

const runnable = command.pipe(Effect.provide(runtime));

const main = Effect.gen(function* renderPhotonCandidateInventory() {
  const exit = yield* Effect.exit(runnable);
  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(PhotonCandidateInventorySuccess)
    )({ receipt: exit.value });
    return yield* Console.log(output);
  }
  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(PhotonCandidateInventoryBlocked)
  )({ status: "blocked" });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

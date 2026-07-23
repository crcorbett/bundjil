import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { ConfigProvider, Console, Effect, Exit, Layer, Schema } from "effect";

import { layerPhotonManagementLive } from "../src/management.js";
import { loadPhotonProviderProofConfig } from "../src/provider-proof.js";
import {
  loadPhotonResourceReconciliationMode,
  loadPhotonSharedUserPhoneNumber,
  PhotonResourceReconciliationReceipt,
  reconcilePhotonResources,
} from "../src/resource-reconciliation.js";

declare const process: {
  exitCode: number | undefined;
};

const PhotonResourceReconciliationSuccess = Schema.Struct({
  receipt: PhotonResourceReconciliationReceipt,
});

const PhotonResourceReconciliationBlocked = Schema.Struct({
  status: Schema.Literal("blocked"),
});

const command = Effect.gen(function* reconcilePhotonResourcesCommand() {
  const config = yield* loadPhotonProviderProofConfig;
  const mode = yield* loadPhotonResourceReconciliationMode;
  const sharedUserPhoneNumber =
    mode === "reconcile-shared-user"
      ? yield* loadPhotonSharedUserPhoneNumber
      : undefined;
  return yield* reconcilePhotonResources(mode, sharedUserPhoneNumber).pipe(
    Effect.provide(
      layerPhotonManagementLive(config.projectId, config.projectSecret).pipe(
        Layer.provide(BunHttpClient.layer)
      )
    )
  );
}).pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv())));

const main = Effect.gen(function* renderPhotonResourceReconciliation() {
  const exit = yield* Effect.exit(command);
  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(PhotonResourceReconciliationSuccess)
    )({ receipt: exit.value });
    return yield* Console.log(output);
  }
  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(PhotonResourceReconciliationBlocked)
  )({ status: "blocked" });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

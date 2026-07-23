import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { ConfigProvider, Console, Effect, Exit, Layer, Schema } from "effect";

import { layerPhotonLifecycleProbeLive } from "../src/lifecycle-probe.js";
import { layerPhotonManagementLive } from "../src/management.js";
import {
  loadPhotonProviderProofConfig,
  PhotonProviderProofReceipt,
  provePhotonProvider,
} from "../src/provider-proof.js";

declare const process: {
  exitCode: number | undefined;
};

const PhotonProviderProofSuccess = Schema.Struct({
  receipt: PhotonProviderProofReceipt,
});

const PhotonProviderProofBlocked = Schema.Struct({
  status: Schema.Literal("blocked"),
});

const command = Effect.gen(function* provePhotonProviderCommand() {
  const config = yield* loadPhotonProviderProofConfig;
  const proofWebhookUrl = new URL(
    "/bundjil-photon-provider-proof",
    "https://example.invalid"
  );
  return yield* provePhotonProvider(
    config.projectId,
    config.projectSecret,
    proofWebhookUrl
  ).pipe(
    Effect.provide(
      Layer.merge(
        layerPhotonManagementLive(config.projectId, config.projectSecret).pipe(
          Layer.provide(BunHttpClient.layer)
        ),
        layerPhotonLifecycleProbeLive
      )
    )
  );
}).pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv())));

const main = Effect.gen(function* renderPhotonProviderProof() {
  const exit = yield* Effect.exit(command);
  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(PhotonProviderProofSuccess)
    )({ receipt: exit.value });
    return yield* Console.log(output);
  }
  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(PhotonProviderProofBlocked)
  )({ status: "blocked" });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

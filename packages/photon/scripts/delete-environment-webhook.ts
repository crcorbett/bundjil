import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  Exit,
  Layer,
  Schema,
} from "effect";

import {
  deletePhotonEnvironmentWebhook,
  PhotonEnvironmentWebhookDeletionReceipt,
} from "../src/environment-webhook.js";
import { layerPhotonManagementLive } from "../src/management.js";
import { loadPhotonProviderProofConfig } from "../src/provider-proof.js";

declare const process: { exitCode: number | undefined };

const PhotonEnvironmentWebhookDeletionSuccess = Schema.Struct({
  receipt: PhotonEnvironmentWebhookDeletionReceipt,
});

const PhotonEnvironmentWebhookDeletionBlocked = Schema.Struct({
  status: Schema.Literal("blocked"),
});

const command = Effect.gen(function* deleteEnvironmentWebhookCommand() {
  const config = yield* loadPhotonProviderProofConfig;
  const webhookUrl = yield* Config.schema(
    Schema.URLFromString,
    "BUNDJIL_PHOTON_WEBHOOK_URL"
  );
  return yield* deletePhotonEnvironmentWebhook(webhookUrl).pipe(
    Effect.provide(
      layerPhotonManagementLive(config.projectId, config.projectSecret).pipe(
        Layer.provide(BunHttpClient.layer)
      )
    )
  );
}).pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv())));

const main = Effect.gen(function* renderEnvironmentWebhookDeletionResult() {
  const exit = yield* Effect.exit(command);
  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(PhotonEnvironmentWebhookDeletionSuccess)
    )({ receipt: exit.value });
    return yield* Console.log(output);
  }
  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(PhotonEnvironmentWebhookDeletionBlocked)
  )({ status: "blocked" });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

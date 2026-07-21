import { dirname, isAbsolute } from "node:path";

import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  Exit,
  FileSystem,
  Layer,
  Redacted,
  Schema,
} from "effect";

import {
  PhotonEnvironmentWebhookReceipt,
  registerPhotonEnvironmentWebhook,
} from "../src/environment-webhook.js";
import {
  layerPhotonManagementLive,
  PhotonManagement,
} from "../src/management.js";
import { PhotonProviderProofError } from "../src/provider-proof.error.js";
import { loadPhotonProviderProofConfig } from "../src/provider-proof.js";
import { PhotonWebhookId } from "../src/schemas.js";

declare const process: { exitCode: number | undefined };

const PhotonWebhookBindingPath = Schema.NonEmptyString.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      isAbsolute(value) ? undefined : "Binding path must be absolute."
    )
  ),
  Schema.brand("@bundjil/photon/PhotonWebhookBindingPath")
);

const PhotonWebhookBindingFile = Schema.Struct({
  webhookId: PhotonWebhookId,
  webhookSecret: Schema.NonEmptyString,
});

const PhotonEnvironmentWebhookSuccess = Schema.Struct({
  bindingPersisted: Schema.Literal(true),
  receipt: PhotonEnvironmentWebhookReceipt,
});

const PhotonEnvironmentWebhookBlocked = Schema.Struct({
  status: Schema.Literal("blocked"),
});

const command = Effect.gen(function* registerEnvironmentWebhookCommand() {
  const config = yield* loadPhotonProviderProofConfig;
  const webhookUrl = yield* Config.schema(
    Schema.URLFromString,
    "BUNDJIL_PHOTON_WEBHOOK_URL"
  );
  const bindingPath = yield* Config.schema(
    PhotonWebhookBindingPath,
    "BUNDJIL_PHOTON_WEBHOOK_BINDING_PATH"
  );
  const fileSystem = yield* FileSystem.FileSystem;
  if (yield* fileSystem.exists(bindingPath)) {
    return yield* new PhotonProviderProofError({
      operation: "writeWebhookBinding",
      reason: "resourceConflict",
    });
  }

  const result = yield* registerPhotonEnvironmentWebhook(webhookUrl).pipe(
    Effect.provide(
      layerPhotonManagementLive(config.projectId, config.projectSecret).pipe(
        Layer.provide(BunHttpClient.layer)
      )
    )
  );
  const webhookSecret = Redacted.value(result.binding.webhookSecret);
  const binding = yield* Schema.encodeEffect(
    Schema.fromJsonString(PhotonWebhookBindingFile)
  )({
    webhookId: result.binding.webhookId,
    webhookSecret,
  });
  const persisted = yield* Effect.exit(
    fileSystem
      .makeDirectory(dirname(bindingPath), {
        mode: 0o700,
        recursive: true,
      })
      .pipe(
        Effect.andThen(
          fileSystem.writeFileString(bindingPath, binding, { mode: 0o600 })
        ),
        Effect.andThen(fileSystem.chmod(bindingPath, 0o600)),
        Effect.andThen(fileSystem.readFileString(bindingPath)),
        Effect.flatMap(
          Schema.decodeUnknownEffect(
            Schema.fromJsonString(PhotonWebhookBindingFile)
          )
        )
      )
  );
  if (
    Exit.isFailure(persisted) ||
    persisted.value.webhookId !== result.binding.webhookId ||
    persisted.value.webhookSecret !== webhookSecret
  ) {
    yield* fileSystem.remove(bindingPath).pipe(Effect.catch(() => Effect.void));
    const management = yield* PhotonManagement.pipe(
      Effect.provide(
        layerPhotonManagementLive(config.projectId, config.projectSecret).pipe(
          Layer.provide(BunHttpClient.layer)
        )
      )
    );
    yield* management.deleteWebhook(result.binding.webhookId);
    return yield* new PhotonProviderProofError({
      operation: "writeWebhookBinding",
      reason: "requestFailed",
    });
  }

  return result.receipt;
}).pipe(
  Effect.provide(
    Layer.merge(
      BunFileSystem.layer,
      ConfigProvider.layer(ConfigProvider.fromEnv())
    )
  )
);

const main = Effect.gen(function* renderEnvironmentWebhookResult() {
  const exit = yield* Effect.exit(command);
  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(PhotonEnvironmentWebhookSuccess)
    )({ bindingPersisted: true, receipt: exit.value });
    return yield* Console.log(output);
  }
  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(PhotonEnvironmentWebhookBlocked)
  )({ status: "blocked" });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

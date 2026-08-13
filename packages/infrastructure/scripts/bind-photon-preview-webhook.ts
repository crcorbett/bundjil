import { isAbsolute } from "node:path";

import {
  PhotonProjectId,
  PhotonProjectSecret,
  PhotonWebhookId,
} from "@bundjil/photon/config";
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
  Option,
  Redacted,
  Schema,
} from "effect";

import {
  layerPhotonWebhookBindingSinkLive,
  PhotonProjectIdEnvironmentKey,
  PhotonProjectSecretEnvironmentKey,
  PhotonWebhookBindingSink,
  PhotonWebhookBindingWrite,
  PhotonWebhookIdEnvironmentKey,
  PhotonWebhookSecretEnvironmentKey,
} from "../src/photon/index.js";
import {
  ListVercelEnvironmentVariables,
  VercelCredentialsLive,
  VercelEnvironmentVariables,
  VercelLive,
  VercelProjectId,
  VercelTeamId,
} from "../src/vercel/index.js";
import type { VercelEnvironmentVariableAttributes } from "../src/vercel/index.js";

declare const process: {
  exitCode: number | undefined;
};

const PhotonWebhookBindingPath = Schema.NonEmptyString.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      isAbsolute(value) ? undefined : "Binding path must be absolute."
    )
  ),
  Schema.brand("@bundjil/infrastructure/PhotonWebhookBindingPath")
);

const PhotonWebhookBindingFile = Schema.Struct({
  webhookId: PhotonWebhookId,
  webhookSecret: Schema.NonEmptyString,
});

const PhotonPreviewWebhookBindingReceipt = Schema.Union([
  Schema.Struct({
    environmentBindingCount: Schema.Literal(4),
    secretReferencePersisted: Schema.Literal(true),
    sourceBindingRemoved: Schema.Literal(true),
    status: Schema.Literal("bound"),
  }),
  Schema.Struct({
    environmentBindingCount: Schema.Literal(4),
    secretReferencePersisted: Schema.Literal(true),
    sourceBindingRemoved: Schema.Literal(false),
    status: Schema.Literals([
      "cutoverPendingIngress",
      "recoveredPendingIngress",
    ]),
  }),
]);

const PhotonPreviewWebhookBindingSuccess = Schema.Struct({
  receipt: PhotonPreviewWebhookBindingReceipt,
});

const PhotonPreviewWebhookBindingBlocked = Schema.Struct({
  status: Schema.Literal("blocked"),
});
const PhotonPreviewWebhookBindingFailureReason = Schema.Literals([
  "bindingAlreadyPresent",
  "bindingFileInvalid",
  "bindingFileRetained",
  "bindingReadbackInvalid",
]);
class PhotonPreviewWebhookBindingError extends Schema.TaggedErrorClass<PhotonPreviewWebhookBindingError>()(
  "PhotonPreviewWebhookBindingError",
  { reason: PhotonPreviewWebhookBindingFailureReason }
) {}

const bindingPathConfig = Config.schema(
  PhotonWebhookBindingPath,
  "BUNDJIL_PHOTON_WEBHOOK_BINDING_PATH"
);
const teamIdConfig = Config.schema(
  VercelTeamId,
  "BUNDJIL_PHOTON_BINDING_VERCEL_TEAM_ID"
);
const vercelProjectIdConfig = Config.schema(
  VercelProjectId,
  "BUNDJIL_PHOTON_BINDING_VERCEL_PROJECT_ID"
);
const photonProjectIdConfig = Config.schema(
  PhotonProjectId,
  "BUNDJIL_PHOTON_PREVIEW_PROJECT_ID"
);
const photonProjectSecretConfig = Config.schema(
  PhotonProjectSecret,
  "BUNDJIL_PHOTON_PREVIEW_PROJECT_SECRET"
);
const recoveryModeConfig = Config.schema(
  Schema.Literals(["signedIngressMismatch", "stableCallbackCutover"]),
  "BUNDJIL_PHOTON_BINDING_RECOVERY_MODE"
).pipe(Config.option);

const requiredKeys = [
  PhotonProjectIdEnvironmentKey,
  PhotonProjectSecretEnvironmentKey,
  PhotonWebhookIdEnvironmentKey,
  PhotonWebhookSecretEnvironmentKey,
] as const;

const exactPhotonBindings = (
  environmentVariables: readonly VercelEnvironmentVariableAttributes[]
) =>
  environmentVariables.filter((candidate) =>
    requiredKeys.some((key) => key === candidate.key)
  );

const isExactPreviewBindingMetadata = (
  bindings: readonly VercelEnvironmentVariableAttributes[]
) =>
  bindings.length === requiredKeys.length &&
  requiredKeys.every(
    (key) => bindings.filter((candidate) => candidate.key === key).length === 1
  ) &&
  bindings.every(
    (candidate) =>
      candidate.sensitive &&
      candidate.targets.length === 1 &&
      candidate.targets[0] === "preview"
  );

const command = Effect.gen(function* bindPhotonPreviewWebhook() {
  const bindingPath = yield* bindingPathConfig;
  const teamId = yield* teamIdConfig;
  const vercelProjectId = yield* vercelProjectIdConfig;
  const photonProjectId = yield* photonProjectIdConfig;
  const projectSecret = yield* photonProjectSecretConfig;
  const recoveryMode = yield* recoveryModeConfig;
  const fileSystem = yield* FileSystem.FileSystem;
  const metadata = yield* fileSystem.stat(bindingPath);
  if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 16n * 1024n) {
    return yield* new PhotonPreviewWebhookBindingError({
      reason: "bindingFileInvalid",
    });
  }
  const binding = yield* fileSystem
    .readFileString(bindingPath)
    .pipe(
      Effect.flatMap(
        Schema.decodeUnknownEffect(
          Schema.fromJsonString(PhotonWebhookBindingFile)
        )
      )
    );

  const environmentVariables = yield* VercelEnvironmentVariables;
  const before = yield* environmentVariables.listEnvironmentVariables(
    ListVercelEnvironmentVariables.make({
      stage: "preview",
      teamId,
      projectId: vercelProjectId,
    })
  );
  const existingBindings = exactPhotonBindings(before.environmentVariables);
  const isInitialBinding = existingBindings.length === 0;
  const isAuthorizedExistingBindingWrite =
    Option.isSome(recoveryMode) &&
    isExactPreviewBindingMetadata(existingBindings);
  if (!isInitialBinding && !isAuthorizedExistingBindingWrite) {
    return yield* new PhotonPreviewWebhookBindingError({
      reason: "bindingAlreadyPresent",
    });
  }

  const sink = yield* PhotonWebhookBindingSink;
  yield* sink.persistPreviewWebhookBinding(
    PhotonWebhookBindingWrite.make({
      stage: "preview",
      teamId,
      vercelProjectId,
      photonProjectId,
      projectSecret,
      webhookId: binding.webhookId,
      signingSecret: Redacted.make(binding.webhookSecret),
    })
  );

  const observed = yield* environmentVariables.listEnvironmentVariables(
    ListVercelEnvironmentVariables.make({
      stage: "preview",
      teamId,
      projectId: vercelProjectId,
    })
  );
  const exactBindings = exactPhotonBindings(observed.environmentVariables);
  if (!isExactPreviewBindingMetadata(exactBindings)) {
    return yield* new PhotonPreviewWebhookBindingError({
      reason: "bindingReadbackInvalid",
    });
  }

  if (isAuthorizedExistingBindingWrite) {
    return PhotonPreviewWebhookBindingReceipt.make({
      environmentBindingCount: 4,
      secretReferencePersisted: true,
      sourceBindingRemoved: false,
      status: Option.exists(
        recoveryMode,
        (mode) => mode === "stableCallbackCutover"
      )
        ? "cutoverPendingIngress"
        : "recoveredPendingIngress",
    });
  }

  yield* fileSystem.remove(bindingPath);
  if (yield* fileSystem.exists(bindingPath)) {
    return yield* new PhotonPreviewWebhookBindingError({
      reason: "bindingFileRetained",
    });
  }
  return PhotonPreviewWebhookBindingReceipt.make({
    environmentBindingCount: 4,
    secretReferencePersisted: true,
    sourceBindingRemoved: true,
    status: "bound",
  });
});

const vercelRuntime = VercelLive.pipe(
  Layer.provideMerge(VercelCredentialsLive),
  Layer.provide(BunHttpClient.layer)
);
const runtime = Layer.mergeAll(
  BunFileSystem.layer,
  ConfigProvider.layer(ConfigProvider.fromEnv()),
  layerPhotonWebhookBindingSinkLive.pipe(Layer.provide(BunHttpClient.layer)),
  vercelRuntime
);

const main = Effect.gen(function* renderPhotonPreviewWebhookBinding() {
  const exit = yield* Effect.exit(command.pipe(Effect.provide(runtime)));
  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(PhotonPreviewWebhookBindingSuccess)
    )({ receipt: exit.value });
    return yield* Console.log(output);
  }
  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(PhotonPreviewWebhookBindingBlocked)
  )({ status: "blocked" });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

import { dirname, isAbsolute } from "node:path";

import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import { Ajv2020 } from "ajv/dist/2020.js";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  Exit,
  FileSystem,
  Layer,
  Match,
  Redacted,
  Schema,
} from "effect";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import productionWebhookCutoverAuthorityPolicy from "../schemas/production-webhook-cutover-authority.schema.json" with { type: "json" };
import {
  PhotonEnvironmentWebhookReceipt,
  registerPhotonEnvironmentWebhook,
} from "../src/environment-webhook.js";
import {
  layerPhotonManagementLive,
  PhotonManagement,
} from "../src/operator-management.js";
import { PhotonProviderProofError } from "../src/provider-proof.error.js";
import { loadPhotonEnvironmentWebhookProviderConfig } from "../src/provider-proof.js";
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

const PhotonWebhookAuthorityPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "Photon webhook authority path must be safe and repository-relative."
    )
  )
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
  const stage = yield* Config.schema(
    Schema.Literals(["preview", "prod"]),
    "BUNDJIL_PHOTON_WEBHOOK_STAGE"
  ).pipe(Config.withDefault("preview"));
  const webhookUrl = yield* Config.schema(
    Schema.URLFromString,
    "BUNDJIL_PHOTON_WEBHOOK_URL"
  );
  const bindingPath = yield* Config.schema(
    PhotonWebhookBindingPath,
    "BUNDJIL_PHOTON_WEBHOOK_BINDING_PATH"
  );
  const fileSystem = yield* FileSystem.FileSystem;
  yield* Match.value(stage).pipe(
    Match.when("preview", () => Effect.void),
    Match.when("prod", () =>
      Effect.gen(function* validateProductionWebhookAuthority() {
        const authorityPath = yield* Config.schema(
          PhotonWebhookAuthorityPath,
          "BUNDJIL_PHOTON_WEBHOOK_AUTHORITY_PATH"
        );
        const metadata = yield* fileSystem.stat(authorityPath);
        if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 64n * 1024n) {
          return yield* new PhotonProviderProofError({
            operation: "assert",
            reason: "requestFailed",
          });
        }
        const authority = yield* fileSystem
          .readFileString(authorityPath)
          .pipe(
            Effect.flatMap(
              Schema.decodeUnknownEffect(Schema.fromJsonString(Schema.Unknown))
            )
          );
        const options = {
          allErrors: true,
          strict: false,
          validateFormats: false,
        } as const;
        if (
          !new Ajv2020(options).compile(authorityEnvelopeSchema)(authority) ||
          !new Ajv2020(options).compile(
            productionWebhookCutoverAuthorityPolicy
          )(authority)
        ) {
          return yield* new PhotonProviderProofError({
            operation: "assert",
            reason: "requestFailed",
          });
        }
        return yield* Effect.void;
      })
    ),
    Match.exhaustive
  );
  if (yield* fileSystem.exists(bindingPath)) {
    return yield* new PhotonProviderProofError({
      operation: "writeWebhookBinding",
      reason: "resourceConflict",
    });
  }

  const config = yield* loadPhotonEnvironmentWebhookProviderConfig;
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

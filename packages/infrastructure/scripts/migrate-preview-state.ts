import { createHash } from "node:crypto";
import { dirname, isAbsolute } from "node:path";

import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
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
import boundedReceiptSchema from "../../../.agents/skills/docs-maintainer/assets/harness/bounded-receipt.schema.json" with { type: "json" };
import migrationAuthorityPolicy from "../schemas/preview-state-migration-authority.schema.json" with { type: "json" };
import {
  AdoptionManifestJson,
  InfrastructureArtifactDigest,
  InfrastructureBoundedReceipt,
  InfrastructureBoundedReceiptJson,
  layerAlchemyR2State,
  loadAlchemyR2StateConfig,
  loadInfrastructurePhotonCredentials,
  makePreviewStateBackupStoreLive,
  PreviewStateBackupPath,
  PreviewStateForbiddenValue,
  PreviewStateMigration,
  PreviewStateMigrationLive,
} from "../src/index.js";
import { VercelAccessToken } from "../src/vercel/index.js";

declare const process: {
  exitCode: number | undefined;
};

const PreviewStateMigrationPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "Preview state migration paths must be repository-relative and bounded."
    )
  ),
  Schema.brand("@bundjil/infrastructure/PreviewStateMigrationPath")
);

const PreviewStateMigrationMode = Schema.Literals(["plan", "apply", "restore"]);
const PreviewStateMigrationCandidate = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(240)),
  Schema.brand("@bundjil/infrastructure/PreviewStateMigrationCandidate")
);

const authorityPathConfig = Config.schema(
  PreviewStateMigrationPath,
  "BUNDJIL_PREVIEW_STATE_MIGRATION_AUTHORITY_PATH"
);
const manifestPathConfig = Config.schema(
  PreviewStateMigrationPath,
  "BUNDJIL_INFRASTRUCTURE_ADOPTION_PATH"
);
const backupPathConfig = Config.schema(
  PreviewStateBackupPath,
  "BUNDJIL_PREVIEW_STATE_MIGRATION_BACKUP_PATH"
);
const receiptPathConfig = Config.schema(
  PreviewStateMigrationPath,
  "BUNDJIL_PREVIEW_STATE_MIGRATION_RECEIPT_PATH"
);
const modeConfig = Config.schema(
  PreviewStateMigrationMode,
  "BUNDJIL_PREVIEW_STATE_MIGRATION_MODE"
);
const candidateConfig = Config.schema(
  PreviewStateMigrationCandidate,
  "BUNDJIL_PREVIEW_STATE_MIGRATION_CANDIDATE"
);
const vercelAccessTokenConfig = Config.schema(
  VercelAccessToken,
  "VERCEL_INFRASTRUCTURE_ACCESS_TOKEN"
);

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const readMode600 = Effect.fn("PreviewStateMigration.readMode600")(function* (
  path: typeof PreviewStateMigrationPath.Type
) {
  const fileSystem = yield* FileSystem.FileSystem;
  const metadata = yield* fileSystem.stat(path);
  if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 2n * 1024n * 1024n) {
    return yield* Effect.fail("migration-input-invalid");
  }
  return yield* fileSystem.readFileString(path);
});

const runPreviewStateMigration = Effect.gen(
  function* runPreviewStateMigrationOperation() {
    const authorityPath = yield* authorityPathConfig;
    const manifestPath = yield* manifestPathConfig;
    const backupPath = yield* backupPathConfig;
    const receiptPath = yield* receiptPathConfig;
    const mode = yield* modeConfig;
    const candidate = yield* candidateConfig;
    if (
      new Set([authorityPath, manifestPath, backupPath, receiptPath]).size !== 4
    ) {
      return yield* Effect.fail("migration-path-conflict");
    }

    const authorityText = yield* readMode600(authorityPath);
    const authority = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(authorityText);
    const ajv = new Ajv2020({
      allErrors: true,
      strict: false,
      validateFormats: false,
    });
    if (
      !ajv.compile(authorityEnvelopeSchema)(authority) ||
      !ajv.compile(migrationAuthorityPolicy)(authority)
    ) {
      return yield* Effect.fail("migration-authority-invalid");
    }

    const manifestText = yield* readMode600(manifestPath);
    const manifest = yield* Schema.decodeUnknownEffect(AdoptionManifestJson)(
      manifestText,
      { onExcessProperty: "error" }
    );
    if (manifest.stage !== "preview") {
      return yield* Effect.fail("migration-manifest-stage-mismatch");
    }

    const stateConfig = yield* loadAlchemyR2StateConfig;
    const photonCredentials =
      yield* loadInfrastructurePhotonCredentials("preview");
    const vercelAccessToken = yield* vercelAccessTokenConfig;
    const forbiddenValues = yield* Effect.forEach(
      [
        stateConfig.accessKeyId,
        stateConfig.secretAccessKey,
        photonCredentials.projectSecret,
        vercelAccessToken,
      ],
      (value) =>
        Schema.decodeUnknownEffect(PreviewStateForbiddenValue)(
          Redacted.value(value)
        )
    );
    const backupStore = makePreviewStateBackupStoreLive(
      backupPath,
      forbiddenValues
    ).pipe(Layer.provide(BunFileSystem.layer));
    const migrationLayer = PreviewStateMigrationLive.pipe(
      Layer.provide(Layer.merge(layerAlchemyR2State, backupStore))
    );
    const migration = yield* PreviewStateMigration.pipe(
      Effect.provide(migrationLayer)
    );
    const result = yield* Match.value(mode).pipe(
      Match.when("plan", () => migration.plan(manifest)),
      Match.when("apply", () => migration.retire(manifest)),
      Match.when("restore", () => migration.restore),
      Match.exhaustive
    );

    const fileSystem = yield* FileSystem.FileSystem;
    const detailArtifacts =
      mode === "plan"
        ? []
        : [
            {
              path: backupPath,
              sha256: InfrastructureArtifactDigest.make(
                sha256(yield* fileSystem.readFileString(backupPath))
              ),
            },
          ];
    const observedAt = new Date(
      yield* Effect.clockWith((clock) => clock.currentTimeMillis)
    ).toISOString();
    const receipt = InfrastructureBoundedReceipt.make({
      schemaVersion: "1",
      status: "passed",
      claim: Match.value(mode).pipe(
        Match.when(
          "plan",
          () =>
            "Exact Preview state discontinuity is eligible for state-only correction."
        ),
        Match.when(
          "apply",
          () =>
            "Exactly seven obsolete retained Preview state rows were retired after full backup."
        ),
        Match.when(
          "restore",
          () => "The complete pre-migration Preview state was restored exactly."
        ),
        Match.exhaustive
      ),
      target: "alchemy:BundjilInfrastructure:preview:state-only",
      candidateIdentity: candidate,
      actor: "codex-authorized-alchemy-operator",
      authorityReceipt: authorityPath,
      environment: "preview",
      journeyIds: [],
      observations: [
        `operation:${mode}`,
        `current-count:${result.currentCount}`,
        `desired-count:${result.desiredCount}`,
        `stale-count:${result.staleCount}`,
        `retained-count:${result.retainedCount}`,
        `stale-fingerprints:${result.staleFingerprints.join(",")}`,
        "provider-writes:0",
      ],
      postconditions: [
        "No Vercel or Photon provider transport was composed.",
        mode === "apply"
          ? "Every pre-migration Preview state row is retained in the mode-0600 backup."
          : "No provider-owned resource was changed.",
      ],
      detailArtifacts,
      limitations: [
        "State correction does not prove the later adoption plan, provider readback, stable binding or deployment.",
      ],
      nonClaims: [
        "This receipt proves no Vercel, Photon, deployment, runtime, Channel or handset outcome.",
      ],
      rollbackOrRecovery:
        mode === "apply"
          ? "Run the same command in restore mode before another provider-bound operation if adoption cannot converge."
          : "No external provider rollback is required.",
      observedAt,
    });
    const receiptJson = yield* Schema.encodeEffect(
      InfrastructureBoundedReceiptJson
    )(receipt);
    const receiptUnknown = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(receiptJson);
    if (
      !new Ajv2020({
        allErrors: true,
        strict: false,
        validateFormats: false,
      }).compile(boundedReceiptSchema)(receiptUnknown)
    ) {
      return yield* Effect.fail("migration-receipt-incompatible");
    }
    yield* fileSystem.makeDirectory(dirname(receiptPath), {
      recursive: true,
      mode: 0o700,
    });
    yield* fileSystem.writeFileString(receiptPath, receiptJson, {
      mode: 0o600,
    });
    yield* fileSystem.chmod(receiptPath, 0o600);
    return result;
  }
);

const main = Effect.exit(runPreviewStateMigration).pipe(
  Effect.flatMap((exit) =>
    Exit.isSuccess(exit)
      ? Schema.encodeEffect(
          Schema.fromJsonString(
            Schema.Struct({
              status: Schema.String,
              currentCount: Schema.Int.pipe(
                Schema.check(Schema.isGreaterThanOrEqualTo(0))
              ),
              desiredCount: Schema.Int.pipe(
                Schema.check(Schema.isGreaterThanOrEqualTo(0))
              ),
              staleCount: Schema.Int.pipe(
                Schema.check(Schema.isGreaterThanOrEqualTo(0))
              ),
              retainedCount: Schema.Int.pipe(
                Schema.check(Schema.isGreaterThanOrEqualTo(0))
              ),
              staleFingerprints: Schema.Array(Schema.String),
              providerWrites: Schema.Literal(0),
            })
          )
        )(exit.value).pipe(Effect.flatMap((encoded) => Console.log(encoded)))
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

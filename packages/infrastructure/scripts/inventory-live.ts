import { createHash } from "node:crypto";
import { dirname, isAbsolute } from "node:path";

import {
  PhotonManagementCredentials,
  PhotonManagementLive,
} from "@bundjil/photon/management";
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
  Schema,
} from "effect";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import boundedReceiptSchema from "../../../.agents/skills/docs-maintainer/assets/harness/bounded-receipt.schema.json" with { type: "json" };
import readOnlyInventoryAuthorityPolicy from "../schemas/read-only-inventory-authority.schema.json" with { type: "json" };
import {
  canonicalizeInfrastructureObservedManifest,
  InfrastructureArtifactDigest,
  InfrastructureBoundedReceipt,
  InfrastructureBoundedReceiptJson,
  InfrastructureInventory,
  InfrastructureInventoryArtifact,
  InfrastructureInventoryArtifactJson,
  InfrastructureInventoryDigest,
  InfrastructureInventoryLive,
  InfrastructureInventoryPrincipalFingerprint,
  InfrastructureInventorySourceSha,
  InfrastructureInventoryTarget,
  InfrastructureObservedManifest,
  loadInfrastructureCommandConfig,
  loadInfrastructurePhotonCredentials,
} from "../src/index.js";
import {
  VercelCredentialsLive,
  VercelLive,
  VercelProjectId,
  VercelTeamId,
} from "../src/vercel/index.js";

declare const process: {
  exitCode: number | undefined;
};

const InventoryArtifactPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "Inventory artifact path must be a safe repository-relative path."
    )
  ),
  Schema.brand("@bundjil/infrastructure/InventoryArtifactPath")
);
const InfrastructureInventoryCommandFailureReason = Schema.Literals([
  "artifactPathConflict",
  "authorityFileInvalid",
  "authorityInvalid",
  "inventoryModeRequired",
  "receiptIncompatible",
]);
class InfrastructureInventoryCommandError extends Schema.TaggedErrorClass<InfrastructureInventoryCommandError>()(
  "InfrastructureInventoryCommandError",
  { reason: InfrastructureInventoryCommandFailureReason }
) {}

const authorityPathConfig = Config.schema(
  InventoryArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_AUTHORITY_PATH"
);
const artifactPathConfig = Config.schema(
  InventoryArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_INVENTORY_PATH"
);
const receiptPathConfig = Config.schema(
  InventoryArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_RECEIPT_PATH"
);
const teamIdConfig = Config.schema(
  VercelTeamId,
  "BUNDJIL_INFRASTRUCTURE_VERCEL_TEAM_ID"
);
const projectIdsConfig = Config.schema(
  Schema.fromJsonString(Schema.Array(VercelProjectId)),
  "BUNDJIL_INFRASTRUCTURE_VERCEL_PROJECT_IDS"
);
const principalFingerprintConfig = Config.schema(
  InfrastructureInventoryPrincipalFingerprint,
  "BUNDJIL_INFRASTRUCTURE_PRINCIPAL_FINGERPRINT"
);
const sourceShaConfig = Config.schema(
  InfrastructureInventorySourceSha,
  "BUNDJIL_INFRASTRUCTURE_SOURCE_SHA"
);
const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const readAndValidateAuthority = Effect.fn("InventoryAuthority.validate")(
  function* (authorityPath: typeof InventoryArtifactPath.Type) {
    const fileSystem = yield* FileSystem.FileSystem;
    const metadata = yield* fileSystem.stat(authorityPath);
    if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 64n * 1024n) {
      return yield* new InfrastructureInventoryCommandError({
        reason: "authorityFileInvalid",
      });
    }
    const authorityText = yield* fileSystem.readFileString(authorityPath);
    const authority = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(authorityText);
    const validate = new Ajv2020({
      allErrors: true,
      strict: false,
    }).compile(authorityEnvelopeSchema);
    const validateTaskPolicy = new Ajv2020({
      allErrors: true,
      strict: false,
    }).compile(readOnlyInventoryAuthorityPolicy);
    if (!validate(authority) || !validateTaskPolicy(authority)) {
      return yield* new InfrastructureInventoryCommandError({
        reason: "authorityInvalid",
      });
    }
    return authorityPath;
  }
);

const runInventory = Effect.gen(
  function* runAuthorizedInfrastructureInventory() {
    const input = yield* loadInfrastructureCommandConfig;
    if (input.mode !== "inventory") {
      return yield* new InfrastructureInventoryCommandError({
        reason: "inventoryModeRequired",
      });
    }
    const authorityPath = yield* authorityPathConfig;
    yield* readAndValidateAuthority(authorityPath);
    const artifactPath = yield* artifactPathConfig;
    const receiptPath = yield* receiptPathConfig;
    if (
      artifactPath === authorityPath ||
      receiptPath === authorityPath ||
      receiptPath === artifactPath
    ) {
      return yield* new InfrastructureInventoryCommandError({
        reason: "artifactPathConflict",
      });
    }
    const teamId = yield* teamIdConfig;
    const projectIds = yield* projectIdsConfig;
    const principalFingerprint = yield* principalFingerprintConfig;
    const sourceSha = yield* sourceShaConfig;
    const photonCredentials = yield* loadInfrastructurePhotonCredentials(
      input.stage
    );
    const inventory = yield* InfrastructureInventory;
    const target = InfrastructureInventoryTarget.make({
      stage: input.stage,
      vercelTeamId: teamId,
      vercelProjectIds: projectIds,
      photonProjectId: photonCredentials.projectId,
    });

    const first = yield* inventory.read(target);
    const second = yield* inventory.read(target);
    const firstCanonical =
      yield* canonicalizeInfrastructureObservedManifest(first);
    const secondCanonical =
      yield* canonicalizeInfrastructureObservedManifest(second);
    const firstEncoded = yield* Schema.encodeEffect(
      Schema.fromJsonString(InfrastructureObservedManifest)
    )(firstCanonical);
    const secondEncoded = yield* Schema.encodeEffect(
      Schema.fromJsonString(InfrastructureObservedManifest)
    )(secondCanonical);
    const firstDigest = InfrastructureInventoryDigest.make(
      sha256(firstEncoded)
    );
    const secondDigest = InfrastructureInventoryDigest.make(
      sha256(secondEncoded)
    );
    const observedAt = new Date(
      yield* Effect.clockWith((clock) => clock.currentTimeMillis)
    ).toISOString();
    const artifact = InfrastructureInventoryArtifact.make({
      schemaVersion: "1",
      sourceSha,
      principalFingerprint,
      observedAt,
      manifestDigest: secondDigest,
      manifest: secondCanonical,
    });
    const artifactJson = yield* Schema.encodeEffect(
      InfrastructureInventoryArtifactJson
    )(artifact);
    const artifactDigest = InfrastructureArtifactDigest.make(
      sha256(artifactJson)
    );
    const unchanged = firstDigest === secondDigest;
    const receipt = InfrastructureBoundedReceipt.make({
      schemaVersion: "1",
      status: unchanged ? "passed" : "inconclusive",
      claim: unchanged
        ? "Two authorized metadata-only inventories produced one canonical manifest."
        : "Two authorized metadata-only inventories produced classified drift.",
      target: `vercel+photon:${input.stage}`,
      candidateIdentity: sourceSha,
      actor: principalFingerprint,
      authorityReceipt: authorityPath,
      environment: input.stage,
      journeyIds: [],
      observations: [
        `manifest-digest:${secondDigest}`,
        `vercel-project-count:${secondCanonical.vercel.projects.length}`,
        `photon-shared-user-count:${secondCanonical.photon.sharedUsers.users.length}`,
        `photon-webhook-count:${secondCanonical.photon.webhooks.webhooks.length}`,
        `photon-line-count:${secondCanonical.photon.lines.lines.length}`,
        `repeat-read:${unchanged ? "unchanged" : "drift"}`,
        "provider-writes:0",
      ],
      postconditions: [
        "No provider mutation was requested or performed.",
        "The persisted artifact passed its owning Schema encoder.",
      ],
      detailArtifacts: [{ path: artifactPath, sha256: artifactDigest }],
      limitations: [
        "Provider readback is point-in-time metadata, not deployment or Channel proof.",
        "Inventory readback does not authorize Photon project creation.",
      ],
      nonClaims: [
        "This receipt proves no deployment, promotion, webhook mutation, send, delivery, handset result, or future provider state.",
      ],
      rollbackOrRecovery:
        "No external rollback is required; discard only the ignored local artifact if its redaction boundary fails.",
      observedAt,
    });
    const receiptJson = yield* Schema.encodeEffect(
      InfrastructureBoundedReceiptJson
    )(receipt);
    const receiptEncoded = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(receiptJson);
    const validateReceipt = new Ajv2020({
      allErrors: true,
      strict: false,
      validateFormats: false,
    }).compile(boundedReceiptSchema);
    if (!validateReceipt(receiptEncoded)) {
      return yield* new InfrastructureInventoryCommandError({
        reason: "receiptIncompatible",
      });
    }
    const fileSystem = yield* FileSystem.FileSystem;
    yield* fileSystem.makeDirectory(dirname(artifactPath), {
      recursive: true,
      mode: 0o700,
    });
    yield* fileSystem.writeFileString(artifactPath, artifactJson, {
      mode: 0o600,
    });
    yield* fileSystem.chmod(artifactPath, 0o600);
    yield* fileSystem.makeDirectory(dirname(receiptPath), {
      recursive: true,
      mode: 0o700,
    });
    yield* fileSystem.writeFileString(receiptPath, receiptJson, {
      mode: 0o600,
    });
    yield* fileSystem.chmod(receiptPath, 0o600);
    return receiptJson;
  }
);

const providerLayers = Layer.merge(
  VercelLive.pipe(
    Layer.provide(VercelCredentialsLive),
    Layer.provide(BunHttpClient.layer)
  ),
  PhotonManagementLive.pipe(
    Layer.provide(
      Layer.succeed(
        PhotonManagementCredentials,
        loadInfrastructureCommandConfig.pipe(
          Effect.flatMap((input) =>
            loadInfrastructurePhotonCredentials(input.stage)
          )
        )
      )
    ),
    Layer.provide(BunHttpClient.layer)
  )
);
const inventoryLayer = InfrastructureInventoryLive.pipe(
  Layer.provide(providerLayers)
);

const main = Effect.exit(runInventory).pipe(
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
      ConfigProvider.layer(ConfigProvider.fromEnv()),
      providerLayers,
      inventoryLayer
    )
  )
);

await Effect.runPromise(main);

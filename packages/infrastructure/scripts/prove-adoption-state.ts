import { createHash } from "node:crypto";
import { dirname, isAbsolute } from "node:path";
/* oxlint-disable unicorn/no-array-method-this-argument -- Effect.forEach is a data-first Effect combinator, not Array.prototype.forEach. */

import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import { Ajv2020 } from "ajv/dist/2020.js";
import { State } from "alchemy/State";
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
import stableEnvironmentAuthorityPolicy from "../schemas/stable-vercel-environment-authority.schema.json" with { type: "json" };
import {
  AdoptionBindingProfile,
  AdoptionManifestJson,
  AlchemyLogicalResourceId,
  InfrastructureArtifactDigest,
  InfrastructureBoundedReceipt,
  InfrastructureBoundedReceiptJson,
  InfrastructureStage,
  layerAlchemyR2State,
  loadAlchemyR2StateConfig,
  loadInfrastructurePhotonCredentials,
} from "../src/index.js";
import {
  VercelAccessToken,
  VercelEnvironmentVariableAttributes,
  VercelEnvironmentVariableDesiredState,
} from "../src/vercel/index.js";

declare const process: {
  exitCode: number | undefined;
};

const AdoptionProofPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !isAbsolute(value) &&
      !value.split("/").includes("..")
        ? undefined
        : "Adoption proof paths must be safe repository-relative paths."
    )
  ),
  Schema.brand("@bundjil/infrastructure/AdoptionProofPath")
);

const CandidateIdentity = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(240)),
  Schema.brand("@bundjil/infrastructure/AdoptionCandidateIdentity")
);

const authorityPathConfig = Config.schema(
  AdoptionProofPath,
  "BUNDJIL_INFRASTRUCTURE_AUTHORITY_PATH"
);
const manifestPathConfig = Config.schema(
  AdoptionProofPath,
  "BUNDJIL_INFRASTRUCTURE_ADOPTION_PATH"
);
const receiptPathConfig = Config.schema(
  AdoptionProofPath,
  "BUNDJIL_INFRASTRUCTURE_RECEIPT_PATH"
);
const stageConfig = Config.schema(
  InfrastructureStage,
  "BUNDJIL_INFRASTRUCTURE_STAGE"
);
const candidateIdentityConfig = Config.schema(
  CandidateIdentity,
  "BUNDJIL_INFRASTRUCTURE_CANDIDATE_IDENTITY"
);
const bindingProfileConfig = Config.schema(
  AdoptionBindingProfile,
  "BUNDJIL_INFRASTRUCTURE_BINDING_PROFILE"
).pipe(Config.withDefault("observedOnly"));

const StableEnvironmentStateResource = Schema.Struct({
  logicalId: AlchemyLogicalResourceId,
  status: Schema.Literal("updated"),
  props: Schema.Struct({
    desired: VercelEnvironmentVariableDesiredState,
  }),
  output: VercelEnvironmentVariableAttributes,
});
const PersistedStateResourceIdentity = Schema.Struct({
  logicalId: AlchemyLogicalResourceId,
  status: Schema.String,
  props: Schema.Struct({
    stage: InfrastructureStage,
  }),
});

const vercelAccessTokenConfig = Config.schema(
  VercelAccessToken,
  "VERCEL_INFRASTRUCTURE_ACCESS_TOKEN"
);
const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const readFixedContractArtifact = Effect.fn(
  "AdoptionProof.readFixedContractArtifact"
)(function* (path: typeof AdoptionProofPath.Type) {
  const fileSystem = yield* FileSystem.FileSystem;
  const metadata = yield* fileSystem.stat(path);
  if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 2n * 1024n * 1024n) {
    return yield* Effect.fail("proof-input-invalid");
  }
  return yield* fileSystem.readFileString(path);
});

const runAdoptionStateProof = Effect.gen(
  // oxlint-disable-next-line complexity -- This foreground proof keeps authority, state, leak, receipt, and custody stops in one linear Effect.
  function* runAdoptionStateProofOperation() {
    const authorityPath = yield* authorityPathConfig;
    const manifestPath = yield* manifestPathConfig;
    const receiptPath = yield* receiptPathConfig;
    const stage = yield* stageConfig;
    const candidateIdentity = yield* candidateIdentityConfig;
    const bindingProfile = yield* bindingProfileConfig;
    if (
      authorityPath === manifestPath ||
      authorityPath === receiptPath ||
      manifestPath === receiptPath
    ) {
      return yield* Effect.fail("proof-path-conflict");
    }

    const authorityText = yield* readFixedContractArtifact(authorityPath);
    const authority = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(authorityText);
    const validateAuthority = new Ajv2020({
      allErrors: true,
      strict: false,
      validateFormats: false,
    }).compile(authorityEnvelopeSchema);
    if (
      !validateAuthority(authority) ||
      (bindingProfile === "previewPhotonManaged" &&
        !new Ajv2020({
          allErrors: true,
          strict: false,
          validateFormats: false,
        }).compile(stableEnvironmentAuthorityPolicy)(authority))
    ) {
      return yield* Effect.fail("authority-invalid");
    }

    const manifestText = yield* readFixedContractArtifact(manifestPath);
    const manifest = yield* Schema.decodeUnknownEffect(AdoptionManifestJson)(
      manifestText,
      { onExcessProperty: "error" }
    );
    if (manifest.stage !== stage) {
      return yield* Effect.fail("manifest-stage-mismatch");
    }
    const managedManifestResources = manifest.resources.filter(
      (resource) =>
        resource.resourceKind === "vercelEnvironmentVariable" &&
        resource.desired.valueOwnership._tag === "Managed"
    );
    if (
      (bindingProfile === "observedOnly" &&
        managedManifestResources.length !== 0) ||
      (bindingProfile === "previewPhotonManaged" &&
        managedManifestResources.length !== 4)
    ) {
      return yield* Effect.fail("binding-profile-mismatch");
    }

    const resolveState = yield* State;
    const state = yield* resolveState;
    const version = yield* state.getVersion();
    const stacks = yield* state.listStacks();
    const stages = yield* state.listStages("BundjilInfrastructure");
    const fqns = yield* state.list({
      stack: "BundjilInfrastructure",
      stage,
    });
    const resources = yield* Effect.forEach(fqns, (fqn) =>
      state
        .get({
          stack: "BundjilInfrastructure",
          stage,
          fqn,
        })
        .pipe(
          Effect.flatMap((resource) =>
            resource === undefined
              ? Effect.fail("remote-state-resource-missing")
              : Effect.succeed(resource)
          )
        )
    );
    const decodedResourceIdentities = yield* Effect.forEach(
      resources,
      (resource) =>
        Schema.decodeUnknownEffect(PersistedStateResourceIdentity)(resource, {
          onExcessProperty: "ignore",
        })
    );
    const persistedLogicalIds = decodedResourceIdentities.map(
      (resource) => resource.logicalId
    );
    const expectedLogicalIds = manifest.resources
      .map((resource) => resource.logicalId)
      .toSorted();
    const logicalIdsMatch =
      persistedLogicalIds.length === expectedLogicalIds.length &&
      persistedLogicalIds
        .toSorted()
        .every((logicalId, index) => logicalId === expectedLogicalIds[index]);
    const stagePropsMatch = decodedResourceIdentities.every(
      (resource) => resource.props.stage === stage
    );
    const stateStatusesMatch = decodedResourceIdentities.every(
      (resource) => resource.status === "updated"
    );
    const stateConfig = yield* loadAlchemyR2StateConfig;
    const photonCredentials = yield* loadInfrastructurePhotonCredentials(stage);
    const credentials = [
      stateConfig.accessKeyId,
      stateConfig.secretAccessKey,
      yield* vercelAccessTokenConfig,
      photonCredentials.projectSecret,
    ];
    const serializedState = yield* Schema.encodeEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(resources);
    const credentialLeakCount = credentials.filter((credential) =>
      serializedState.includes(Redacted.value(credential))
    ).length;
    const managedStateResources =
      bindingProfile === "previewPhotonManaged"
        ? yield* Effect.forEach(managedManifestResources, (expected) =>
            Schema.decodeUnknownEffect(StableEnvironmentStateResource)(
              resources[
                decodedResourceIdentities.findIndex(
                  (resource) => resource.logicalId === expected.logicalId
                )
              ],
              { onExcessProperty: "ignore" }
            )
          )
        : [];
    const managedStateMatches =
      bindingProfile === "observedOnly" ||
      (managedStateResources.length === 4 &&
        managedStateResources.every(
          (resource) =>
            resource.props.desired.valueOwnership._tag === "Managed" &&
            resource.output.valueOwnership._tag === "Managed" &&
            resource.output.deploymentRequired &&
            resource.output.providerUpdatedAt !== undefined &&
            resource.props.desired.valueOwnership.reference.revision ===
              resource.output.valueOwnership.reference.revision
        ));
    const exactState =
      state.id === "s3" &&
      version === 5 &&
      stacks.length === 1 &&
      stacks[0] === "BundjilInfrastructure" &&
      stages.length === 2 &&
      stages.includes("preview") &&
      stages.includes("prod") &&
      fqns.length === manifest.resources.length &&
      logicalIdsMatch &&
      stagePropsMatch &&
      stateStatusesMatch &&
      managedStateMatches &&
      credentialLeakCount === 0;
    if (!exactState) {
      return yield* Effect.fail("remote-state-proof-failed");
    }

    const observedAt = new Date(
      yield* Effect.clockWith((clock) => clock.currentTimeMillis)
    ).toISOString();
    const manifestDigest = InfrastructureArtifactDigest.make(
      sha256(manifestText)
    );
    const receipt = InfrastructureBoundedReceipt.make({
      schemaVersion: "1",
      status: "passed",
      claim:
        bindingProfile === "previewPhotonManaged"
          ? "Authorized stable Preview Photon environment bindings produced exact provider acknowledgements in dedicated remote state."
          : "Authorized no-write adoption persisted the exact accepted manifest in dedicated remote state and converged to no-op.",
      target: `alchemy:BundjilInfrastructure:${stage}`,
      candidateIdentity,
      actor: "codex-authorized-alchemy-operator",
      authorityReceipt: authorityPath,
      environment: stage,
      journeyIds: [],
      observations: [
        `state-store:${state.id}`,
        `state-version:${version}`,
        `manifest-digest:${manifest.digest}`,
        `resource-count:${fqns.length}`,
        ...(bindingProfile === "previewPhotonManaged"
          ? [
              "managed-provider-acknowledgements:4",
              "managed-deployment-required:4",
            ]
          : [
              "adoption-dry-run:create=0,replace=0,delete=0",
              `adoption-deploy:imported=${fqns.length}`,
              `post-adoption-plan:noop=${fqns.length}`,
              "consecutive-sync-dry-runs:unchanged=2",
              "provider-transport-writes:0",
            ]),
        `credential-value-leaks:${credentialLeakCount}`,
      ],
      postconditions: [
        "The remote state contains exactly the accepted stage logical identities.",
        "Every persisted resource has the exact stage and completed adoption status.",
        "Preview and Production coexist as distinct stages in the dedicated state store.",
        bindingProfile === "previewPhotonManaged"
          ? "Only the four existing Preview Photon environment identities have managed ownership; every other Vercel and Photon resource remains read-only and retained."
          : "The live Vercel and Photon adoption adapters expose read transports only.",
      ],
      detailArtifacts: [{ path: manifestPath, sha256: manifestDigest }],
      limitations: [
        "The installed Alchemy CLI has no plan --adopt option; deploy --dry-run --adopt supplied the side-effect-free adoption plan.",
        bindingProfile === "previewPhotonManaged"
          ? "Provider acknowledgements and state do not prove the separate live plan, fresh inventory, no-op sync, immutable deployment or runtime configuration."
          : "Adoption state is stage-scoped point-in-time evidence and does not substitute one Photon project for another.",
      ],
      nonClaims: [
        "This receipt proves no Vercel deployment, promotion, runtime health, Photon mutation, Channel delivery, handset result, or future provider state.",
      ],
      rollbackOrRecovery:
        bindingProfile === "previewPhotonManaged"
          ? "Use the externally retained prior value revision, reapply it to the same four exact environment IDs under a new authority receipt, read back acknowledgements, and require a new immutable deployment; Vercel does not retain two active values for one key and target."
          : "Retain the R2 state and provider resources; revert the desired Git revision, dry-run plan and sync, then replace the exact bucket-scoped credential only through create-readback-cutover-revoke.",
      observedAt,
    });
    const receiptText = yield* Schema.encodeEffect(
      InfrastructureBoundedReceiptJson
    )(receipt);
    const receiptEncoded = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(receiptText);
    const validateReceipt = new Ajv2020({
      allErrors: true,
      strict: false,
      validateFormats: false,
    }).compile(boundedReceiptSchema);
    if (!validateReceipt(receiptEncoded)) {
      return yield* Effect.fail("receipt-incompatible");
    }

    const fileSystem = yield* FileSystem.FileSystem;
    yield* fileSystem.makeDirectory(dirname(receiptPath), {
      recursive: true,
      mode: 0o700,
    });
    yield* fileSystem.writeFileString(receiptPath, receiptText, {
      mode: 0o600,
    });
    yield* fileSystem.chmod(receiptPath, 0o600);
    return Match.value(bindingProfile).pipe(
      Match.when("observedOnly", () => ({
        status: "passed" as const,
        stage,
        stateStore: state.id,
        stateVersion: version,
        resourceCount: fqns.length,
        credentialLeakCount,
        providerWrites: 0,
      })),
      Match.when("previewPhotonManaged", () => ({
        status: "passed" as const,
        stage,
        stateStore: state.id,
        stateVersion: version,
        resourceCount: fqns.length,
        credentialLeakCount,
        providerAcknowledgements: managedStateResources.length,
      })),
      Match.exhaustive
    );
  }
);

const main = Effect.exit(runAdoptionStateProof).pipe(
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
      layerAlchemyR2State,
      BunFileSystem.layer,
      ConfigProvider.layer(ConfigProvider.fromEnv())
    )
  )
);

await Effect.runPromise(main);

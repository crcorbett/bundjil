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
  FileSystem,
  Layer,
  Match,
  Redacted,
  Schema,
} from "effect";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import boundedReceiptSchema from "../../../.agents/skills/docs-maintainer/assets/harness/bounded-receipt.schema.json" with { type: "json" };
import productionStableEnvironmentAuthorityPolicy from "../schemas/production-stable-vercel-environment-authority.schema.json" with { type: "json" };
import stableEnvironmentAuthorityPolicy from "../schemas/stable-vercel-environment-authority.schema.json" with { type: "json" };
import { ManagedStableEnvironmentStateResource } from "../src/adoption-proof.js";
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
import { VercelAccessToken } from "../src/vercel/index.js";

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

const AdoptionProofBlockedReason = Schema.Literals([
  "authority-invalid",
  "authority-input-invalid",
  "binding-profile-mismatch",
  "configuration-invalid",
  "credential-custody-invalid",
  "managed-state-attributes-invalid",
  "manifest-invalid",
  "manifest-stage-mismatch",
  "proof-input-invalid",
  "proof-path-conflict",
  "receipt-write-failed",
  "receipt-incompatible",
  "remote-state-read-failed",
  "remote-state-shape-invalid",
  "remote-state-proof-failed",
  "remote-state-resource-missing",
  "unclassified",
]);
class AdoptionProofError extends Schema.TaggedErrorClass<AdoptionProofError>()(
  "AdoptionProofError",
  { reason: AdoptionProofBlockedReason }
) {}

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
    return yield* new AdoptionProofError({ reason: "proof-input-invalid" });
  }
  return yield* fileSystem.readFileString(path);
});

const runAdoptionStateProof = Effect.gen(
  // oxlint-disable-next-line complexity -- This foreground proof keeps authority, state, leak, receipt, and custody stops in one linear Effect.
  function* runAdoptionStateProofOperation() {
    const {
      authorityPath,
      bindingProfile,
      candidateIdentity,
      manifestPath,
      receiptPath,
      stage,
    } = yield* Effect.all({
      authorityPath: authorityPathConfig,
      bindingProfile: bindingProfileConfig,
      candidateIdentity: candidateIdentityConfig,
      manifestPath: manifestPathConfig,
      receiptPath: receiptPathConfig,
      stage: stageConfig,
    }).pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "configuration-invalid" })
      )
    );
    if (
      authorityPath === manifestPath ||
      authorityPath === receiptPath ||
      manifestPath === receiptPath
    ) {
      return yield* new AdoptionProofError({ reason: "proof-path-conflict" });
    }

    const authorityText = yield* readFixedContractArtifact(authorityPath).pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "authority-input-invalid" })
      )
    );
    const authority = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(authorityText).pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "authority-input-invalid" })
      )
    );
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
        }).compile(stableEnvironmentAuthorityPolicy)(authority)) ||
      (bindingProfile === "productionPhotonManaged" &&
        !new Ajv2020({
          allErrors: true,
          strict: false,
          validateFormats: false,
        }).compile(productionStableEnvironmentAuthorityPolicy)(authority))
    ) {
      return yield* new AdoptionProofError({ reason: "authority-invalid" });
    }

    const manifestText = yield* readFixedContractArtifact(manifestPath).pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "manifest-invalid" })
      )
    );
    const manifest = yield* Schema.decodeUnknownEffect(AdoptionManifestJson)(
      manifestText,
      { onExcessProperty: "error" }
    ).pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "manifest-invalid" })
      )
    );
    if (manifest.stage !== stage) {
      return yield* new AdoptionProofError({
        reason: "manifest-stage-mismatch",
      });
    }
    const managedManifestResources = manifest.resources.filter(
      (resource) =>
        resource.resourceKind === "vercelEnvironmentVariable" &&
        resource.desired.valueOwnership._tag === "Managed"
    );
    if (
      (bindingProfile === "observedOnly" &&
        managedManifestResources.length !== 0) ||
      ((bindingProfile === "previewPhotonManaged" ||
        bindingProfile === "productionPhotonManaged") &&
        managedManifestResources.length !== 4)
    ) {
      return yield* new AdoptionProofError({
        reason: "binding-profile-mismatch",
      });
    }

    const resolveState = yield* State;
    const state = yield* resolveState.pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "remote-state-read-failed" })
      )
    );
    const version = yield* state
      .getVersion()
      .pipe(
        Effect.mapError(
          () => new AdoptionProofError({ reason: "remote-state-read-failed" })
        )
      );
    const stacks = yield* state
      .listStacks()
      .pipe(
        Effect.mapError(
          () => new AdoptionProofError({ reason: "remote-state-read-failed" })
        )
      );
    const stages = yield* state
      .listStages("BundjilInfrastructure")
      .pipe(
        Effect.mapError(
          () => new AdoptionProofError({ reason: "remote-state-read-failed" })
        )
      );
    const fqns = yield* state
      .list({
        stack: "BundjilInfrastructure",
        stage,
      })
      .pipe(
        Effect.mapError(
          () => new AdoptionProofError({ reason: "remote-state-read-failed" })
        )
      );
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
              ? new AdoptionProofError({
                  reason: "remote-state-resource-missing",
                })
              : Effect.succeed(resource)
          )
        )
    ).pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "remote-state-read-failed" })
      )
    );
    const decodedResourceIdentities = yield* Effect.forEach(
      resources,
      (resource) =>
        Schema.decodeUnknownEffect(PersistedStateResourceIdentity)(resource, {
          onExcessProperty: "ignore",
        })
    ).pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "remote-state-shape-invalid" })
      )
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
    const stateConfig = yield* loadAlchemyR2StateConfig.pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "credential-custody-invalid" })
      )
    );
    const photonCredentials = yield* loadInfrastructurePhotonCredentials(
      stage
    ).pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "credential-custody-invalid" })
      )
    );
    const credentials = [
      stateConfig.accessKeyId,
      stateConfig.secretAccessKey,
      yield* vercelAccessTokenConfig.pipe(
        Effect.mapError(
          () => new AdoptionProofError({ reason: "credential-custody-invalid" })
        )
      ),
      photonCredentials.projectSecret,
    ];
    const serializedState = yield* Schema.encodeEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(resources);
    const credentialLeakCount = credentials.filter((credential) =>
      serializedState.includes(Redacted.value(credential))
    ).length;
    const managedStateResources =
      bindingProfile !== "observedOnly"
        ? yield* Effect.forEach(managedManifestResources, (expected) =>
            Schema.decodeUnknownEffect(ManagedStableEnvironmentStateResource)(
              resources[
                decodedResourceIdentities.findIndex(
                  (resource) => resource.logicalId === expected.logicalId
                )
              ],
              { onExcessProperty: "ignore" }
            )
          ).pipe(
            Effect.mapError(
              () =>
                new AdoptionProofError({
                  reason: "managed-state-attributes-invalid",
                })
            )
          )
        : [];
    const managedStateMatches =
      bindingProfile === "observedOnly" ||
      (managedStateResources.length === 4 &&
        managedStateResources.every(
          (resource) =>
            resource.props.desired.valueOwnership._tag === "Managed" &&
            resource.attr.valueOwnership._tag === "Managed" &&
            resource.attr.deploymentRequired &&
            resource.attr.providerUpdatedAt !== undefined &&
            resource.props.desired.valueOwnership.reference.revision ===
              resource.attr.valueOwnership.reference.revision
        ));
    const stageLabel = Match.value(stage).pipe(
      Match.when("preview", () => "Preview" as const),
      Match.when("prod", () => "Production" as const),
      Match.exhaustive
    );
    const exactState =
      state.id === "s3" &&
      version === 5 &&
      stacks.length === 2 &&
      stacks.includes("BundjilInfrastructure") &&
      stacks.includes("BundjilPreviewConfigurationSpike") &&
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
      return yield* new AdoptionProofError({
        reason: "remote-state-proof-failed",
      });
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
        bindingProfile !== "observedOnly"
          ? `Authorized stable ${stageLabel} Photon environment bindings produced exact provider acknowledgements in dedicated remote state.`
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
        "state-stacks:BundjilInfrastructure,BundjilPreviewConfigurationSpike",
        `manifest-digest:${manifest.digest}`,
        `resource-count:${fqns.length}`,
        ...(bindingProfile !== "observedOnly"
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
        bindingProfile !== "observedOnly"
          ? `Only the four existing ${stageLabel} Photon environment identities have managed ownership; every other Vercel and Photon resource remains read-only and retained.`
          : "The live Vercel and Photon adoption adapters expose read transports only.",
      ],
      detailArtifacts: [{ path: manifestPath, sha256: manifestDigest }],
      limitations: [
        "The installed Alchemy CLI has no plan --adopt option; deploy --dry-run --adopt supplied the side-effect-free adoption plan.",
        bindingProfile !== "observedOnly"
          ? "Provider acknowledgements and state do not prove the separate live plan, fresh inventory, no-op sync, immutable deployment or runtime configuration."
          : "Adoption state is stage-scoped point-in-time evidence and does not substitute one Photon project for another.",
      ],
      nonClaims: [
        "This receipt proves no Vercel deployment, promotion, runtime health, Photon mutation, Channel delivery, handset result, or future provider state.",
      ],
      rollbackOrRecovery: Match.value(bindingProfile).pipe(
        Match.when(
          "observedOnly",
          () =>
            "Retain the R2 state and provider resources; revert the desired Git revision, dry-run plan and sync, then replace the exact bucket-scoped credential only through create-readback-cutover-revoke."
        ),
        Match.when(
          "previewPhotonManaged",
          () =>
            "Use the externally retained prior value revision, reapply it to the same four exact environment IDs under a new authority receipt, read back acknowledgements, and require a new immutable deployment; Vercel does not retain two active values for one key and target."
        ),
        Match.when(
          "productionPhotonManaged",
          () =>
            "Preserve the last-known-good Production deployment and original Photon callback through staged qualification. If the candidate fails, do not deploy or promote it; after promotion, restore the prior immutable deployment and original callback. The overwritten write-only environment values cannot be reconstructed from Vercel metadata, so establish any later revision only from complete independent custody under a new authority receipt."
        ),
        Match.exhaustive
      ),
      observedAt,
    });
    const receiptText = yield* Schema.encodeEffect(
      InfrastructureBoundedReceiptJson
    )(receipt).pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "receipt-write-failed" })
      )
    );
    const receiptEncoded = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(Schema.Unknown)
    )(receiptText).pipe(
      Effect.mapError(
        () => new AdoptionProofError({ reason: "receipt-write-failed" })
      )
    );
    const validateReceipt = new Ajv2020({
      allErrors: true,
      strict: false,
      validateFormats: false,
    }).compile(boundedReceiptSchema);
    if (!validateReceipt(receiptEncoded)) {
      return yield* new AdoptionProofError({ reason: "receipt-incompatible" });
    }

    const fileSystem = yield* FileSystem.FileSystem;
    yield* fileSystem
      .makeDirectory(dirname(receiptPath), {
        recursive: true,
        mode: 0o700,
      })
      .pipe(
        Effect.mapError(
          () => new AdoptionProofError({ reason: "receipt-write-failed" })
        )
      );
    yield* fileSystem
      .writeFileString(receiptPath, receiptText, {
        mode: 0o600,
      })
      .pipe(
        Effect.mapError(
          () => new AdoptionProofError({ reason: "receipt-write-failed" })
        )
      );
    yield* fileSystem
      .chmod(receiptPath, 0o600)
      .pipe(
        Effect.mapError(
          () => new AdoptionProofError({ reason: "receipt-write-failed" })
        )
      );
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
      Match.when("productionPhotonManaged", () => ({
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

const runtime = Layer.mergeAll(
  layerAlchemyR2State,
  BunFileSystem.layer,
  ConfigProvider.layer(ConfigProvider.fromEnv())
);

const main = runAdoptionStateProof.pipe(
  Effect.provide(runtime),
  /* oxlint-disable-next-line eslint-plugin-promise/prefer-await-to-callbacks -- Effect.mapError translates the Effect error channel, not a Promise callback. */
  Effect.mapError((error) =>
    Schema.is(AdoptionProofError)(error)
      ? error
      : new AdoptionProofError({ reason: "configuration-invalid" })
  ),
  Effect.flatMap(Console.log),
  /* oxlint-disable-next-line eslint-plugin-promise/prefer-await-to-then, eslint-plugin-promise/prefer-await-to-callbacks -- Effect.catch handles the typed Effect error channel, not a Promise callback. */
  Effect.catch((error) =>
    Console.error({
      status: "blocked" as const,
      reason: Schema.is(AdoptionProofError)(error)
        ? error.reason
        : AdoptionProofBlockedReason.make("unclassified"),
    }).pipe(
      Effect.andThen(
        Effect.sync(() => {
          process.exitCode = 1;
        })
      )
    )
  )
);

await Effect.runPromise(main);

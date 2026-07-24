import { Schema } from "effect";

export const InfrastructureStage = Schema.Literals(["preview", "prod"]);
export type InfrastructureStage = typeof InfrastructureStage.Type;
export type InfrastructureStageEncoded = typeof InfrastructureStage.Encoded;

export const InfrastructureMode = Schema.Literals([
  "inventory",
  "plan",
  "apply",
  "adopt",
  "sync",
  "offline",
]);
export type InfrastructureMode = typeof InfrastructureMode.Type;
export type InfrastructureModeEncoded = typeof InfrastructureMode.Encoded;

export const InfrastructureProvider = Schema.Literals([
  "synthetic",
  "vercel",
  "photon",
]);
export type InfrastructureProvider = typeof InfrastructureProvider.Type;
export type InfrastructureProviderEncoded =
  typeof InfrastructureProvider.Encoded;

export const InfrastructureResourceKind = Schema.Literals([
  "syntheticResource",
  "vercelProject",
  "vercelDomain",
  "vercelEnvironmentVariable",
  "vercelMarketplaceBinding",
  "vercelDeploymentObservation",
  "photonProjectObservation",
  "photonPlatformConfiguration",
  "photonSharedUser",
  "photonWebhookObservation",
  "photonLineObservation",
  "photonBillingObservation",
]);
export type InfrastructureResourceKind = typeof InfrastructureResourceKind.Type;
export type InfrastructureResourceKindEncoded =
  typeof InfrastructureResourceKind.Encoded;

export const InfrastructureLifecycleOperation = Schema.Literals([
  "initialize",
  "list",
  "read",
  "diff",
  "reconcile",
  "delete",
  "inventory",
  "receipt",
]);
export type InfrastructureLifecycleOperation =
  typeof InfrastructureLifecycleOperation.Type;
export type InfrastructureLifecycleOperationEncoded =
  typeof InfrastructureLifecycleOperation.Encoded;

export const InfrastructureOwnershipState = Schema.Literals([
  "Owned",
  "Unowned",
]);
export type InfrastructureOwnershipState =
  typeof InfrastructureOwnershipState.Type;
export type InfrastructureOwnershipStateEncoded =
  typeof InfrastructureOwnershipState.Encoded;

export const InfrastructureDiffClass = Schema.Literals([
  "no_op",
  "update",
  "replace",
]);
export type InfrastructureDiffClass = typeof InfrastructureDiffClass.Type;
export type InfrastructureDiffClassEncoded =
  typeof InfrastructureDiffClass.Encoded;

export const InfrastructureRetryClass = Schema.Literals([
  "never",
  "backoff",
  "readbackRequired",
]);
export type InfrastructureRetryClass = typeof InfrastructureRetryClass.Type;
export type InfrastructureRetryClassEncoded =
  typeof InfrastructureRetryClass.Encoded;

export const InfrastructureOutcomeCertainty = Schema.Union([
  Schema.TaggedStruct("Known", {}),
  Schema.TaggedStruct("Uncertain", {
    recovery: Schema.Literals(["observeByPhysicalIdentity", "operatorReview"]),
  }),
]);
export type InfrastructureOutcomeCertainty =
  typeof InfrastructureOutcomeCertainty.Type;
export type InfrastructureOutcomeCertaintyEncoded =
  typeof InfrastructureOutcomeCertainty.Encoded;

export const InfrastructureRemovalPolicy = Schema.Literals([
  "retain",
  "destroy",
]);
export type InfrastructureRemovalPolicy =
  typeof InfrastructureRemovalPolicy.Type;
export type InfrastructureRemovalPolicyEncoded =
  typeof InfrastructureRemovalPolicy.Encoded;

export const InfrastructureDestructivePolicy = Schema.Union([
  Schema.TaggedStruct("Protected", {}),
  Schema.TaggedStruct("Permitted", {
    approvalReceipt: Schema.NonEmptyString.pipe(
      Schema.brand(
        "@bundjil/infrastructure/InfrastructureDestructiveApprovalReceipt"
      )
    ),
  }),
]);
export type InfrastructureDestructivePolicy =
  typeof InfrastructureDestructivePolicy.Type;
export type InfrastructureDestructivePolicyEncoded =
  typeof InfrastructureDestructivePolicy.Encoded;

export const AlchemyLogicalResourceId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/AlchemyLogicalResourceId")
);
export type AlchemyLogicalResourceId = typeof AlchemyLogicalResourceId.Type;
export type AlchemyLogicalResourceIdEncoded =
  typeof AlchemyLogicalResourceId.Encoded;

export const SyntheticPhysicalResourceId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/SyntheticPhysicalResourceId")
);
export type SyntheticPhysicalResourceId =
  typeof SyntheticPhysicalResourceId.Type;
export type SyntheticPhysicalResourceIdEncoded =
  typeof SyntheticPhysicalResourceId.Encoded;

export const VercelProjectId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/VercelProjectId")
);
export type VercelProjectId = typeof VercelProjectId.Type;
export type VercelProjectIdEncoded = typeof VercelProjectId.Encoded;

export const VercelDeploymentId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/VercelDeploymentId")
);
export type VercelDeploymentId = typeof VercelDeploymentId.Type;
export type VercelDeploymentIdEncoded = typeof VercelDeploymentId.Encoded;

export const PreviewInfrastructureStateRevision = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/PreviewInfrastructureStateRevision")
);
export type PreviewInfrastructureStateRevision =
  typeof PreviewInfrastructureStateRevision.Type;
export type PreviewInfrastructureStateRevisionEncoded =
  typeof PreviewInfrastructureStateRevision.Encoded;

export const ProductionInfrastructureStateRevision = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/ProductionInfrastructureStateRevision")
);
export type ProductionInfrastructureStateRevision =
  typeof ProductionInfrastructureStateRevision.Type;
export type ProductionInfrastructureStateRevisionEncoded =
  typeof ProductionInfrastructureStateRevision.Encoded;

export const InfrastructureStateRevision = Schema.Union([
  Schema.TaggedStruct("Preview", {
    revision: PreviewInfrastructureStateRevision,
  }),
  Schema.TaggedStruct("Production", {
    revision: ProductionInfrastructureStateRevision,
  }),
]);
export type InfrastructureStateRevision =
  typeof InfrastructureStateRevision.Type;
export type InfrastructureStateRevisionEncoded =
  typeof InfrastructureStateRevision.Encoded;

export const AdoptionManifestDigest = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
  Schema.brand("@bundjil/infrastructure/AdoptionManifestDigest")
);
export type AdoptionManifestDigest = typeof AdoptionManifestDigest.Type;
export type AdoptionManifestDigestEncoded =
  typeof AdoptionManifestDigest.Encoded;

export const SyntheticDesiredValue = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(128)),
  Schema.brand("@bundjil/infrastructure/SyntheticDesiredValue")
);
export type SyntheticDesiredValue = typeof SyntheticDesiredValue.Type;
export type SyntheticDesiredValueEncoded = typeof SyntheticDesiredValue.Encoded;

export const InfrastructureStackName = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/InfrastructureStackName")
);
export type InfrastructureStackName = typeof InfrastructureStackName.Type;
export type InfrastructureStackNameEncoded =
  typeof InfrastructureStackName.Encoded;

export const InfrastructureManifestPath = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/InfrastructureManifestPath")
);
export type InfrastructureManifestPath = typeof InfrastructureManifestPath.Type;
export type InfrastructureManifestPathEncoded =
  typeof InfrastructureManifestPath.Encoded;

export const InfrastructureCommandInput = Schema.Struct({
  stack: InfrastructureStackName,
  stage: InfrastructureStage,
  mode: InfrastructureMode,
  manifestPath: Schema.optional(InfrastructureManifestPath),
  manifestDigest: Schema.optional(AdoptionManifestDigest),
});
export type InfrastructureCommandInput = typeof InfrastructureCommandInput.Type;
export type InfrastructureCommandInputEncoded =
  typeof InfrastructureCommandInput.Encoded;

export const SyntheticResourceProps = Schema.Struct({
  stage: InfrastructureStage,
  logicalId: AlchemyLogicalResourceId,
  physicalId: SyntheticPhysicalResourceId,
  desiredValue: SyntheticDesiredValue,
  adoptionManifestDigest: AdoptionManifestDigest,
  removalPolicy: InfrastructureRemovalPolicy,
  destructivePolicy: InfrastructureDestructivePolicy,
});
export type SyntheticResourceProps = typeof SyntheticResourceProps.Type;
export type SyntheticResourcePropsEncoded =
  typeof SyntheticResourceProps.Encoded;

export const SyntheticResourceAttributes = Schema.Struct({
  stage: InfrastructureStage,
  physicalId: SyntheticPhysicalResourceId,
  observedValue: SyntheticDesiredValue,
  observedMetadataDigest: AdoptionManifestDigest,
  ownership: InfrastructureOwnershipState,
  stateRevision: InfrastructureStateRevision,
});
export type SyntheticResourceAttributes =
  typeof SyntheticResourceAttributes.Type;
export type SyntheticResourceAttributesEncoded =
  typeof SyntheticResourceAttributes.Encoded;

export const ObserveSyntheticResource = Schema.Struct({
  stage: InfrastructureStage,
  physicalId: SyntheticPhysicalResourceId,
});
export type ObserveSyntheticResource = typeof ObserveSyntheticResource.Type;
export type ObserveSyntheticResourceEncoded =
  typeof ObserveSyntheticResource.Encoded;

export const SyntheticResourceObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    stage: InfrastructureStage,
    physicalId: SyntheticPhysicalResourceId,
  }),
  Schema.TaggedStruct("Found", {
    attributes: SyntheticResourceAttributes,
  }),
]);
export type SyntheticResourceObservation =
  typeof SyntheticResourceObservation.Type;
export type SyntheticResourceObservationEncoded =
  typeof SyntheticResourceObservation.Encoded;

export const ReconcileSyntheticResource = Schema.Struct({
  desired: SyntheticResourceProps,
  observed: SyntheticResourceObservation,
});
export type ReconcileSyntheticResource = typeof ReconcileSyntheticResource.Type;
export type ReconcileSyntheticResourceEncoded =
  typeof ReconcileSyntheticResource.Encoded;

export const ReconciledSyntheticResource = Schema.Struct({
  attributes: SyntheticResourceAttributes,
  result: Schema.Literals(["created", "updated", "no_op", "recovered"]),
});
export type ReconciledSyntheticResource =
  typeof ReconciledSyntheticResource.Type;
export type ReconciledSyntheticResourceEncoded =
  typeof ReconciledSyntheticResource.Encoded;

export const DeleteSyntheticResource = Schema.Struct({
  attributes: SyntheticResourceAttributes,
  destructivePolicy: InfrastructureDestructivePolicy,
});
export type DeleteSyntheticResource = typeof DeleteSyntheticResource.Type;
export type DeleteSyntheticResourceEncoded =
  typeof DeleteSyntheticResource.Encoded;

export const DeletedSyntheticResource = Schema.Struct({
  stage: InfrastructureStage,
  physicalId: SyntheticPhysicalResourceId,
  result: Schema.Literals(["deleted", "alreadyMissing"]),
});
export type DeletedSyntheticResource = typeof DeletedSyntheticResource.Type;
export type DeletedSyntheticResourceEncoded =
  typeof DeletedSyntheticResource.Encoded;

export const ListSyntheticResources = Schema.Struct({
  stage: InfrastructureStage,
});
export type ListSyntheticResources = typeof ListSyntheticResources.Type;
export type ListSyntheticResourcesEncoded =
  typeof ListSyntheticResources.Encoded;

export const ListedSyntheticResources = Schema.Struct({
  resources: Schema.Array(SyntheticResourceAttributes),
});
export type ListedSyntheticResources = typeof ListedSyntheticResources.Type;
export type ListedSyntheticResourcesEncoded =
  typeof ListedSyntheticResources.Encoded;

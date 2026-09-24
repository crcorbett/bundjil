import { Schema } from "effect";

export const InfrastructureStage = Schema.Literals(["preview", "prod"]);
export type InfrastructureStage = typeof InfrastructureStage.Type;

export const InfrastructureMode = Schema.Literals([
  "inventory",
  "plan",
  "apply",
  "adopt",
  "sync",
  "offline",
]);
export type InfrastructureMode = typeof InfrastructureMode.Type;

export const InfrastructureProvider = Schema.Literals([
  "synthetic",
  "vercel",
  "photon",
]);
export type InfrastructureProvider = typeof InfrastructureProvider.Type;

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

export const InfrastructureOwnershipState = Schema.Literals([
  "Owned",
  "Unowned",
]);
export type InfrastructureOwnershipState =
  typeof InfrastructureOwnershipState.Type;

export const InfrastructureDiffClass = Schema.Literals([
  "no_op",
  "update",
  "replace",
]);
export type InfrastructureDiffClass = typeof InfrastructureDiffClass.Type;

export const InfrastructureRetryClass = Schema.Literals([
  "never",
  "backoff",
  "readbackRequired",
]);
export type InfrastructureRetryClass = typeof InfrastructureRetryClass.Type;

export const InfrastructureOutcomeCertainty = Schema.Union([
  Schema.TaggedStruct("Known", {}),
  Schema.TaggedStruct("Uncertain", {
    recovery: Schema.Literals(["observeByPhysicalIdentity", "operatorReview"]),
  }),
]);
export type InfrastructureOutcomeCertainty =
  typeof InfrastructureOutcomeCertainty.Type;

export const InfrastructureRemovalPolicy = Schema.Literals([
  "retain",
  "destroy",
]);
export type InfrastructureRemovalPolicy =
  typeof InfrastructureRemovalPolicy.Type;

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

export const AlchemyLogicalResourceId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/AlchemyLogicalResourceId")
);
export type AlchemyLogicalResourceId = typeof AlchemyLogicalResourceId.Type;

export const SyntheticPhysicalResourceId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/SyntheticPhysicalResourceId")
);
export type SyntheticPhysicalResourceId =
  typeof SyntheticPhysicalResourceId.Type;

export const PreviewInfrastructureStateRevision = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/PreviewInfrastructureStateRevision")
);
export type PreviewInfrastructureStateRevision =
  typeof PreviewInfrastructureStateRevision.Type;

export const ProductionInfrastructureStateRevision = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/ProductionInfrastructureStateRevision")
);
export type ProductionInfrastructureStateRevision =
  typeof ProductionInfrastructureStateRevision.Type;

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

export const AdoptionManifestDigest = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/u)),
  Schema.brand("@bundjil/infrastructure/AdoptionManifestDigest")
);
export type AdoptionManifestDigest = typeof AdoptionManifestDigest.Type;

export const SyntheticDesiredValue = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(128)),
  Schema.brand("@bundjil/infrastructure/SyntheticDesiredValue")
);
export type SyntheticDesiredValue = typeof SyntheticDesiredValue.Type;

export const InfrastructureStackName = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/InfrastructureStackName")
);
export type InfrastructureStackName = typeof InfrastructureStackName.Type;

export const InfrastructureManifestPath = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/InfrastructureManifestPath")
);
export type InfrastructureManifestPath = typeof InfrastructureManifestPath.Type;

export const InfrastructureCommandInput = Schema.Struct({
  stack: InfrastructureStackName,
  stage: InfrastructureStage,
  mode: InfrastructureMode,
  manifestPath: Schema.optional(InfrastructureManifestPath),
  manifestDigest: Schema.optional(AdoptionManifestDigest),
});
export type InfrastructureCommandInput = typeof InfrastructureCommandInput.Type;

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

export const ObserveSyntheticResource = Schema.Struct({
  stage: InfrastructureStage,
  physicalId: SyntheticPhysicalResourceId,
});
export type ObserveSyntheticResource = typeof ObserveSyntheticResource.Type;

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

export const ReconcileSyntheticResource = Schema.Struct({
  desired: SyntheticResourceProps,
  observed: SyntheticResourceObservation,
});
export type ReconcileSyntheticResource = typeof ReconcileSyntheticResource.Type;

export const ReconciledSyntheticResource = Schema.Struct({
  attributes: SyntheticResourceAttributes,
  result: Schema.Literals(["created", "updated", "no_op", "recovered"]),
});
export type ReconciledSyntheticResource =
  typeof ReconciledSyntheticResource.Type;

export const DeleteSyntheticResource = Schema.Struct({
  attributes: SyntheticResourceAttributes,
  destructivePolicy: InfrastructureDestructivePolicy,
});
export type DeleteSyntheticResource = typeof DeleteSyntheticResource.Type;

export const DeletedSyntheticResource = Schema.Struct({
  stage: InfrastructureStage,
  physicalId: SyntheticPhysicalResourceId,
  result: Schema.Literals(["deleted", "alreadyMissing"]),
});
export type DeletedSyntheticResource = typeof DeletedSyntheticResource.Type;

export const ListSyntheticResources = Schema.Struct({
  stage: InfrastructureStage,
});
export type ListSyntheticResources = typeof ListSyntheticResources.Type;

export const ListedSyntheticResources = Schema.Struct({
  resources: Schema.Array(SyntheticResourceAttributes),
});
export type ListedSyntheticResources = typeof ListedSyntheticResources.Type;

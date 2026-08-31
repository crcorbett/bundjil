import { Schema } from "effect";

import {
  InfrastructureOwnershipState,
  InfrastructureStage,
} from "../schemas.js";
import { SecretOwnership } from "../secret-reference.js";

export const VercelTeamId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/vercel/VercelTeamId")
);
export type VercelTeamId = typeof VercelTeamId.Type;
export type VercelTeamIdEncoded = typeof VercelTeamId.Encoded;

export const VercelProjectId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/vercel/VercelProjectId")
);
export type VercelProjectId = typeof VercelProjectId.Type;
export type VercelProjectIdEncoded = typeof VercelProjectId.Encoded;

export const VercelEnvironmentVariableId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/vercel/VercelEnvironmentVariableId")
);
export type VercelEnvironmentVariableId =
  typeof VercelEnvironmentVariableId.Type;
export type VercelEnvironmentVariableIdEncoded =
  typeof VercelEnvironmentVariableId.Encoded;

export const VercelEnvironmentVariableKey = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isPattern(/^[A-Z][A-Z0-9_]*$/u)),
  Schema.brand("@bundjil/infrastructure/vercel/VercelEnvironmentVariableKey")
);
export type VercelEnvironmentVariableKey =
  typeof VercelEnvironmentVariableKey.Type;
export type VercelEnvironmentVariableKeyEncoded =
  typeof VercelEnvironmentVariableKey.Encoded;

export const VercelEnvironmentVariableUpdatedAt = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0)),
  Schema.brand(
    "@bundjil/infrastructure/vercel/VercelEnvironmentVariableUpdatedAt"
  )
);
export type VercelEnvironmentVariableUpdatedAt =
  typeof VercelEnvironmentVariableUpdatedAt.Type;
export type VercelEnvironmentVariableUpdatedAtEncoded =
  typeof VercelEnvironmentVariableUpdatedAt.Encoded;

export const VercelGitBranch = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/vercel/VercelGitBranch")
);
export type VercelGitBranch = typeof VercelGitBranch.Type;
export type VercelGitBranchEncoded = typeof VercelGitBranch.Encoded;

export const VercelCanonicalDomain = Schema.NonEmptyString.pipe(
  Schema.check(
    Schema.isPattern(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u
    )
  ),
  Schema.brand("@bundjil/infrastructure/vercel/VercelCanonicalDomain")
);
export type VercelCanonicalDomain = typeof VercelCanonicalDomain.Type;
export type VercelCanonicalDomainEncoded = typeof VercelCanonicalDomain.Encoded;

export const VercelIntegrationId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/vercel/VercelIntegrationId")
);
export type VercelIntegrationId = typeof VercelIntegrationId.Type;
export type VercelIntegrationIdEncoded = typeof VercelIntegrationId.Encoded;

export const VercelIntegrationConfigurationId = Schema.NonEmptyString.pipe(
  Schema.brand(
    "@bundjil/infrastructure/vercel/VercelIntegrationConfigurationId"
  )
);
export type VercelIntegrationConfigurationId =
  typeof VercelIntegrationConfigurationId.Type;
export type VercelIntegrationConfigurationIdEncoded =
  typeof VercelIntegrationConfigurationId.Encoded;

export const VercelMarketplaceResourceId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/vercel/VercelMarketplaceResourceId")
);
export type VercelMarketplaceResourceId =
  typeof VercelMarketplaceResourceId.Type;
export type VercelMarketplaceResourceIdEncoded =
  typeof VercelMarketplaceResourceId.Encoded;

export const VercelMarketplaceDatabaseId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/vercel/VercelMarketplaceDatabaseId")
);
export type VercelMarketplaceDatabaseId =
  typeof VercelMarketplaceDatabaseId.Type;
export type VercelMarketplaceDatabaseIdEncoded =
  typeof VercelMarketplaceDatabaseId.Encoded;

export const VercelDeploymentId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/vercel/VercelDeploymentId")
);
export type VercelDeploymentId = typeof VercelDeploymentId.Type;
export type VercelDeploymentIdEncoded = typeof VercelDeploymentId.Encoded;

export const VercelGitSha = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{40}$/u)),
  Schema.brand("@bundjil/infrastructure/vercel/VercelGitSha")
);
export type VercelGitSha = typeof VercelGitSha.Type;
export type VercelGitShaEncoded = typeof VercelGitSha.Encoded;

export const VercelPaginationCursor = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/vercel/VercelPaginationCursor")
);
export type VercelPaginationCursor = typeof VercelPaginationCursor.Type;
export type VercelPaginationCursorEncoded =
  typeof VercelPaginationCursor.Encoded;

export const VercelProjectName = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/infrastructure/vercel/VercelProjectName")
);
export type VercelProjectName = typeof VercelProjectName.Type;
export type VercelProjectNameEncoded = typeof VercelProjectName.Encoded;

export const VercelProjectFramework = Schema.Literals([
  "vite",
  "nextjs",
  "other",
]);
export type VercelProjectFramework = typeof VercelProjectFramework.Type;
export type VercelProjectFrameworkEncoded =
  typeof VercelProjectFramework.Encoded;

export const VercelEnvironmentTarget = Schema.Literals([
  "preview",
  "production",
  "development",
]);
export type VercelEnvironmentTarget = typeof VercelEnvironmentTarget.Type;
export type VercelEnvironmentTargetEncoded =
  typeof VercelEnvironmentTarget.Encoded;

export const VercelEnvironmentVariableType = Schema.Literals([
  "plain",
  "encrypted",
  "secret",
  "system",
  "sensitive",
]);
export type VercelEnvironmentVariableType =
  typeof VercelEnvironmentVariableType.Type;
export type VercelEnvironmentVariableTypeEncoded =
  typeof VercelEnvironmentVariableType.Encoded;

export const VercelDeploymentTarget = Schema.Literals([
  "preview",
  "production",
]);
export type VercelDeploymentTarget = typeof VercelDeploymentTarget.Type;
export type VercelDeploymentTargetEncoded =
  typeof VercelDeploymentTarget.Encoded;

export const VercelDeploymentStatus = Schema.Literals([
  "BUILDING",
  "READY",
  "ERROR",
  "CANCELED",
  "QUEUED",
]);
export type VercelDeploymentStatus = typeof VercelDeploymentStatus.Type;
export type VercelDeploymentStatusEncoded =
  typeof VercelDeploymentStatus.Encoded;

export const VercelReadOperation = Schema.Literals([
  "listProjects",
  "discoverProject",
  "observeProject",
  "listDomains",
  "observeDomain",
  "listEnvironmentVariables",
  "observeEnvironmentVariable",
  "listMarketplaceBindings",
  "observeMarketplaceBinding",
  "listDeployments",
  "observeDeployment",
]);
export type VercelReadOperation = typeof VercelReadOperation.Type;
export type VercelReadOperationEncoded = typeof VercelReadOperation.Encoded;

export const VercelCredentialScope = Schema.Union([
  Schema.TaggedStruct("Team", { teamId: VercelTeamId }),
  Schema.TaggedStruct("Project", { projectId: VercelProjectId }),
]);
export type VercelCredentialScope = typeof VercelCredentialScope.Type;
export type VercelCredentialScopeEncoded = typeof VercelCredentialScope.Encoded;

export const VercelCredentialFailureReason = Schema.Literals([
  "configurationUnavailable",
  "projectScopeUnavailable",
  "teamScopeUnavailable",
]);
export type VercelCredentialFailureReason =
  typeof VercelCredentialFailureReason.Type;
export type VercelCredentialFailureReasonEncoded =
  typeof VercelCredentialFailureReason.Encoded;

export const VercelAccessToken = Schema.Redacted(Schema.NonEmptyString);
export type VercelAccessToken = typeof VercelAccessToken.Type;
export type VercelAccessTokenEncoded = typeof VercelAccessToken.Encoded;

export const VercelReadFailureReason = Schema.Literals([
  "notFound",
  "ambiguous",
  "teamMismatch",
  "rateLimited",
  "transient",
  "invalidResponse",
  "requestFailed",
  "writeForbidden",
]);
export type VercelReadFailureReason = typeof VercelReadFailureReason.Type;
export type VercelReadFailureReasonEncoded =
  typeof VercelReadFailureReason.Encoded;

export const VercelProjectProps = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
});
export type VercelProjectProps = typeof VercelProjectProps.Type;
export type VercelProjectPropsEncoded = typeof VercelProjectProps.Encoded;

export const VercelProjectAttributes = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  name: VercelProjectName,
  framework: VercelProjectFramework,
  rootDirectory: Schema.NullOr(Schema.String),
  ownership: InfrastructureOwnershipState,
});
export type VercelProjectAttributes = typeof VercelProjectAttributes.Type;
export type VercelProjectAttributesEncoded =
  typeof VercelProjectAttributes.Encoded;

export const VercelProjectObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    stage: InfrastructureStage,
    teamId: VercelTeamId,
    projectId: VercelProjectId,
  }),
  Schema.TaggedStruct("Found", { attributes: VercelProjectAttributes }),
]);
export type VercelProjectObservation = typeof VercelProjectObservation.Type;
export type VercelProjectObservationEncoded =
  typeof VercelProjectObservation.Encoded;

export const ObserveVercelProject = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
});
export type ObserveVercelProject = typeof ObserveVercelProject.Type;
export type ObserveVercelProjectEncoded = typeof ObserveVercelProject.Encoded;

export const DiscoverVercelProject = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  name: VercelProjectName,
});
export type DiscoverVercelProject = typeof DiscoverVercelProject.Type;
export type DiscoverVercelProjectEncoded = typeof DiscoverVercelProject.Encoded;

export const VercelProjectDiscovery = Schema.Union([
  Schema.TaggedStruct("Missing", {
    stage: InfrastructureStage,
    teamId: VercelTeamId,
    name: VercelProjectName,
  }),
  Schema.TaggedStruct("Found", { attributes: VercelProjectAttributes }),
]);
export type VercelProjectDiscovery = typeof VercelProjectDiscovery.Type;
export type VercelProjectDiscoveryEncoded =
  typeof VercelProjectDiscovery.Encoded;

export const ListVercelProjects = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
});
export type ListVercelProjects = typeof ListVercelProjects.Type;
export type ListVercelProjectsEncoded = typeof ListVercelProjects.Encoded;

export const ListedVercelProjects = Schema.Struct({
  projects: Schema.Array(VercelProjectAttributes),
});
export type ListedVercelProjects = typeof ListedVercelProjects.Type;
export type ListedVercelProjectsEncoded = typeof ListedVercelProjects.Encoded;

export const VercelProjectDomainProps = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  domain: VercelCanonicalDomain,
});
export type VercelProjectDomainProps = typeof VercelProjectDomainProps.Type;
export type VercelProjectDomainPropsEncoded =
  typeof VercelProjectDomainProps.Encoded;

export const VercelProjectDomainAttributes = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  domain: VercelCanonicalDomain,
  verified: Schema.Boolean,
  ownership: InfrastructureOwnershipState,
});
export type VercelProjectDomainAttributes =
  typeof VercelProjectDomainAttributes.Type;
export type VercelProjectDomainAttributesEncoded =
  typeof VercelProjectDomainAttributes.Encoded;

export const VercelProjectDomainObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    stage: InfrastructureStage,
    teamId: VercelTeamId,
    projectId: VercelProjectId,
    domain: VercelCanonicalDomain,
  }),
  Schema.TaggedStruct("Found", {
    attributes: VercelProjectDomainAttributes,
  }),
]);
export type VercelProjectDomainObservation =
  typeof VercelProjectDomainObservation.Type;
export type VercelProjectDomainObservationEncoded =
  typeof VercelProjectDomainObservation.Encoded;

export const ObserveVercelProjectDomain = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  domain: VercelCanonicalDomain,
});
export type ObserveVercelProjectDomain = typeof ObserveVercelProjectDomain.Type;
export type ObserveVercelProjectDomainEncoded =
  typeof ObserveVercelProjectDomain.Encoded;

export const ListVercelProjectDomains = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
});
export type ListVercelProjectDomains = typeof ListVercelProjectDomains.Type;
export type ListVercelProjectDomainsEncoded =
  typeof ListVercelProjectDomains.Encoded;

export const ListedVercelProjectDomains = Schema.Struct({
  domains: Schema.Array(VercelProjectDomainAttributes),
});
export type ListedVercelProjectDomains = typeof ListedVercelProjectDomains.Type;
export type ListedVercelProjectDomainsEncoded =
  typeof ListedVercelProjectDomains.Encoded;

export const VercelEnvironmentVariableDesiredState = Schema.Struct({
  key: VercelEnvironmentVariableKey,
  type: VercelEnvironmentVariableType,
  targets: Schema.Array(VercelEnvironmentTarget).pipe(
    Schema.check(Schema.isMinLength(1))
  ),
  gitBranch: Schema.optional(VercelGitBranch),
  valueOwnership: SecretOwnership,
});
export type VercelEnvironmentVariableDesiredState =
  typeof VercelEnvironmentVariableDesiredState.Type;
export type VercelEnvironmentVariableDesiredStateEncoded =
  typeof VercelEnvironmentVariableDesiredState.Encoded;

export const VercelEnvironmentVariableProps = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  environmentVariableId: VercelEnvironmentVariableId,
  desired: Schema.optional(VercelEnvironmentVariableDesiredState),
});
export type VercelEnvironmentVariableProps =
  typeof VercelEnvironmentVariableProps.Type;
export type VercelEnvironmentVariablePropsEncoded =
  typeof VercelEnvironmentVariableProps.Encoded;

export const VercelEnvironmentVariableAttributes = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  environmentVariableId: VercelEnvironmentVariableId,
  key: VercelEnvironmentVariableKey,
  type: VercelEnvironmentVariableType,
  targets: Schema.Array(VercelEnvironmentTarget),
  gitBranch: Schema.optional(VercelGitBranch),
  sensitive: Schema.Boolean,
  providerUpdatedAt: Schema.optional(VercelEnvironmentVariableUpdatedAt),
  valueOwnership: SecretOwnership,
  deploymentRequired: Schema.Boolean,
  ownership: InfrastructureOwnershipState,
});
export type VercelEnvironmentVariableAttributes =
  typeof VercelEnvironmentVariableAttributes.Type;
export type VercelEnvironmentVariableAttributesEncoded =
  typeof VercelEnvironmentVariableAttributes.Encoded;

export const VercelEnvironmentVariableObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    stage: InfrastructureStage,
    teamId: VercelTeamId,
    projectId: VercelProjectId,
    environmentVariableId: VercelEnvironmentVariableId,
  }),
  Schema.TaggedStruct("Found", {
    attributes: VercelEnvironmentVariableAttributes,
  }),
]);
export type VercelEnvironmentVariableObservation =
  typeof VercelEnvironmentVariableObservation.Type;
export type VercelEnvironmentVariableObservationEncoded =
  typeof VercelEnvironmentVariableObservation.Encoded;

export const ObserveVercelEnvironmentVariable = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  environmentVariableId: VercelEnvironmentVariableId,
});
export type ObserveVercelEnvironmentVariable =
  typeof ObserveVercelEnvironmentVariable.Type;
export type ObserveVercelEnvironmentVariableEncoded =
  typeof ObserveVercelEnvironmentVariable.Encoded;

export const ListVercelEnvironmentVariables = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
});
export type ListVercelEnvironmentVariables =
  typeof ListVercelEnvironmentVariables.Type;
export type ListVercelEnvironmentVariablesEncoded =
  typeof ListVercelEnvironmentVariables.Encoded;

export const ListedVercelEnvironmentVariables = Schema.Struct({
  environmentVariables: Schema.Array(VercelEnvironmentVariableAttributes),
});
export type ListedVercelEnvironmentVariables =
  typeof ListedVercelEnvironmentVariables.Type;
export type ListedVercelEnvironmentVariablesEncoded =
  typeof ListedVercelEnvironmentVariables.Encoded;

export const VercelMarketplaceBindingProps = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  integrationId: VercelIntegrationId,
  configurationId: VercelIntegrationConfigurationId,
  resourceId: VercelMarketplaceResourceId,
  databaseId: VercelMarketplaceDatabaseId,
});
export type VercelMarketplaceBindingProps =
  typeof VercelMarketplaceBindingProps.Type;
export type VercelMarketplaceBindingPropsEncoded =
  typeof VercelMarketplaceBindingProps.Encoded;

export const VercelMarketplaceBindingAttributes = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  integrationId: VercelIntegrationId,
  configurationId: VercelIntegrationConfigurationId,
  resourceId: VercelMarketplaceResourceId,
  databaseId: VercelMarketplaceDatabaseId,
  ownership: InfrastructureOwnershipState,
});
export type VercelMarketplaceBindingAttributes =
  typeof VercelMarketplaceBindingAttributes.Type;
export type VercelMarketplaceBindingAttributesEncoded =
  typeof VercelMarketplaceBindingAttributes.Encoded;

export const VercelMarketplaceBindingObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    stage: InfrastructureStage,
    teamId: VercelTeamId,
    projectId: VercelProjectId,
    resourceId: VercelMarketplaceResourceId,
  }),
  Schema.TaggedStruct("Found", {
    attributes: VercelMarketplaceBindingAttributes,
  }),
]);
export type VercelMarketplaceBindingObservation =
  typeof VercelMarketplaceBindingObservation.Type;
export type VercelMarketplaceBindingObservationEncoded =
  typeof VercelMarketplaceBindingObservation.Encoded;

export const ObserveVercelMarketplaceBinding = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  integrationId: VercelIntegrationId,
  configurationId: VercelIntegrationConfigurationId,
  resourceId: VercelMarketplaceResourceId,
  databaseId: VercelMarketplaceDatabaseId,
});
export type ObserveVercelMarketplaceBinding =
  typeof ObserveVercelMarketplaceBinding.Type;
export type ObserveVercelMarketplaceBindingEncoded =
  typeof ObserveVercelMarketplaceBinding.Encoded;

export const ListVercelMarketplaceBindings = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
});
export type ListVercelMarketplaceBindings =
  typeof ListVercelMarketplaceBindings.Type;
export type ListVercelMarketplaceBindingsEncoded =
  typeof ListVercelMarketplaceBindings.Encoded;

export const ListedVercelMarketplaceBindings = Schema.Struct({
  bindings: Schema.Array(VercelMarketplaceBindingAttributes),
});
export type ListedVercelMarketplaceBindings =
  typeof ListedVercelMarketplaceBindings.Type;
export type ListedVercelMarketplaceBindingsEncoded =
  typeof ListedVercelMarketplaceBindings.Encoded;

export const VercelDeploymentObservationProps = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  deploymentId: VercelDeploymentId,
});
export type VercelDeploymentObservationProps =
  typeof VercelDeploymentObservationProps.Type;
export type VercelDeploymentObservationPropsEncoded =
  typeof VercelDeploymentObservationProps.Encoded;

export const VercelDeploymentObservationAttributes = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  deploymentId: VercelDeploymentId,
  gitSha: VercelGitSha,
  target: VercelDeploymentTarget,
  status: VercelDeploymentStatus,
  aliases: Schema.Array(VercelCanonicalDomain),
  ownership: InfrastructureOwnershipState,
});
export type VercelDeploymentObservationAttributes =
  typeof VercelDeploymentObservationAttributes.Type;
export type VercelDeploymentObservationAttributesEncoded =
  typeof VercelDeploymentObservationAttributes.Encoded;

export const VercelDeploymentObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    stage: InfrastructureStage,
    teamId: VercelTeamId,
    projectId: VercelProjectId,
    deploymentId: VercelDeploymentId,
  }),
  Schema.TaggedStruct("Found", {
    attributes: VercelDeploymentObservationAttributes,
  }),
]);
export type VercelDeploymentObservation =
  typeof VercelDeploymentObservation.Type;
export type VercelDeploymentObservationEncoded =
  typeof VercelDeploymentObservation.Encoded;

export const ObserveVercelDeployment = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  deploymentId: VercelDeploymentId,
});
export type ObserveVercelDeployment = typeof ObserveVercelDeployment.Type;
export type ObserveVercelDeploymentEncoded =
  typeof ObserveVercelDeployment.Encoded;

export const ListVercelDeployments = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
});
export type ListVercelDeployments = typeof ListVercelDeployments.Type;
export type ListVercelDeploymentsEncoded = typeof ListVercelDeployments.Encoded;

export const ListedVercelDeployments = Schema.Struct({
  deployments: Schema.Array(VercelDeploymentObservationAttributes),
});
export type ListedVercelDeployments = typeof ListedVercelDeployments.Type;
export type ListedVercelDeploymentsEncoded =
  typeof ListedVercelDeployments.Encoded;

export const VercelProviderRate = Schema.Struct({
  remaining: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
  resetEpochSeconds: Schema.Int.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0))
  ),
  retryAfterSeconds: Schema.optional(
    Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0)))
  ),
});
export type VercelProviderRate = typeof VercelProviderRate.Type;
export type VercelProviderRateEncoded = typeof VercelProviderRate.Encoded;

export const VercelProjectsPage = Schema.Struct({
  projects: Schema.Array(VercelProjectAttributes),
  next: Schema.optional(VercelPaginationCursor),
  rate: VercelProviderRate,
});
export type VercelProjectsPage = typeof VercelProjectsPage.Type;
export type VercelProjectsPageEncoded = typeof VercelProjectsPage.Encoded;

export const VercelReadOnlyInventory = Schema.Struct({
  projects: Schema.Array(VercelProjectAttributes),
  domains: Schema.Array(VercelProjectDomainAttributes),
  environmentVariables: Schema.Array(VercelEnvironmentVariableAttributes),
  marketplaceBindings: Schema.Array(VercelMarketplaceBindingAttributes),
  deployments: Schema.Array(VercelDeploymentObservationAttributes),
});
export type VercelReadOnlyInventory = typeof VercelReadOnlyInventory.Type;
export type VercelReadOnlyInventoryEncoded =
  typeof VercelReadOnlyInventory.Encoded;

export const VercelInventoryProjectScope = Schema.Struct({
  stage: InfrastructureStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
});
export type VercelInventoryProjectScope =
  typeof VercelInventoryProjectScope.Type;
export type VercelInventoryProjectScopeEncoded =
  typeof VercelInventoryProjectScope.Encoded;

export const VercelInventoryScope = Schema.Struct({
  projects: Schema.Array(VercelInventoryProjectScope),
});
export type VercelInventoryScope = typeof VercelInventoryScope.Type;
export type VercelInventoryScopeEncoded = typeof VercelInventoryScope.Encoded;

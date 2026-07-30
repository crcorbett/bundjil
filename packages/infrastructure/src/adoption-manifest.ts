import {
  PhotonLineId,
  PhotonProjectId,
  PhotonUserId,
  PhotonWebhookId,
} from "@bundjil/photon/management";
import { Effect, Match, Schema } from "effect";
/* oxlint-disable unicorn/no-array-method-this-argument -- Effect.forEach is a data-first Effect combinator, not Array.prototype.forEach. */

import type { InfrastructureInventoryArtifact } from "./inventory.js";
import { PhotonInventoryScope } from "./photon/schemas.js";
import {
  AdoptionManifestDigest,
  AlchemyLogicalResourceId,
  InfrastructureStage,
  SyntheticPhysicalResourceId,
} from "./schemas.js";
import {
  SecretOwner,
  SecretReference,
  SecretReferenceId,
  SecretRevision,
} from "./secret-reference.js";
import {
  VercelCanonicalDomain,
  VercelDeploymentId,
  VercelEnvironmentVariableId,
  VercelEnvironmentVariableDesiredState,
  VercelIntegrationConfigurationId,
  VercelIntegrationId,
  VercelMarketplaceDatabaseId,
  VercelMarketplaceResourceId,
  VercelProjectId,
  VercelTeamId,
  VercelInventoryScope,
} from "./vercel/schemas.js";

export const AdoptionResourceOwner = Schema.Union([
  Schema.TaggedStruct("Repository", {
    owner: Schema.Literal("@bundjil/infrastructure"),
  }),
  Schema.TaggedStruct("VercelTeam", { teamId: VercelTeamId }),
  Schema.TaggedStruct("PhotonProject", { projectId: PhotonProjectId }),
]);
export type AdoptionResourceOwner = typeof AdoptionResourceOwner.Type;
export type AdoptionResourceOwnerEncoded = typeof AdoptionResourceOwner.Encoded;

const AdoptionResourceFields = {
  stage: InfrastructureStage,
  logicalId: AlchemyLogicalResourceId,
  removalPolicy: Schema.Literal("retain"),
  observedMetadataDigest: AdoptionManifestDigest,
};

const SyntheticAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("synthetic"),
  resourceKind: Schema.Literal("syntheticResource"),
  owner: Schema.TaggedStruct("Repository", {
    owner: Schema.Literal("@bundjil/infrastructure"),
  }),
  physicalId: Schema.Struct({
    resourceId: SyntheticPhysicalResourceId,
  }),
});

const VercelProjectAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("vercel"),
  resourceKind: Schema.Literal("vercelProject"),
  owner: Schema.TaggedStruct("VercelTeam", { teamId: VercelTeamId }),
  physicalId: Schema.Struct({
    teamId: VercelTeamId,
    projectId: VercelProjectId,
  }),
});

const VercelDomainAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("vercel"),
  resourceKind: Schema.Literal("vercelDomain"),
  owner: Schema.TaggedStruct("VercelTeam", { teamId: VercelTeamId }),
  physicalId: Schema.Struct({
    teamId: VercelTeamId,
    projectId: VercelProjectId,
    domain: VercelCanonicalDomain,
  }),
});

const VercelEnvironmentAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("vercel"),
  resourceKind: Schema.Literal("vercelEnvironmentVariable"),
  owner: Schema.TaggedStruct("VercelTeam", { teamId: VercelTeamId }),
  physicalId: Schema.Struct({
    teamId: VercelTeamId,
    projectId: VercelProjectId,
    environmentVariableId: VercelEnvironmentVariableId,
  }),
  desired: VercelEnvironmentVariableDesiredState,
});

const VercelMarketplaceAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("vercel"),
  resourceKind: Schema.Literal("vercelMarketplaceBinding"),
  owner: Schema.TaggedStruct("VercelTeam", { teamId: VercelTeamId }),
  physicalId: Schema.Struct({
    teamId: VercelTeamId,
    projectId: VercelProjectId,
    integrationId: VercelIntegrationId,
    configurationId: VercelIntegrationConfigurationId,
    resourceId: VercelMarketplaceResourceId,
    databaseId: VercelMarketplaceDatabaseId,
  }),
});

const VercelDeploymentAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("vercel"),
  resourceKind: Schema.Literal("vercelDeploymentObservation"),
  owner: Schema.TaggedStruct("VercelTeam", { teamId: VercelTeamId }),
  physicalId: Schema.Struct({
    teamId: VercelTeamId,
    projectId: VercelProjectId,
    deploymentId: VercelDeploymentId,
  }),
});

const PhotonProjectAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("photon"),
  resourceKind: Schema.Literal("photonProjectObservation"),
  owner: Schema.TaggedStruct("PhotonProject", { projectId: PhotonProjectId }),
  physicalId: Schema.Struct({ projectId: PhotonProjectId }),
});

const PhotonPlatformAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("photon"),
  resourceKind: Schema.Literal("photonPlatformConfiguration"),
  owner: Schema.TaggedStruct("PhotonProject", { projectId: PhotonProjectId }),
  physicalId: Schema.Struct({
    projectId: PhotonProjectId,
    platform: Schema.Literal("imessage"),
  }),
});

const PhotonSharedUserAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("photon"),
  resourceKind: Schema.Literal("photonSharedUser"),
  owner: Schema.TaggedStruct("PhotonProject", { projectId: PhotonProjectId }),
  physicalId: Schema.Struct({
    projectId: PhotonProjectId,
    userId: PhotonUserId,
  }),
});

const PhotonWebhookAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("photon"),
  resourceKind: Schema.Literal("photonWebhookObservation"),
  owner: Schema.TaggedStruct("PhotonProject", { projectId: PhotonProjectId }),
  physicalId: Schema.Struct({
    projectId: PhotonProjectId,
    webhookId: PhotonWebhookId,
  }),
});

const PhotonLineAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("photon"),
  resourceKind: Schema.Literal("photonLineObservation"),
  owner: Schema.TaggedStruct("PhotonProject", { projectId: PhotonProjectId }),
  physicalId: Schema.Struct({
    projectId: PhotonProjectId,
    lineId: PhotonLineId,
    platform: Schema.Literal("imessage"),
  }),
});

const PhotonBillingAdoptionManifestResource = Schema.Struct({
  ...AdoptionResourceFields,
  provider: Schema.Literal("photon"),
  resourceKind: Schema.Literal("photonBillingObservation"),
  owner: Schema.TaggedStruct("PhotonProject", { projectId: PhotonProjectId }),
  physicalId: Schema.Struct({ projectId: PhotonProjectId }),
});

export const AdoptionManifestResource = Schema.Union([
  SyntheticAdoptionManifestResource,
  VercelProjectAdoptionManifestResource,
  VercelDomainAdoptionManifestResource,
  VercelEnvironmentAdoptionManifestResource,
  VercelMarketplaceAdoptionManifestResource,
  VercelDeploymentAdoptionManifestResource,
  PhotonProjectAdoptionManifestResource,
  PhotonPlatformAdoptionManifestResource,
  PhotonSharedUserAdoptionManifestResource,
  PhotonWebhookAdoptionManifestResource,
  PhotonLineAdoptionManifestResource,
  PhotonBillingAdoptionManifestResource,
]);
export type AdoptionManifestResource = typeof AdoptionManifestResource.Type;
export type AdoptionManifestResourceEncoded =
  typeof AdoptionManifestResource.Encoded;

const AdoptionManifestWithoutChecks = Schema.Struct({
  schemaVersion: Schema.Literal("1"),
  stage: InfrastructureStage,
  digest: AdoptionManifestDigest,
  resources: Schema.Array(AdoptionManifestResource).pipe(
    Schema.check(Schema.isMinLength(1))
  ),
});

export const AdoptionManifest = AdoptionManifestWithoutChecks.pipe(
  Schema.check(
    Schema.makeFilter<typeof AdoptionManifestWithoutChecks.Type>((manifest) => {
      const issues: Schema.FilterIssue[] = [];
      const logicalIds = new Set<string>();
      for (const [index, resource] of manifest.resources.entries()) {
        if (resource.stage !== manifest.stage) {
          issues.push({
            path: ["resources", index, "stage"],
            issue: "Adoption resource stage must match the manifest stage",
          });
        }
        if (resource.observedMetadataDigest !== manifest.digest) {
          issues.push({
            path: ["resources", index, "observedMetadataDigest"],
            issue:
              "Adoption resource digest must match the observed manifest digest",
          });
        }
        if (logicalIds.has(resource.logicalId)) {
          issues.push({
            path: ["resources", index, "logicalId"],
            issue: "Adoption logical resource identities must be unique",
          });
        }
        logicalIds.add(resource.logicalId);
      }
      return issues;
    })
  )
);
export type AdoptionManifest = typeof AdoptionManifest.Type;
export type AdoptionManifestEncoded = typeof AdoptionManifest.Encoded;

export const AdoptionManifestJson = Schema.fromJsonString(AdoptionManifest);
export type AdoptionManifestJson = typeof AdoptionManifestJson.Type;
export type AdoptionManifestJsonEncoded = typeof AdoptionManifestJson.Encoded;

export const AdoptionManifestBuildMessage = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(300)),
  Schema.brand("@bundjil/infrastructure/AdoptionManifestBuildMessage")
);
export type AdoptionManifestBuildMessage =
  typeof AdoptionManifestBuildMessage.Type;
export type AdoptionManifestBuildMessageEncoded =
  typeof AdoptionManifestBuildMessage.Encoded;

export class AdoptionManifestBuildError extends Schema.TaggedErrorClass<AdoptionManifestBuildError>()(
  "AdoptionManifestBuildError",
  {
    reason: Schema.Literals([
      "photonProjectMissing",
      "photonPlatformMissing",
      "candidateMismatch",
    ]),
    message: AdoptionManifestBuildMessage,
  }
) {}

export const AdoptionProviderScopes = Schema.Struct({
  vercel: VercelInventoryScope,
  photon: PhotonInventoryScope,
});
export type AdoptionProviderScopes = typeof AdoptionProviderScopes.Type;
export type AdoptionProviderScopesEncoded =
  typeof AdoptionProviderScopes.Encoded;

export const AdoptionBindingProfile = Schema.Literals([
  "observedOnly",
  "previewPhotonManaged",
]);
export type AdoptionBindingProfile = typeof AdoptionBindingProfile.Type;
export type AdoptionBindingProfileEncoded =
  typeof AdoptionBindingProfile.Encoded;

const logicalId = Schema.decodeUnknownEffect(AlchemyLogicalResourceId);
const managedPreviewPhotonKeys = new Set([
  "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
  "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
  "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID",
  "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
]);

export const buildAdoptionManifest = Effect.fn("AdoptionManifest.build")(
  function* (
    artifact: InfrastructureInventoryArtifact,
    bindingProfile: AdoptionBindingProfile = "observedOnly"
  ) {
    const digest = yield* Schema.decodeUnknownEffect(AdoptionManifestDigest)(
      artifact.manifestDigest
    );
    const { stage } = artifact.manifest;
    const vercelProjects = yield* Effect.forEach(
      artifact.manifest.vercel.projects,
      (project) =>
        logicalId(`vercel-project:${project.projectId}`).pipe(
          Effect.map((resourceLogicalId) =>
            AdoptionManifestResource.make({
              stage,
              provider: "vercel",
              resourceKind: "vercelProject",
              logicalId: resourceLogicalId,
              physicalId: {
                teamId: project.teamId,
                projectId: project.projectId,
              },
              owner: { _tag: "VercelTeam", teamId: project.teamId },
              removalPolicy: "retain",
              observedMetadataDigest: digest,
            })
          )
        )
    );
    const vercelDomains = yield* Effect.forEach(
      artifact.manifest.vercel.domains,
      (domain) =>
        logicalId(`vercel-domain:${domain.projectId}:${domain.domain}`).pipe(
          Effect.map((resourceLogicalId) =>
            AdoptionManifestResource.make({
              stage,
              provider: "vercel",
              resourceKind: "vercelDomain",
              logicalId: resourceLogicalId,
              physicalId: {
                teamId: domain.teamId,
                projectId: domain.projectId,
                domain: domain.domain,
              },
              owner: { _tag: "VercelTeam", teamId: domain.teamId },
              removalPolicy: "retain",
              observedMetadataDigest: digest,
            })
          )
        )
    );
    const vercelEnvironmentVariables = yield* Effect.forEach(
      artifact.manifest.vercel.environmentVariables,
      (environmentVariable) =>
        Effect.gen(function* buildVercelEnvironmentManifestResource() {
          const valueOwnership =
            bindingProfile === "previewPhotonManaged" &&
            artifact.manifest.stage === "preview" &&
            managedPreviewPhotonKeys.has(environmentVariable.key)
              ? {
                  _tag: "Managed" as const,
                  reference: SecretReference.make({
                    owner: yield* Schema.decodeUnknownEffect(SecretOwner)(
                      "@bundjil/infrastructure/vercel/preview-photon"
                    ),
                    reference: yield* Schema.decodeUnknownEffect(
                      SecretReferenceId
                    )(environmentVariable.environmentVariableId),
                    revision: yield* Schema.decodeUnknownEffect(SecretRevision)(
                      artifact.sourceSha
                    ),
                  }),
                }
              : ({ _tag: "ObservedUnknown", configured: true } as const);
          const resourceLogicalId = yield* logicalId(
            `vercel-environment:${environmentVariable.projectId}:${environmentVariable.environmentVariableId}`
          );
          return AdoptionManifestResource.make({
            stage,
            provider: "vercel",
            resourceKind: "vercelEnvironmentVariable",
            logicalId: resourceLogicalId,
            physicalId: {
              teamId: environmentVariable.teamId,
              projectId: environmentVariable.projectId,
              environmentVariableId: environmentVariable.environmentVariableId,
            },
            desired: VercelEnvironmentVariableDesiredState.make({
              key: environmentVariable.key,
              type: environmentVariable.type,
              targets: environmentVariable.targets,
              gitBranch: environmentVariable.gitBranch,
              valueOwnership,
            }),
            owner: {
              _tag: "VercelTeam",
              teamId: environmentVariable.teamId,
            },
            removalPolicy: "retain",
            observedMetadataDigest: digest,
          });
        })
    );
    const vercelMarketplaceBindings = yield* Effect.forEach(
      artifact.manifest.vercel.marketplaceBindings,
      (binding) =>
        logicalId(
          `vercel-marketplace:${binding.projectId}:${binding.resourceId}`
        ).pipe(
          Effect.map((resourceLogicalId) =>
            AdoptionManifestResource.make({
              stage,
              provider: "vercel",
              resourceKind: "vercelMarketplaceBinding",
              logicalId: resourceLogicalId,
              physicalId: {
                teamId: binding.teamId,
                projectId: binding.projectId,
                integrationId: binding.integrationId,
                configurationId: binding.configurationId,
                resourceId: binding.resourceId,
                databaseId: binding.databaseId,
              },
              owner: { _tag: "VercelTeam", teamId: binding.teamId },
              removalPolicy: "retain",
              observedMetadataDigest: digest,
            })
          )
        )
    );
    const photonProject = yield* Match.value(
      artifact.manifest.photon.project
    ).pipe(
      Match.tag("Found", ({ projectId }) => Effect.succeed(projectId)),
      Match.tag("Missing", () =>
        Effect.fail(
          new AdoptionManifestBuildError({
            reason: "photonProjectMissing",
            message: AdoptionManifestBuildMessage.make(
              "The accepted inventory does not contain a Photon project to adopt."
            ),
          })
        )
      ),
      Match.exhaustive
    );
    const photonPlatform = yield* Match.value(
      artifact.manifest.photon.platform
    ).pipe(
      Match.tag("Found", ({ attributes }) =>
        Effect.succeed(attributes.platform)
      ),
      Match.tag("Missing", () =>
        Effect.fail(
          new AdoptionManifestBuildError({
            reason: "photonPlatformMissing",
            message: AdoptionManifestBuildMessage.make(
              "The accepted inventory does not contain a Photon platform to adopt."
            ),
          })
        )
      ),
      Match.exhaustive
    );
    const photonProjectResources = [
      AdoptionManifestResource.make({
        stage,
        provider: "photon",
        resourceKind: "photonProjectObservation",
        logicalId: yield* logicalId(`photon-project:${photonProject}`),
        physicalId: { projectId: photonProject },
        owner: { _tag: "PhotonProject", projectId: photonProject },
        removalPolicy: "retain",
        observedMetadataDigest: digest,
      }),
      AdoptionManifestResource.make({
        stage,
        provider: "photon",
        resourceKind: "photonPlatformConfiguration",
        logicalId: yield* logicalId(
          `photon-platform:${photonProject}:${photonPlatform}`
        ),
        physicalId: {
          projectId: photonProject,
          platform: photonPlatform,
        },
        owner: { _tag: "PhotonProject", projectId: photonProject },
        removalPolicy: "retain",
        observedMetadataDigest: digest,
      }),
    ];
    const photonUsers = yield* Effect.forEach(
      artifact.manifest.photon.sharedUsers.users,
      (user) =>
        logicalId(`photon-user:${user.projectId}:${user.userId}`).pipe(
          Effect.map((resourceLogicalId) =>
            AdoptionManifestResource.make({
              stage,
              provider: "photon",
              resourceKind: "photonSharedUser",
              logicalId: resourceLogicalId,
              physicalId: {
                projectId: user.projectId,
                userId: user.userId,
              },
              owner: { _tag: "PhotonProject", projectId: user.projectId },
              removalPolicy: "retain",
              observedMetadataDigest: digest,
            })
          )
        )
    );
    const photonWebhooks = yield* Effect.forEach(
      artifact.manifest.photon.webhooks.webhooks,
      (webhook) =>
        logicalId(
          `photon-webhook:${webhook.projectId}:${webhook.webhookId}`
        ).pipe(
          Effect.map((resourceLogicalId) =>
            AdoptionManifestResource.make({
              stage,
              provider: "photon",
              resourceKind: "photonWebhookObservation",
              logicalId: resourceLogicalId,
              physicalId: {
                projectId: webhook.projectId,
                webhookId: webhook.webhookId,
              },
              owner: { _tag: "PhotonProject", projectId: webhook.projectId },
              removalPolicy: "retain",
              observedMetadataDigest: digest,
            })
          )
        )
    );
    const photonLines = yield* Effect.forEach(
      artifact.manifest.photon.lines.lines,
      (line) =>
        logicalId(`photon-line:${line.projectId}:${line.lineId}`).pipe(
          Effect.map((resourceLogicalId) =>
            AdoptionManifestResource.make({
              stage,
              provider: "photon",
              resourceKind: "photonLineObservation",
              logicalId: resourceLogicalId,
              physicalId: {
                projectId: line.projectId,
                lineId: line.lineId,
                platform: line.platform,
              },
              owner: { _tag: "PhotonProject", projectId: line.projectId },
              removalPolicy: "retain",
              observedMetadataDigest: digest,
            })
          )
        )
    );
    const photonBilling = AdoptionManifestResource.make({
      stage,
      provider: "photon",
      resourceKind: "photonBillingObservation",
      logicalId: yield* logicalId(`photon-billing:${photonProject}`),
      physicalId: { projectId: photonProject },
      owner: { _tag: "PhotonProject", projectId: photonProject },
      removalPolicy: "retain",
      observedMetadataDigest: digest,
    });
    const vercelDeployments = yield* Effect.forEach(
      artifact.manifest.vercel.deployments,
      (deployment) =>
        logicalId(
          `vercel-deployment:${deployment.projectId}:${deployment.deploymentId}`
        ).pipe(
          Effect.map((resourceLogicalId) =>
            AdoptionManifestResource.make({
              stage,
              provider: "vercel",
              resourceKind: "vercelDeploymentObservation",
              logicalId: resourceLogicalId,
              physicalId: {
                teamId: deployment.teamId,
                projectId: deployment.projectId,
                deploymentId: deployment.deploymentId,
              },
              owner: { _tag: "VercelTeam", teamId: deployment.teamId },
              removalPolicy: "retain",
              observedMetadataDigest: digest,
            })
          )
        )
    );

    return AdoptionManifest.make({
      schemaVersion: "1",
      stage,
      digest,
      resources: [
        ...vercelProjects,
        ...vercelDomains,
        ...vercelEnvironmentVariables,
        ...vercelMarketplaceBindings,
        ...photonProjectResources,
        ...photonUsers,
        ...photonWebhooks,
        ...photonLines,
        photonBilling,
        ...vercelDeployments,
      ],
    });
  }
);

export const verifyAdoptionManifestAgainstInventory = Effect.fn(
  "AdoptionManifest.verifyAgainstInventory"
)(function* (
  artifact: InfrastructureInventoryArtifact,
  candidate: AdoptionManifest,
  bindingProfile: AdoptionBindingProfile = "observedOnly"
) {
  const expected = yield* buildAdoptionManifest(artifact, bindingProfile);
  const encodedExpected =
    yield* Schema.encodeEffect(AdoptionManifestJson)(expected);
  const encodedCandidate =
    yield* Schema.encodeEffect(AdoptionManifestJson)(candidate);
  if (encodedExpected !== encodedCandidate) {
    return yield* new AdoptionManifestBuildError({
      reason: "candidateMismatch",
      message: AdoptionManifestBuildMessage.make(
        "The adoption manifest does not exactly match the accepted inventory."
      ),
    });
  }
  return candidate;
});

export const adoptionManifestProviderScopes = Effect.fn(
  "AdoptionManifest.providerScopes"
)(function* (manifest: AdoptionManifest) {
  const vercelProjects = manifest.resources.filter(
    (resource) => resource.resourceKind === "vercelProject"
  );
  const photonProjects = manifest.resources.filter(
    (resource) => resource.resourceKind === "photonProjectObservation"
  );
  if (vercelProjects.length === 0 || photonProjects.length !== 1) {
    return yield* new AdoptionManifestBuildError({
      reason: "candidateMismatch",
      message: AdoptionManifestBuildMessage.make(
        "The adoption manifest must contain Vercel projects and exactly one Photon project."
      ),
    });
  }
  const [photonProject] = photonProjects;
  if (photonProject === undefined) {
    return yield* Effect.die("Photon project cardinality check failed.");
  }
  const vercel = yield* Schema.decodeUnknownEffect(VercelInventoryScope)({
    projects: vercelProjects.map((resource) => ({
      stage: resource.stage,
      teamId: resource.physicalId.teamId,
      projectId: resource.physicalId.projectId,
    })),
  });
  const photon = yield* Schema.decodeUnknownEffect(PhotonInventoryScope)({
    stage: photonProject.stage,
    projectId: photonProject.physicalId.projectId,
    sharedUserIds: manifest.resources
      .filter((resource) => resource.resourceKind === "photonSharedUser")
      .map((resource) => resource.physicalId.userId),
    webhookIds: manifest.resources
      .filter(
        (resource) => resource.resourceKind === "photonWebhookObservation"
      )
      .map((resource) => resource.physicalId.webhookId),
    lineIds: manifest.resources
      .filter((resource) => resource.resourceKind === "photonLineObservation")
      .map((resource) => resource.physicalId.lineId),
  });
  return AdoptionProviderScopes.make({ vercel, photon });
});

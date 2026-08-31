/* oxlint-disable max-classes-per-file, max-lines-per-function, unicorn/no-array-method-this-argument -- The safe error and service share one owner; one linear inventory Effect keeps provider reads and their projections visible; Effect.forEach is not Array.prototype.forEach. */

import {
  ListedPhotonLines,
  ListedPhotonSharedUsers,
  ListedPhotonWebhooks,
  ListPhotonLines,
  ListPhotonSharedUsers,
  ListPhotonWebhooks,
  ObservePhotonBilling,
  ObservePhotonPlatform,
  ObservePhotonProject,
  PhotonBilling,
  PhotonBillingObservation,
  PhotonLines,
  PhotonPaginationLimit,
  PhotonPaginationOffset,
  PhotonPlatformObservation,
  PhotonPlatforms,
  PhotonProjectId,
  PhotonProjects,
  PhotonSharedUsers,
  PhotonWebhooks,
} from "@bundjil/photon/management";
import type {
  PhotonBillingReadError,
  PhotonLinesReadError,
  PhotonPlatformsReadError,
  PhotonProjectsReadError,
  PhotonSharedUsersReadError,
  PhotonWebhooksReadError,
} from "@bundjil/photon/management";
import type { Effect as EffectType } from "effect";
import { Context, Effect, HashSet, Layer, Match, Schema } from "effect";

import { InfrastructureStage } from "./schemas.js";
import type {
  VercelDeploymentsReadError,
  VercelDomainsReadError,
  VercelEnvironmentVariablesReadError,
  VercelMarketplaceBindingsReadError,
  VercelProjectsReadError,
} from "./vercel/errors.js";
import {
  ListVercelDeployments,
  ListVercelEnvironmentVariables,
  ListVercelMarketplaceBindings,
  ListVercelProjectDomains,
  ObserveVercelProject,
  VercelInventoryProjectScope,
  VercelProjectId,
  VercelReadOnlyInventory,
  VercelTeamId,
} from "./vercel/schemas.js";
import {
  VercelDeployments,
  VercelDomains,
  VercelEnvironmentVariables,
  VercelMarketplaceBindings,
  VercelProjects,
} from "./vercel/services.js";

export const InfrastructureInventoryPrincipalFingerprint = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/u)),
  Schema.brand(
    "@bundjil/infrastructure/InfrastructureInventoryPrincipalFingerprint"
  )
);
export type InfrastructureInventoryPrincipalFingerprint =
  typeof InfrastructureInventoryPrincipalFingerprint.Type;
export type InfrastructureInventoryPrincipalFingerprintEncoded =
  typeof InfrastructureInventoryPrincipalFingerprint.Encoded;

export const InfrastructureInventorySourceSha = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{40}$/u)),
  Schema.brand("@bundjil/infrastructure/InfrastructureInventorySourceSha")
);
export type InfrastructureInventorySourceSha =
  typeof InfrastructureInventorySourceSha.Type;
export type InfrastructureInventorySourceShaEncoded =
  typeof InfrastructureInventorySourceSha.Encoded;

export const InfrastructureInventoryDigest = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/u)),
  Schema.brand("@bundjil/infrastructure/InfrastructureInventoryDigest")
);
export type InfrastructureInventoryDigest =
  typeof InfrastructureInventoryDigest.Type;
export type InfrastructureInventoryDigestEncoded =
  typeof InfrastructureInventoryDigest.Encoded;

export const InfrastructureInventoryReadMessage = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(500)),
  Schema.brand("@bundjil/infrastructure/InfrastructureInventoryReadMessage")
);
export type InfrastructureInventoryReadMessage =
  typeof InfrastructureInventoryReadMessage.Type;
export type InfrastructureInventoryReadMessageEncoded =
  typeof InfrastructureInventoryReadMessage.Encoded;

export const InfrastructureInventoryTarget = Schema.Struct({
  stage: InfrastructureStage,
  vercelTeamId: VercelTeamId,
  vercelProjectIds: Schema.Array(VercelProjectId).pipe(
    Schema.check(Schema.isMinLength(1))
  ),
  photonProjectId: PhotonProjectId,
});
export type InfrastructureInventoryTarget =
  typeof InfrastructureInventoryTarget.Type;
export type InfrastructureInventoryTargetEncoded =
  typeof InfrastructureInventoryTarget.Encoded;

export const PhotonInventoryProjectObservation = Schema.Union([
  Schema.TaggedStruct("Missing", { projectId: PhotonProjectId }),
  Schema.TaggedStruct("Found", {
    projectId: PhotonProjectId,
    profileConfigured: Schema.Boolean,
  }),
]);
export type PhotonInventoryProjectObservation =
  typeof PhotonInventoryProjectObservation.Type;
export type PhotonInventoryProjectObservationEncoded =
  typeof PhotonInventoryProjectObservation.Encoded;

export const PhotonReadOnlyInventory = Schema.Struct({
  project: PhotonInventoryProjectObservation,
  platform: PhotonPlatformObservation,
  sharedUsers: ListedPhotonSharedUsers,
  webhooks: ListedPhotonWebhooks,
  lines: ListedPhotonLines,
  billing: PhotonBillingObservation,
});
export type PhotonReadOnlyInventory = typeof PhotonReadOnlyInventory.Type;
export type PhotonReadOnlyInventoryEncoded =
  typeof PhotonReadOnlyInventory.Encoded;

export const InfrastructureObservedManifest = Schema.Struct({
  schemaVersion: Schema.Literal("1"),
  stage: InfrastructureStage,
  vercel: VercelReadOnlyInventory,
  photon: PhotonReadOnlyInventory,
  providerWrites: Schema.Literal(0),
});
export type InfrastructureObservedManifest =
  typeof InfrastructureObservedManifest.Type;
export type InfrastructureObservedManifestEncoded =
  typeof InfrastructureObservedManifest.Encoded;

export const InfrastructureInventoryArtifact = Schema.Struct({
  schemaVersion: Schema.Literal("1"),
  sourceSha: InfrastructureInventorySourceSha,
  principalFingerprint: InfrastructureInventoryPrincipalFingerprint,
  observedAt: Schema.String.pipe(
    Schema.check(
      Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u)
    )
  ),
  manifestDigest: InfrastructureInventoryDigest,
  manifest: InfrastructureObservedManifest,
});
export type InfrastructureInventoryArtifact =
  typeof InfrastructureInventoryArtifact.Type;
export type InfrastructureInventoryArtifactEncoded =
  typeof InfrastructureInventoryArtifact.Encoded;
export const InfrastructureInventoryArtifactJson = Schema.fromJsonString(
  InfrastructureInventoryArtifact
);

export const canonicalizeInfrastructureObservedManifest = Effect.fn(
  "InfrastructureObservedManifest.canonicalize"
)((manifest: InfrastructureObservedManifest) =>
  Effect.succeed(
    InfrastructureObservedManifest.make({
      ...manifest,
      vercel: VercelReadOnlyInventory.make({
        projects: manifest.vercel.projects.toSorted((left, right) =>
          left.projectId.localeCompare(right.projectId)
        ),
        domains: manifest.vercel.domains.toSorted((left, right) =>
          `${left.projectId}:${left.domain}`.localeCompare(
            `${right.projectId}:${right.domain}`
          )
        ),
        environmentVariables: manifest.vercel.environmentVariables.toSorted(
          (left, right) =>
            `${left.projectId}:${left.key}:${left.environmentVariableId}`.localeCompare(
              `${right.projectId}:${right.key}:${right.environmentVariableId}`
            )
        ),
        marketplaceBindings: manifest.vercel.marketplaceBindings.toSorted(
          (left, right) => left.resourceId.localeCompare(right.resourceId)
        ),
        deployments: manifest.vercel.deployments.toSorted((left, right) =>
          left.deploymentId.localeCompare(right.deploymentId)
        ),
      }),
      photon: PhotonReadOnlyInventory.make({
        ...manifest.photon,
        sharedUsers: ListedPhotonSharedUsers.make({
          ...manifest.photon.sharedUsers,
          users: manifest.photon.sharedUsers.users.toSorted((left, right) =>
            left.userId.localeCompare(right.userId)
          ),
        }),
        webhooks: ListedPhotonWebhooks.make({
          webhooks: manifest.photon.webhooks.webhooks.toSorted((left, right) =>
            left.webhookId.localeCompare(right.webhookId)
          ),
        }),
        lines: ListedPhotonLines.make({
          lines: manifest.photon.lines.lines.toSorted((left, right) =>
            left.lineId.localeCompare(right.lineId)
          ),
        }),
      }),
    })
  )
);

export class InfrastructureInventoryReadError extends Schema.TaggedErrorClass<InfrastructureInventoryReadError>()(
  "InfrastructureInventoryReadError",
  {
    reason: Schema.Literals([
      "projectMissing",
      "projectAmbiguous",
      "stageMismatch",
    ]),
    message: InfrastructureInventoryReadMessage,
  }
) {}

export interface InfrastructureInventoryContract {
  readonly read: (
    target: InfrastructureInventoryTarget
  ) => EffectType.Effect<
    InfrastructureObservedManifest,
    | InfrastructureInventoryReadError
    | VercelProjectsReadError
    | VercelDomainsReadError
    | VercelEnvironmentVariablesReadError
    | VercelMarketplaceBindingsReadError
    | VercelDeploymentsReadError
    | PhotonProjectsReadError
    | PhotonPlatformsReadError
    | PhotonSharedUsersReadError
    | PhotonWebhooksReadError
    | PhotonLinesReadError
    | PhotonBillingReadError
  >;
}

export class InfrastructureInventory extends Context.Service<
  InfrastructureInventory,
  InfrastructureInventoryContract
>()("@bundjil/infrastructure/InfrastructureInventory") {}

export const InfrastructureInventoryLive = Layer.effect(
  InfrastructureInventory,
  Effect.gen(function* makeInfrastructureInventory() {
    const projects = yield* VercelProjects;
    const domains = yield* VercelDomains;
    const environmentVariables = yield* VercelEnvironmentVariables;
    const marketplaceBindings = yield* VercelMarketplaceBindings;
    const deployments = yield* VercelDeployments;
    const photonProjects = yield* PhotonProjects;
    const photonPlatforms = yield* PhotonPlatforms;
    const photonSharedUsers = yield* PhotonSharedUsers;
    const photonWebhooks = yield* PhotonWebhooks;
    const photonLines = yield* PhotonLines;
    const photonBilling = yield* PhotonBilling;

    const read = Effect.fn("InfrastructureInventory.read")(function* (
      target: InfrastructureInventoryTarget
    ) {
      if (
        HashSet.size(HashSet.fromIterable(target.vercelProjectIds)) !==
        target.vercelProjectIds.length
      ) {
        return yield* new InfrastructureInventoryReadError({
          reason: "projectAmbiguous",
          message: InfrastructureInventoryReadMessage.make(
            "The authorized Vercel project scope contains duplicate identities."
          ),
        });
      }
      const selectedProjects = yield* Effect.forEach(
        target.vercelProjectIds,
        Effect.fn("InfrastructureInventory.observeVercelProject")(
          function* (projectId) {
            const observation = yield* projects.observeProject(
              ObserveVercelProject.make({
                stage: target.stage,
                teamId: target.vercelTeamId,
                projectId,
              })
            );
            return yield* Match.value(observation).pipe(
              Match.tag("Missing", () =>
                Effect.fail(
                  new InfrastructureInventoryReadError({
                    reason: "projectMissing",
                    message: InfrastructureInventoryReadMessage.make(
                      "An authorized Vercel project identity was not found."
                    ),
                  })
                )
              ),
              Match.tag("Found", ({ attributes }) =>
                Effect.succeed(attributes)
              ),
              Match.exhaustive
            );
          }
        ),
        { concurrency: 1 }
      );

      const projectInventories = yield* Effect.forEach(
        target.vercelProjectIds,
        Effect.fn("InfrastructureInventory.readVercelProject")(
          function* (projectId) {
            const scope = VercelInventoryProjectScope.make({
              stage: target.stage,
              teamId: target.vercelTeamId,
              projectId,
            });
            const observedDomains = yield* domains.listDomains(
              ListVercelProjectDomains.make(scope)
            );
            const observedEnvironmentVariables =
              yield* environmentVariables.listEnvironmentVariables(
                ListVercelEnvironmentVariables.make(scope)
              );
            const observedMarketplaceBindings =
              yield* marketplaceBindings.listMarketplaceBindings(
                ListVercelMarketplaceBindings.make(scope)
              );
            const observedDeployments = yield* deployments.listDeployments(
              ListVercelDeployments.make(scope)
            );
            return {
              domains: observedDomains.domains,
              environmentVariables:
                observedEnvironmentVariables.environmentVariables,
              marketplaceBindings: observedMarketplaceBindings.bindings,
              deployments: observedDeployments.deployments,
            };
          }
        )
      );

      const projectObservation = yield* photonProjects.observeProject(
        ObservePhotonProject.make({ projectId: target.photonProjectId })
      );
      const project = Match.value(projectObservation).pipe(
        Match.tag("Missing", ({ projectId }) =>
          PhotonInventoryProjectObservation.make({
            _tag: "Missing",
            projectId,
          })
        ),
        Match.tag("Found", ({ attributes }) =>
          PhotonInventoryProjectObservation.make({
            _tag: "Found",
            projectId: attributes.projectId,
            profileConfigured: attributes.profileConfigured,
          })
        ),
        Match.exhaustive
      );
      const platform = yield* photonPlatforms.observePlatform(
        ObservePhotonPlatform.make({
          projectId: target.photonProjectId,
          platform: "imessage",
        })
      );
      const sharedUsers = yield* photonSharedUsers.listSharedUsers(
        ListPhotonSharedUsers.make({
          projectId: target.photonProjectId,
          limit: PhotonPaginationLimit.make(100),
          offset: PhotonPaginationOffset.make(0),
        })
      );
      const webhooks = yield* photonWebhooks.listWebhooks(
        ListPhotonWebhooks.make({ projectId: target.photonProjectId })
      );
      const lines = yield* photonLines.listLines(
        ListPhotonLines.make({
          projectId: target.photonProjectId,
          platform: "imessage",
        })
      );
      const billing = yield* photonBilling.observeBilling(
        ObservePhotonBilling.make({ projectId: target.photonProjectId })
      );

      return InfrastructureObservedManifest.make({
        schemaVersion: "1",
        stage: target.stage,
        vercel: VercelReadOnlyInventory.make({
          projects: selectedProjects,
          domains: projectInventories.flatMap((inventory) => inventory.domains),
          environmentVariables: projectInventories.flatMap(
            (inventory) => inventory.environmentVariables
          ),
          marketplaceBindings: projectInventories.flatMap(
            (inventory) => inventory.marketplaceBindings
          ),
          deployments: projectInventories.flatMap(
            (inventory) => inventory.deployments
          ),
        }),
        photon: PhotonReadOnlyInventory.make({
          project,
          platform,
          sharedUsers,
          webhooks,
          lines,
          billing,
        }),
        providerWrites: 0,
      });
    });

    return InfrastructureInventory.of({ read });
  })
);

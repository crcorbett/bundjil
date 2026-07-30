// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */

import type {
  AdoptionManifest,
  AdoptionManifestResource,
} from "@bundjil/infrastructure";
import { InfrastructureStage } from "@bundjil/infrastructure";
import {
  PhotonBillingObservationResource,
  PhotonLineObservationResource,
  PhotonPlatformConfigurationResource,
  PhotonProjectObservationResource,
  PhotonSharedUserResource,
  PhotonWebhookObservationResource,
} from "@bundjil/infrastructure/photon";
import {
  VercelDeploymentObservationResource,
  VercelEnvironmentVariable,
  VercelMarketplaceBinding,
  VercelProject,
  VercelProjectDomain,
} from "@bundjil/infrastructure/vercel";
import { Stage } from "alchemy/Stage";
import { Config, Effect, Match, Schema } from "effect";

const failConfiguration = (message: string) =>
  Schema.decodeUnknownEffect(Schema.Never)(message).pipe(
    Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
  );

type AdoptionProviderRequirements =
  | typeof PhotonBillingObservationResource.Provider
  | typeof PhotonLineObservationResource.Provider
  | typeof PhotonPlatformConfigurationResource.Provider
  | typeof PhotonProjectObservationResource.Provider
  | typeof PhotonSharedUserResource.Provider
  | typeof PhotonWebhookObservationResource.Provider
  | typeof VercelDeploymentObservationResource.Provider
  | typeof VercelEnvironmentVariable.Provider
  | typeof VercelMarketplaceBinding.Provider
  | typeof VercelProject.Provider
  | typeof VercelProjectDomain.Provider;

const deployAdoptionResource = (
  resource: AdoptionManifestResource
): Effect.Effect<unknown, Config.ConfigError, AdoptionProviderRequirements> =>
  Match.value(resource).pipe(
    Match.discriminatorsExhaustive("resourceKind")({
      syntheticResource: () =>
        failConfiguration(
          "Synthetic resources are not valid in the provider-bound adoption stack."
        ),
      vercelProject: (candidate) =>
        VercelProject(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
        }),
      vercelDomain: (candidate) =>
        VercelProjectDomain(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
        }),
      vercelEnvironmentVariable: (candidate) =>
        VercelEnvironmentVariable(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
          desired: candidate.desired,
        }),
      vercelMarketplaceBinding: (candidate) =>
        VercelMarketplaceBinding(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
        }),
      photonProjectObservation: (candidate) =>
        PhotonProjectObservationResource(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
        }),
      photonPlatformConfiguration: (candidate) =>
        PhotonPlatformConfigurationResource(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
        }),
      photonSharedUser: (candidate) =>
        PhotonSharedUserResource(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
        }),
      photonWebhookObservation: (candidate) =>
        PhotonWebhookObservationResource(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
        }),
      photonLineObservation: (candidate) =>
        PhotonLineObservationResource(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
        }),
      photonBillingObservation: (candidate) =>
        PhotonBillingObservationResource(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
        }),
      vercelDeploymentObservation: (candidate) =>
        VercelDeploymentObservationResource(candidate.logicalId, {
          stage: candidate.stage,
          ...candidate.physicalId,
        }),
    })
  );

export const BundjilInfrastructureStack = (manifest: AdoptionManifest) =>
  Effect.gen(function* bundjilInfrastructureStack() {
    const rawStage = yield* Stage;
    const stage = yield* Schema.decodeUnknownEffect(InfrastructureStage)(
      rawStage
    ).pipe(
      Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
    );
    if (stage !== manifest.stage) {
      return yield* failConfiguration(
        "The Alchemy CLI stage does not match the decoded adoption manifest."
      );
    }
    yield* Effect.forEach(manifest.resources, deployAdoptionResource, {
      concurrency: 1,
      discard: true,
    });

    return {
      stage,
      retainedResourceCount: manifest.resources.length,
      observedManifestDigest: manifest.digest,
    };
  });

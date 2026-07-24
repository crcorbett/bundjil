import { Schema } from "effect";

import {
  AdoptionManifestDigest,
  AlchemyLogicalResourceId,
  InfrastructureProvider,
  InfrastructureRemovalPolicy,
  InfrastructureResourceKind,
  InfrastructureStage,
  SyntheticPhysicalResourceId,
} from "./schemas.js";

export const AdoptionManifestResource = Schema.Struct({
  stage: InfrastructureStage,
  provider: InfrastructureProvider,
  resourceKind: InfrastructureResourceKind,
  logicalId: AlchemyLogicalResourceId,
  physicalId: SyntheticPhysicalResourceId,
  removalPolicy: InfrastructureRemovalPolicy,
  observedMetadataDigest: AdoptionManifestDigest,
});
export type AdoptionManifestResource = typeof AdoptionManifestResource.Type;
export type AdoptionManifestResourceEncoded =
  typeof AdoptionManifestResource.Encoded;

export const AdoptionManifest = Schema.Struct({
  schemaVersion: Schema.Literal("1"),
  stage: InfrastructureStage,
  digest: AdoptionManifestDigest,
  resources: Schema.Array(AdoptionManifestResource).pipe(
    Schema.check(Schema.isMinLength(1))
  ),
});
export type AdoptionManifest = typeof AdoptionManifest.Type;
export type AdoptionManifestEncoded = typeof AdoptionManifest.Encoded;

export const AdoptionManifestJson = Schema.fromJsonString(AdoptionManifest);
export type AdoptionManifestJson = typeof AdoptionManifestJson.Type;
export type AdoptionManifestJsonEncoded = typeof AdoptionManifestJson.Encoded;

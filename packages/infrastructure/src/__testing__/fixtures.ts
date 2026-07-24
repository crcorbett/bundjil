import { Effect, Schema } from "effect";

import {
  AdoptionManifest,
  AdoptionManifestResource,
} from "../adoption-manifest.js";
import {
  SyntheticMemoryConfig,
  SyntheticMemoryFailureMode,
} from "../memory.layer.js";
import {
  AdoptionManifestDigest,
  AlchemyLogicalResourceId,
  PreviewInfrastructureStateRevision,
  SyntheticDesiredValue,
  SyntheticPhysicalResourceId,
  SyntheticResourceAttributes,
  SyntheticResourceProps,
} from "../schemas.js";

const fixtureDigestSource =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

export const decodeSyntheticFixture = Effect.gen(
  function* decodeSyntheticFixtureOperation() {
    const logicalId = yield* Schema.decodeUnknownEffect(
      AlchemyLogicalResourceId
    )("offline-foundation");
    const physicalId = yield* Schema.decodeUnknownEffect(
      SyntheticPhysicalResourceId
    )("synthetic-preview-foundation");
    const desiredValue = yield* Schema.decodeUnknownEffect(
      SyntheticDesiredValue
    )("foundation-v1");
    const digest = yield* Schema.decodeUnknownEffect(AdoptionManifestDigest)(
      fixtureDigestSource
    );
    const props = SyntheticResourceProps.make({
      stage: "preview",
      logicalId,
      physicalId,
      desiredValue,
      adoptionManifestDigest: digest,
      removalPolicy: "retain",
      destructivePolicy: { _tag: "Protected" },
    });
    const manifestResource = AdoptionManifestResource.make({
      stage: "preview",
      provider: "synthetic",
      resourceKind: "syntheticResource",
      logicalId,
      physicalId,
      removalPolicy: "retain",
      observedMetadataDigest: digest,
    });
    const manifest = AdoptionManifest.make({
      schemaVersion: "1",
      stage: "preview",
      digest,
      resources: [manifestResource],
    });
    return { props, manifest };
  }
).pipe(Effect.withSpan("SyntheticFixture.decode"));

export const decodeSyntheticMemoryFixture = Effect.gen(
  function* decodeSyntheticMemoryFixtureOperation() {
    const { props } = yield* decodeSyntheticFixture;
    const revision = yield* Schema.decodeUnknownEffect(
      PreviewInfrastructureStateRevision
    )("memory-preview-adopted");
    return SyntheticMemoryConfig.make({
      resources: [
        SyntheticResourceAttributes.make({
          stage: props.stage,
          physicalId: props.physicalId,
          observedValue: props.desiredValue,
          observedMetadataDigest: props.adoptionManifestDigest,
          ownership: "Unowned",
          stateRevision: {
            _tag: "Preview",
            revision,
          },
        }),
      ],
      failureMode: yield* Schema.decodeUnknownEffect(
        SyntheticMemoryFailureMode
      )("none"),
    });
  }
).pipe(Effect.withSpan("SyntheticMemoryFixture.decode"));

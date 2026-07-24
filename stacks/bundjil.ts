// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */

import {
  AdoptionManifestDigest,
  AlchemyLogicalResourceId,
  InfrastructureStage,
  SyntheticDesiredValue,
  SyntheticPhysicalResourceId,
  SyntheticResource,
  SyntheticResourceProps,
} from "@bundjil/infrastructure";
import { Stage } from "alchemy/Stage";
import { Config, Effect, Schema } from "effect";

export const BundjilInfrastructureStack = Effect.gen(
  function* bundjilInfrastructureStack() {
    const rawStage = yield* Stage;
    const stage =
      yield* Schema.decodeUnknownEffect(InfrastructureStage)(rawStage);
    const logicalId = yield* Schema.decodeUnknownEffect(
      AlchemyLogicalResourceId
    )("offline-foundation");
    const physicalId = yield* Schema.decodeUnknownEffect(
      SyntheticPhysicalResourceId
    )(`synthetic-${stage}-foundation`);
    const desiredValue = yield* Schema.decodeUnknownEffect(
      SyntheticDesiredValue
    )("foundation-v1");
    const adoptionManifestDigest = yield* Schema.decodeUnknownEffect(
      AdoptionManifestDigest
    )("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const props = SyntheticResourceProps.make({
      stage,
      logicalId,
      physicalId,
      desiredValue,
      adoptionManifestDigest,
      removalPolicy: "retain",
      destructivePolicy: { _tag: "Protected" },
    });
    const resource = yield* SyntheticResource("OfflineFoundation", props);

    return {
      stage,
      syntheticPhysicalId: resource.physicalId,
      syntheticStateRevision: resource.stateRevision,
    };
  }
).pipe(
  Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
);

// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */
/* oxlint-disable promise/prefer-await-to-then -- Effect.catch is an Effect combinator, not Promise.catch. */

import {
  adoptionManifestProviderScopes,
  layerAlchemyR2State,
  layerLiveReadOnlyAdoptionProviders,
  loadAdoptionCommand,
} from "@bundjil/infrastructure";
import * as Alchemy from "alchemy";
import { Config, Effect, Schema } from "effect";

import { BundjilInfrastructureStack } from "./stacks/bundjil.js";

const failConfiguration = (message: string) =>
  Schema.decodeUnknownEffect(Schema.Never)(message).pipe(
    Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
  );

export default loadAdoptionCommand.pipe(
  Effect.flatMap(({ manifest }) =>
    manifest.resources.some(
      (resource) =>
        resource.resourceKind === "vercelEnvironmentVariable" &&
        resource.desired.valueOwnership._tag === "Managed"
    )
      ? failConfiguration(
          "Managed environment values require the stable-binding entrypoint."
        )
      : adoptionManifestProviderScopes(manifest).pipe(
          Effect.catch(() =>
            failConfiguration(
              "The adoption manifest does not define the exact provider scopes."
            )
          ),
          Effect.flatMap((scopes) =>
            Alchemy.Stack(
              "BundjilInfrastructure",
              {
                providers: layerLiveReadOnlyAdoptionProviders(scopes),
                state: layerAlchemyR2State,
              },
              BundjilInfrastructureStack(manifest)
            )
          )
        )
  )
);

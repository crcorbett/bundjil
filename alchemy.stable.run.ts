// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */
/* oxlint-disable promise/prefer-await-to-then -- Effect.catch is an Effect combinator, not Promise.catch. */

import {
  adoptionManifestProviderScopes,
  layerAlchemyR2State,
  layerLiveStableAdoptionProviders,
  loadAdoptionCommand,
  validateStableAdoptionCommand,
} from "@bundjil/infrastructure";
import { loadVercelStableEnvironmentAuthority } from "@bundjil/infrastructure/vercel";
import * as Alchemy from "alchemy";
import { Config, Effect, Schema } from "effect";

import { BundjilInfrastructureStack } from "./stacks/bundjil.js";

const failConfiguration = (message: string) =>
  Schema.decodeUnknownEffect(Schema.Never)(message).pipe(
    Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
  );

export default Effect.all({
  authorityPath: loadVercelStableEnvironmentAuthority,
  command: loadAdoptionCommand,
}).pipe(
  Effect.flatMap(({ command }) => validateStableAdoptionCommand(command)),
  Effect.flatMap((manifest) =>
    adoptionManifestProviderScopes(manifest).pipe(
      Effect.catch(() =>
        failConfiguration(
          "The stable manifest does not define the exact provider scopes."
        )
      ),
      Effect.flatMap((scopes) =>
        Alchemy.Stack(
          "BundjilInfrastructure",
          {
            providers: layerLiveStableAdoptionProviders(scopes),
            state: layerAlchemyR2State,
          },
          BundjilInfrastructureStack(manifest)
        )
      )
    )
  )
);

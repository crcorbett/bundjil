// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */
/* oxlint-disable promise/prefer-await-to-then -- Effect.catch is an Effect combinator, not Promise.catch. */

import {
  adoptionManifestProviderScopes,
  layerAlchemyR2State,
  layerLiveStableAdoptionDriftProviders,
  layerLiveStableAdoptionProviders,
  loadAdoptionCommand,
  validateStableAdoptionCommand,
} from "@bundjil/infrastructure";
import type { AdoptionManifest } from "@bundjil/infrastructure";
import { loadVercelStableEnvironmentAuthority } from "@bundjil/infrastructure/vercel";
import * as Alchemy from "alchemy";
import { Config, Effect, Layer, Schema } from "effect";

import { BundjilInfrastructureStack } from "./stacks/bundjil.js";

const failConfiguration = (message: string) =>
  Schema.decodeUnknownEffect(Schema.Never)(message).pipe(
    Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
  );

const makeStableInfrastructureStackWith = Effect.fn(
  "StableInfrastructureStack.makeWith"
)(
  (
    manifest: AdoptionManifest,
    providersFor: typeof layerLiveStableAdoptionProviders
  ) =>
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
            providers: providersFor(scopes),
            // Alchemy.Stack requires an infallible state Layer; retain the defect
            // conversion only at this framework-owned host edge.
            state: layerAlchemyR2State.pipe(Layer.orDie),
          },
          BundjilInfrastructureStack(manifest)
        )
      )
    )
);

export const makeStableInfrastructureStack = Effect.fn(
  "StableInfrastructureStack.make"
)((manifest: AdoptionManifest) =>
  makeStableInfrastructureStackWith(manifest, layerLiveStableAdoptionProviders)
);

export const buildStableInfrastructureDriftStack = Effect.fn(
  "StableInfrastructureDriftStack.make"
)((manifest: AdoptionManifest) =>
  makeStableInfrastructureStackWith(
    manifest,
    layerLiveStableAdoptionDriftProviders
  )
);

export const loadStableInfrastructureStack = Effect.all({
  authorityPath: loadVercelStableEnvironmentAuthority,
  command: loadAdoptionCommand,
}).pipe(
  Effect.flatMap(({ command }) => validateStableAdoptionCommand(command)),
  Effect.flatMap(makeStableInfrastructureStack)
);

export default loadStableInfrastructureStack;

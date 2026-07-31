/* oxlint-disable unicorn/no-array-method-this-argument -- Effect.forEach is a data-first Effect combinator, not Array.prototype.forEach. */

import { Config, Effect, Match, Schema } from "effect";

import type { AdoptionCommand } from "./adoption-command.js";
import { SecretReferenceId } from "./secret-reference.js";
import { VercelEnvironmentVariableId } from "./vercel/schemas.js";
import {
  VercelPreviewPhotonEnvironmentKey,
  VercelPreviewPhotonSecretOwner,
  VercelProductionPhotonSecretOwner,
} from "./vercel/stable-environment.js";

const expectedManagedKeys = new Set<string>([
  "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
  "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
  "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID",
  "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
]);

const failConfiguration = (message: string) =>
  Schema.decodeUnknownEffect(Schema.Never)(message).pipe(
    Effect.mapError((schemaFailure) => new Config.ConfigError(schemaFailure))
  );

export const validateStableAdoptionCommand = Effect.fn(
  "StableAdoptionCommand.validate"
)(function* ({ input, manifest }: AdoptionCommand) {
  if (
    input.mode !== "plan" &&
    input.mode !== "apply" &&
    input.mode !== "sync"
  ) {
    return yield* failConfiguration(
      "Stable environment bindings require a stage-owned plan, apply, or sync."
    );
  }
  const expectedTarget = Match.value(input.stage).pipe(
    Match.when("preview", () => "preview" as const),
    Match.when("prod", () => "production" as const),
    Match.exhaustive
  );
  const expectedOwner = Match.value(input.stage).pipe(
    Match.when("preview", () => VercelPreviewPhotonSecretOwner),
    Match.when("prod", () => VercelProductionPhotonSecretOwner),
    Match.exhaustive
  );
  const environmentResources = manifest.resources.filter(
    (resource) => resource.resourceKind === "vercelEnvironmentVariable"
  );
  let managedCount = 0;
  const managedProjects = new Set<string>();
  const managedKeys = new Set<string>();
  yield* Effect.forEach(environmentResources, (resource) =>
    Match.value(resource.desired.valueOwnership).pipe(
      Match.tag("Absent", () =>
        failConfiguration(
          "Stable binding manifests cannot remove retained environment values."
        )
      ),
      Match.tag("ObservedUnknown", () => Effect.void),
      Match.tag("Managed", (ownership) =>
        Effect.gen(function* validateManagedResource() {
          managedCount += 1;
          managedProjects.add(resource.physicalId.projectId);
          managedKeys.add(resource.desired.key);
          if (
            resource.desired.type !== "sensitive" ||
            resource.desired.targets.length !== 1 ||
            resource.desired.targets[0] !== expectedTarget ||
            resource.desired.gitBranch !== undefined ||
            ownership.reference.owner !== expectedOwner ||
            !Schema.is(VercelPreviewPhotonEnvironmentKey)(resource.desired.key)
          ) {
            return yield* failConfiguration(
              "A managed Photon binding has invalid stage metadata or custody ownership."
            );
          }
          const encodedReference = yield* Schema.encodeEffect(
            SecretReferenceId
          )(ownership.reference.reference).pipe(
            Effect.mapError(
              (schemaFailure) => new Config.ConfigError(schemaFailure)
            )
          );
          const encodedEnvironmentVariableId = yield* Schema.encodeEffect(
            VercelEnvironmentVariableId
          )(resource.physicalId.environmentVariableId).pipe(
            Effect.mapError(
              (schemaFailure) => new Config.ConfigError(schemaFailure)
            )
          );
          if (encodedReference !== encodedEnvironmentVariableId) {
            return yield* failConfiguration(
              "A managed Preview Photon reference does not match its exact environment identity."
            );
          }
          return yield* Effect.void;
        })
      ),
      Match.exhaustive
    )
  );
  if (
    managedCount !== expectedManagedKeys.size ||
    managedProjects.size !== 1 ||
    managedKeys.size !== expectedManagedKeys.size ||
    [...expectedManagedKeys].some((key) => !managedKeys.has(key))
  ) {
    return yield* failConfiguration(
      "The stable manifest must manage exactly the four stage-owned Photon bindings in one Vercel project."
    );
  }
  return manifest;
});

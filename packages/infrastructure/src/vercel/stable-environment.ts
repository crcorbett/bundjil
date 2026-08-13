/* oxlint-disable max-classes-per-file -- The two exact Preview binding capabilities share one state and failure contract. */

import { Context, Effect, Layer, Schema } from "effect";

import {
  InfrastructureOutcomeCertainty,
  InfrastructureRetryClass,
} from "../schemas.js";
import type { SecretRevision } from "../secret-reference.js";
import {
  SecretOwner,
  SecretReference,
  SecretReferenceId,
} from "../secret-reference.js";
import type { VercelEnvironmentVariableAttributes } from "./schemas.js";
import {
  VercelEnvironmentVariableId,
  VercelEnvironmentVariableUpdatedAt,
  VercelProjectId,
  VercelTeamId,
} from "./schemas.js";

export const VercelPreviewPhotonEnvironmentKey = Schema.Literals([
  "BUNDJIL_CHANNEL_PHOTON_PROJECT_ID",
  "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
  "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_ID",
  "BUNDJIL_CHANNEL_PHOTON_WEBHOOK_SECRET",
]);
export type VercelPreviewPhotonEnvironmentKey =
  typeof VercelPreviewPhotonEnvironmentKey.Type;
export type VercelPreviewPhotonEnvironmentKeyEncoded =
  typeof VercelPreviewPhotonEnvironmentKey.Encoded;

export const VercelStableEnvironmentValue = Schema.Redacted(
  Schema.NonEmptyString
);
export type VercelStableEnvironmentValue =
  typeof VercelStableEnvironmentValue.Type;
export type VercelStableEnvironmentValueEncoded =
  typeof VercelStableEnvironmentValue.Encoded;

export const VercelManagedEnvironmentValue = Schema.TaggedStruct("Managed", {
  reference: SecretReference,
});
export type VercelManagedEnvironmentValue =
  typeof VercelManagedEnvironmentValue.Type;
export type VercelManagedEnvironmentValueEncoded =
  typeof VercelManagedEnvironmentValue.Encoded;

export const ResolveVercelPreviewPhotonValue = Schema.Struct({
  stage: Schema.Literals(["preview", "prod"]),
  environmentVariableId: VercelEnvironmentVariableId,
  key: VercelPreviewPhotonEnvironmentKey,
  valueOwnership: VercelManagedEnvironmentValue,
});
export type ResolveVercelPreviewPhotonValue =
  typeof ResolveVercelPreviewPhotonValue.Type;
export type ResolveVercelPreviewPhotonValueEncoded =
  typeof ResolveVercelPreviewPhotonValue.Encoded;

const StableEnvironmentVariableFields = {
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  environmentVariableId: VercelEnvironmentVariableId,
  key: VercelPreviewPhotonEnvironmentKey,
  type: Schema.Literal("sensitive"),
  valueOwnership: VercelManagedEnvironmentValue,
  value: VercelStableEnvironmentValue,
  previousProviderUpdatedAt: Schema.optional(
    VercelEnvironmentVariableUpdatedAt
  ),
};

export const UpdateVercelStableEnvironmentVariable = Schema.Union([
  Schema.Struct({
    ...StableEnvironmentVariableFields,
    stage: Schema.Literal("preview"),
    targets: Schema.Tuple([Schema.Literal("preview")]),
  }),
  Schema.Struct({
    ...StableEnvironmentVariableFields,
    stage: Schema.Literal("prod"),
    targets: Schema.Tuple([Schema.Literal("production")]),
  }),
]);
export type UpdateVercelStableEnvironmentVariable =
  typeof UpdateVercelStableEnvironmentVariable.Type;
export type UpdateVercelStableEnvironmentVariableEncoded =
  typeof UpdateVercelStableEnvironmentVariable.Encoded;

export const VercelStableEnvironmentOperation = Schema.Literals([
  "resolvePreviewPhotonValue",
  "updateStableEnvironmentVariable",
]);
export type VercelStableEnvironmentOperation =
  typeof VercelStableEnvironmentOperation.Type;

export const VercelStableEnvironmentFailureReason = Schema.Literals([
  "identityMismatch",
  "unsupportedBinding",
  "rateLimited",
  "transient",
  "invalidResponse",
  "requestFailed",
  "uncertainOutcome",
  "protected",
]);
export type VercelStableEnvironmentFailureReason =
  typeof VercelStableEnvironmentFailureReason.Type;

export const VercelStableEnvironmentProviderStatus = Schema.Literals([
  400, 401, 403, 404, 409, 412, 429, 500, 502, 503, 504,
]);
export type VercelStableEnvironmentProviderStatus =
  typeof VercelStableEnvironmentProviderStatus.Type;

export const VercelStableEnvironmentProviderFailure = Schema.Struct({
  status: VercelStableEnvironmentProviderStatus,
  codePresent: Schema.Boolean,
  messagePresent: Schema.Boolean,
});
export type VercelStableEnvironmentProviderFailure =
  typeof VercelStableEnvironmentProviderFailure.Type;

const VercelStableEnvironmentErrorMessage = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(300))
);

const VercelStableEnvironmentErrorFields = {
  operation: VercelStableEnvironmentOperation,
  reason: VercelStableEnvironmentFailureReason,
  retry: InfrastructureRetryClass,
  certainty: InfrastructureOutcomeCertainty,
  providerFailure: Schema.optional(VercelStableEnvironmentProviderFailure),
  message: VercelStableEnvironmentErrorMessage,
};

export class VercelStableEnvironmentReadError extends Schema.TaggedErrorClass<VercelStableEnvironmentReadError>()(
  "VercelStableEnvironmentReadError",
  VercelStableEnvironmentErrorFields
) {}

export class VercelStableEnvironmentWriteError extends Schema.TaggedErrorClass<VercelStableEnvironmentWriteError>()(
  "VercelStableEnvironmentWriteError",
  VercelStableEnvironmentErrorFields
) {}

export interface VercelPreviewPhotonBindingValuesShape {
  readonly resolvePreviewPhotonValue: (
    input: ResolveVercelPreviewPhotonValue
  ) => Effect.Effect<
    VercelStableEnvironmentValue,
    VercelStableEnvironmentReadError
  >;
}

export class VercelPreviewPhotonBindingValues extends Context.Service<
  VercelPreviewPhotonBindingValues,
  VercelPreviewPhotonBindingValuesShape
>()("@bundjil/infrastructure/vercel/VercelPreviewPhotonBindingValues") {}

export interface VercelStableEnvironmentBindingsShape {
  readonly updateStableEnvironmentVariable: (
    input: UpdateVercelStableEnvironmentVariable
  ) => Effect.Effect<
    typeof VercelEnvironmentVariableAttributes.Type,
    VercelStableEnvironmentWriteError
  >;
}

export class VercelStableEnvironmentBindings extends Context.Service<
  VercelStableEnvironmentBindings,
  VercelStableEnvironmentBindingsShape
>()("@bundjil/infrastructure/vercel/VercelStableEnvironmentBindings") {}

export const VercelStableEnvironmentBindingsDenied = Layer.succeed(
  VercelStableEnvironmentBindings,
  VercelStableEnvironmentBindings.of({
    updateStableEnvironmentVariable: Effect.fn(
      "VercelStableEnvironmentBindingsDenied.updateStableEnvironmentVariable"
    )(() =>
      Effect.fail(
        new VercelStableEnvironmentWriteError({
          operation: "updateStableEnvironmentVariable",
          reason: "protected",
          retry: "never",
          certainty: { _tag: "Known" },
          message:
            "Stable environment writes are disabled in the read-only provider Layer.",
        })
      )
    ),
  })
);

export const VercelPreviewPhotonBindingValuesDenied = Layer.succeed(
  VercelPreviewPhotonBindingValues,
  VercelPreviewPhotonBindingValues.of({
    resolvePreviewPhotonValue: Effect.fn(
      "VercelPreviewPhotonBindingValuesDenied.resolvePreviewPhotonValue"
    )(() =>
      Effect.fail(
        new VercelStableEnvironmentReadError({
          operation: "resolvePreviewPhotonValue",
          reason: "protected",
          retry: "never",
          certainty: { _tag: "Known" },
          message:
            "Preview Photon binding values are unavailable in the read-only provider Layer.",
        })
      )
    ),
  })
);

export const VercelPreviewPhotonSecretOwner = SecretOwner.make(
  "@bundjil/infrastructure/vercel/preview-photon"
);
export const VercelProductionPhotonSecretOwner = SecretOwner.make(
  "@bundjil/infrastructure/vercel/production-photon"
);
export const previewPhotonSecretReference = (
  environmentVariableId: typeof VercelEnvironmentVariableId.Type,
  revision: typeof SecretRevision.Type
) =>
  SecretReference.make({
    owner: VercelPreviewPhotonSecretOwner,
    reference: SecretReferenceId.make(environmentVariableId),
    revision,
  });

export const productionPhotonSecretReference = (
  environmentVariableId: typeof VercelEnvironmentVariableId.Type,
  revision: typeof SecretRevision.Type
) =>
  SecretReference.make({
    owner: VercelProductionPhotonSecretOwner,
    reference: SecretReferenceId.make(environmentVariableId),
    revision,
  });

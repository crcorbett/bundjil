/* oxlint-disable max-classes-per-file -- Preview configuration failures and services share one exact provider capability boundary. */

import type { Effect } from "effect";
import { Context, Schema } from "effect";

import {
  InfrastructureDestructivePolicy,
  InfrastructureOutcomeCertainty,
  InfrastructureOwnershipState,
  InfrastructureRetryClass,
} from "../schemas.js";
import {
  VercelEnvironmentVariableId,
  VercelEnvironmentVariableKey,
  VercelProjectId,
  VercelTeamId,
} from "./schemas.js";

export const VercelPreviewStage = Schema.Literal("preview");
export type VercelPreviewStage = typeof VercelPreviewStage.Type;
export type VercelPreviewStageEncoded = typeof VercelPreviewStage.Encoded;

export const VercelPreviewFeedbackValue = Schema.NullOr(Schema.Boolean);
export type VercelPreviewFeedbackValue = typeof VercelPreviewFeedbackValue.Type;
export type VercelPreviewFeedbackValueEncoded =
  typeof VercelPreviewFeedbackValue.Encoded;

export const VercelPreviewEnvironmentValue = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(128)),
  Schema.brand("@bundjil/infrastructure/vercel/VercelPreviewEnvironmentValue")
);
export type VercelPreviewEnvironmentValue =
  typeof VercelPreviewEnvironmentValue.Type;
export type VercelPreviewEnvironmentValueEncoded =
  typeof VercelPreviewEnvironmentValue.Encoded;

export const VercelPreviewConfigurationOperation = Schema.Literals([
  "observePreviewFeedback",
  "setPreviewFeedback",
  "observePreviewEnvironmentMetadata",
  "createPreviewEnvironmentMetadata",
  "deletePreviewEnvironmentMetadata",
]);
export type VercelPreviewConfigurationOperation =
  typeof VercelPreviewConfigurationOperation.Type;

export const VercelPreviewConfigurationFailureReason = Schema.Literals([
  "notFound",
  "ambiguous",
  "identityMismatch",
  "rateLimited",
  "transient",
  "invalidResponse",
  "requestFailed",
  "protected",
  "uncertainOutcome",
]);
export type VercelPreviewConfigurationFailureReason =
  typeof VercelPreviewConfigurationFailureReason.Type;

const VercelPreviewConfigurationErrorMessage = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(300))
);

const VercelPreviewConfigurationErrorFields = {
  operation: VercelPreviewConfigurationOperation,
  reason: VercelPreviewConfigurationFailureReason,
  retry: InfrastructureRetryClass,
  certainty: InfrastructureOutcomeCertainty,
  message: VercelPreviewConfigurationErrorMessage,
};

export class VercelPreviewConfigurationReadError extends Schema.TaggedErrorClass<VercelPreviewConfigurationReadError>()(
  "VercelPreviewConfigurationReadError",
  VercelPreviewConfigurationErrorFields
) {}

export class VercelPreviewConfigurationWriteError extends Schema.TaggedErrorClass<VercelPreviewConfigurationWriteError>()(
  "VercelPreviewConfigurationWriteError",
  VercelPreviewConfigurationErrorFields
) {}

export const VercelPreviewFeedbackProps = Schema.Struct({
  stage: VercelPreviewStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  desired: VercelPreviewFeedbackValue,
  productionGuard: VercelPreviewFeedbackValue,
});
export type VercelPreviewFeedbackProps = typeof VercelPreviewFeedbackProps.Type;
export type VercelPreviewFeedbackPropsEncoded =
  typeof VercelPreviewFeedbackProps.Encoded;

export const VercelPreviewFeedbackAttributes = Schema.Struct({
  stage: VercelPreviewStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  enabled: VercelPreviewFeedbackValue,
  productionEnabled: VercelPreviewFeedbackValue,
  ownership: InfrastructureOwnershipState,
});
export type VercelPreviewFeedbackAttributes =
  typeof VercelPreviewFeedbackAttributes.Type;
export type VercelPreviewFeedbackAttributesEncoded =
  typeof VercelPreviewFeedbackAttributes.Encoded;

export const ObserveVercelPreviewFeedback = Schema.Struct({
  stage: VercelPreviewStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
});
export type ObserveVercelPreviewFeedback =
  typeof ObserveVercelPreviewFeedback.Type;
export type ObserveVercelPreviewFeedbackEncoded =
  typeof ObserveVercelPreviewFeedback.Encoded;

export const VercelPreviewFeedbackObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    stage: VercelPreviewStage,
    teamId: VercelTeamId,
    projectId: VercelProjectId,
  }),
  Schema.TaggedStruct("Found", {
    attributes: VercelPreviewFeedbackAttributes,
  }),
]);
export type VercelPreviewFeedbackObservation =
  typeof VercelPreviewFeedbackObservation.Type;
export type VercelPreviewFeedbackObservationEncoded =
  typeof VercelPreviewFeedbackObservation.Encoded;

export const SetVercelPreviewFeedback = Schema.Struct({
  stage: VercelPreviewStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  desired: VercelPreviewFeedbackValue,
  productionGuard: VercelPreviewFeedbackValue,
});
export type SetVercelPreviewFeedback = typeof SetVercelPreviewFeedback.Type;
export type SetVercelPreviewFeedbackEncoded =
  typeof SetVercelPreviewFeedback.Encoded;

export const VercelPreviewEnvironmentMetadataProps = Schema.Struct({
  stage: VercelPreviewStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  key: VercelEnvironmentVariableKey,
  value: VercelPreviewEnvironmentValue,
  destructivePolicy: InfrastructureDestructivePolicy,
});
export type VercelPreviewEnvironmentMetadataProps =
  typeof VercelPreviewEnvironmentMetadataProps.Type;
export type VercelPreviewEnvironmentMetadataPropsEncoded =
  typeof VercelPreviewEnvironmentMetadataProps.Encoded;

export const VercelPreviewEnvironmentMetadataAttributes = Schema.Struct({
  stage: VercelPreviewStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  environmentVariableId: VercelEnvironmentVariableId,
  key: VercelEnvironmentVariableKey,
  type: Schema.Literal("plain"),
  targets: Schema.Tuple([Schema.Literal("preview")]),
  sensitive: Schema.Literal(false),
  ownership: InfrastructureOwnershipState,
});
export type VercelPreviewEnvironmentMetadataAttributes =
  typeof VercelPreviewEnvironmentMetadataAttributes.Type;
export type VercelPreviewEnvironmentMetadataAttributesEncoded =
  typeof VercelPreviewEnvironmentMetadataAttributes.Encoded;

export const ObserveVercelPreviewEnvironmentMetadata = Schema.Struct({
  stage: VercelPreviewStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  key: VercelEnvironmentVariableKey,
});
export type ObserveVercelPreviewEnvironmentMetadata =
  typeof ObserveVercelPreviewEnvironmentMetadata.Type;
export type ObserveVercelPreviewEnvironmentMetadataEncoded =
  typeof ObserveVercelPreviewEnvironmentMetadata.Encoded;

export const VercelPreviewEnvironmentMetadataObservation = Schema.Union([
  Schema.TaggedStruct("Missing", {
    stage: VercelPreviewStage,
    teamId: VercelTeamId,
    projectId: VercelProjectId,
    key: VercelEnvironmentVariableKey,
  }),
  Schema.TaggedStruct("Found", {
    attributes: VercelPreviewEnvironmentMetadataAttributes,
  }),
]);
export type VercelPreviewEnvironmentMetadataObservation =
  typeof VercelPreviewEnvironmentMetadataObservation.Type;
export type VercelPreviewEnvironmentMetadataObservationEncoded =
  typeof VercelPreviewEnvironmentMetadataObservation.Encoded;

export const CreateVercelPreviewEnvironmentMetadata = Schema.Struct({
  stage: VercelPreviewStage,
  teamId: VercelTeamId,
  projectId: VercelProjectId,
  key: VercelEnvironmentVariableKey,
  value: VercelPreviewEnvironmentValue,
});
export type CreateVercelPreviewEnvironmentMetadata =
  typeof CreateVercelPreviewEnvironmentMetadata.Type;
export type CreateVercelPreviewEnvironmentMetadataEncoded =
  typeof CreateVercelPreviewEnvironmentMetadata.Encoded;

export const DeleteVercelPreviewEnvironmentMetadata = Schema.Struct({
  attributes: VercelPreviewEnvironmentMetadataAttributes,
  destructivePolicy: InfrastructureDestructivePolicy,
});
export type DeleteVercelPreviewEnvironmentMetadata =
  typeof DeleteVercelPreviewEnvironmentMetadata.Type;
export type DeleteVercelPreviewEnvironmentMetadataEncoded =
  typeof DeleteVercelPreviewEnvironmentMetadata.Encoded;

export interface VercelPreviewConfigurationShape {
  readonly observePreviewFeedback: (
    input: ObserveVercelPreviewFeedback
  ) => Effect.Effect<
    VercelPreviewFeedbackObservation,
    VercelPreviewConfigurationReadError
  >;
  readonly setPreviewFeedback: (
    input: SetVercelPreviewFeedback
  ) => Effect.Effect<
    VercelPreviewFeedbackAttributes,
    VercelPreviewConfigurationWriteError
  >;
  readonly observePreviewEnvironmentMetadata: (
    input: ObserveVercelPreviewEnvironmentMetadata
  ) => Effect.Effect<
    VercelPreviewEnvironmentMetadataObservation,
    VercelPreviewConfigurationReadError
  >;
  readonly createPreviewEnvironmentMetadata: (
    input: CreateVercelPreviewEnvironmentMetadata
  ) => Effect.Effect<
    VercelPreviewEnvironmentMetadataAttributes,
    VercelPreviewConfigurationWriteError
  >;
  readonly deletePreviewEnvironmentMetadata: (
    input: DeleteVercelPreviewEnvironmentMetadata
  ) => Effect.Effect<void, VercelPreviewConfigurationWriteError>;
}

export class VercelPreviewConfiguration extends Context.Service<
  VercelPreviewConfiguration,
  VercelPreviewConfigurationShape
>()("@bundjil/infrastructure/vercel/VercelPreviewConfiguration") {}

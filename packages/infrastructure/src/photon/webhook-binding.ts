/* oxlint-disable max-classes-per-file -- The binding request, safe failure and owner-specific service form one capability boundary. */

import {
  PhotonProjectId,
  PhotonProjectSecret,
  PhotonWebhookId,
  PhotonWebhookSecret,
} from "@bundjil/photon/config";
import type { Effect } from "effect";
import { Context, Schema } from "effect";

import {
  InfrastructureOutcomeCertainty,
  InfrastructureRetryClass,
} from "../schemas.js";
import type { SecretReference } from "../secret-reference.js";
import { VercelProjectId, VercelTeamId } from "../vercel/schemas.js";

export const PhotonPreviewStage = Schema.Literal("preview");
export type PhotonPreviewStage = typeof PhotonPreviewStage.Type;
export type PhotonPreviewStageEncoded = typeof PhotonPreviewStage.Encoded;

export const PhotonWebhookBindingWrite = Schema.Struct({
  stage: PhotonPreviewStage,
  teamId: VercelTeamId,
  vercelProjectId: VercelProjectId,
  photonProjectId: PhotonProjectId,
  projectSecret: PhotonProjectSecret,
  webhookId: PhotonWebhookId,
  signingSecret: PhotonWebhookSecret,
});
export type PhotonWebhookBindingWrite = typeof PhotonWebhookBindingWrite.Type;
export type PhotonWebhookBindingWriteEncoded =
  typeof PhotonWebhookBindingWrite.Encoded;

export const PhotonWebhookBindingOperation = Schema.Literal(
  "persistPreviewWebhookBinding"
);
export type PhotonWebhookBindingOperation =
  typeof PhotonWebhookBindingOperation.Type;

export const PhotonWebhookBindingFailureReason = Schema.Literals([
  "ambiguous",
  "conflict",
  "rateLimited",
  "transient",
  "invalidResponse",
  "requestFailed",
  "uncertainOutcome",
]);
export type PhotonWebhookBindingFailureReason =
  typeof PhotonWebhookBindingFailureReason.Type;

export const PhotonWebhookBindingFailureMessage = Schema.NonEmptyString;
export type PhotonWebhookBindingFailureMessage =
  typeof PhotonWebhookBindingFailureMessage.Type;
export type PhotonWebhookBindingFailureMessageEncoded =
  typeof PhotonWebhookBindingFailureMessage.Encoded;

export class PhotonWebhookBindingWriteError extends Schema.TaggedErrorClass<PhotonWebhookBindingWriteError>()(
  "PhotonWebhookBindingWriteError",
  {
    operation: PhotonWebhookBindingOperation,
    reason: PhotonWebhookBindingFailureReason,
    retry: InfrastructureRetryClass,
    certainty: InfrastructureOutcomeCertainty,
    message: PhotonWebhookBindingFailureMessage,
  }
) {}

export interface PhotonWebhookBindingSinkShape {
  readonly persistPreviewWebhookBinding: (
    input: PhotonWebhookBindingWrite
  ) => Effect.Effect<SecretReference, PhotonWebhookBindingWriteError>;
}

export class PhotonWebhookBindingSink extends Context.Service<
  PhotonWebhookBindingSink,
  PhotonWebhookBindingSinkShape
>()("@bundjil/infrastructure/photon/PhotonWebhookBindingSink") {}

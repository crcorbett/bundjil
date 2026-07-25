import {
  ChannelConversation,
  ChannelInboundTextMessage,
  ChannelOutboundText,
  ChannelParticipantId,
  ChannelPresenceResult,
  ChannelProviderMessageId,
} from "@bundjil/channel";
import { EveSessionId, EveTurnId } from "@bundjil/eve";
import { AtomicKeyValueStoreValue } from "@bundjil/store";
import { Schema } from "effect";

export const ChannelWebhookPath = Schema.Literals([
  "/eve/v1/sendblue/webhook",
  "/eve/v1/photon/webhook",
]);
export type ChannelWebhookPath = typeof ChannelWebhookPath.Type;

export const ChannelWebhookProofPolicy = Schema.Literals([
  "disabled",
  "provider-retry",
]);
export type ChannelWebhookProofPolicy = typeof ChannelWebhookProofPolicy.Type;

export const ChannelWebhookQuery = Schema.Struct({
  "bundjil-proof": Schema.optional(Schema.Literal("retry-once")),
});
export type ChannelWebhookQuery = typeof ChannelWebhookQuery.Type;

export const ChannelPrincipalId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/agent/ChannelPrincipalId")
);
export type ChannelPrincipalId = typeof ChannelPrincipalId.Type;

export const ChannelContinuationToken = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/agent/ChannelContinuationToken")
);
export type ChannelContinuationToken = typeof ChannelContinuationToken.Type;

export const ChannelReplayPrefix = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/agent/ChannelReplayPrefix")
);
export type ChannelReplayPrefix = typeof ChannelReplayPrefix.Type;

export const ChannelRoutingSecret = Schema.Redacted(Schema.NonEmptyString);
export type ChannelRoutingSecret = typeof ChannelRoutingSecret.Type;

export const ChannelReplayKey = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/agent/ChannelReplayKey")
);
export type ChannelReplayKey = typeof ChannelReplayKey.Type;

const ChannelHandoffFingerprint = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[0-9a-f]{64}$/))
);

export const ChannelWorkFingerprint = ChannelHandoffFingerprint.pipe(
  Schema.brand("@bundjil/agent/ChannelWorkFingerprint")
);
export type ChannelWorkFingerprint = typeof ChannelWorkFingerprint.Type;

export const ChannelSessionFingerprint = ChannelHandoffFingerprint.pipe(
  Schema.brand("@bundjil/agent/ChannelSessionFingerprint")
);
export type ChannelSessionFingerprint = typeof ChannelSessionFingerprint.Type;

export const ChannelHandoffTimestamp = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0))
);
export type ChannelHandoffTimestamp = typeof ChannelHandoffTimestamp.Type;

export const ChannelHandoffLatency = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0))
);
export type ChannelHandoffLatency = typeof ChannelHandoffLatency.Type;

export const ChannelHandoffExitOutcome = Schema.Literals([
  "succeeded",
  "failed",
  "defect",
  "interrupted",
]);
export type ChannelHandoffExitOutcome = typeof ChannelHandoffExitOutcome.Type;

export const ChannelHandoffAttempt = Schema.Struct({
  preparedAtEpochMilliseconds: ChannelHandoffTimestamp,
  workFingerprint: ChannelWorkFingerprint,
});
export type ChannelHandoffAttempt = typeof ChannelHandoffAttempt.Type;

export const ChannelHandoffAcceptance = Schema.Struct({
  acceptedAtEpochMilliseconds: ChannelHandoffTimestamp,
  sessionFingerprint: ChannelSessionFingerprint,
  workFingerprint: ChannelWorkFingerprint,
});
export type ChannelHandoffAcceptance = typeof ChannelHandoffAcceptance.Type;

const ChannelHandoffObservationBase = {
  latencyMilliseconds: ChannelHandoffLatency,
  observedAtEpochMilliseconds: ChannelHandoffTimestamp,
  workFingerprint: ChannelWorkFingerprint,
};

export const ChannelHandoffObservation = Schema.Union([
  Schema.TaggedStruct("Prepared", {
    ...ChannelHandoffObservationBase,
    outcome: Schema.Literal("pending"),
  }),
  Schema.TaggedStruct("SendStarted", {
    ...ChannelHandoffObservationBase,
    outcome: Schema.Literal("pending"),
  }),
  Schema.TaggedStruct("SendAccepted", {
    ...ChannelHandoffObservationBase,
    outcome: Schema.Literal("accepted"),
    sessionFingerprint: ChannelSessionFingerprint,
  }),
  Schema.TaggedStruct("SendRejected", {
    ...ChannelHandoffObservationBase,
    outcome: Schema.Literal("rejected"),
  }),
  Schema.TaggedStruct("Response", {
    ...ChannelHandoffObservationBase,
    outcome: Schema.Literals(["accepted", "retryable"]),
    status: Schema.Literals([202, 503]),
  }),
  Schema.TaggedStruct("Exit", {
    ...ChannelHandoffObservationBase,
    outcome: ChannelHandoffExitOutcome,
  }),
]);
export type ChannelHandoffObservation = typeof ChannelHandoffObservation.Type;

export const ChannelReplayRecord = Schema.Struct({
  status: Schema.Literals(["claimed", "complete", "uncertain"]),
});
export type ChannelReplayRecord = typeof ChannelReplayRecord.Type;

export const ChannelReplayClaim = Schema.Struct({
  key: ChannelReplayKey,
  claimedValue: AtomicKeyValueStoreValue,
});
export type ChannelReplayClaim = typeof ChannelReplayClaim.Type;

export const ChannelReplayClaimResult = Schema.Union([
  Schema.TaggedStruct("Claimed", { claim: ChannelReplayClaim }),
  Schema.TaggedStruct("Duplicate", {}),
]);
export type ChannelReplayClaimResult = typeof ChannelReplayClaimResult.Type;

export const ChannelOutboundCoordinates = Schema.Struct({
  sessionId: EveSessionId,
  turnId: EveTurnId,
  sequence: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
});
export type ChannelOutboundCoordinates = typeof ChannelOutboundCoordinates.Type;

export const ChannelIdentityRecord = Schema.Struct({
  participantId: ChannelParticipantId,
  principalId: ChannelPrincipalId,
});
export type ChannelIdentityRecord = typeof ChannelIdentityRecord.Type;

export const ChannelIdentityRecords = Schema.Array(ChannelIdentityRecord);
export type ChannelIdentityRecords = typeof ChannelIdentityRecords.Type;

export const ChannelReplayOptions = Schema.Struct({
  prefix: ChannelReplayPrefix,
  leaseMilliseconds: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
  ttlMilliseconds: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
});
export type ChannelReplayOptions = typeof ChannelReplayOptions.Type;

export const ChannelStateV1 = Schema.TaggedStruct("V1", {
  conversation: ChannelConversation,
});
export type ChannelStateV1 = typeof ChannelStateV1.Type;

export const ChannelAdapterState = Schema.Struct({ snapshot: ChannelStateV1 });
export type ChannelAdapterState = typeof ChannelAdapterState.Type;
export type ChannelAdapterStateEncoded = typeof ChannelAdapterState.Encoded;
export interface ChannelMutableAdapterStateEncoded {
  snapshot: ChannelAdapterStateEncoded["snapshot"];
}

export const ChannelPreparedInbound = Schema.Struct({
  claim: ChannelReplayClaim,
  principalId: ChannelPrincipalId,
  continuationToken: ChannelContinuationToken,
  message: ChannelInboundTextMessage,
  state: ChannelAdapterState,
});
export type ChannelPreparedInbound = typeof ChannelPreparedInbound.Type;

export const ChannelPrepareInboundResult = Schema.Union([
  Schema.TaggedStruct("Dispatch", { prepared: ChannelPreparedInbound }),
  Schema.TaggedStruct("Duplicate", {}),
]);
export type ChannelPrepareInboundResult =
  typeof ChannelPrepareInboundResult.Type;

export const ChannelEvent = Schema.Union([
  Schema.TaggedStruct("PresenceRequested", {
    action: Schema.Literals(["start", "stop"]),
    conversation: ChannelConversation,
  }),
  Schema.TaggedStruct("OutboundTextReady", {
    coordinates: ChannelOutboundCoordinates,
    conversation: ChannelConversation,
    text: ChannelOutboundText,
  }),
]);
export type ChannelEvent = typeof ChannelEvent.Type;

export const ChannelEventOutcome = Schema.Union([
  Schema.TaggedStruct("Presence", { result: ChannelPresenceResult }),
  Schema.TaggedStruct("SendAccepted", { messageId: ChannelProviderMessageId }),
  Schema.TaggedStruct("Duplicate", {}),
]);
export type ChannelEventOutcome = typeof ChannelEventOutcome.Type;

export const ChannelEventResult = Schema.Struct({
  state: ChannelStateV1,
  outcome: ChannelEventOutcome,
});
export type ChannelEventResult = typeof ChannelEventResult.Type;

import {
  EveAssistantMessageContent,
  EveAssistantStepFinishReason,
  EveSessionId,
  EveTurnId,
} from "@bundjil/eve-effect";
import { Schema } from "effect";

export const E164PhoneNumber = Schema.String.check(
  Schema.isPattern(/^\+[1-9]\d{7,14}$/)
).pipe(Schema.brand("E164PhoneNumber"));
export type E164PhoneNumber = typeof E164PhoneNumber.Type;

export const SendblueMessageHandle = Schema.NonEmptyString.pipe(
  Schema.brand("SendblueMessageHandle")
);
export type SendblueMessageHandle = typeof SendblueMessageHandle.Type;

export const SendbluePrincipalId = Schema.NonEmptyString.pipe(
  Schema.brand("SendbluePrincipalId")
);
export type SendbluePrincipalId = typeof SendbluePrincipalId.Type;

export const SendblueConversationKey = Schema.NonEmptyString.pipe(
  Schema.brand("SendblueConversationKey")
);
export type SendblueConversationKey = typeof SendblueConversationKey.Type;

export const SendblueInboundClaimKey = Schema.NonEmptyString.pipe(
  Schema.brand("SendblueInboundClaimKey")
);
export type SendblueInboundClaimKey = typeof SendblueInboundClaimKey.Type;

export const SendblueOutboundClaimKey = Schema.NonEmptyString.pipe(
  Schema.brand("SendblueOutboundClaimKey")
);
export type SendblueOutboundClaimKey = typeof SendblueOutboundClaimKey.Type;

export const SendblueReplayClaimKey = Schema.Union([
  SendblueInboundClaimKey,
  SendblueOutboundClaimKey,
]);
export type SendblueReplayClaimKey = typeof SendblueReplayClaimKey.Type;

const NonNegativeInt = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

export const SendblueReplayClaimId = Schema.String.check(Schema.isUUID()).pipe(
  Schema.brand("SendblueReplayClaimId")
);
export type SendblueReplayClaimId = typeof SendblueReplayClaimId.Type;

export const SendblueReplayStorePrefix = Schema.NonEmptyString.pipe(
  Schema.brand("SendblueReplayStorePrefix")
);
export type SendblueReplayStorePrefix = typeof SendblueReplayStorePrefix.Type;

export const SendblueMessageContent = Schema.String;
export type SendblueMessageContent = typeof SendblueMessageContent.Type;

export const SendblueInboundDispatchContent = Schema.NonEmptyString;
export type SendblueInboundDispatchContent =
  typeof SendblueInboundDispatchContent.Type;

export const SendblueOutboundMessageContent = Schema.NonEmptyString.check(
  Schema.isMaxLength(18_996)
);
export type SendblueOutboundMessageContent =
  typeof SendblueOutboundMessageContent.Type;

export const SendblueGroupId = Schema.String.pipe(
  Schema.brand("SendblueGroupId")
);
export type SendblueGroupId = typeof SendblueGroupId.Type;

export const SendblueMediaUrl = Schema.String.pipe(
  Schema.brand("SendblueMediaUrl")
);
export type SendblueMediaUrl = typeof SendblueMediaUrl.Type;

export const SendblueInboundStatus = Schema.String.pipe(
  Schema.brand("SendblueInboundStatus")
);
export type SendblueInboundStatus = typeof SendblueInboundStatus.Type;

export const SendblueReceivedStatusValue = "RECEIVED";

export const SendblueReceivedStatus = Schema.Literal(
  SendblueReceivedStatusValue
);
export type SendblueReceivedStatus = typeof SendblueReceivedStatus.Type;

export const SendblueInboundDeliveryStatus = Schema.Union([
  SendblueReceivedStatus,
  SendblueInboundStatus,
]);
export type SendblueInboundDeliveryStatus =
  typeof SendblueInboundDeliveryStatus.Type;

export const SendblueService = Schema.Literals(["iMessage", "SMS", "RCS"]);
export type SendblueService = typeof SendblueService.Type;

export const SendblueIgnoredReason = Schema.Literals([
  "duplicate",
  "empty",
  "group",
  "lineMismatch",
  "loop",
  "media",
  "outbound",
  "senderNotAllowed",
  "serviceNotAllowed",
  "statusNotReceived",
  "typing",
]);
export type SendblueIgnoredReason = typeof SendblueIgnoredReason.Type;

export const SendblueMessageDeliveryStatus = Schema.Literals([
  "QUEUED",
  "SENT",
  "DELIVERED",
]);
export type SendblueMessageDeliveryStatus =
  typeof SendblueMessageDeliveryStatus.Type;

export const SendblueProviderRejectedStatus = Schema.Literal("ERROR");
export type SendblueProviderRejectedStatus =
  typeof SendblueProviderRejectedStatus.Type;

export const SendblueResponseErrorReason = Schema.Literals([
  "clientRejected",
  "malformedResponse",
  "providerRejected",
  "rateLimited",
  "serverRejected",
  "unauthorized",
]);
export type SendblueResponseErrorReason =
  typeof SendblueResponseErrorReason.Type;

export const SendblueClientOperation = Schema.Literal("sendMessage");
export type SendblueClientOperation = typeof SendblueClientOperation.Type;

export const SendblueRequestErrorReason = Schema.Literal("requestEncoding");
export type SendblueRequestErrorReason = typeof SendblueRequestErrorReason.Type;

export const SendblueDeliveryUncertainReason = Schema.Literals([
  "timeout",
  "transport",
]);
export type SendblueDeliveryUncertainReason =
  typeof SendblueDeliveryUncertainReason.Type;

export const SendblueOutboundEventCoordinates = Schema.Struct({
  sequence: NonNegativeInt,
  sessionId: EveSessionId,
  stepIndex: NonNegativeInt,
  turnId: EveTurnId,
});
export type SendblueOutboundEventCoordinates =
  typeof SendblueOutboundEventCoordinates.Type;

export const SendblueWebhookSecret = Schema.Redacted(Schema.NonEmptyString);
export type SendblueWebhookSecret = typeof SendblueWebhookSecret.Type;

export const SendblueApiKey = Schema.Redacted(Schema.NonEmptyString);
export type SendblueApiKey = typeof SendblueApiKey.Type;

export const SendblueApiSecret = Schema.Redacted(Schema.NonEmptyString);
export type SendblueApiSecret = typeof SendblueApiSecret.Type;

export const SendblueReplayStoreToken = Schema.Redacted(Schema.NonEmptyString);
export type SendblueReplayStoreToken = typeof SendblueReplayStoreToken.Type;

export const SendblueReplayStoreUrl = Schema.Redacted(Schema.NonEmptyString);
export type SendblueReplayStoreUrl = typeof SendblueReplayStoreUrl.Type;

export const SendblueRoutingKey = Schema.Redacted(Schema.NonEmptyString);
export type SendblueRoutingKey = typeof SendblueRoutingKey.Type;

export const SendblueSenderIdentity = Schema.Struct({
  phoneNumber: E164PhoneNumber,
  principalId: SendbluePrincipalId,
});
export type SendblueSenderIdentity = typeof SendblueSenderIdentity.Type;

export const SendblueSenderIdentities = Schema.Record(
  E164PhoneNumber,
  SendbluePrincipalId
);
export type SendblueSenderIdentities = typeof SendblueSenderIdentities.Type;

export const SendblueMessageDirection = Schema.Literals([
  "inbound",
  "outbound",
]);
export type SendblueMessageDirection = typeof SendblueMessageDirection.Type;

export const SendblueInboundMessage = Schema.Struct({
  content: SendblueMessageContent,
  direction: Schema.optional(SendblueMessageDirection),
  from_number: E164PhoneNumber,
  group_id: Schema.optional(SendblueGroupId),
  is_outbound: Schema.optional(Schema.Boolean),
  is_typing: Schema.optional(Schema.Boolean),
  media_url: Schema.optional(SendblueMediaUrl),
  media_urls: Schema.optional(Schema.Array(SendblueMediaUrl)),
  message_handle: SendblueMessageHandle,
  sendblue_number: Schema.NullOr(E164PhoneNumber),
  service: SendblueService,
  status: SendblueInboundDeliveryStatus,
  to_number: E164PhoneNumber,
});
export type SendblueInboundMessage = typeof SendblueInboundMessage.Type;

export const SendblueIgnoredEvent = Schema.Struct({
  reason: SendblueIgnoredReason,
});
export type SendblueIgnoredEvent = typeof SendblueIgnoredEvent.Type;

export const SendblueChannelState = Schema.Struct({
  conversationKey: SendblueConversationKey,
  principalId: SendbluePrincipalId,
  sendblueNumber: E164PhoneNumber,
  senderNumber: E164PhoneNumber,
});
export type SendblueChannelState = typeof SendblueChannelState.Type;

export const SendblueSendMessageInput = Schema.Struct({
  content: SendblueOutboundMessageContent,
  from_number: E164PhoneNumber,
  number: E164PhoneNumber,
});
export type SendblueSendMessageInput = typeof SendblueSendMessageInput.Type;

export const SendblueSendMessageSuccess = Schema.Struct({
  message_handle: SendblueMessageHandle,
  status: SendblueMessageDeliveryStatus,
});
export type SendblueSendMessageSuccess = typeof SendblueSendMessageSuccess.Type;

export const SendblueSendMessageProviderRejected = Schema.Struct({
  status: SendblueProviderRejectedStatus,
});
export type SendblueSendMessageProviderRejected =
  typeof SendblueSendMessageProviderRejected.Type;

export const SendblueSendMessageProviderResponse = Schema.Union([
  SendblueSendMessageSuccess,
  SendblueSendMessageProviderRejected,
]);
export type SendblueSendMessageProviderResponse =
  typeof SendblueSendMessageProviderResponse.Type;

export const SendblueReplayClaimStatus = Schema.Literals([
  "claimed",
  "complete",
  "duplicate",
  "retryable",
  "uncertain",
]);
export type SendblueReplayClaimStatus = typeof SendblueReplayClaimStatus.Type;

export const SendblueReplayKind = Schema.Literals(["inbound", "outbound"]);
export type SendblueReplayKind = typeof SendblueReplayKind.Type;

export const SendblueReplayRecordStatus = Schema.Literals([
  "claimed",
  "complete",
  "retryable",
  "uncertain",
]);
export type SendblueReplayRecordStatus = typeof SendblueReplayRecordStatus.Type;

export const SendblueReplayTerminalStatus = Schema.Literals([
  "complete",
  "uncertain",
]);
export type SendblueReplayTerminalStatus =
  typeof SendblueReplayTerminalStatus.Type;

export const SendblueReplayTransitionStatus = Schema.Literals([
  "complete",
  "retryable",
  "uncertain",
]);
export type SendblueReplayTransitionStatus =
  typeof SendblueReplayTransitionStatus.Type;

export const SendblueReplayClaim = Schema.Struct({
  claimedAtEpochMillis: NonNegativeInt,
  claimId: SendblueReplayClaimId,
  key: SendblueReplayClaimKey,
  status: Schema.Literal("claimed"),
});
export type SendblueReplayClaim = typeof SendblueReplayClaim.Type;

export const SendblueReplayClaimed = Schema.Struct({
  claim: SendblueReplayClaim,
  status: Schema.Literal("claimed"),
});
export type SendblueReplayClaimed = typeof SendblueReplayClaimed.Type;

export const SendblueReplayDuplicate = Schema.Struct({
  status: Schema.Literal("duplicate"),
});
export type SendblueReplayDuplicate = typeof SendblueReplayDuplicate.Type;

export const SendblueReplayClaimResult = Schema.Union([
  SendblueReplayClaimed,
  SendblueReplayDuplicate,
]);
export type SendblueReplayClaimResult = typeof SendblueReplayClaimResult.Type;

export const SendblueReplayCompletion = Schema.Struct({
  providerMessageHandle: Schema.optional(SendblueMessageHandle),
});
export type SendblueReplayCompletion = typeof SendblueReplayCompletion.Type;

export const SendblueReplayRecord = Schema.Struct({
  claimedAtEpochMillis: NonNegativeInt,
  claimId: SendblueReplayClaimId,
  completedAtEpochMillis: Schema.optional(NonNegativeInt),
  key: SendblueReplayClaimKey,
  providerMessageHandle: Schema.optional(SendblueMessageHandle),
  status: SendblueReplayRecordStatus,
});
export type SendblueReplayRecord = typeof SendblueReplayRecord.Type;

export const SendblueWebhookAcknowledgement = Schema.Struct({
  accepted: Schema.Boolean,
});
export type SendblueWebhookAcknowledgement =
  typeof SendblueWebhookAcknowledgement.Type;

export const SendblueEveAuth = Schema.Struct({
  attributes: Schema.Struct({ channel: Schema.Literal("sendblue") }),
  authenticator: Schema.Literal("sendblue"),
  principalId: SendbluePrincipalId,
  principalType: Schema.Literal("user"),
});
export type SendblueEveAuth = typeof SendblueEveAuth.Type;

export const SendblueInboundIgnoredDecision = Schema.TaggedStruct("Ignore", {
  outcome: SendblueIgnoredEvent,
});
export type SendblueInboundIgnoredDecision =
  typeof SendblueInboundIgnoredDecision.Type;

export const SendblueInboundDuplicateDecision = Schema.TaggedStruct(
  "Duplicate",
  {}
);
export type SendblueInboundDuplicateDecision =
  typeof SendblueInboundDuplicateDecision.Type;

export const SendblueInboundDispatchDecision = Schema.TaggedStruct("Dispatch", {
  auth: SendblueEveAuth,
  claim: SendblueReplayClaim,
  continuationToken: SendblueConversationKey,
  message: SendblueInboundDispatchContent,
  state: SendblueChannelState,
});
export type SendblueInboundDispatchDecision =
  typeof SendblueInboundDispatchDecision.Type;

export const SendblueInboundDecision = Schema.Union([
  SendblueInboundIgnoredDecision,
  SendblueInboundDuplicateDecision,
  SendblueInboundDispatchDecision,
]);
export type SendblueInboundDecision = typeof SendblueInboundDecision.Type;

export const SendblueCompletedMessage = Schema.Struct({
  finishReason: EveAssistantStepFinishReason,
  message: Schema.NullOr(EveAssistantMessageContent),
  sequence: NonNegativeInt,
  sessionId: EveSessionId,
  state: SendblueChannelState,
  stepIndex: NonNegativeInt,
  turnId: EveTurnId,
});
export type SendblueCompletedMessage = typeof SendblueCompletedMessage.Type;

export const SendblueCompletedMessageResult = Schema.Literals([
  "delivered",
  "duplicate",
  "ignored",
]);
export type SendblueCompletedMessageResult =
  typeof SendblueCompletedMessageResult.Type;

export const SendblueProofResult = Schema.Struct({
  accepted: Schema.Boolean,
  status: Schema.Int.check(Schema.isBetween({ maximum: 599, minimum: 100 })),
});
export type SendblueProofResult = typeof SendblueProofResult.Type;

export const SendblueConfig = Schema.Struct({
  allowedServices: Schema.Array(SendblueService),
  apiBaseUrl: Schema.URL,
  apiKey: SendblueApiKey,
  apiSecret: SendblueApiSecret,
  fromNumber: E164PhoneNumber,
  replayStore: Schema.Struct({
    leaseSeconds: Schema.Int.check(Schema.isGreaterThan(0)),
    prefix: SendblueReplayStorePrefix,
    token: SendblueReplayStoreToken,
    ttlSeconds: Schema.Int.check(Schema.isGreaterThan(0)),
    url: SendblueReplayStoreUrl,
  }),
  routingKey: SendblueRoutingKey,
  senderIdentities: SendblueSenderIdentities,
  webhookSecret: SendblueWebhookSecret,
});
export type SendblueConfig = typeof SendblueConfig.Type;

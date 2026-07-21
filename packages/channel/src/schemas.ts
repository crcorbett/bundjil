import { Schema } from "effect";

export const ChannelProvider = Schema.Literals(["sendblue", "photon"]);
export type ChannelProvider = typeof ChannelProvider.Type;
export type ChannelProviderEncoded = typeof ChannelProvider.Encoded;

export const ChannelConversationId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/channel/ChannelConversationId")
);
export type ChannelConversationId = typeof ChannelConversationId.Type;
export type ChannelConversationIdEncoded = typeof ChannelConversationId.Encoded;

export const ChannelParticipantId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/channel/ChannelParticipantId")
);
export type ChannelParticipantId = typeof ChannelParticipantId.Type;
export type ChannelParticipantIdEncoded = typeof ChannelParticipantId.Encoded;

export const ChannelInboundMessageId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/channel/ChannelInboundMessageId")
);
export type ChannelInboundMessageId = typeof ChannelInboundMessageId.Type;
export type ChannelInboundMessageIdEncoded =
  typeof ChannelInboundMessageId.Encoded;

export const ChannelProviderMessageId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/channel/ChannelProviderMessageId")
);
export type ChannelProviderMessageId = typeof ChannelProviderMessageId.Type;
export type ChannelProviderMessageIdEncoded =
  typeof ChannelProviderMessageId.Encoded;

export const ChannelInboundText = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(20_000)),
  Schema.brand("@bundjil/channel/ChannelInboundText")
);
export type ChannelInboundText = typeof ChannelInboundText.Type;
export type ChannelInboundTextEncoded = typeof ChannelInboundText.Encoded;

export const ChannelOutboundText = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(20_000)),
  Schema.brand("@bundjil/channel/ChannelOutboundText")
);
export type ChannelOutboundText = typeof ChannelOutboundText.Type;
export type ChannelOutboundTextEncoded = typeof ChannelOutboundText.Encoded;

export const ChannelIgnoreReason = Schema.Literals([
  "unsupportedEvent",
  "unsupportedService",
  "unsupportedConversation",
  "nonInbound",
  "emptyText",
  "selfMessage",
]);
export type ChannelIgnoreReason = typeof ChannelIgnoreReason.Type;
export type ChannelIgnoreReasonEncoded = typeof ChannelIgnoreReason.Encoded;

export const ChannelConversation = Schema.Struct({
  provider: ChannelProvider,
  conversationId: ChannelConversationId,
  participantId: ChannelParticipantId,
  providerAgentId: Schema.optional(ChannelParticipantId),
});
export type ChannelConversation = typeof ChannelConversation.Type;
export type ChannelConversationEncoded = typeof ChannelConversation.Encoded;

export const ChannelInboundTextMessage = Schema.Struct({
  messageId: ChannelInboundMessageId,
  conversation: ChannelConversation,
  text: ChannelInboundText,
});
export type ChannelInboundTextMessage = typeof ChannelInboundTextMessage.Type;
export type ChannelInboundTextMessageEncoded =
  typeof ChannelInboundTextMessage.Encoded;

export const ChannelWebhookResult = Schema.Union([
  Schema.TaggedStruct("Accepted", { message: ChannelInboundTextMessage }),
  Schema.TaggedStruct("Ignored", { reason: ChannelIgnoreReason }),
]);
export type ChannelWebhookResult = typeof ChannelWebhookResult.Type;
export type ChannelWebhookResultEncoded = typeof ChannelWebhookResult.Encoded;

export const ChannelSendMessageInput = Schema.Struct({
  conversation: ChannelConversation,
  text: ChannelOutboundText,
});
export type ChannelSendMessageInput = typeof ChannelSendMessageInput.Type;
export type ChannelSendMessageInputEncoded =
  typeof ChannelSendMessageInput.Encoded;

export const ChannelSendAccepted = Schema.Struct({
  provider: ChannelProvider,
  messageId: ChannelProviderMessageId,
});
export type ChannelSendAccepted = typeof ChannelSendAccepted.Type;
export type ChannelSendAcceptedEncoded = typeof ChannelSendAccepted.Encoded;

export const ChannelPresenceAction = Schema.Literals(["start", "stop"]);
export type ChannelPresenceAction = typeof ChannelPresenceAction.Type;
export type ChannelPresenceActionEncoded = typeof ChannelPresenceAction.Encoded;

export const ChannelPresenceInput = Schema.Struct({
  conversation: ChannelConversation,
  action: ChannelPresenceAction,
});
export type ChannelPresenceInput = typeof ChannelPresenceInput.Type;
export type ChannelPresenceInputEncoded = typeof ChannelPresenceInput.Encoded;

export const ChannelPresenceResult = Schema.Literals(["accepted", "no-op"]);
export type ChannelPresenceResult = typeof ChannelPresenceResult.Type;
export type ChannelPresenceResultEncoded = typeof ChannelPresenceResult.Encoded;

export const ChannelOperation = Schema.Literals([
  "decodeWebhook",
  "sendMessage",
  "setPresence",
]);
export type ChannelOperation = typeof ChannelOperation.Type;
export type ChannelOperationEncoded = typeof ChannelOperation.Encoded;

export const ChannelSafeReason = Schema.Literals([
  "authentication",
  "invalidPayload",
  "requestEncoding",
  "providerRejected",
  "rateLimited",
  "timeout",
  "transport",
  "uncertain",
  "unsupported",
]);
export type ChannelSafeReason = typeof ChannelSafeReason.Type;
export type ChannelSafeReasonEncoded = typeof ChannelSafeReason.Encoded;

export const ChannelSafeStatus = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 100, maximum: 599 }))
);
export type ChannelSafeStatus = typeof ChannelSafeStatus.Type;
export type ChannelSafeStatusEncoded = typeof ChannelSafeStatus.Encoded;

export const ChannelRetryClass = Schema.Literals([
  "never",
  "backoff",
  "readbackRequired",
]);
export type ChannelRetryClass = typeof ChannelRetryClass.Type;
export type ChannelRetryClassEncoded = typeof ChannelRetryClass.Encoded;

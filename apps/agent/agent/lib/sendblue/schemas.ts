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

export const SendblueWebhookSecret = Schema.Redacted(Schema.NonEmptyString);
export type SendblueWebhookSecret = typeof SendblueWebhookSecret.Type;

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

export const SendblueInboundMessage = Schema.Struct({
  content: Schema.String,
  from_number: E164PhoneNumber,
  group_id: Schema.optional(Schema.String),
  message_handle: SendblueMessageHandle,
  sendblue_number: E164PhoneNumber,
  service: Schema.Literals(["iMessage", "SMS", "RCS"]),
  status: Schema.String,
  to_number: E164PhoneNumber,
});
export type SendblueInboundMessage = typeof SendblueInboundMessage.Type;

export const SendblueIgnoredEvent = Schema.Struct({
  reason: Schema.Literals([
    "duplicate",
    "group",
    "media",
    "outbound",
    "senderNotAllowed",
    "serviceNotAllowed",
    "statusNotReceived",
  ]),
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
  content: Schema.NonEmptyString.check(Schema.isMaxLength(18_996)),
  from_number: E164PhoneNumber,
  number: E164PhoneNumber,
});
export type SendblueSendMessageInput = typeof SendblueSendMessageInput.Type;

export const SendblueSendMessageSuccess = Schema.Struct({
  message_handle: SendblueMessageHandle,
  status: Schema.Literals(["QUEUED", "SENT", "DELIVERED"]),
});
export type SendblueSendMessageSuccess = typeof SendblueSendMessageSuccess.Type;

export const SendblueSendMessageProviderRejected = Schema.Struct({
  status: Schema.Literal("ERROR"),
});
export type SendblueSendMessageProviderRejected =
  typeof SendblueSendMessageProviderRejected.Type;

export const SendblueSendMessageProviderResponse = Schema.Union([
  SendblueSendMessageSuccess,
  SendblueSendMessageProviderRejected,
]);
export type SendblueSendMessageProviderResponse =
  typeof SendblueSendMessageProviderResponse.Type;

export const ReplayClaimStatus = Schema.Literals([
  "claimed",
  "complete",
  "duplicate",
  "uncertain",
]);
export type ReplayClaimStatus = typeof ReplayClaimStatus.Type;

export const SendblueWebhookAcknowledgement = Schema.Struct({
  accepted: Schema.Boolean,
});
export type SendblueWebhookAcknowledgement =
  typeof SendblueWebhookAcknowledgement.Type;

export const SendblueProofResult = Schema.Struct({
  accepted: Schema.Boolean,
  status: Schema.Int.check(Schema.isBetween({ maximum: 599, minimum: 100 })),
});
export type SendblueProofResult = typeof SendblueProofResult.Type;

export const SendblueConfig = Schema.Struct({
  allowedServices: Schema.Array(Schema.Literals(["iMessage", "SMS", "RCS"])),
  apiBaseUrl: Schema.URL,
  apiKey: Schema.Redacted(Schema.NonEmptyString),
  apiSecret: Schema.Redacted(Schema.NonEmptyString),
  fromNumber: E164PhoneNumber,
  replayStore: Schema.Struct({
    leaseSeconds: Schema.Int.check(Schema.isGreaterThan(0)),
    prefix: Schema.NonEmptyString,
    token: Schema.Redacted(Schema.NonEmptyString),
    ttlSeconds: Schema.Int.check(Schema.isGreaterThan(0)),
    url: Schema.Redacted(Schema.NonEmptyString),
  }),
  routingKey: Schema.Redacted(Schema.NonEmptyString),
  senderIdentities: SendblueSenderIdentities,
  webhookSecret: SendblueWebhookSecret,
});
export type SendblueConfig = typeof SendblueConfig.Type;

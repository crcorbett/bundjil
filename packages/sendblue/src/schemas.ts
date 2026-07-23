import { Schema } from "effect";

export const SendblueE164PhoneNumber = Schema.String.check(
  Schema.isPattern(/^\+[1-9]\d{7,14}$/)
).pipe(Schema.brand("@bundjil/sendblue/SendblueE164PhoneNumber"));
export type SendblueE164PhoneNumber = typeof SendblueE164PhoneNumber.Type;

export const SendblueApiKey = Schema.Redacted(Schema.NonEmptyString);
export type SendblueApiKey = typeof SendblueApiKey.Type;

export const SendblueApiSecret = Schema.Redacted(Schema.NonEmptyString);
export type SendblueApiSecret = typeof SendblueApiSecret.Type;

export const SendblueWebhookSecret = Schema.Redacted(Schema.NonEmptyString);
export type SendblueWebhookSecret = typeof SendblueWebhookSecret.Type;

export const SendblueService = Schema.Literals(["iMessage", "SMS", "RCS"]);
export type SendblueService = typeof SendblueService.Type;

export const SendblueTypingDurationMillis = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 300_000 })),
  Schema.brand("@bundjil/sendblue/SendblueTypingDurationMillis")
);
export type SendblueTypingDurationMillis =
  typeof SendblueTypingDurationMillis.Type;

export const SendblueWebhookContent = Schema.String;
export const SendblueMessageHandle = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/sendblue/SendblueMessageHandle")
);
export const SendblueWebhookStatus = Schema.NonEmptyString;
export const SendblueOutboundContent = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isMaxLength(18_996))
);

export const SendblueConfig = Schema.Struct({
  apiKey: SendblueApiKey,
  apiSecret: SendblueApiSecret,
  webhookSecret: SendblueWebhookSecret,
  line: SendblueE164PhoneNumber,
  allowedServices: Schema.Array(SendblueService),
  typingDurationMillis: SendblueTypingDurationMillis,
});
export type SendblueConfig = typeof SendblueConfig.Type;
export type SendblueConfigEncoded = typeof SendblueConfig.Encoded;

export const SendblueWebhookMessage = Schema.Struct({
  content: SendblueWebhookContent,
  from_number: SendblueE164PhoneNumber,
  to_number: SendblueE164PhoneNumber,
  sendblue_number: SendblueE164PhoneNumber,
  message_handle: SendblueMessageHandle,
  is_outbound: Schema.Boolean,
  status: SendblueWebhookStatus,
  service: SendblueService,
  group_id: Schema.optional(Schema.NullOr(Schema.String)),
  media_url: Schema.optional(Schema.NullOr(Schema.String)),
});

export const SendblueSendMessageRequest = Schema.Struct({
  content: SendblueOutboundContent,
  from_number: SendblueE164PhoneNumber,
  number: SendblueE164PhoneNumber,
});

export const SendblueSendMessageResponse = Schema.Union([
  Schema.Struct({
    status: Schema.Literals(["QUEUED", "SENT", "DELIVERED"]),
    message_handle: SendblueMessageHandle,
  }),
  Schema.Struct({ status: Schema.Literal("ERROR") }),
]);

export const SendbluePresenceRequest = Schema.Union([
  Schema.Struct({
    number: SendblueE164PhoneNumber,
    from_number: SendblueE164PhoneNumber,
    state: Schema.Literal("start"),
    max_duration_ms: SendblueTypingDurationMillis,
  }),
  Schema.Struct({
    number: SendblueE164PhoneNumber,
    from_number: SendblueE164PhoneNumber,
    state: Schema.Literal("stop"),
  }),
]);

export const SendbluePresenceResponse = Schema.Union([
  Schema.Struct({ status: Schema.Literals(["QUEUED", "SENT"]) }),
  Schema.Struct({ status: Schema.Literal("ERROR") }),
]);

export const SendblueWebhookBodyLimitBytes = 262_144;

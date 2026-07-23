import { Schema } from "effect";

export const PhotonProjectId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/photon/PhotonProjectId")
);
export type PhotonProjectId = typeof PhotonProjectId.Type;
export type PhotonProjectIdEncoded = typeof PhotonProjectId.Encoded;

export const PhotonProjectSecret = Schema.Redacted(Schema.NonEmptyString);
export type PhotonProjectSecret = typeof PhotonProjectSecret.Type;
export type PhotonProjectSecretEncoded = typeof PhotonProjectSecret.Encoded;

export const PhotonUserId = Schema.NonEmptyString.pipe(
  Schema.brand("@bundjil/photon/PhotonUserId")
);
export type PhotonUserId = typeof PhotonUserId.Type;
export type PhotonUserIdEncoded = typeof PhotonUserId.Encoded;

export const PhotonE164PhoneNumber = Schema.String.check(
  Schema.isPattern(/^\+[1-9]\d{6,14}$/)
).pipe(Schema.brand("@bundjil/photon/PhotonE164PhoneNumber"));
export type PhotonE164PhoneNumber = typeof PhotonE164PhoneNumber.Type;
export type PhotonE164PhoneNumberEncoded = typeof PhotonE164PhoneNumber.Encoded;

export const PhotonSharedUserPhoneNumber = Schema.Redacted(
  PhotonE164PhoneNumber
);
export type PhotonSharedUserPhoneNumber =
  typeof PhotonSharedUserPhoneNumber.Type;
export type PhotonSharedUserPhoneNumberEncoded =
  typeof PhotonSharedUserPhoneNumber.Encoded;

export const PhotonWebhookId = Schema.String.check(Schema.isUUID()).pipe(
  Schema.brand("@bundjil/photon/PhotonWebhookId")
);
export type PhotonWebhookId = typeof PhotonWebhookId.Type;
export type PhotonWebhookIdEncoded = typeof PhotonWebhookId.Encoded;

export const PhotonWebhookSecret = Schema.Redacted(Schema.NonEmptyString);
export type PhotonWebhookSecret = typeof PhotonWebhookSecret.Type;
export type PhotonWebhookSecretEncoded = typeof PhotonWebhookSecret.Encoded;

export const PhotonWebhookToleranceSeconds = Schema.Int.pipe(
  Schema.check(Schema.isBetween({ minimum: 1, maximum: 900 })),
  Schema.brand("@bundjil/photon/PhotonWebhookToleranceSeconds")
);
export type PhotonWebhookToleranceSeconds =
  typeof PhotonWebhookToleranceSeconds.Type;
export type PhotonWebhookToleranceSecondsEncoded =
  typeof PhotonWebhookToleranceSeconds.Encoded;

export const PhotonConfig = Schema.Struct({
  projectId: PhotonProjectId,
  projectSecret: PhotonProjectSecret,
  webhookId: PhotonWebhookId,
  webhookSecret: PhotonWebhookSecret,
  webhookToleranceSeconds: PhotonWebhookToleranceSeconds,
});
export type PhotonConfig = typeof PhotonConfig.Type;
export type PhotonConfigEncoded = typeof PhotonConfig.Encoded;

const PhotonWebhookEvent = Schema.NonEmptyString;
const PhotonWebhookSpaceId = Schema.NonEmptyString;
const PhotonWebhookPlatform = Schema.NonEmptyString;
const PhotonWebhookSpaceType = Schema.NonEmptyString;
const PhotonWebhookSpacePhone = Schema.NonEmptyString;
const PhotonWebhookMessageId = Schema.NonEmptyString;
const PhotonWebhookDirection = Schema.NonEmptyString;
const PhotonWebhookMessageTimestamp = Schema.NonEmptyString;
const PhotonWebhookSenderId = Schema.NonEmptyString;
const PhotonWebhookText = Schema.String;
const PhotonSdkMessageId = Schema.NonEmptyString;

const PhotonWebhookTimestamp = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isGreaterThanOrEqualTo(0))
);

const PhotonWebhookSignature = Schema.String.check(
  Schema.isPattern(/^v0=[0-9a-f]{64}$/)
);

export const PhotonWebhookHeaders = Schema.Struct({
  event: PhotonWebhookEvent,
  webhookId: PhotonWebhookId,
  timestamp: PhotonWebhookTimestamp,
  signature: PhotonWebhookSignature,
});
export type PhotonWebhookHeaders = typeof PhotonWebhookHeaders.Type;

const PhotonWebhookSpace = Schema.Struct({
  id: PhotonWebhookSpaceId,
  platform: PhotonWebhookPlatform,
  type: Schema.optional(PhotonWebhookSpaceType),
  phone: Schema.optional(PhotonWebhookSpacePhone),
});

const PhotonWebhookSender = Schema.Struct({
  id: PhotonWebhookSenderId,
  platform: PhotonWebhookPlatform,
});

export const PhotonTextContent = Schema.Struct({
  type: Schema.Literal("text"),
  text: PhotonWebhookText,
});

const PhotonUnsupportedContent = Schema.Struct({
  type: PhotonWebhookEvent.pipe(
    Schema.check(
      Schema.makeFilter((value) => value !== "text", {
        identifier: "PhotonUnsupportedContentType",
      })
    )
  ),
});

export const PhotonMessagesWebhook = Schema.Struct({
  event: Schema.Literal("messages"),
  space: PhotonWebhookSpace,
  message: Schema.Struct({
    id: PhotonWebhookMessageId,
    platform: PhotonWebhookPlatform,
    direction: PhotonWebhookDirection,
    timestamp: PhotonWebhookMessageTimestamp,
    sender: PhotonWebhookSender,
    space: PhotonWebhookSpace,
    content: Schema.Union([PhotonTextContent, PhotonUnsupportedContent]),
  }),
});

const PhotonUnsupportedWebhook = Schema.Struct({
  event: PhotonWebhookEvent.pipe(
    Schema.check(
      Schema.makeFilter((value) => value !== "messages", {
        identifier: "PhotonUnsupportedWebhookEvent",
      })
    )
  ),
});

export const PhotonWebhookPayload = Schema.Union([
  PhotonMessagesWebhook,
  PhotonUnsupportedWebhook,
]);
export type PhotonWebhookPayload = typeof PhotonWebhookPayload.Type;

export const PhotonSdkSendResult = Schema.Struct({ id: PhotonSdkMessageId });
export type PhotonSdkSendResult = typeof PhotonSdkSendResult.Type;
export type PhotonSdkSendResultEncoded = typeof PhotonSdkSendResult.Encoded;

export const PhotonWebhookBodyLimitBytes = 262_144;

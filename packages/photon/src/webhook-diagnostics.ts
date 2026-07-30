import { Match, Schema } from "effect";

import type { PhotonWebhookPlatform } from "./schemas.js";

export const PhotonWebhookPlatformClassification = Schema.Literals([
  "exactAccepted",
  "knownAlternative",
  "caseVariant",
  "unknown",
]);
export type PhotonWebhookPlatformClassification =
  typeof PhotonWebhookPlatformClassification.Type;

export const classifyPhotonWebhookPlatform = (
  platform: typeof PhotonWebhookPlatform.Type
): PhotonWebhookPlatformClassification =>
  Match.value(platform).pipe(
    Match.when("imessage", () =>
      PhotonWebhookPlatformClassification.make("exactAccepted")
    ),
    Match.when("local_imessage", () =>
      PhotonWebhookPlatformClassification.make("knownAlternative")
    ),
    Match.when(
      (candidate) => /^imessage$/i.test(candidate),
      () => PhotonWebhookPlatformClassification.make("caseVariant")
    ),
    Match.orElse(() => PhotonWebhookPlatformClassification.make("unknown"))
  );

export const PhotonWebhookBoundaryDiagnostic = Schema.Union([
  Schema.Struct({
    disposition: Schema.Literal("authenticationRejected"),
    checkpoint: Schema.Literals(["webhookId", "timestamp", "signature"]),
  }),
  Schema.Struct({
    disposition: Schema.Literal("authenticationRejected"),
    checkpoint: Schema.Literals([
      "eventHeader",
      "webhookIdHeader",
      "timestampHeader",
      "signatureHeader",
    ]),
    classification: Schema.Literals(["missing", "malformed"]),
  }),
  Schema.Struct({
    disposition: Schema.Literal("unsupportedService"),
    checkpoint: Schema.Literals([
      "spacePlatform",
      "messagePlatform",
      "senderPlatform",
      "messageSpacePlatform",
    ]),
    classification: Schema.Literals([
      "knownAlternative",
      "caseVariant",
      "unknown",
    ]),
  }),
]);
export type PhotonWebhookBoundaryDiagnostic =
  typeof PhotonWebhookBoundaryDiagnostic.Type;

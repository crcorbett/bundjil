import { Schema } from "effect";

export const PhotonWebhookBoundaryDiagnostic = Schema.Union([
  Schema.Struct({
    disposition: Schema.Literal("authenticationRejected"),
    checkpoint: Schema.Literals([
      "headers",
      "webhookId",
      "timestamp",
      "signature",
    ]),
  }),
  Schema.Struct({
    disposition: Schema.Literal("unsupportedService"),
    checkpoint: Schema.Literals([
      "spacePlatform",
      "messagePlatform",
      "senderPlatform",
      "messageSpacePlatform",
    ]),
  }),
]);
export type PhotonWebhookBoundaryDiagnostic =
  typeof PhotonWebhookBoundaryDiagnostic.Type;

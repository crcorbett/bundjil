import { createHmac, timingSafeEqual } from "node:crypto";

import {
  ChannelDeliveryUncertainError,
  ChannelInboundTextMessage,
  ChannelProviderMessageId,
  ChannelProviderRejectedError,
  ChannelTransport,
  ChannelUnavailableError,
  ChannelUnsupportedOperationError,
  ChannelWebhookAuthenticationError,
  ChannelWebhookResult,
  ChannelWebhookSchemaError,
} from "@bundjil/channel";
import type {
  ChannelPresenceResultType,
  ChannelWebhookResult as ChannelWebhookResultType,
} from "@bundjil/channel";
import { Clock, Effect, Layer, Option, Redacted, Schema } from "effect";

import { PhotonClient } from "./client.js";
import {
  PhotonWebhookBodyLimitBytes,
  PhotonWebhookHeaders,
  PhotonMessagesWebhook,
  PhotonWebhookPayload,
  PhotonTextContent,
} from "./schemas.js";
import type { PhotonConfig } from "./schemas.js";
import type { PhotonWebhookBoundaryDiagnostic } from "./webhook-diagnostics.js";

const textDecoder = new TextDecoder("utf-8", { fatal: true });
const acceptedPresence: ChannelPresenceResultType = "accepted";

const authenticationError = () =>
  new ChannelWebhookAuthenticationError({
    provider: "photon",
    operation: "decodeWebhook",
    reason: "authentication",
    retry: "never",
  });

const authenticationFailure = (
  checkpoint: Extract<
    typeof PhotonWebhookBoundaryDiagnostic.Type,
    { readonly disposition: "authenticationRejected" }
  >["checkpoint"]
) => {
  const diagnostic: typeof PhotonWebhookBoundaryDiagnostic.Type = {
    disposition: "authenticationRejected",
    checkpoint,
  };
  return Effect.logWarning("PhotonWebhookBoundaryDisposition", diagnostic).pipe(
    Effect.andThen(Effect.fail(authenticationError()))
  );
};

const unsupportedService = (
  checkpoint: Extract<
    typeof PhotonWebhookBoundaryDiagnostic.Type,
    { readonly disposition: "unsupportedService" }
  >["checkpoint"]
): Effect.Effect<ChannelWebhookResultType> => {
  const diagnostic: typeof PhotonWebhookBoundaryDiagnostic.Type = {
    disposition: "unsupportedService",
    checkpoint,
  };
  return Effect.logInfo("PhotonWebhookBoundaryDisposition", diagnostic).pipe(
    Effect.as(
      ChannelWebhookResult.make({
        _tag: "Ignored",
        reason: "unsupportedService",
      })
    )
  );
};

const webhookSchemaError = () =>
  new ChannelWebhookSchemaError({
    provider: "photon",
    operation: "decodeWebhook",
    reason: "invalidPayload",
    retry: "never",
  });

const verifySignature = (
  timestamp: number,
  body: Uint8Array,
  signature: string,
  secret: Redacted.Redacted
) =>
  Effect.sync(() => {
    const expected = createHmac("sha256", Redacted.value(secret))
      .update(`v0:${timestamp}:`)
      .update(body)
      .digest();
    const provided = Buffer.from(signature.slice(3), "hex");
    return expected.byteLength === provided.byteLength
      ? timingSafeEqual(expected, provided)
      : false;
  });

export const layerTransport = (config: PhotonConfig) =>
  Layer.effect(
    ChannelTransport,
    Effect.gen(function* makePhotonTransport() {
      const client = yield* PhotonClient;

      return ChannelTransport.of({
        decodeWebhook: Effect.fn("PhotonTransport.decodeWebhook")(
          function* (request) {
            const headers = yield* Schema.decodeUnknownEffect(
              PhotonWebhookHeaders
            )({
              event: request.headers.get("x-spectrum-event"),
              webhookId: request.headers.get("x-spectrum-webhook-id"),
              timestamp: request.headers.get("x-spectrum-timestamp"),
              signature: request.headers.get("x-spectrum-signature"),
            }).pipe(Effect.catch(() => authenticationFailure("headers")));
            if (headers.webhookId !== config.webhookId) {
              return yield* authenticationFailure("webhookId");
            }
            const now = yield* Clock.currentTimeMillis;
            if (
              Math.abs(Math.floor(now / 1000) - headers.timestamp) >
              config.webhookToleranceSeconds
            ) {
              return yield* authenticationFailure("timestamp");
            }
            const buffer = yield* Effect.tryPromise({
              try: () => request.arrayBuffer(),
              catch: webhookSchemaError,
            });
            if (buffer.byteLength > PhotonWebhookBodyLimitBytes) {
              return yield* webhookSchemaError();
            }
            const body = new Uint8Array(buffer);
            const authenticated = yield* verifySignature(
              headers.timestamp,
              body,
              headers.signature,
              config.webhookSecret
            );
            if (!authenticated) {
              return yield* authenticationFailure("signature");
            }
            const bodyText = yield* Effect.try({
              try: () => textDecoder.decode(body),
              catch: webhookSchemaError,
            });
            const payload = yield* Schema.decodeUnknownEffect(
              Schema.fromJsonString(PhotonWebhookPayload)
            )(bodyText).pipe(Effect.mapError(webhookSchemaError));
            if (headers.event !== payload.event) {
              return yield* webhookSchemaError();
            }
            if (!Schema.is(PhotonMessagesWebhook)(payload)) {
              if (payload.event === "messages") {
                return yield* webhookSchemaError();
              }
              return { _tag: "Ignored", reason: "unsupportedEvent" };
            }
            if (payload.space.platform !== "iMessage") {
              return yield* unsupportedService("spacePlatform");
            }
            if (payload.message.platform !== "iMessage") {
              return yield* unsupportedService("messagePlatform");
            }
            if (payload.message.sender.platform !== "iMessage") {
              return yield* unsupportedService("senderPlatform");
            }
            if (payload.message.space.platform !== "iMessage") {
              return yield* unsupportedService("messageSpacePlatform");
            }
            if (
              payload.message.space.id !== payload.space.id ||
              payload.message.space.type !== payload.space.type ||
              payload.message.space.phone !== payload.space.phone
            ) {
              return yield* webhookSchemaError();
            }
            if (payload.message.direction !== "inbound") {
              return { _tag: "Ignored", reason: "nonInbound" };
            }
            if (payload.space.type !== "dm") {
              return { _tag: "Ignored", reason: "unsupportedConversation" };
            }
            if (!Schema.is(PhotonTextContent)(payload.message.content)) {
              return { _tag: "Ignored", reason: "unsupportedEvent" };
            }
            const content = payload.message.content.text.trim();
            if (content.length === 0) {
              return { _tag: "Ignored", reason: "emptyText" };
            }
            const message = yield* Schema.decodeEffect(
              ChannelInboundTextMessage
            )({
              messageId: payload.message.id,
              conversation: {
                provider: "photon",
                conversationId: payload.space.id,
                participantId: payload.message.sender.id,
              },
              text: content,
            }).pipe(Effect.mapError(webhookSchemaError));
            return { _tag: "Accepted", message };
          }
        ),
        sendMessage: Effect.fn("PhotonTransport.sendMessage")(
          function* (input) {
            if (input.conversation.provider !== "photon") {
              return yield* new ChannelUnsupportedOperationError({
                provider: "photon",
                operation: "sendMessage",
                reason: "unsupported",
                retry: "never",
              });
            }
            const result = yield* client
              .sendMessage(input.conversation.participantId, input.text)
              .pipe(
                Effect.timeoutOption("30 seconds"),
                Effect.flatMap(
                  Option.match({
                    onNone: () =>
                      Effect.fail(
                        new ChannelDeliveryUncertainError({
                          provider: "photon",
                          operation: "sendMessage",
                          reason: "timeout",
                          retry: "readbackRequired",
                        })
                      ),
                    onSome: Effect.succeed,
                  })
                )
              );
            return {
              provider: "photon",
              messageId: yield* Schema.decodeEffect(ChannelProviderMessageId)(
                result.id
              ).pipe(
                Effect.mapError(
                  () =>
                    new ChannelProviderRejectedError({
                      provider: "photon",
                      operation: "sendMessage",
                      reason: "invalidPayload",
                      retry: "never",
                    })
                )
              ),
            };
          }
        ),
        setPresence: Effect.fn("PhotonTransport.setPresence")(
          function* (input) {
            if (input.conversation.provider !== "photon") {
              return yield* new ChannelUnsupportedOperationError({
                provider: "photon",
                operation: "setPresence",
                reason: "unsupported",
                retry: "never",
              });
            }
            yield* client
              .setPresence(input.conversation.participantId, input.action)
              .pipe(
                Effect.timeoutOption("15 seconds"),
                Effect.flatMap(
                  Option.match({
                    onNone: () =>
                      Effect.fail(
                        new ChannelUnavailableError({
                          provider: "photon",
                          operation: "setPresence",
                          reason: "timeout",
                          retry: "backoff",
                        })
                      ),
                    onSome: Effect.succeed,
                  })
                )
              );
            return acceptedPresence;
          }
        ),
      });
    })
  );

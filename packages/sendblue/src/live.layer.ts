import {
  ChannelDeliveryUncertainError,
  ChannelInboundTextMessage,
  ChannelProviderMessageId,
  ChannelProviderRejectedError,
  ChannelRequestEncodingError,
  ChannelTransport,
  ChannelUnavailableError,
  ChannelUnsupportedOperationError,
  ChannelWebhookAuthenticationError,
  ChannelWebhookSchemaError,
} from "@bundjil/channel";
import type { ChannelPresenceResultType } from "@bundjil/channel";
import {
  Effect,
  HashSet,
  Layer,
  Match,
  Option,
  Redacted,
  Schema,
} from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import {
  SendblueE164PhoneNumber,
  SendbluePresenceRequest,
  SendbluePresenceResponse,
  SendblueSendMessageRequest,
  SendblueSendMessageResponse,
  SendblueWebhookBodyLimitBytes,
  SendblueWebhookMessage,
} from "./schemas.js";
import type { SendblueConfig } from "./schemas.js";

const sendMessageUrl = "https://api.sendblue.com/api/send-message";
const presenceUrl = "https://api.sendblue.com/api/send-typing-indicator";
const textEncoder = new TextEncoder();

const verifyWebhookSecret = (provided: string, expected: Redacted.Redacted) =>
  Effect.tryPromise({
    try: async () => {
      const algorithm = { name: "HMAC", hash: "SHA-256" };
      const [providedKey, expectedKey] = await Promise.all([
        globalThis.crypto.subtle.importKey(
          "raw",
          textEncoder.encode(provided),
          algorithm,
          false,
          ["sign"]
        ),
        globalThis.crypto.subtle.importKey(
          "raw",
          textEncoder.encode(Redacted.value(expected)),
          algorithm,
          false,
          ["verify"]
        ),
      ]);
      const comparisonPayload = textEncoder.encode(
        "@bundjil/sendblue/webhook-secret-v1"
      );
      const providedSignature = await globalThis.crypto.subtle.sign(
        algorithm,
        providedKey,
        comparisonPayload
      );
      return globalThis.crypto.subtle.verify(
        algorithm,
        expectedKey,
        providedSignature,
        comparisonPayload
      );
    },
    catch: () =>
      new ChannelWebhookAuthenticationError({
        provider: "sendblue",
        operation: "decodeWebhook",
        reason: "authentication",
        retry: "never",
      }),
  });

export const layerLive = (config: SendblueConfig) =>
  Layer.effect(
    ChannelTransport,
    Effect.gen(function* makeSendblueTransport() {
      const client = yield* HttpClient.HttpClient;
      const allowedServices = HashSet.fromIterable(config.allowedServices);

      return ChannelTransport.of({
        decodeWebhook: Effect.fn("SendblueTransport.decodeWebhook")(
          function* (request) {
            const provided = request.headers.get("sb-signing-secret");
            if (provided === null) {
              return yield* new ChannelWebhookAuthenticationError({
                provider: "sendblue",
                operation: "decodeWebhook",
                reason: "authentication",
                retry: "never",
              });
            }
            const authenticated = yield* verifyWebhookSecret(
              provided,
              config.webhookSecret
            );
            if (!authenticated) {
              return yield* new ChannelWebhookAuthenticationError({
                provider: "sendblue",
                operation: "decodeWebhook",
                reason: "authentication",
                retry: "never",
              });
            }
            const body = yield* Effect.tryPromise({
              try: () => request.text(),
              catch: () =>
                new ChannelWebhookSchemaError({
                  provider: "sendblue",
                  operation: "decodeWebhook",
                  reason: "invalidPayload",
                  retry: "never",
                }),
            });
            if (
              textEncoder.encode(body).byteLength >
              SendblueWebhookBodyLimitBytes
            ) {
              return yield* new ChannelWebhookSchemaError({
                provider: "sendblue",
                operation: "decodeWebhook",
                reason: "invalidPayload",
                retry: "never",
              });
            }
            const decoded = yield* Schema.decodeUnknownEffect(
              Schema.fromJsonString(SendblueWebhookMessage)
            )(body).pipe(
              Effect.mapError(
                () =>
                  new ChannelWebhookSchemaError({
                    provider: "sendblue",
                    operation: "decodeWebhook",
                    reason: "invalidPayload",
                    retry: "never",
                  })
              )
            );
            if (!HashSet.has(allowedServices, decoded.service)) {
              return { _tag: "Ignored", reason: "unsupportedService" };
            }
            if (decoded.sendblue_number !== config.line) {
              return { _tag: "Ignored", reason: "unsupportedConversation" };
            }
            if (
              decoded.group_id !== undefined &&
              decoded.group_id !== null &&
              decoded.group_id.length > 0
            ) {
              return { _tag: "Ignored", reason: "unsupportedConversation" };
            }
            if (decoded.is_outbound) {
              return { _tag: "Ignored", reason: "nonInbound" };
            }
            if (decoded.status !== "RECEIVED") {
              return { _tag: "Ignored", reason: "unsupportedEvent" };
            }
            if (decoded.from_number === decoded.sendblue_number) {
              return { _tag: "Ignored", reason: "selfMessage" };
            }
            const content = decoded.content.trim();
            if (content.length === 0) {
              return { _tag: "Ignored", reason: "emptyText" };
            }
            const message = yield* Schema.decodeEffect(
              ChannelInboundTextMessage
            )({
              messageId: decoded.message_handle,
              conversation: {
                provider: "sendblue",
                conversationId: `${decoded.from_number}:${decoded.sendblue_number}`,
                participantId: decoded.from_number,
                providerAgentId: decoded.sendblue_number,
              },
              text: content,
            }).pipe(
              Effect.mapError(
                () =>
                  new ChannelWebhookSchemaError({
                    provider: "sendblue",
                    operation: "decodeWebhook",
                    reason: "invalidPayload",
                    retry: "never",
                  })
              )
            );
            return { _tag: "Accepted", message };
          }
        ),
        sendMessage: Effect.fn("SendblueTransport.sendMessage")(
          function* (input) {
            if (
              input.conversation.provider !== "sendblue" ||
              input.conversation.providerAgentId === undefined
            ) {
              return yield* new ChannelUnsupportedOperationError({
                provider: "sendblue",
                operation: "sendMessage",
                reason: "unsupported",
                retry: "never",
              });
            }
            const requestBody = yield* Schema.decodeEffect(
              SendblueSendMessageRequest
            )({
              content: input.text,
              from_number: input.conversation.providerAgentId,
              number: input.conversation.participantId,
            }).pipe(
              Effect.mapError(
                () =>
                  new ChannelRequestEncodingError({
                    provider: "sendblue",
                    operation: "sendMessage",
                    reason: "requestEncoding",
                    retry: "never",
                  })
              )
            );
            const request = yield* HttpClientRequest.post(sendMessageUrl).pipe(
              HttpClientRequest.setHeader(
                "sb-api-key-id",
                Redacted.value(config.apiKey)
              ),
              HttpClientRequest.setHeader(
                "sb-api-secret-key",
                Redacted.value(config.apiSecret)
              ),
              HttpClientRequest.schemaBodyJson(SendblueSendMessageRequest)(
                requestBody
              ),
              Effect.mapError(
                () =>
                  new ChannelRequestEncodingError({
                    provider: "sendblue",
                    operation: "sendMessage",
                    reason: "requestEncoding",
                    retry: "never",
                  })
              )
            );
            const response = yield* client.execute(request).pipe(
              Effect.mapError(
                () =>
                  new ChannelDeliveryUncertainError({
                    provider: "sendblue",
                    operation: "sendMessage",
                    reason: "transport",
                    retry: "readbackRequired",
                  })
              ),
              Effect.timeoutOption("30 seconds"),
              Effect.flatMap(
                Option.match({
                  onNone: () =>
                    Effect.fail(
                      new ChannelDeliveryUncertainError({
                        provider: "sendblue",
                        operation: "sendMessage",
                        reason: "timeout",
                        retry: "readbackRequired",
                      })
                    ),
                  onSome: Effect.succeed,
                })
              )
            );
            if (response.status < 200 || response.status >= 300) {
              return yield* Match.value(response.status).pipe(
                Match.when(429, () =>
                  Effect.fail(
                    new ChannelUnavailableError({
                      provider: "sendblue",
                      operation: "sendMessage",
                      reason: "rateLimited",
                      status: response.status,
                      retry: "backoff",
                    })
                  )
                ),
                Match.when(
                  (status) => status >= 500,
                  () =>
                    Effect.fail(
                      new ChannelUnavailableError({
                        provider: "sendblue",
                        operation: "sendMessage",
                        reason: "transport",
                        status: response.status,
                        retry: "backoff",
                      })
                    )
                ),
                Match.orElse(() =>
                  Effect.fail(
                    new ChannelProviderRejectedError({
                      provider: "sendblue",
                      operation: "sendMessage",
                      reason: "providerRejected",
                      status: response.status,
                      retry: "never",
                    })
                  )
                )
              );
            }
            const decoded = yield* HttpClientResponse.schemaBodyJson(
              SendblueSendMessageResponse
            )(response).pipe(
              Effect.mapError(
                () =>
                  new ChannelProviderRejectedError({
                    provider: "sendblue",
                    operation: "sendMessage",
                    reason: "invalidPayload",
                    status: response.status,
                    retry: "never",
                  })
              )
            );
            if (decoded.status === "ERROR") {
              return yield* new ChannelProviderRejectedError({
                provider: "sendblue",
                operation: "sendMessage",
                reason: "providerRejected",
                status: response.status,
                retry: "never",
              });
            }
            return {
              provider: "sendblue",
              messageId: yield* Schema.decodeEffect(ChannelProviderMessageId)(
                decoded.message_handle
              ).pipe(
                Effect.mapError(
                  () =>
                    new ChannelProviderRejectedError({
                      provider: "sendblue",
                      operation: "sendMessage",
                      reason: "invalidPayload",
                      status: response.status,
                      retry: "never",
                    })
                )
              ),
            };
          }
        ),
        setPresence: Effect.fn("SendblueTransport.setPresence")(
          function* (input) {
            if (
              input.conversation.provider !== "sendblue" ||
              input.conversation.providerAgentId === undefined
            ) {
              return yield* new ChannelUnsupportedOperationError({
                provider: "sendblue",
                operation: "setPresence",
                reason: "unsupported",
                retry: "never",
              });
            }
            const participant = yield* Schema.decodeEffect(
              SendblueE164PhoneNumber
            )(input.conversation.participantId).pipe(
              Effect.mapError(
                () =>
                  new ChannelRequestEncodingError({
                    provider: "sendblue",
                    operation: "setPresence",
                    reason: "requestEncoding",
                    retry: "never",
                  })
              )
            );
            const line = yield* Schema.decodeEffect(SendblueE164PhoneNumber)(
              input.conversation.providerAgentId
            ).pipe(
              Effect.mapError(
                () =>
                  new ChannelRequestEncodingError({
                    provider: "sendblue",
                    operation: "setPresence",
                    reason: "requestEncoding",
                    retry: "never",
                  })
              )
            );
            const requestBody = yield* Schema.decodeEffect(
              SendbluePresenceRequest
            )(
              input.action === "start"
                ? {
                    number: participant,
                    from_number: line,
                    state: "start",
                    max_duration_ms: config.typingDurationMillis,
                  }
                : { number: participant, from_number: line, state: "stop" }
            ).pipe(
              Effect.mapError(
                () =>
                  new ChannelRequestEncodingError({
                    provider: "sendblue",
                    operation: "setPresence",
                    reason: "requestEncoding",
                    retry: "never",
                  })
              )
            );
            const request = yield* HttpClientRequest.post(presenceUrl).pipe(
              HttpClientRequest.setHeader(
                "sb-api-key-id",
                Redacted.value(config.apiKey)
              ),
              HttpClientRequest.setHeader(
                "sb-api-secret-key",
                Redacted.value(config.apiSecret)
              ),
              HttpClientRequest.schemaBodyJson(SendbluePresenceRequest)(
                requestBody
              ),
              Effect.mapError(
                () =>
                  new ChannelRequestEncodingError({
                    provider: "sendblue",
                    operation: "setPresence",
                    reason: "requestEncoding",
                    retry: "never",
                  })
              )
            );
            const response = yield* client.execute(request).pipe(
              Effect.mapError(
                () =>
                  new ChannelUnavailableError({
                    provider: "sendblue",
                    operation: "setPresence",
                    reason: "transport",
                    retry: "backoff",
                  })
              ),
              Effect.timeoutOption("2 seconds"),
              Effect.flatMap(
                Option.match({
                  onNone: () =>
                    Effect.fail(
                      new ChannelUnavailableError({
                        provider: "sendblue",
                        operation: "setPresence",
                        reason: "timeout",
                        retry: "backoff",
                      })
                    ),
                  onSome: Effect.succeed,
                })
              )
            );
            if (response.status < 200 || response.status >= 300) {
              return yield* Match.value(response.status).pipe(
                Match.when(429, () =>
                  Effect.fail(
                    new ChannelUnavailableError({
                      provider: "sendblue",
                      operation: "setPresence",
                      reason: "rateLimited",
                      status: response.status,
                      retry: "backoff",
                    })
                  )
                ),
                Match.when(
                  (status) => status >= 500,
                  () =>
                    Effect.fail(
                      new ChannelUnavailableError({
                        provider: "sendblue",
                        operation: "setPresence",
                        reason: "transport",
                        status: response.status,
                        retry: "backoff",
                      })
                    )
                ),
                Match.orElse(() =>
                  Effect.fail(
                    new ChannelProviderRejectedError({
                      provider: "sendblue",
                      operation: "setPresence",
                      reason: "providerRejected",
                      status: response.status,
                      retry: "never",
                    })
                  )
                )
              );
            }
            const decoded = yield* HttpClientResponse.schemaBodyJson(
              SendbluePresenceResponse
            )(response).pipe(
              Effect.mapError(
                () =>
                  new ChannelProviderRejectedError({
                    provider: "sendblue",
                    operation: "setPresence",
                    reason: "invalidPayload",
                    status: response.status,
                    retry: "never",
                  })
              )
            );
            if (decoded.status === "ERROR") {
              return yield* new ChannelProviderRejectedError({
                provider: "sendblue",
                operation: "setPresence",
                reason: "providerRejected",
                status: response.status,
                retry: "never",
              });
            }
            const result: ChannelPresenceResultType = "accepted";
            return result;
          }
        ),
      });
    })
  );

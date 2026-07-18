import { Context, Effect, Layer, Match, Option, Redacted } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import { SendblueConfigService } from "./config.js";
import {
  SendblueDeliveryUncertainError,
  SendblueRequestError,
  SendblueResponseError,
} from "./errors.js";
import {
  SendblueSendMessageInput,
  SendblueSendMessageProviderResponse,
} from "./schemas.js";
import type {
  SendblueSendMessageInput as SendblueSendMessageInputType,
  SendblueSendMessageSuccess as SendblueSendMessageSuccessType,
  SendblueResponseErrorReason,
} from "./schemas.js";

export type SendblueClientError =
  | SendblueDeliveryUncertainError
  | SendblueRequestError
  | SendblueResponseError;

export interface SendblueClientShape {
  readonly sendMessage: (
    input: SendblueSendMessageInputType
  ) => Effect.Effect<SendblueSendMessageSuccessType, SendblueClientError>;
}

export class SendblueClient extends Context.Service<
  SendblueClient,
  SendblueClientShape
>()("@bundjil/agent/SendblueClient") {}

const executionTimeout = "30 seconds";

export const makeSendblueClient = Effect.gen(
  function* makeSendblueClientOperation() {
    const config = yield* SendblueConfigService;
    const client = yield* HttpClient.HttpClient;

    return SendblueClient.of({
      sendMessage: Effect.fn("SendblueClient.sendMessage")(function* (input) {
        const request = yield* HttpClientRequest.post(
          new URL("/api/send-message", config.apiBaseUrl).href
        ).pipe(
          HttpClientRequest.setHeader(
            "sb-api-key-id",
            Redacted.value(config.apiKey)
          ),
          HttpClientRequest.setHeader(
            "sb-api-secret-key",
            Redacted.value(config.apiSecret)
          ),
          HttpClientRequest.schemaBodyJson(SendblueSendMessageInput)(input),
          Effect.mapError(
            () =>
              new SendblueRequestError({
                message: "Unable to encode the Sendblue message request.",
                operation: "sendMessage",
                reason: "requestEncoding",
              })
          )
        );
        const response = yield* client.execute(request).pipe(
          Effect.mapError(
            () =>
              new SendblueDeliveryUncertainError({
                message: "The Sendblue delivery outcome is uncertain.",
                operation: "sendMessage",
                reason: "transport",
              })
          ),
          Effect.timeoutOption(executionTimeout),
          Effect.flatMap(
            Option.match({
              onNone: () =>
                Effect.fail(
                  new SendblueDeliveryUncertainError({
                    message: "The Sendblue delivery request timed out.",
                    operation: "sendMessage",
                    reason: "timeout",
                  })
                ),
              onSome: Effect.succeed,
            })
          )
        );

        if (response.status < 200 || response.status >= 300) {
          const reason: SendblueResponseErrorReason = Match.value(
            response.status
          ).pipe(
            Match.when(401, (): SendblueResponseErrorReason => "unauthorized"),
            Match.when(429, (): SendblueResponseErrorReason => "rateLimited"),
            Match.when(
              (status) => status >= 500,
              (): SendblueResponseErrorReason => "serverRejected"
            ),
            Match.orElse((): SendblueResponseErrorReason => "clientRejected")
          );
          return yield* new SendblueResponseError({
            message: "Sendblue rejected the message request.",
            operation: "sendMessage",
            reason,
            status: response.status,
          });
        }

        const providerResponse = yield* HttpClientResponse.schemaBodyJson(
          SendblueSendMessageProviderResponse
        )(response).pipe(
          Effect.mapError(
            () =>
              new SendblueResponseError({
                message: "Sendblue returned an invalid message response.",
                operation: "sendMessage",
                reason: "malformedResponse",
                status: response.status,
              })
          )
        );
        return yield* Match.value(providerResponse).pipe(
          Match.when({ status: "ERROR" }, () =>
            Effect.fail(
              new SendblueResponseError({
                message: "Sendblue rejected the message request.",
                operation: "sendMessage",
                reason: "providerRejected",
                status: response.status,
              })
            )
          ),
          Match.when({ status: "QUEUED" }, (success) =>
            Effect.succeed<SendblueSendMessageSuccessType>(success)
          ),
          Match.when({ status: "SENT" }, (success) =>
            Effect.succeed<SendblueSendMessageSuccessType>(success)
          ),
          Match.when({ status: "DELIVERED" }, (success) =>
            Effect.succeed<SendblueSendMessageSuccessType>(success)
          ),
          Match.exhaustive
        );
      }),
    });
  }
).pipe(Effect.withSpan("SendblueClientLive"));

export const SendblueClientLive = Layer.effect(
  SendblueClient,
  makeSendblueClient
);

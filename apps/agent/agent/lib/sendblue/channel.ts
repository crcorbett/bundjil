import { Context, Effect, Layer, Match, Schema } from "effect";

import { SendblueClient } from "./client.js";
import type { SendblueClientError } from "./client.js";
import { SendblueConfigService } from "./config.js";
import {
  SendblueRequestError,
  SendblueRoutingError,
  SendblueWebhookSchemaError,
} from "./errors.js";
import type {
  SendblueReplayStoreError,
  SendblueWebhookAuthenticationError,
} from "./errors.js";
import { SendblueIdentityDirectory } from "./identity-directory.js";
import { SendblueReplayStore } from "./replay-store.js";
import {
  SendblueCompletedMessage,
  SendblueInboundMessage,
  SendblueReceivedStatusValue,
  SendblueSendMessageInput,
} from "./schemas.js";
import type {
  SendblueCompletedMessage as SendblueCompletedMessageType,
  SendblueCompletedMessageResult,
  SendblueInboundDecision,
  SendblueInboundDispatchDecision,
  SendblueIgnoredReason,
} from "./schemas.js";
import { SendblueSessionRouter } from "./session-router.js";
import { SendblueWebhookVerifier } from "./webhook-verifier.js";

export interface SendblueChannelShape {
  readonly authorizeAndClaimInbound: (
    request: Request
  ) => Effect.Effect<
    SendblueInboundDecision,
    | SendblueWebhookAuthenticationError
    | SendblueWebhookSchemaError
    | SendblueReplayStoreError
    | SendblueRoutingError
  >;
  readonly dispatchAcceptedInbound: (
    decision: SendblueInboundDispatchDecision,
    send: () => Promise<unknown>
  ) => Effect.Effect<void, SendblueReplayStoreError | SendblueRoutingError>;
  readonly deliverCompletedMessage: (
    input: unknown
  ) => Effect.Effect<
    SendblueCompletedMessageResult,
    SendblueClientError | SendblueReplayStoreError | SendblueRoutingError
  >;
}

export class SendblueChannel extends Context.Service<
  SendblueChannel,
  SendblueChannelShape
>()("@bundjil/agent/SendblueChannel") {}

export const authorizeAndClaimInbound = Effect.fn(
  "SendblueChannel.authorizeAndClaimInbound"
)(function* (request: Request) {
  const verifier = yield* SendblueWebhookVerifier;
  const config = yield* SendblueConfigService;
  const identities = yield* SendblueIdentityDirectory;
  const replay = yield* SendblueReplayStore;
  const router = yield* SendblueSessionRouter;

  yield* verifier.verify(request.headers);
  const body = yield* Effect.tryPromise({
    try: () => request.text(),
    catch: () =>
      new SendblueWebhookSchemaError({
        boundary: "SendblueInboundMessage",
        message: "Unable to read the Sendblue webhook body.",
      }),
  });
  if (body.length > 131_072) {
    return yield* new SendblueWebhookSchemaError({
      boundary: "SendblueInboundMessage",
      message: "The Sendblue webhook body is too large.",
    });
  }
  const inbound = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(SendblueInboundMessage)
  )(body).pipe(
    Effect.mapError(
      () =>
        new SendblueWebhookSchemaError({
          boundary: "SendblueInboundMessage",
          message: "The Sendblue webhook body is invalid.",
        })
    )
  );

  const receivedStatus = Match.value(inbound.status).pipe(
    Match.when(SendblueReceivedStatusValue, () => true),
    Match.orElse(() => false)
  );
  const ignored: SendblueIgnoredReason | null = Match.value(inbound).pipe(
    Match.when({ is_typing: true }, (): SendblueIgnoredReason => "typing"),
    Match.when(
      { direction: "outbound" },
      (): SendblueIgnoredReason => "outbound"
    ),
    Match.when({ is_outbound: true }, (): SendblueIgnoredReason => "outbound"),
    Match.when(
      () => !receivedStatus,
      (): SendblueIgnoredReason => "statusNotReceived"
    ),
    Match.when(
      ({ group_id }) => group_id !== undefined && group_id.length > 0,
      (): SendblueIgnoredReason => "group"
    ),
    Match.when(
      ({ media_url, media_urls }) =>
        (media_url !== undefined && media_url.length > 0) ||
        (media_urls !== undefined && media_urls.length > 0),
      (): SendblueIgnoredReason => "media"
    ),
    Match.when(
      ({ content }) => content.trim().length === 0,
      (): SendblueIgnoredReason => "empty"
    ),
    Match.when(
      ({ service }) => !config.allowedServices.includes(service),
      (): SendblueIgnoredReason => "serviceNotAllowed"
    ),
    Match.when(
      ({ sendblue_number, to_number }) =>
        sendblue_number !== config.fromNumber &&
        to_number !== config.fromNumber,
      (): SendblueIgnoredReason => "lineMismatch"
    ),
    Match.when(
      ({ from_number }) => from_number === config.fromNumber,
      (): SendblueIgnoredReason => "loop"
    ),
    Match.orElse(() => null)
  );
  if (ignored !== null) {
    return {
      _tag: "Ignore",
      outcome: { reason: ignored },
    } satisfies SendblueInboundDecision;
  }

  const identity = yield* identities
    .resolve(inbound.from_number)
    .pipe(Effect.catchTag("SendblueSenderNotAllowedError", () => Effect.void));
  if (identity === undefined) {
    return {
      _tag: "Ignore",
      outcome: { reason: "senderNotAllowed" },
    } satisfies SendblueInboundDecision;
  }
  const continuationToken = yield* router.route(
    inbound.from_number,
    config.fromNumber
  );
  const claimed = yield* replay.claimInbound(inbound.message_handle);
  return yield* Match.value(claimed).pipe(
    Match.when({ status: "duplicate" }, () =>
      Effect.succeed<SendblueInboundDecision>({ _tag: "Duplicate" })
    ),
    Match.orElse(({ claim }) =>
      Effect.succeed<SendblueInboundDecision>({
        _tag: "Dispatch",
        auth: {
          attributes: { channel: "sendblue" },
          authenticator: "sendblue",
          principalId: identity.principalId,
          principalType: "user",
        },
        claim,
        continuationToken,
        message: inbound.content.trim(),
        state: {
          conversationKey: continuationToken,
          principalId: identity.principalId,
          sendblueNumber: config.fromNumber,
          senderNumber: inbound.from_number,
        },
      })
    )
  );
});

export const dispatchAcceptedInbound = Effect.fn(
  "SendblueChannel.dispatchAcceptedInbound"
)(function* (
  decision: SendblueInboundDispatchDecision,
  send: () => Promise<unknown>
) {
  const replay = yield* SendblueReplayStore;
  yield* Effect.tryPromise({
    try: send,
    catch: () =>
      new SendblueRoutingError({
        message: "Unable to dispatch the Sendblue message to Eve.",
      }),
  }).pipe(
    Effect.catchTag("SendblueRoutingError", (error) =>
      replay.retryable(decision.claim).pipe(Effect.andThen(Effect.fail(error)))
    )
  );
  return yield* replay
    .complete(decision.claim)
    .pipe(
      Effect.catchTag("SendblueReplayStoreError", (completeError) =>
        replay
          .uncertain(decision.claim)
          .pipe(Effect.andThen(Effect.fail(completeError)))
      )
    );
});

export const deliverCompletedMessage = Effect.fn(
  "SendblueChannel.deliverCompletedMessage"
)(function* (input: unknown) {
  const completed = yield* Schema.decodeUnknownEffect(SendblueCompletedMessage)(
    input
  ).pipe(
    Effect.mapError(
      () =>
        new SendblueRoutingError({
          message: "The completed Eve message is invalid.",
        })
    )
  );
  return yield* Match.value(completed).pipe(
    Match.when({ finishReason: "tool-calls" }, () =>
      Effect.succeed<SendblueCompletedMessageResult>("ignored")
    ),
    Match.when(
      (
        completed
      ): completed is SendblueCompletedMessageType & {
        readonly message: string;
      } => completed.message !== null && completed.message.trim().length > 0,
      (completed) =>
        Effect.gen(function* deliverTerminalSendblueMessage() {
          const replay = yield* SendblueReplayStore;
          const client = yield* SendblueClient;
          const claimed = yield* replay.claimOutbound({
            sequence: completed.sequence,
            sessionId: completed.sessionId,
            stepIndex: completed.stepIndex,
            turnId: completed.turnId,
          });
          return yield* Match.value(claimed).pipe(
            Match.when({ status: "duplicate" }, () =>
              Effect.succeed<SendblueCompletedMessageResult>("duplicate")
            ),
            Match.orElse(({ claim }) =>
              Schema.decodeUnknownEffect(SendblueSendMessageInput)({
                content: completed.message.trim(),
                from_number: completed.state.sendblueNumber,
                number: completed.state.senderNumber,
              }).pipe(
                Effect.mapError(
                  () =>
                    new SendblueRequestError({
                      message:
                        "The completed Eve message cannot be sent by Sendblue.",
                      operation: "sendMessage",
                      reason: "requestEncoding",
                    })
                ),
                Effect.flatMap(client.sendMessage),
                Effect.tap((success) =>
                  replay
                    .complete(claim, {
                      providerMessageHandle: success.message_handle,
                    })
                    .pipe(
                      Effect.catchTag(
                        "SendblueReplayStoreError",
                        (completeError) =>
                          replay
                            .uncertain(claim)
                            .pipe(Effect.andThen(Effect.fail(completeError)))
                      )
                    )
                ),
                Effect.as<SendblueCompletedMessageResult>("delivered"),
                Effect.catchTag("SendblueDeliveryUncertainError", (error) =>
                  replay
                    .uncertain(claim)
                    .pipe(Effect.andThen(Effect.fail(error)))
                ),
                Effect.catchTag("SendblueRequestError", (error) =>
                  replay
                    .retryable(claim)
                    .pipe(Effect.andThen(Effect.fail(error)))
                ),
                Effect.catchTag("SendblueResponseError", (error) =>
                  Match.value(error.reason).pipe(
                    Match.when("malformedResponse", () =>
                      replay.uncertain(claim)
                    ),
                    Match.orElse(() => replay.retryable(claim)),
                    Effect.andThen(Effect.fail(error))
                  )
                )
              )
            )
          );
        })
    ),
    Match.orElse(() =>
      Effect.succeed<SendblueCompletedMessageResult>("ignored")
    )
  );
});

export const SendblueChannelLive = Layer.effect(
  SendblueChannel,
  Effect.gen(function* makeSendblueChannel() {
    const client = yield* SendblueClient;
    const config = yield* SendblueConfigService;
    const identities = yield* SendblueIdentityDirectory;
    const replay = yield* SendblueReplayStore;
    const router = yield* SendblueSessionRouter;
    const verifier = yield* SendblueWebhookVerifier;
    return SendblueChannel.of({
      authorizeAndClaimInbound: (request) =>
        authorizeAndClaimInbound(request).pipe(
          Effect.provideService(SendblueWebhookVerifier, verifier),
          Effect.provideService(SendblueConfigService, config),
          Effect.provideService(SendblueIdentityDirectory, identities),
          Effect.provideService(SendblueReplayStore, replay),
          Effect.provideService(SendblueSessionRouter, router)
        ),
      deliverCompletedMessage: (input) =>
        deliverCompletedMessage(input).pipe(
          Effect.provideService(SendblueClient, client),
          Effect.provideService(SendblueReplayStore, replay)
        ),
      dispatchAcceptedInbound: (decision, send) =>
        dispatchAcceptedInbound(decision, send).pipe(
          Effect.provideService(SendblueReplayStore, replay)
        ),
    });
  })
);

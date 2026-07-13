import { Context, Effect, Layer, Match, Schema } from "effect";

import { SendblueClient } from "./client.service.js";
import type { SendblueClientError } from "./client.service.js";
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
import { SendblueIdentityDirectory } from "./identity-directory.service.js";
import { SendblueReplayStore } from "./replay-store.service.js";
import {
  SendblueCompletedMessage,
  SendblueInboundMessage,
  SendblueSendMessageInput,
} from "./schemas.js";
import type {
  SendblueCompletedMessage as SendblueCompletedMessageType,
  SendblueCompletedMessageResult,
  SendblueInboundDecision,
  SendblueInboundDispatchDecision,
} from "./schemas.js";
import { SendblueSessionRouter } from "./session-router.service.js";
import { SendblueWebhookVerifier } from "./webhook-verifier.service.js";

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
    input: SendblueCompletedMessageType
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

  const ignored = Match.value(inbound).pipe(
    Match.when({ is_typing: true }, () => "typing" as const),
    Match.when({ direction: "outbound" }, () => "outbound" as const),
    Match.when({ is_outbound: true }, () => "outbound" as const),
    Match.when(
      ({ status }) => status !== "RECEIVED",
      () => "statusNotReceived" as const
    ),
    Match.when(
      ({ group_id }) => group_id !== undefined && group_id.length > 0,
      () => "group" as const
    ),
    Match.when(
      ({ media_url, media_urls }) =>
        (media_url !== undefined && media_url.length > 0) ||
        (media_urls !== undefined && media_urls.length > 0),
      () => "media" as const
    ),
    Match.when(
      ({ content }) => content.trim().length === 0,
      () => "empty" as const
    ),
    Match.when(
      ({ service }) => !config.allowedServices.includes(service),
      () => "serviceNotAllowed" as const
    ),
    Match.when(
      ({ sendblue_number, to_number }) =>
        sendblue_number !== config.fromNumber &&
        to_number !== config.fromNumber,
      () => "lineMismatch" as const
    ),
    Match.when(
      ({ from_number }) => from_number === config.fromNumber,
      () => "loop" as const
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
  if (claimed.status === "duplicate") {
    return { _tag: "Duplicate" } satisfies SendblueInboundDecision;
  }
  return {
    _tag: "Dispatch",
    auth: {
      attributes: { channel: "sendblue" },
      authenticator: "sendblue",
      principalId: identity.principalId,
      principalType: "user",
    },
    claim: claimed.claim,
    continuationToken,
    message: inbound.content.trim(),
    state: {
      conversationKey: continuationToken,
      principalId: identity.principalId,
      sendblueNumber: config.fromNumber,
      senderNumber: inbound.from_number,
    },
  } satisfies SendblueInboundDecision;
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
)(function* (input: SendblueCompletedMessageType) {
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
  if (
    completed.finishReason === "tool-calls" ||
    completed.message === null ||
    completed.message.trim().length === 0
  ) {
    return "ignored";
  }
  const replay = yield* SendblueReplayStore;
  const client = yield* SendblueClient;
  const claimed = yield* replay.claimOutbound({
    sequence: completed.sequence,
    sessionId: completed.sessionId,
    stepIndex: completed.stepIndex,
    turnId: completed.turnId,
  });
  if (claimed.status === "duplicate") {
    return "duplicate";
  }
  return yield* Schema.decodeUnknownEffect(SendblueSendMessageInput)({
    content: completed.message.trim(),
    from_number: completed.state.sendblueNumber,
    number: completed.state.senderNumber,
  }).pipe(
    Effect.mapError(
      () =>
        new SendblueRequestError({
          message: "The completed Eve message cannot be sent by Sendblue.",
          operation: "sendMessage",
          reason: "requestEncoding",
        })
    ),
    Effect.flatMap(client.sendMessage),
    Effect.tap((success) =>
      replay
        .complete(claimed.claim, {
          providerMessageHandle: success.message_handle,
        })
        .pipe(
          Effect.catchTag("SendblueReplayStoreError", (completeError) =>
            replay
              .uncertain(claimed.claim)
              .pipe(Effect.andThen(Effect.fail(completeError)))
          )
        )
    ),
    Effect.as("delivered" as const),
    Effect.catchTag("SendblueDeliveryUncertainError", (error) =>
      replay.uncertain(claimed.claim).pipe(Effect.andThen(Effect.fail(error)))
    ),
    Effect.catchTag("SendblueRequestError", (error) =>
      replay.retryable(claimed.claim).pipe(Effect.andThen(Effect.fail(error)))
    ),
    Effect.catchTag("SendblueResponseError", (error) =>
      (error.reason === "malformedResponse"
        ? replay.uncertain(claimed.claim)
        : replay.retryable(claimed.claim)
      ).pipe(Effect.andThen(Effect.fail(error)))
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

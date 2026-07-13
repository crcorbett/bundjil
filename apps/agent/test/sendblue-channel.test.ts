import { assert, it } from "@effect/vitest";
import { Effect, Layer, ManagedRuntime, Redacted, Ref, Schema } from "effect";
import type { RouteHandlerArgs, Session } from "eve/channels";

import { makeSendblueEveChannel } from "../agent/channels/sendblue.js";
import {
  SendblueChannel,
  SendblueChannelLive,
} from "../agent/lib/sendblue/channel.service.js";
import { SendblueConfigService } from "../agent/lib/sendblue/config.js";
import {
  SendblueDeliveryUncertainError,
  SendblueRequestError,
  SendblueReplayStoreError,
  SendblueResponseError,
  SendblueRoutingError,
  SendblueWebhookAuthenticationError,
  SendblueWebhookSchemaError,
} from "../agent/lib/sendblue/errors.js";
import { SendblueIdentityDirectoryLive } from "../agent/lib/sendblue/identity-directory.service.js";
import { SendblueClientMemory } from "../agent/lib/sendblue/memory.layer.js";
import {
  SendblueReplayStore,
  SendblueReplayStoreMemory,
} from "../agent/lib/sendblue/replay-store.service.js";
import {
  SendblueChannelState,
  SendblueConfig,
  SendblueInboundMessage,
  SendblueSendMessageSuccess,
  SendblueSenderIdentities,
} from "../agent/lib/sendblue/schemas.js";
import { SendblueSessionRouterLive } from "../agent/lib/sendblue/session-router.service.js";
import { SendblueWebhookVerifierLive } from "../agent/lib/sendblue/webhook-verifier.service.js";

const senderIdentities = Schema.decodeUnknownSync(SendblueSenderIdentities)({
  "+14155550100": "owner",
});
const config = Schema.decodeUnknownSync(SendblueConfig)({
  allowedServices: ["iMessage"],
  apiBaseUrl: new URL("https://api.sendblue.test"),
  apiKey: Redacted.make("test-api-key"),
  apiSecret: Redacted.make("test-api-secret"),
  fromNumber: "+13472760577",
  replayStore: {
    leaseSeconds: 60,
    prefix: "sendblue:test",
    token: Redacted.make("test-replay-token"),
    ttlSeconds: 86_400,
    url: Redacted.make("https://example.test/redis"),
  },
  routingKey: Redacted.make("test-routing-key"),
  senderIdentities,
  webhookSecret: Redacted.make("test-webhook-secret"),
});
const channelState = Schema.decodeUnknownSync(SendblueChannelState)({
  conversationKey: "sendblue:conversation:test",
  principalId: "owner",
  sendblueNumber: "+13472760577",
  senderNumber: "+14155550100",
});
const sendSuccess = Schema.decodeUnknownSync(SendblueSendMessageSuccess)({
  message_handle: "outbound-provider-handle",
  status: "QUEUED",
});
const encodeInbound = Schema.encodeSync(
  Schema.fromJsonString(SendblueInboundMessage)
);

const request = (
  input: Record<string, unknown>,
  secret: string | null = "test-webhook-secret"
) =>
  new Request("https://agent.test/eve/v1/sendblue/webhook", {
    body: encodeInbound(
      Schema.decodeUnknownSync(SendblueInboundMessage)(input)
    ),
    headers: {
      "content-type": "application/json",
      ...(secret === null ? {} : { "sb-signing-secret": secret }),
    },
    method: "POST",
  });

const inbound = (input: Record<string, unknown> = {}) => ({
  content: "Hello from Sendblue.",
  direction: "inbound",
  from_number: "+14155550100",
  is_outbound: false,
  media_url: "",
  message_handle: "inbound-message-handle",
  sendblue_number: "+13472760577",
  service: "iMessage",
  status: "RECEIVED",
  to_number: "+13472760577",
  ...input,
});

const channelLayer = (
  client = SendblueClientMemory(),
  replay: Layer.Layer<
    SendblueReplayStore,
    never,
    SendblueConfigService
  > = SendblueReplayStoreMemory
) =>
  SendblueChannelLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        SendblueWebhookVerifierLive,
        SendblueIdentityDirectoryLive,
        SendblueSessionRouterLive,
        replay,
        client
      ).pipe(Layer.provideMerge(Layer.succeed(SendblueConfigService, config)))
    )
  );

const replayUnavailable = Layer.succeed(
  SendblueReplayStore,
  SendblueReplayStore.of({
    claimInbound: () =>
      Effect.fail(new SendblueReplayStoreError({ message: "unavailable" })),
    claimOutbound: () =>
      Effect.fail(new SendblueReplayStoreError({ message: "unavailable" })),
    complete: () => Effect.void,
    retryable: () => Effect.void,
    uncertain: () => Effect.void,
  })
);

const replayCompletionFailure = Layer.effect(
  SendblueReplayStore,
  Effect.gen(function* makeCompletionFailureStore() {
    const replay = yield* SendblueReplayStore;
    return SendblueReplayStore.of({
      ...replay,
      complete: () =>
        Effect.fail(
          new SendblueReplayStoreError({
            message: "completion unavailable",
          })
        ),
    });
  })
).pipe(Layer.provide(SendblueReplayStoreMemory));

it.effect(
  "authenticates, dispatches one direct text, and suppresses replay",
  () =>
    Effect.gen(function* testInboundDispatch() {
      let sent = 0;
      const sendblue = yield* SendblueChannel;
      const decision = yield* sendblue.authorizeAndClaimInbound(
        request(inbound())
      );

      assert.strictEqual(decision._tag, "Dispatch");
      if (decision._tag === "Dispatch") {
        assert.strictEqual(decision.auth.principalId, "owner");
        assert.notInclude(decision.continuationToken, "+14155550100");
        yield* sendblue.dispatchAcceptedInbound(decision, () =>
          Promise.resolve().then(() => {
            sent += 1;
          })
        );
      }
      assert.strictEqual(sent, 1);
      assert.strictEqual(
        (yield* sendblue.authorizeAndClaimInbound(request(inbound())))._tag,
        "Duplicate"
      );
    }).pipe(Effect.provide(channelLayer()))
);

it.effect("releases an inbound claim when Eve rejects before acceptance", () =>
  Effect.gen(function* testRejectedInboundDispatch() {
    const sendblue = yield* SendblueChannel;
    const providerMessage = inbound({
      message_handle: "eve-rejected-message",
    });
    const first = yield* sendblue.authorizeAndClaimInbound(
      request(providerMessage)
    );

    assert.strictEqual(first._tag, "Dispatch");
    if (first._tag === "Dispatch") {
      const error = yield* sendblue
        .dispatchAcceptedInbound(first, () =>
          Promise.reject(new Error("Fake Eve rejection."))
        )
        .pipe(Effect.flip);
      assert.strictEqual(Schema.is(SendblueRoutingError)(error), true);
    }

    assert.strictEqual(
      (yield* sendblue.authorizeAndClaimInbound(request(providerMessage)))._tag,
      "Dispatch"
    );
  }).pipe(Effect.provide(channelLayer()))
);

it.effect(
  "ignores unsupported inbound events without claims or Eve dispatch",
  () =>
    Effect.gen(function* testInboundClassification() {
      const sendblue = yield* SendblueChannel;
      const cases = [
        ["typing", { is_typing: true }],
        ["outbound", { is_outbound: true }],
        ["outbound", { direction: "outbound" }],
        ["statusNotReceived", { status: "SENT" }],
        ["group", { group_id: "group-1" }],
        ["media", { media_urls: ["https://example.test/media"] }],
        ["empty", { content: "  " }],
        ["serviceNotAllowed", { service: "SMS" }],
        [
          "lineMismatch",
          { sendblue_number: "+14155550111", to_number: "+14155550111" },
        ],
        ["loop", { from_number: "+13472760577" }],
        ["senderNotAllowed", { from_number: "+14155550101" }],
      ] as const;
      for (const [reason, changes] of cases) {
        const decision = yield* sendblue.authorizeAndClaimInbound(
          request(inbound({ ...changes, message_handle: `ignored-${reason}` }))
        );
        assert.deepStrictEqual(decision, {
          _tag: "Ignore",
          outcome: { reason },
        });
      }
    }).pipe(Effect.provide(channelLayer()))
);

it.effect(
  "fails closed before decode for bad auth and rejects authenticated malformed requests",
  () =>
    Effect.gen(function* testInboundRejections() {
      const sendblue = yield* SendblueChannel;
      const authError = yield* sendblue
        .authorizeAndClaimInbound(request(inbound(), "wrong-secret"))
        .pipe(Effect.flip);
      assert.strictEqual(
        Schema.is(SendblueWebhookAuthenticationError)(authError),
        true
      );
      const schemaError = yield* sendblue
        .authorizeAndClaimInbound(
          new Request("https://agent.test/eve/v1/sendblue/webhook", {
            body: "not-json",
            headers: { "sb-signing-secret": "test-webhook-secret" },
            method: "POST",
          })
        )
        .pipe(Effect.flip);
      assert.strictEqual(
        Schema.is(SendblueWebhookSchemaError)(schemaError),
        true
      );
    }).pipe(Effect.provide(channelLayer()))
);

it.effect("atomically elects one concurrent inbound claim", () =>
  Effect.gen(function* testConcurrentInboundClaim() {
    const sendblue = yield* SendblueChannel;
    const decisions = yield* Effect.all(
      [
        sendblue.authorizeAndClaimInbound(
          request(inbound({ message_handle: "concurrent-handle" }))
        ),
        sendblue.authorizeAndClaimInbound(
          request(inbound({ message_handle: "concurrent-handle" }))
        ),
      ],
      { concurrency: "unbounded" }
    );
    assert.deepStrictEqual(
      decisions.map((decision) => decision._tag).toSorted(),
      ["Dispatch", "Duplicate"]
    );
  }).pipe(Effect.provide(channelLayer()))
);

it.effect(
  "delivers only visible completed text once and quarantines uncertainty",
  () =>
    Effect.gen(function* testOutboundDelivery() {
      const sends = yield* Ref.make(0);
      const client = SendblueClientMemory({
        sendMessage: () =>
          Ref.update(sends, (value) => value + 1).pipe(Effect.as(sendSuccess)),
      });
      yield* Effect.gen(function* testVisibleOutboundDelivery() {
        const sendblue = yield* SendblueChannel;
        const completed = {
          finishReason: "stop",
          message: "A visible reply.",
          sequence: 0,
          sessionId: "session-1",
          state: channelState,
          stepIndex: 0,
          turnId: "turn-1",
        };
        const outcomes = yield* Effect.all(
          [
            sendblue.deliverCompletedMessage(completed),
            sendblue.deliverCompletedMessage(completed),
          ],
          { concurrency: "unbounded" }
        );
        assert.deepStrictEqual(outcomes.toSorted(), ["delivered", "duplicate"]);
        assert.strictEqual(
          yield* sendblue.deliverCompletedMessage({
            ...completed,
            message: "tool text",
            finishReason: "tool-calls",
            sequence: 1,
          }),
          "ignored"
        );
        assert.strictEqual(
          yield* sendblue.deliverCompletedMessage({
            ...completed,
            message: null,
            sequence: 2,
          }),
          "ignored"
        );
        assert.strictEqual(
          yield* sendblue.deliverCompletedMessage({
            ...completed,
            message: "   ",
            sequence: 3,
          }),
          "ignored"
        );
        assert.strictEqual(yield* Ref.get(sends), 1);
      }).pipe(Effect.provide(channelLayer(client)));
    })
);

it.effect("marks an indeterminate outbound delivery as non-retryable", () =>
  Effect.gen(function* testUncertainOutbound() {
    const sends = yield* Ref.make(0);
    const client = SendblueClientMemory({
      sendMessage: () =>
        Ref.update(sends, (value) => value + 1).pipe(
          Effect.andThen(
            Effect.fail(
              new SendblueDeliveryUncertainError({
                message: "The Sendblue delivery outcome is uncertain.",
                operation: "sendMessage",
                reason: "transport",
              })
            )
          )
        ),
    });
    yield* Effect.gen(function* testUncertainNoResend() {
      const sendblue = yield* SendblueChannel;
      const completed = {
        finishReason: "stop",
        message: "A visible reply.",
        sequence: 0,
        sessionId: "session-uncertain",
        state: channelState,
        stepIndex: 0,
        turnId: "turn-1",
      };
      const error = yield* sendblue
        .deliverCompletedMessage(completed)
        .pipe(Effect.flip);
      assert.strictEqual(
        Schema.is(SendblueDeliveryUncertainError)(error),
        true
      );
      assert.strictEqual(
        yield* sendblue.deliverCompletedMessage(completed),
        "duplicate"
      );
      assert.strictEqual(yield* Ref.get(sends), 1);
    }).pipe(Effect.provide(channelLayer(client)));
  })
);

it.effect(
  "rejects over-limit output before the provider and releases the claim",
  () =>
    Effect.gen(function* testOverLimitOutbound() {
      const sends = yield* Ref.make(0);
      const client = SendblueClientMemory({
        sendMessage: () =>
          Ref.update(sends, (value) => value + 1).pipe(Effect.as(sendSuccess)),
      });
      yield* Effect.gen(function* testOverLimitRetryableClaim() {
        const sendblue = yield* SendblueChannel;
        const completed = {
          finishReason: "stop",
          message: "x".repeat(18_997),
          sequence: 0,
          sessionId: "session-over-limit",
          state: channelState,
          stepIndex: 0,
          turnId: "turn-1",
        };
        const errors = yield* Effect.forEach([0, 1], () =>
          sendblue.deliverCompletedMessage(completed).pipe(Effect.flip)
        );
        assert.strictEqual(
          errors.every((error) => Schema.is(SendblueRequestError)(error)),
          true
        );
        assert.strictEqual(yield* Ref.get(sends), 0);
      }).pipe(Effect.provide(channelLayer(client)));
    })
);

it.effect("releases a known provider rejection for a safe retry", () =>
  Effect.gen(function* testKnownProviderFailure() {
    const sends = yield* Ref.make(0);
    const client = SendblueClientMemory({
      sendMessage: () =>
        Ref.update(sends, (value) => value + 1).pipe(
          Effect.andThen(
            Effect.fail(
              new SendblueResponseError({
                message: "Sendblue rejected the message request.",
                operation: "sendMessage",
                reason: "clientRejected",
                status: 400,
              })
            )
          )
        ),
    });
    yield* Effect.gen(function* testKnownFailureRetryableClaim() {
      const sendblue = yield* SendblueChannel;
      const completed = {
        finishReason: "stop",
        message: "A visible reply.",
        sequence: 0,
        sessionId: "session-known-failure",
        state: channelState,
        stepIndex: 0,
        turnId: "turn-1",
      };
      const errors = yield* Effect.forEach([0, 1], () =>
        sendblue.deliverCompletedMessage(completed).pipe(Effect.flip)
      );
      assert.strictEqual(
        errors.every((error) => Schema.is(SendblueResponseError)(error)),
        true
      );
      assert.strictEqual(yield* Ref.get(sends), 2);
    }).pipe(Effect.provide(channelLayer(client)));
  })
);

it.effect(
  "quarantines a provider-accepted outbound message when completion fails",
  () =>
    Effect.gen(function* testOutboundCompletionQuarantine() {
      const sends = yield* Ref.make(0);
      const client = SendblueClientMemory({
        sendMessage: () =>
          Ref.update(sends, (value) => value + 1).pipe(Effect.as(sendSuccess)),
      });
      yield* Effect.gen(function* testAcceptedOutboundQuarantine() {
        const sendblue = yield* SendblueChannel;
        const completed = {
          finishReason: "stop",
          message: "A visible reply.",
          sequence: 0,
          sessionId: "session-completion-failure",
          state: channelState,
          stepIndex: 0,
          turnId: "turn-1",
        };
        const error = yield* sendblue
          .deliverCompletedMessage(completed)
          .pipe(Effect.flip);
        assert.strictEqual(error.message, "completion unavailable");
        assert.strictEqual(
          yield* sendblue.deliverCompletedMessage(completed),
          "duplicate"
        );
        assert.strictEqual(yield* Ref.get(sends), 1);
      }).pipe(Effect.provide(channelLayer(client, replayCompletionFailure)));
    })
);

it.effect(
  "quarantines an accepted inbound message when completion persistence fails",
  () =>
    Effect.gen(function* testAcceptedInboundQuarantine() {
      const sendblue = yield* SendblueChannel;
      const first = yield* sendblue.authorizeAndClaimInbound(
        request(inbound({ message_handle: "completion-failure" }))
      );
      assert.strictEqual(first._tag, "Dispatch");
      if (first._tag === "Dispatch") {
        const error = yield* sendblue
          .dispatchAcceptedInbound(first, () => Promise.resolve())
          .pipe(Effect.flip);
        assert.strictEqual(error.message, "completion unavailable");
      }
      assert.strictEqual(
        (yield* sendblue.authorizeAndClaimInbound(
          request(inbound({ message_handle: "completion-failure" }))
        ))._tag,
        "Duplicate"
      );
    }).pipe(
      Effect.provide(
        channelLayer(SendblueClientMemory(), replayCompletionFailure)
      )
    )
);

it.effect(
  "surfaces replay failure when accepted-message quarantine also fails",
  () =>
    Effect.gen(function* testInboundQuarantineFailure() {
      const transitionFailure = Layer.effect(
        SendblueReplayStore,
        Effect.gen(function* makeTransitionFailureStore() {
          const replay = yield* SendblueReplayStore;
          return SendblueReplayStore.of({
            ...replay,
            complete: () =>
              Effect.fail(
                new SendblueReplayStoreError({
                  message: "completion unavailable",
                })
              ),
            uncertain: () =>
              Effect.fail(
                new SendblueReplayStoreError({
                  message: "quarantine unavailable",
                })
              ),
          });
        })
      ).pipe(Layer.provide(SendblueReplayStoreMemory));
      yield* Effect.gen(function* testFailedInboundQuarantine() {
        const sendblue = yield* SendblueChannel;
        const first = yield* sendblue.authorizeAndClaimInbound(
          request(inbound({ message_handle: "quarantine-failure" }))
        );
        assert.strictEqual(first._tag, "Dispatch");
        if (first._tag === "Dispatch") {
          const error = yield* sendblue
            .dispatchAcceptedInbound(first, () => Promise.resolve())
            .pipe(Effect.flip);
          assert.strictEqual(error.message, "quarantine unavailable");
        }
        assert.strictEqual(
          (yield* sendblue.authorizeAndClaimInbound(
            request(inbound({ message_handle: "quarantine-failure" }))
          ))._tag,
          "Duplicate"
        );
      }).pipe(
        Effect.provide(channelLayer(SendblueClientMemory(), transitionFailure))
      );
    })
);

it.effect(
  "maps actual Eve webhook requests to statuses and background dispatch",
  () =>
    Effect.gen(function* testEveRouteBoundary() {
      const runtime = yield* Effect.acquireRelease(
        Effect.sync(() => ManagedRuntime.make(channelLayer())),
        (managed) => managed.disposeEffect
      );
      const channel = makeSendblueEveChannel(runtime);
      const [route] = channel.routes;
      if (route === undefined || route.transport === "websocket") {
        return yield* Effect.die("The Sendblue Eve webhook route is missing.");
      }
      const session = {
        continuationToken: "sendblue:test",
        getEventStream: () => Promise.resolve(new ReadableStream()),
        id: "session-test",
      } satisfies Session;
      let sends = 0;
      const pending: Promise<unknown>[] = [];
      const args = {
        getSession: () => session,
        params: {},
        receive: () => Promise.resolve(session),
        requestIp: null,
        send: () => {
          sends += 1;
          return Promise.resolve(session);
        },
        waitUntil: (task) => {
          pending.push(task);
        },
      } satisfies RouteHandlerArgs<SendblueChannelState>;

      assert.strictEqual(
        (yield* Effect.promise(() =>
          route.handler(request(inbound(), null), args)
        )).status,
        401
      );
      assert.strictEqual(
        (yield* Effect.promise(() =>
          route.handler(request(inbound(), "wrong-secret"), args)
        )).status,
        401
      );
      assert.strictEqual(
        (yield* Effect.promise(() =>
          route.handler(
            new Request("https://agent.test/eve/v1/sendblue/webhook", {
              body: "not-json",
              headers: { "sb-signing-secret": "test-webhook-secret" },
              method: "POST",
            }),
            args
          )
        )).status,
        400
      );
      assert.strictEqual(
        (yield* Effect.promise(() =>
          route.handler(
            request(
              inbound({
                direction: "outbound",
                message_handle: "route-ignored",
              })
            ),
            args
          )
        )).status,
        200
      );
      assert.strictEqual(
        (yield* Effect.promise(() =>
          route.handler(
            request(
              inbound({
                from_number: "+14155550101",
                message_handle: "route-unknown",
              })
            ),
            args
          )
        )).status,
        200
      );
      assert.strictEqual(sends, 0);
      assert.strictEqual(pending.length, 0);

      const acceptedRequest = request(
        inbound({ message_handle: "route-accepted" })
      );
      assert.strictEqual(
        (yield* Effect.promise(() => route.handler(acceptedRequest, args)))
          .status,
        202
      );
      assert.strictEqual(pending.length, 1);
      yield* Effect.promise(() => Promise.all(pending));
      assert.strictEqual(sends, 1);
      assert.strictEqual(
        (yield* Effect.promise(() =>
          route.handler(
            request(inbound({ message_handle: "route-accepted" })),
            args
          )
        )).status,
        200
      );
      assert.strictEqual(pending.length, 1);
      assert.strictEqual(sends, 1);
      return yield* Effect.void;
    })
);

it.effect(
  "returns 503 from the actual Eve route when replay claiming fails",
  () =>
    Effect.gen(function* testEveRouteReplayFailure() {
      const runtime = yield* Effect.acquireRelease(
        Effect.sync(() =>
          ManagedRuntime.make(
            channelLayer(SendblueClientMemory(), replayUnavailable)
          )
        ),
        (managed) => managed.disposeEffect
      );
      const channel = makeSendblueEveChannel(runtime);
      const [route] = channel.routes;
      if (route === undefined || route.transport === "websocket") {
        return yield* Effect.die("The Sendblue Eve webhook route is missing.");
      }
      const session = {
        continuationToken: "sendblue:test",
        getEventStream: () => Promise.resolve(new ReadableStream()),
        id: "session-test",
      } satisfies Session;
      let sends = 0;
      const pending: Promise<unknown>[] = [];
      const args = {
        getSession: () => session,
        params: {},
        receive: () => Promise.resolve(session),
        requestIp: null,
        send: () => {
          sends += 1;
          return Promise.resolve(session);
        },
        waitUntil: (task) => {
          pending.push(task);
        },
      } satisfies RouteHandlerArgs<SendblueChannelState>;
      const response = yield* Effect.promise(() =>
        route.handler(
          request(inbound({ message_handle: "route-store-failure" })),
          args
        )
      );
      assert.strictEqual(response.status, 503);
      assert.strictEqual(sends, 0);
      assert.strictEqual(pending.length, 0);
      return yield* Effect.void;
    })
);

it.effect("fails closed when inbound replay storage cannot claim", () =>
  Effect.gen(function* testUnavailableReplayStore() {
    const sendblue = yield* SendblueChannel;
    const error = yield* sendblue
      .authorizeAndClaimInbound(request(inbound()))
      .pipe(Effect.flip);
    assert.strictEqual(Schema.is(SendblueReplayStoreError)(error), true);
  }).pipe(
    Effect.provide(channelLayer(SendblueClientMemory(), replayUnavailable))
  )
);

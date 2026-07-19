import { assert, it } from "@effect/vitest";
import {
  Effect,
  Fiber,
  Layer,
  Logger,
  ManagedRuntime,
  Redacted,
  Ref,
  Schema,
} from "effect";
import { TestClock } from "effect/testing";
import type { RouteHandlerArgs, Session } from "eve/channels";

import {
  makeSendblueEveChannel,
  makeSendblueEveEvents,
} from "../agent/channels/sendblue.js";
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
  SendblueConversationState,
  SendblueConfig,
  SendblueInboundMessage,
  SendblueSendMessageSuccess,
  SendblueSenderIdentities,
  SendblueTypingIndicatorSuccess,
  SendblueTypingLifecycle,
  SendblueTypingObservation,
  SendblueTypingTransitionInput,
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
  fromNumber: "+14155550177",
  replayStore: {
    leaseSeconds: 60,
    prefix: "sendblue:test",
    token: Redacted.make("test-replay-token"),
    ttlSeconds: 86_400,
    url: Redacted.make("https://example.test/redis"),
  },
  routingKey: Redacted.make("test-routing-key"),
  senderIdentities,
  typingMaxDurationMillis: 120_000,
  webhookSecret: Redacted.make("test-webhook-secret"),
});
const channelState = Schema.decodeUnknownSync(SendblueChannelState)({
  conversationKey: "sendblue:conversation:test",
  principalId: "owner",
  sendblueNumber: "+14155550177",
  senderNumber: "+14155550100",
});
const sendSuccess = Schema.decodeUnknownSync(SendblueSendMessageSuccess)({
  message_handle: "outbound-provider-handle",
  status: "QUEUED",
});
const typingSuccess = Schema.decodeUnknownSync(SendblueTypingIndicatorSuccess)({
  number: "+14155550100",
  status: "SENT",
});
const typingInput = (state: unknown, command: unknown) =>
  Schema.decodeUnknownSync(SendblueTypingTransitionInput)({ command, state });
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
  sendblue_number: "+14155550177",
  service: "iMessage",
  status: "RECEIVED",
  to_number: "+14155550177",
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

it.effect("starts typing before Eve dispatch and suppresses replay", () =>
  Effect.gen(function* testInboundDispatch() {
    let sent = 0;
    const operations: string[] = [];
    const client = SendblueClientMemory({
      setTypingIndicator: (input) =>
        Effect.sync(() => {
          operations.push(`typing:${input.state}`);
          return typingSuccess;
        }),
    });
    yield* Effect.gen(function* assertEarlyTypingDispatch() {
      const sendblue = yield* SendblueChannel;
      const decision = yield* sendblue.authorizeAndClaimInbound(
        request(inbound())
      );

      assert.strictEqual(decision._tag, "Dispatch");
      if (decision._tag === "Dispatch") {
        assert.strictEqual(decision.auth.principalId, "owner");
        assert.notInclude(decision.continuationToken, "+14155550100");
        yield* sendblue.dispatchAcceptedInbound(decision, (state) =>
          Promise.resolve().then(() => {
            operations.push(`eve:${state.typing._tag}`);
            assert.deepStrictEqual(state.typing, { _tag: "Pending" });
            sent += 1;
          })
        );
      }
      assert.strictEqual(sent, 1);
      assert.deepStrictEqual(operations, ["typing:start", "eve:Pending"]);
      assert.strictEqual(
        (yield* sendblue.authorizeAndClaimInbound(request(inbound())))._tag,
        "Duplicate"
      );
    }).pipe(Effect.provide(channelLayer(client)));
  })
);

it.effect("releases an inbound claim when Eve rejects before acceptance", () =>
  Effect.gen(function* testRejectedInboundDispatch() {
    const operations: string[] = [];
    const client = SendblueClientMemory({
      setTypingIndicator: (input) =>
        Effect.sync(() => {
          operations.push(input.state);
          return typingSuccess;
        }),
    });
    yield* Effect.gen(function* assertRejectedDispatchCleanup() {
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

      assert.deepStrictEqual(operations, ["start", "stop"]);
      assert.strictEqual(
        (yield* sendblue.authorizeAndClaimInbound(request(providerMessage)))
          ._tag,
        "Dispatch"
      );
    }).pipe(Effect.provide(channelLayer(client)));
  })
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
        ["loop", { from_number: "+14155550177" }],
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
      const sentContent = yield* Ref.make<string | null>(null);
      const client = SendblueClientMemory({
        sendMessage: (input) =>
          Ref.set(sentContent, input.content).pipe(
            Effect.andThen(Ref.update(sends, (value) => value + 1)),
            Effect.as(sendSuccess)
          ),
      });
      yield* Effect.gen(function* testVisibleOutboundDelivery() {
        const sendblue = yield* SendblueChannel;
        const completed = {
          finishReason: "stop",
          message: "  A visible reply.  ",
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
        assert.strictEqual(yield* Ref.get(sentContent), "A visible reply.");
      }).pipe(Effect.provide(channelLayer(client)));
    })
);

it.effect("dispatches inbound content beyond the Sendblue outbound limit", () =>
  Effect.gen(function* testInboundDispatchContent() {
    const sendblue = yield* SendblueChannel;
    const content = "x".repeat(18_997);
    const decision = yield* sendblue.authorizeAndClaimInbound(
      request(inbound({ content, message_handle: "long-inbound-content" }))
    );

    assert.strictEqual(decision._tag, "Dispatch");
    if (decision._tag === "Dispatch") {
      assert.strictEqual(decision.message, content);
    }
  }).pipe(Effect.provide(channelLayer()))
);

it.effect("delivers non-tool completed finish reasons", () =>
  Effect.gen(function* testTerminalFinishReason() {
    const sendblue = yield* SendblueChannel;
    const result = yield* sendblue.deliverCompletedMessage({
      finishReason: "length",
      message: "Truncated terminal reply.",
      sequence: 99,
      sessionId: "session-terminal-finish-reason",
      state: channelState,
      stepIndex: 0,
      turnId: "turn-terminal-finish-reason",
    });

    assert.strictEqual(result, "delivered");
  }).pipe(
    Effect.provide(
      channelLayer(
        SendblueClientMemory({ sendMessage: () => Effect.succeed(sendSuccess) })
      )
    )
  )
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

it.effect("migrates and rolls back the encoded typing lifecycle", () =>
  Effect.gen(function* testTypingStateMigration() {
    const legacy = {
      conversationKey: "sendblue:conversation:migration",
      principalId: "owner",
      sendblueNumber: "+14155550177",
      senderNumber: "+14155550100",
    };
    const migrated =
      yield* Schema.decodeUnknownEffect(SendblueChannelState)(legacy);
    assert.deepStrictEqual(migrated.typing, { _tag: "Idle" });

    const explicitUndefined = yield* Schema.decodeUnknownEffect(
      SendblueChannelState
    )({ ...legacy, typing: undefined }).pipe(Effect.flip);
    assert.strictEqual(explicitUndefined._tag, "SchemaError");

    const encoded = yield* Schema.encodeEffect(SendblueChannelState)({
      ...migrated,
      typing: Schema.decodeUnknownSync(SendblueTypingLifecycle)({
        _tag: "Active",
        turnId: "turn-migration",
      }),
    });
    assert.deepStrictEqual(encoded.typing, {
      _tag: "Active",
      turnId: "turn-migration",
    });
    const pending = yield* Schema.encodeEffect(SendblueChannelState)({
      ...migrated,
      typing: Schema.decodeUnknownSync(SendblueTypingLifecycle)({
        _tag: "Pending",
      }),
    });
    assert.deepStrictEqual(pending.typing, { _tag: "Pending" });
    assert.deepStrictEqual(
      yield* Schema.decodeUnknownEffect(SendblueConversationState)(encoded),
      legacy
    );
  })
);

it.effect(
  "starts before the turn, adopts once, supersedes, and rejects stale cleanup",
  () =>
    Effect.gen(function* testReplaySafeTypingLifecycle() {
      const requests = yield* Ref.make<readonly string[]>([]);
      const client = SendblueClientMemory({
        setTypingIndicator: (input) =>
          Ref.update(requests, (values) => [...values, input.state]).pipe(
            Effect.as(typingSuccess)
          ),
      });
      yield* Effect.gen(function* assertReplaySafeTransitions() {
        const sendblue = yield* SendblueChannel;
        const pending = yield* sendblue.transitionTyping(
          typingInput(channelState, { _tag: "StartInbound" })
        );
        assert.strictEqual(pending.outcome, "started");
        assert.deepStrictEqual(pending.lifecycle, { _tag: "Pending" });

        const first = yield* sendblue.transitionTyping(
          typingInput(
            { ...channelState, typing: pending.lifecycle },
            {
              _tag: "StartTurn",
              turnId: "turn-old",
            }
          )
        );
        assert.strictEqual(first.outcome, "adopted");
        assert.strictEqual(first.lifecycle._tag, "Active");
        if (first.lifecycle._tag === "Active") {
          assert.strictEqual(first.lifecycle.turnId, "turn-old");
        }

        const duplicateInbound = yield* sendblue.transitionTyping(
          typingInput(
            { ...channelState, typing: pending.lifecycle },
            { _tag: "StartInbound" }
          )
        );
        assert.strictEqual(duplicateInbound.outcome, "unchanged");

        const replay = yield* sendblue.transitionTyping(
          typingInput(
            { ...channelState, typing: first.lifecycle },
            { _tag: "StartTurn", turnId: "turn-old" }
          )
        );
        assert.strictEqual(replay.outcome, "unchanged");

        const newer = yield* sendblue.transitionTyping(
          typingInput(
            { ...channelState, typing: first.lifecycle },
            { _tag: "StartTurn", turnId: "turn-new" }
          )
        );
        assert.strictEqual(newer.outcome, "started");
        assert.strictEqual(newer.lifecycle._tag, "Active");
        if (newer.lifecycle._tag === "Active") {
          assert.strictEqual(newer.lifecycle.turnId, "turn-new");
        }

        const resumed = yield* sendblue.transitionTyping(
          typingInput(
            { ...channelState, typing: newer.lifecycle },
            { _tag: "ResumeTurn", turnId: "turn-new" }
          )
        );
        assert.strictEqual(resumed.outcome, "started");

        const stale = yield* sendblue.transitionTyping(
          typingInput(
            { ...channelState, typing: newer.lifecycle },
            { _tag: "StopTurn", expectedTurnId: "turn-old" }
          )
        );
        assert.strictEqual(stale.outcome, "unchanged");

        const stopped = yield* sendblue.transitionTyping(
          typingInput(
            { ...channelState, typing: newer.lifecycle },
            { _tag: "StopTurn", expectedTurnId: "turn-new" }
          )
        );
        assert.strictEqual(stopped.outcome, "stopped");
        assert.deepStrictEqual(stopped.lifecycle, { _tag: "Idle" });
        assert.deepStrictEqual(yield* Ref.get(requests), [
          "start",
          "start",
          "start",
          "stop",
        ]);
      }).pipe(Effect.provide(channelLayer(client)));
    })
);

it.effect(
  "retains uncertain cleanup obligations until a successful retry",
  () =>
    Effect.gen(function* testUncertainTypingTransitions() {
      const attempts = yield* Ref.make(0);
      const client = SendblueClientMemory({
        setTypingIndicator: () =>
          Ref.getAndUpdate(attempts, (value) => value + 1).pipe(
            Effect.flatMap((attempt) =>
              attempt < 2
                ? Effect.fail(
                    new SendblueDeliveryUncertainError({
                      message: "Typing outcome uncertain.",
                      operation: "setTypingIndicator",
                      reason: "transport",
                    })
                  )
                : Effect.succeed(typingSuccess)
            )
          ),
      });
      yield* Effect.gen(function* assertConservativeTypingState() {
        const sendblue = yield* SendblueChannel;
        const uncertainStart = yield* sendblue.transitionTyping(
          typingInput(channelState, {
            _tag: "StartTurn",
            turnId: "turn-uncertain",
          })
        );
        assert.strictEqual(uncertainStart.outcome, "unavailable");
        assert.strictEqual(uncertainStart.lifecycle._tag, "Active");
        if (uncertainStart.lifecycle._tag === "Active") {
          assert.strictEqual(uncertainStart.lifecycle.turnId, "turn-uncertain");
        }

        const uncertainStop = yield* sendblue.transitionTyping(
          typingInput(
            { ...channelState, typing: uncertainStart.lifecycle },
            { _tag: "StopTurn", expectedTurnId: "turn-uncertain" }
          )
        );
        assert.strictEqual(uncertainStop.outcome, "unavailable");
        assert.deepStrictEqual(
          uncertainStop.lifecycle,
          uncertainStart.lifecycle
        );

        const retry = yield* sendblue.transitionTyping(
          typingInput(
            { ...channelState, typing: uncertainStop.lifecycle },
            { _tag: "StopTurn", expectedTurnId: "turn-uncertain" }
          )
        );
        assert.strictEqual(retry.outcome, "stopped");
        assert.deepStrictEqual(retry.lifecycle, { _tag: "Idle" });
        assert.strictEqual(yield* Ref.get(attempts), 3);
      }).pipe(Effect.provide(channelLayer(client)));
    })
);

it.effect(
  "repairs corrupt auxiliary state without blocking valid final delivery",
  () =>
    Effect.gen(function* testTypingStateRepair() {
      const typingAttempts = yield* Ref.make(0);
      const messageAttempts = yield* Ref.make(0);
      const client = SendblueClientMemory({
        sendMessage: () =>
          Ref.update(messageAttempts, (value) => value + 1).pipe(
            Effect.as(sendSuccess)
          ),
        setTypingIndicator: () =>
          Ref.update(typingAttempts, (value) => value + 1).pipe(
            Effect.as(typingSuccess)
          ),
      });
      yield* Effect.gen(function* assertAuxiliaryRepair() {
        const sendblue = yield* SendblueChannel;
        const corrupt = { ...channelState, typing: { _tag: "Corrupt" } };
        const transition = yield* sendblue.transitionTyping(
          typingInput(corrupt, {
            _tag: "StartTurn",
            turnId: "turn-corrupt",
          })
        );
        assert.strictEqual(transition.outcome, "unavailable");
        if (transition._tag === "Unavailable") {
          assert.strictEqual(transition.reason, "stateInvalid");
        }
        assert.deepStrictEqual(transition.lifecycle, { _tag: "Idle" });
        assert.strictEqual(yield* Ref.get(typingAttempts), 0);

        assert.strictEqual(
          yield* sendblue.deliverCompletedMessage({
            finishReason: "stop",
            message: "Delivery survives auxiliary corruption.",
            sequence: 0,
            sessionId: "session-corrupt-auxiliary",
            state: corrupt,
            stepIndex: 0,
            turnId: "turn-corrupt",
          }),
          "delivered"
        );
        assert.strictEqual(yield* Ref.get(messageAttempts), 1);

        const corruptCore = {
          ...corrupt,
          senderNumber: "not-a-phone-number",
        };
        const coreTransition = yield* sendblue.transitionTyping(
          typingInput(corruptCore, {
            _tag: "StartTurn",
            turnId: "turn-corrupt-core",
          })
        );
        assert.strictEqual(coreTransition.outcome, "unavailable");
        const deliveryError = yield* sendblue
          .deliverCompletedMessage({
            finishReason: "stop",
            message: "Invalid routing must fail.",
            sequence: 0,
            sessionId: "session-corrupt-core",
            state: corruptCore,
            stepIndex: 0,
            turnId: "turn-corrupt-core",
          })
          .pipe(Effect.flip);
        assert.strictEqual(
          Schema.is(SendblueRoutingError)(deliveryError),
          true
        );
        assert.strictEqual(yield* Ref.get(typingAttempts), 0);
      }).pipe(Effect.provide(channelLayer(client)));
    })
);

it.effect(
  "emits one private Schema-valid observation with exact TestClock timing",
  () => {
    const observations: unknown[] = [];
    const levels: string[] = [];
    const logger = Logger.make(
      ({ logLevel, message }: Logger.Options<unknown>) => {
        const messages = Array.isArray(message) ? message : [message];
        for (const candidate of messages) {
          if (Schema.is(SendblueTypingObservation)(candidate)) {
            observations.push(candidate);
            levels.push(logLevel);
          }
        }
      }
    );
    const client = SendblueClientMemory({
      setTypingIndicator: () =>
        Effect.sleep("2 seconds").pipe(Effect.as(typingSuccess)),
    });
    return Effect.gen(function* testTypingObservation() {
      const sendblue = yield* SendblueChannel;
      const fiber = yield* Effect.forkChild(
        sendblue.transitionTyping(
          typingInput(channelState, {
            _tag: "StartTurn",
            turnId: "protected-turn-id",
          })
        )
      );
      yield* TestClock.adjust("2 seconds");
      const started = yield* Fiber.join(fiber);
      assert.strictEqual(started.outcome, "started");
      const replay = yield* sendblue.transitionTyping(
        typingInput(
          { ...channelState, typing: started.lifecycle },
          { _tag: "StartTurn", turnId: "protected-turn-id" }
        )
      );
      assert.strictEqual(replay.outcome, "unchanged");
      assert.strictEqual(observations.length, 1);
      assert.deepStrictEqual(levels, ["Info"]);
      assert.deepStrictEqual(observations[0], {
        command: "StartTurn",
        elapsedMillis: 2000,
        operation: "setTypingIndicator",
        outcome: "started",
        providerAttempted: true,
      });
      const serialized = JSON.stringify(observations);
      for (const protectedValue of [
        "protected-turn-id",
        "+14155550100",
        "+14155550177",
        "test-api-key",
        "test-api-secret",
      ]) {
        assert.notInclude(serialized, protectedValue);
      }
    }).pipe(
      Effect.provide(Layer.merge(channelLayer(client), Logger.layer([logger])))
    );
  }
);

it.effect("observes state repair without claiming a provider attempt", () => {
  const observations: unknown[] = [];
  const levels: string[] = [];
  const logger = Logger.make(
    ({ logLevel, message }: Logger.Options<unknown>) => {
      const messages = Array.isArray(message) ? message : [message];
      for (const candidate of messages) {
        if (Schema.is(SendblueTypingObservation)(candidate)) {
          observations.push(candidate);
          levels.push(logLevel);
        }
      }
    }
  );
  return Effect.gen(function* testStateRepairObservation() {
    const sendblue = yield* SendblueChannel;
    const result = yield* sendblue.transitionTyping(
      typingInput(
        { ...channelState, typing: { _tag: "Invalid" } },
        { _tag: "StartTurn", turnId: "protected-state-invalid-turn" }
      )
    );
    assert.strictEqual(result.outcome, "unavailable");
    assert.deepStrictEqual(observations, [
      {
        command: "StartTurn",
        elapsedMillis: 0,
        operation: "setTypingIndicator",
        outcome: "unavailable",
        providerAttempted: false,
        reason: "stateInvalid",
      },
    ]);
    assert.deepStrictEqual(levels, ["Warn"]);
    assert.notInclude(
      JSON.stringify(observations),
      "protected-state-invalid-turn"
    );
  }).pipe(
    Effect.provide(
      Layer.merge(channelLayer(SendblueClientMemory()), Logger.layer([logger]))
    )
  );
});

it.effect("never calls typing for rejected or replayed inbound paths", () =>
  Effect.gen(function* testNoTypingBeforeAcceptedTurn() {
    const typingAttempts = yield* Ref.make(0);
    const client = SendblueClientMemory({
      setTypingIndicator: () =>
        Ref.update(typingAttempts, (value) => value + 1).pipe(
          Effect.as(typingSuccess)
        ),
    });
    yield* Effect.gen(function* assertInboundPathsDoNotType() {
      const sendblue = yield* SendblueChannel;
      const cases = [
        { is_typing: true },
        { group_id: "group-no-typing" },
        { media_urls: ["https://example.test/no-typing"] },
        { service: "SMS" },
        { service: "RCS" },
        { from_number: "+14155550101" },
      ];
      for (const [index, changes] of cases.entries()) {
        yield* sendblue.authorizeAndClaimInbound(
          request(inbound({ ...changes, message_handle: `no-typing-${index}` }))
        );
      }
      const replayed = inbound({ message_handle: "no-typing-replay" });
      yield* sendblue.authorizeAndClaimInbound(request(replayed));
      yield* sendblue.authorizeAndClaimInbound(request(replayed));
      yield* sendblue
        .authorizeAndClaimInbound(request(inbound(), "wrong-secret"))
        .pipe(Effect.ignore);
      yield* sendblue
        .authorizeAndClaimInbound(
          new Request("https://agent.test/eve/v1/sendblue/webhook", {
            body: "not-json",
            headers: { "sb-signing-secret": "test-webhook-secret" },
            method: "POST",
          })
        )
        .pipe(Effect.ignore);
      assert.strictEqual(yield* Ref.get(typingAttempts), 0);
    }).pipe(Effect.provide(channelLayer(client)));
  })
);

it.effect(
  "projects every installed Eve event and stops before terminal delivery",
  () =>
    Effect.gen(function* testEveTypingProjection() {
      const operations: string[] = [];
      let failStop = false;
      const client = SendblueClientMemory({
        sendMessage: () =>
          Effect.sync(() => {
            operations.push("message");
            return sendSuccess;
          }),
        setTypingIndicator: (input) =>
          Effect.sync(() => {
            operations.push(`typing:${input.state}`);
          }).pipe(
            Effect.flatMap(() =>
              failStop && input.state === "stop"
                ? Effect.fail(
                    new SendblueDeliveryUncertainError({
                      message: "Bounded typing stop timed out.",
                      operation: "setTypingIndicator",
                      reason: "timeout",
                    })
                  )
                : Effect.succeed(typingSuccess)
            )
          ),
      });
      const managed = yield* Effect.acquireRelease(
        Effect.sync(() => ManagedRuntime.make(channelLayer(client))),
        (activeRuntime) => activeRuntime.disposeEffect
      );
      const events = makeSendblueEveEvents(managed);
      assert.deepStrictEqual(Object.keys(events).toSorted(), [
        "action.result",
        "actions.requested",
        "authorization.completed",
        "authorization.required",
        "input.requested",
        "message.appended",
        "message.completed",
        "reasoning.appended",
        "reasoning.completed",
        "session.completed",
        "session.failed",
        "session.waiting",
        "turn.completed",
        "turn.failed",
        "turn.started",
      ]);
      const state = Schema.encodeSync(SendblueChannelState)(channelState);
      const eventChannel = {
        continuationToken: "sendblue:conversation:test",
        setContinuationToken() {},
        state,
      };
      const ctx = {
        getSandbox: () => Promise.reject(new Error("unused")),
        getSkill: () => {
          throw new Error("unused");
        },
        session: {
          auth: { current: null, initiator: null },
          id: "session-eve-events",
          turn: { id: "turn-eve-events", sequence: 0 },
        },
      };
      const started = events["turn.started"];
      const completed = events["message.completed"];
      if (started === undefined || completed === undefined) {
        return yield* Effect.die("Required Sendblue Eve events are missing.");
      }

      yield* Effect.promise(() =>
        Promise.resolve(
          started({ sequence: 0, turnId: "turn-eve-events" }, eventChannel, ctx)
        )
      );
      assert.deepStrictEqual(state.typing, {
        _tag: "Active",
        turnId: "turn-eve-events",
      });

      events["message.appended"]?.(
        {
          messageDelta: "delta",
          messageSoFar: "delta",
          sequence: 0,
          stepIndex: 0,
          turnId: "turn-eve-events",
        },
        eventChannel,
        ctx
      );
      events["reasoning.appended"]?.(
        {
          reasoningDelta: "private reasoning delta",
          reasoningSoFar: "private reasoning delta",
          sequence: 0,
          stepIndex: 0,
          turnId: "turn-eve-events",
        },
        eventChannel,
        ctx
      );
      events["reasoning.completed"]?.(
        {
          reasoning: "private reasoning",
          sequence: 0,
          stepIndex: 0,
          turnId: "turn-eve-events",
        },
        eventChannel,
        ctx
      );
      assert.deepStrictEqual(operations, ["typing:start"]);

      yield* Effect.promise(() =>
        Promise.resolve(
          completed(
            {
              finishReason: "tool-calls",
              message: "Intermediate tool text.",
              sequence: 0,
              stepIndex: 0,
              turnId: "turn-eve-events",
            },
            eventChannel,
            ctx
          )
        )
      );
      assert.deepStrictEqual(operations, ["typing:start"]);

      yield* Effect.promise(() =>
        Promise.resolve(
          completed(
            {
              finishReason: "stop",
              message: "Visible final reply.",
              sequence: 1,
              stepIndex: 1,
              turnId: "turn-eve-events",
            },
            eventChannel,
            ctx
          )
        )
      );
      assert.deepStrictEqual(operations, [
        "typing:start",
        "typing:stop",
        "message",
      ]);
      assert.deepStrictEqual(state.typing, { _tag: "Idle" });

      operations.length = 0;
      failStop = true;
      yield* Effect.promise(() =>
        Promise.resolve(
          started(
            { sequence: 1, turnId: "turn-fail-open-delivery" },
            eventChannel,
            ctx
          )
        )
      );
      yield* Effect.promise(() =>
        Promise.resolve(
          completed(
            {
              finishReason: "stop",
              message: "Delivered after typing timeout.",
              sequence: 2,
              stepIndex: 0,
              turnId: "turn-fail-open-delivery",
            },
            eventChannel,
            ctx
          )
        )
      );
      assert.deepStrictEqual(operations, [
        "typing:start",
        "typing:stop",
        "message",
      ]);
      assert.deepStrictEqual(state.typing, {
        _tag: "Active",
        turnId: "turn-fail-open-delivery",
      });

      operations.length = 0;
      failStop = false;
      Object.assign(state, { typing: { _tag: "Corrupt" } });
      yield* Effect.promise(() =>
        Promise.resolve(
          started(
            { sequence: 2, turnId: "turn-corrupt-adapter" },
            eventChannel,
            ctx
          )
        )
      );
      assert.deepStrictEqual(operations, []);
      assert.deepStrictEqual(state.typing, { _tag: "Idle" });
      yield* Effect.promise(() =>
        Promise.resolve(
          completed(
            {
              finishReason: "stop",
              message: "Core delivery survives adapter state repair.",
              sequence: 3,
              stepIndex: 0,
              turnId: "turn-corrupt-adapter",
            },
            eventChannel,
            ctx
          )
        )
      );
      assert.deepStrictEqual(operations, ["message"]);
      assert.deepStrictEqual(state.typing, { _tag: "Idle" });
      return yield* Effect.void;
    })
);

it.effect("adopts pre-turn typing without a duplicate provider start", () =>
  Effect.gen(function* testPendingEveTypingAdoption() {
    const operations: string[] = [];
    const client = SendblueClientMemory({
      setTypingIndicator: (input) =>
        Effect.sync(() => {
          operations.push(input.state);
          return typingSuccess;
        }),
    });
    const managed = yield* Effect.acquireRelease(
      Effect.sync(() => ManagedRuntime.make(channelLayer(client))),
      (activeRuntime) => activeRuntime.disposeEffect
    );
    const events = makeSendblueEveEvents(managed);
    const state = Schema.encodeSync(SendblueChannelState)({
      ...channelState,
      typing: Schema.decodeUnknownSync(SendblueTypingLifecycle)({
        _tag: "Pending",
      }),
    });
    const eventChannel = {
      continuationToken: "sendblue:conversation:test",
      setContinuationToken() {},
      state,
    };
    const ctx = {
      getSandbox: () => Promise.reject(new Error("unused")),
      getSkill: () => {
        throw new Error("unused");
      },
      session: {
        auth: { current: null, initiator: null },
        id: "session-pending-eve-state",
        turn: { id: "turn-pending-eve-state", sequence: 0 },
      },
    };
    const started = events["turn.started"];
    if (started === undefined) {
      return yield* Effect.die("Required Sendblue Eve event is missing.");
    }

    yield* Effect.promise(() =>
      Promise.resolve(
        started(
          { sequence: 0, turnId: "turn-pending-eve-state" },
          eventChannel,
          ctx
        )
      )
    );
    assert.deepStrictEqual(operations, []);
    assert.deepStrictEqual(state.typing, {
      _tag: "Active",
      turnId: "turn-pending-eve-state",
    });
    return yield* Effect.void;
  })
);

it.effect("upgrades a persisted legacy adapter state through Eve events", () =>
  Effect.gen(function* testLegacyEveAdapterStateUpgrade() {
    const operations: string[] = [];
    const client = SendblueClientMemory({
      sendMessage: () =>
        Effect.sync(() => {
          operations.push("message");
          return sendSuccess;
        }),
      setTypingIndicator: (input) =>
        Effect.sync(() => {
          operations.push(`typing:${input.state}`);
          return typingSuccess;
        }),
    });
    const managed = yield* Effect.acquireRelease(
      Effect.sync(() => ManagedRuntime.make(channelLayer(client))),
      (activeRuntime) => activeRuntime.disposeEffect
    );
    const events = makeSendblueEveEvents(managed);
    const state = Schema.encodeSync(SendblueChannelState)(channelState);
    assert.strictEqual(Reflect.deleteProperty(state, "typing"), true);
    assert.deepStrictEqual(Object.keys(state).toSorted(), [
      "conversationKey",
      "principalId",
      "sendblueNumber",
      "senderNumber",
    ]);
    const eventChannel = {
      continuationToken: "sendblue:conversation:test",
      setContinuationToken() {},
      state,
    };
    const ctx = {
      getSandbox: () => Promise.reject(new Error("unused")),
      getSkill: () => {
        throw new Error("unused");
      },
      session: {
        auth: { current: null, initiator: null },
        id: "session-legacy-eve-state",
        turn: { id: "turn-legacy-eve-state", sequence: 0 },
      },
    };
    const started = events["turn.started"];
    const completed = events["message.completed"];
    if (started === undefined || completed === undefined) {
      return yield* Effect.die("Required Sendblue Eve events are missing.");
    }

    yield* Effect.promise(() =>
      Promise.resolve(
        started(
          { sequence: 0, turnId: "turn-legacy-eve-state" },
          eventChannel,
          ctx
        )
      )
    );
    assert.deepStrictEqual(operations, ["typing:start"]);
    assert.deepStrictEqual(state.typing, {
      _tag: "Active",
      turnId: "turn-legacy-eve-state",
    });

    yield* Effect.promise(() =>
      Promise.resolve(
        completed(
          {
            finishReason: "stop",
            message: "Legacy adapter state upgraded.",
            sequence: 1,
            stepIndex: 0,
            turnId: "turn-legacy-eve-state",
          },
          eventChannel,
          ctx
        )
      )
    );
    assert.deepStrictEqual(operations, [
      "typing:start",
      "typing:stop",
      "message",
    ]);
    assert.deepStrictEqual(state.typing, { _tag: "Idle" });
    return yield* Effect.void;
  })
);

it.effect(
  "maps wait, authorization, terminal, and failed-session cleanup",
  () =>
    Effect.gen(function* testEveCleanupEvents() {
      const operations: string[] = [];
      const client = SendblueClientMemory({
        setTypingIndicator: (input) =>
          Effect.sync(() => {
            operations.push(input.state);
            return typingSuccess;
          }),
      });
      const managed = yield* Effect.acquireRelease(
        Effect.sync(() => ManagedRuntime.make(channelLayer(client))),
        (activeRuntime) => activeRuntime.disposeEffect
      );
      const events = makeSendblueEveEvents(managed);
      const state = Schema.encodeSync(SendblueChannelState)(channelState);
      const eventChannel = {
        continuationToken: "sendblue:conversation:test",
        setContinuationToken() {},
        state,
      };
      const ctx = {
        getSandbox: () => Promise.reject(new Error("unused")),
        getSkill: () => {
          throw new Error("unused");
        },
        session: {
          auth: { current: null, initiator: null },
          id: "session-cleanup-events",
          turn: { id: "turn-cleanup-events", sequence: 0 },
        },
      };
      const started = events["turn.started"];
      const inputRequested = events["input.requested"];
      const authorizationRequired = events["authorization.required"];
      const authorizationCompleted = events["authorization.completed"];
      const turnFailed = events["turn.failed"];
      const turnCompleted = events["turn.completed"];
      const sessionWaiting = events["session.waiting"];
      const sessionCompleted = events["session.completed"];
      const sessionFailed = events["session.failed"];
      if (
        started === undefined ||
        inputRequested === undefined ||
        authorizationRequired === undefined ||
        authorizationCompleted === undefined ||
        turnFailed === undefined ||
        turnCompleted === undefined ||
        sessionWaiting === undefined ||
        sessionCompleted === undefined ||
        sessionFailed === undefined
      ) {
        return yield* Effect.die(
          "Required Sendblue cleanup events are missing."
        );
      }
      const start = () =>
        Promise.resolve(
          started(
            { sequence: 0, turnId: "turn-cleanup-events" },
            eventChannel,
            ctx
          )
        );

      yield* Effect.promise(start);
      yield* Effect.promise(() =>
        Promise.resolve(
          inputRequested(
            {
              requests: [],
              sequence: 0,
              stepIndex: 0,
              turnId: "turn-cleanup-events",
            },
            eventChannel,
            ctx
          )
        )
      );
      yield* Effect.promise(start);
      yield* Effect.promise(() =>
        Promise.resolve(
          authorizationRequired(
            {
              description: "Authorize",
              name: "provider",
              sequence: 0,
              stepIndex: 0,
              turnId: "turn-cleanup-events",
            },
            eventChannel,
            ctx
          )
        )
      );
      yield* Effect.promise(() =>
        Promise.resolve(
          authorizationCompleted(
            {
              name: "provider",
              outcome: "declined",
              sequence: 0,
              stepIndex: 0,
              turnId: "turn-cleanup-events",
            },
            eventChannel,
            ctx
          )
        )
      );
      const beforeResume = operations.length;
      for (const outcome of ["failed", "timed-out"] as const) {
        yield* Effect.promise(() =>
          Promise.resolve(
            authorizationCompleted(
              {
                name: "provider",
                outcome,
                sequence: 0,
                stepIndex: 0,
                turnId: "turn-cleanup-events",
              },
              eventChannel,
              ctx
            )
          )
        );
      }
      assert.strictEqual(operations.length, beforeResume);
      yield* Effect.promise(() =>
        Promise.resolve(
          authorizationCompleted(
            {
              name: "provider",
              outcome: "authorized",
              sequence: 0,
              stepIndex: 0,
              turnId: "turn-cleanup-events",
            },
            eventChannel,
            ctx
          )
        )
      );
      assert.strictEqual(operations.length, beforeResume + 1);

      yield* Effect.promise(() =>
        Promise.resolve(
          turnFailed(
            {
              code: "failed",
              message: "failed",
              sequence: 0,
              turnId: "turn-cleanup-events",
            },
            eventChannel,
            ctx
          )
        )
      );
      yield* Effect.promise(start);
      yield* Effect.promise(() =>
        Promise.resolve(
          turnCompleted(
            { sequence: 0, turnId: "turn-cleanup-events" },
            eventChannel,
            ctx
          )
        )
      );
      yield* Effect.promise(start);
      yield* Effect.promise(() =>
        Promise.resolve(
          sessionWaiting({ wait: "next-user-message" }, eventChannel, ctx)
        )
      );
      yield* Effect.promise(start);
      yield* Effect.promise(() =>
        Promise.resolve(sessionCompleted(undefined, eventChannel, ctx))
      );
      yield* Effect.promise(start);
      assert.deepStrictEqual(state.typing, {
        _tag: "Active",
        turnId: "turn-cleanup-events",
      });
      yield* Effect.promise(() =>
        Promise.resolve(
          sessionFailed(
            {
              code: "failed",
              message: "failed",
              sessionId: "session-cleanup-events",
            },
            eventChannel
          )
        )
      );
      assert.deepStrictEqual(state.typing, {
        _tag: "Active",
        turnId: "turn-cleanup-events",
      });
      assert.deepStrictEqual(operations, [
        "start",
        "stop",
        "start",
        "stop",
        "start",
        "stop",
        "start",
        "stop",
        "start",
        "stop",
        "start",
        "stop",
        "start",
        "stop",
      ]);
      return yield* Effect.void;
    })
);

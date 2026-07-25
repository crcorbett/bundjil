import {
  ChannelSendAccepted,
  ChannelTransport,
  ChannelWebhookAuthenticationError,
  ChannelWebhookResult,
  ChannelWebhookSchemaError,
} from "@bundjil/channel";
import { PersistenceMemory } from "@bundjil/store/memory";
import { assert, it } from "@effect/vitest";
import {
  Context,
  Deferred,
  Duration,
  Effect,
  Exit,
  Fiber,
  Layer,
  ManagedRuntime,
  Redacted,
  Ref,
  Schema,
} from "effect";
import type { RouteHandlerArgs, Session } from "eve/channels";

import { makeSendblueEveChannel } from "../agent/channels/sendblue.js";
import type { ChannelHandoff } from "../agent/lib/channel/index.js";
import {
  Channel,
  channelHandoffTimeoutDefault,
  ChannelHandoffMemory,
  ChannelIdentityMemory,
  ChannelLive,
  ChannelReplayMemory,
  ChannelRouter,
  ChannelRouterMemory,
  ChannelRoutingError,
} from "../agent/lib/channel/index.js";
import type {
  ChannelHandoffObservation,
  ChannelHandoffTimeout,
  ChannelInboundAcceptance,
  ChannelMutableAdapterStateEncoded,
} from "../agent/lib/channel/schemas.js";
import {
  ChannelIdentityRecords,
  ChannelPrepareInboundResult,
  ChannelReplayOptions,
  ChannelRoutingSecret,
} from "../agent/lib/channel/schemas.js";

const fixtures = Effect.gen(function* decodeSendblueChannelFixtures() {
  const accepted = yield* Schema.decodeEffect(ChannelWebhookResult)({
    _tag: "Accepted",
    message: {
      conversation: {
        conversationId: "conversation-1",
        participantId: "+61400000001",
        provider: "sendblue",
        providerAgentId: "+61400000002",
      },
      messageId: "message-1",
      text: "hello",
    },
  });
  const ignored = yield* Schema.decodeEffect(ChannelWebhookResult)({
    _tag: "Ignored",
    reason: "unsupportedEvent",
  });
  const identities = yield* Schema.decodeEffect(ChannelIdentityRecords)([
    { participantId: "+61400000001", principalId: "principal-1" },
  ]);
  const replay = yield* Schema.decodeEffect(ChannelReplayOptions)({
    leaseMilliseconds: 30_000,
    prefix: "channel:v1:route-test:",
    ttlMilliseconds: 86_400_000,
  });
  const send = yield* Schema.decodeEffect(ChannelSendAccepted)({
    messageId: "unused-provider-message",
    provider: "sendblue",
  });
  const routingSecret = yield* Schema.decodeUnknownEffect(ChannelRoutingSecret)(
    Redacted.make("synthetic-channel-handoff-secret")
  );
  const prepared = yield* Schema.decodeEffect(ChannelPrepareInboundResult)({
    _tag: "Dispatch",
    prepared: {
      claim: {
        claimedValue: '{"status":"claimed"}',
        key: "channel:v1:route-test:inbound:sendblue:message-1",
      },
      continuationToken: "channel:v1:sendblue:conversation-1",
      message:
        accepted._tag === "Accepted"
          ? accepted.message
          : yield* Effect.die("accepted fixture required"),
      principalId: "principal-1",
      state: {
        snapshot: {
          _tag: "V1",
          conversation:
            accepted._tag === "Accepted"
              ? accepted.message.conversation
              : yield* Effect.die("accepted fixture required"),
        },
      },
    },
  });
  return {
    accepted,
    identities,
    ignored,
    prepared,
    replay,
    routingSecret,
    send,
  };
});

const makeObservedRuntime = Effect.fn(
  "SendblueChannelTest.makeObservedRuntime"
)(function* (
  webhook: Effect.Effect<
    typeof ChannelWebhookResult.Type,
    ChannelWebhookAuthenticationError | ChannelWebhookSchemaError
  >,
  handoffTimeout: ChannelHandoffTimeout = channelHandoffTimeoutDefault
) {
  const fixture = yield* fixtures;
  const observations = yield* Ref.make<
    readonly (typeof ChannelHandoffObservation.Type)[]
  >([]);
  const transport = Layer.succeed(
    ChannelTransport,
    ChannelTransport.of({
      decodeWebhook: () => webhook,
      sendMessage: () => Effect.succeed(fixture.send),
      setPresence: () => Effect.succeed("accepted"),
    })
  );
  const dependencies = Layer.mergeAll(
    transport,
    ChannelIdentityMemory(fixture.identities),
    ChannelRouterMemory,
    ChannelReplayMemory(fixture.replay).pipe(Layer.provide(PersistenceMemory))
  );
  const runtime = ManagedRuntime.make(
    Layer.merge(
      ChannelLive.pipe(Layer.provide(dependencies)),
      ChannelHandoffMemory(fixture.routingSecret, observations, handoffTimeout)
    )
  );
  return { observations, runtime };
});

const makeRuntime = Effect.fn("SendblueChannelTest.makeRuntime")(function* (
  webhook: Effect.Effect<
    typeof ChannelWebhookResult.Type,
    ChannelWebhookAuthenticationError | ChannelWebhookSchemaError
  >
) {
  return (yield* makeObservedRuntime(webhook)).runtime;
});

const makeObservedSupervisionRuntime = Effect.fn(
  "SendblueChannelTest.makeObservedSupervisionRuntime"
)(function* (
  acceptInbound: Effect.Effect<void>,
  acceptanceMode: (typeof ChannelInboundAcceptance.Type)["_tag"] = "New"
) {
  const fixture = yield* fixtures;
  const observations = yield* Ref.make<
    readonly (typeof ChannelHandoffObservation.Type)[]
  >([]);
  const runtime = ManagedRuntime.make(
    Layer.merge(
      Layer.succeed(
        Channel,
        Channel.of({
          acceptInbound: (_claim, _continuationToken, acceptance) =>
            acceptInbound.pipe(Effect.as({ _tag: acceptanceMode, acceptance })),
          decodeWebhook: () => Effect.succeed(fixture.accepted),
          handleEvent: () =>
            Effect.die("channel event is not used in this test"),
          prepareInbound: () => Effect.succeed(fixture.prepared),
          retryInbound: () => Effect.void,
          settleSession: () => Effect.succeed("retired"),
          uncertainInbound: () => Effect.void,
        })
      ),
      ChannelHandoffMemory(fixture.routingSecret, observations)
    )
  );
  return { observations, runtime };
});

const makeSupervisionRuntime = Effect.fn(
  "SendblueChannelTest.makeSupervisionRuntime"
)(function* (completeInbound: Effect.Effect<void>) {
  return (yield* makeObservedSupervisionRuntime(completeInbound)).runtime;
});

const routeFor = <E>(
  runtime: ManagedRuntime.ManagedRuntime<Channel | ChannelHandoff, E>
) => {
  const definition = makeSendblueEveChannel(runtime);
  const [route] = definition.routes;
  if (route === undefined || route.transport === "websocket") {
    throw new Error("The Sendblue Eve webhook route is missing.");
  }
  return route;
};

const session = {
  continuationToken: "sendblue:test",
  getEventStream: () => Promise.resolve(new ReadableStream()),
  id: "session-test",
} satisfies Session;

const request = () =>
  new Request("https://agent.test/eve/v1/sendblue/webhook", {
    method: "POST",
  });

it.effect("maps accepted, ignored, duplicate and failed channel ingress", () =>
  Effect.gen(function* testSendblueRouteResponses() {
    const fixture = yield* fixtures;
    const acceptedRuntime = yield* makeRuntime(
      Effect.succeed(fixture.accepted)
    );
    const ignoredRuntime = yield* makeRuntime(Effect.succeed(fixture.ignored));
    const authenticationRuntime = yield* makeRuntime(
      Effect.fail(
        new ChannelWebhookAuthenticationError({
          operation: "decodeWebhook",
          provider: "sendblue",
          reason: "authentication",
          retry: "never",
        })
      )
    );
    const schemaRuntime = yield* makeRuntime(
      Effect.fail(
        new ChannelWebhookSchemaError({
          operation: "decodeWebhook",
          provider: "sendblue",
          reason: "invalidPayload",
          retry: "never",
        })
      )
    );
    yield* Effect.addFinalizer(() =>
      Effect.all(
        [
          acceptedRuntime.disposeEffect,
          ignoredRuntime.disposeEffect,
          authenticationRuntime.disposeEffect,
          schemaRuntime.disposeEffect,
        ],
        { discard: true }
      )
    );

    let sends = 0;
    let waitUntilRegistrations = 0;
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
        waitUntilRegistrations += 1;
        void task;
      },
    } satisfies RouteHandlerArgs<ChannelMutableAdapterStateEncoded>;

    const acceptedRoute = routeFor(acceptedRuntime);
    const acceptedResponse = yield* Effect.promise(() =>
      acceptedRoute.handler(request(), args).then((response) => {
        assert.strictEqual(waitUntilRegistrations, 0);
        return response;
      })
    );
    assert.strictEqual(acceptedResponse.status, 202);
    assert.strictEqual(sends, 1);
    assert.strictEqual(
      (yield* Effect.promise(() => acceptedRoute.handler(request(), args)))
        .status,
      204
    );
    assert.strictEqual(
      (yield* Effect.promise(() =>
        routeFor(ignoredRuntime).handler(request(), args)
      )).status,
      204
    );
    assert.strictEqual(
      (yield* Effect.promise(() =>
        routeFor(authenticationRuntime).handler(request(), args)
      )).status,
      401
    );
    assert.strictEqual(
      (yield* Effect.promise(() =>
        routeFor(schemaRuntime).handler(request(), args)
      )).status,
      400
    );
  }).pipe(Effect.scoped)
);

it.effect(
  "withholds 202 and suppresses a duplicate until delayed Eve acceptance converges",
  () =>
    Effect.gen(function* testDelayedChannelHandoffOrdering() {
      const fixture = yield* fixtures;
      const started = yield* Deferred.make<null>();
      const release = yield* Deferred.make<null>();
      const runPromise = Effect.runPromiseWith(Context.empty());
      const observed = yield* makeObservedRuntime(
        Effect.succeed(fixture.accepted)
      );
      yield* Effect.addFinalizer(() => observed.runtime.disposeEffect);

      let sends = 0;
      let waitUntilRegistrations = 0;
      let responseResolved = false;
      const args = {
        getSession: () => session,
        params: {},
        receive: () => Promise.resolve(session),
        requestIp: null,
        send: () => {
          sends += 1;
          return runPromise(
            Deferred.succeed(started, null).pipe(
              Effect.andThen(Deferred.await(release)),
              Effect.as(session)
            )
          );
        },
        waitUntil: () => {
          waitUntilRegistrations += 1;
        },
      } satisfies RouteHandlerArgs<ChannelMutableAdapterStateEncoded>;
      const route = routeFor(observed.runtime);
      const responseFiber = yield* Effect.forkChild(
        Effect.promise(() =>
          route.handler(request(), args).then((response) => {
            responseResolved = true;
            return response;
          })
        )
      );
      yield* Deferred.await(started);
      const duplicate = yield* Effect.promise(() =>
        route.handler(request(), args)
      );
      const beforeAcceptance = yield* Ref.get(observed.observations);

      assert.strictEqual(duplicate.status, 204);
      assert.strictEqual(sends, 1);
      assert.strictEqual(responseResolved, false);
      assert.strictEqual(waitUntilRegistrations, 0);
      assert.deepStrictEqual(
        beforeAcceptance.map((observation) => observation._tag),
        ["Prepared", "SendStarted"]
      );
      assert.strictEqual(
        beforeAcceptance.some(
          (observation) => observation._tag === "SendAccepted"
        ),
        false
      );

      yield* Deferred.succeed(release, null);
      const response = yield* Fiber.join(responseFiber);
      const afterAcceptance = yield* Ref.get(observed.observations);
      assert.strictEqual(response.status, 202);
      assert.strictEqual(sends, 1);
      assert.deepStrictEqual(
        afterAcceptance.map((observation) => observation._tag),
        [
          "Prepared",
          "SendStarted",
          "SendAccepted",
          "Continuity",
          "Exit",
          "Response",
        ]
      );
      const responseObservation = afterAcceptance.find(
        (observation) => observation._tag === "Response"
      );
      const acceptanceObservation = afterAcceptance.find(
        (observation) => observation._tag === "SendAccepted"
      );
      assert.strictEqual(responseObservation?.status, 202);
      assert.strictEqual(acceptanceObservation?.outcome, "accepted");
      assert.strictEqual(
        responseObservation?.workFingerprint,
        acceptanceObservation?.workFingerprint
      );
    }).pipe(Effect.scoped)
);

it.effect(
  "returns 202 for intended-session resume but rejects a continuity fork",
  () =>
    Effect.gen(function* testExistingSessionConvergence() {
      const resumed = yield* makeObservedSupervisionRuntime(
        Effect.void,
        "Resumed"
      );
      const forked = yield* makeObservedSupervisionRuntime(
        Effect.void,
        "ContinuityUncertain"
      );
      yield* Effect.addFinalizer(() =>
        Effect.all(
          [resumed.runtime.disposeEffect, forked.runtime.disposeEffect],
          { discard: true }
        )
      );

      const args = {
        getSession: () => session,
        params: {},
        receive: () => Promise.resolve(session),
        requestIp: null,
        send: () => Promise.resolve(session),
        waitUntil: () => {},
      } satisfies RouteHandlerArgs<ChannelMutableAdapterStateEncoded>;
      const resumedResponse = yield* Effect.promise(() =>
        routeFor(resumed.runtime).handler(request(), args)
      );
      const forkedResponse = yield* Effect.promise(() =>
        routeFor(forked.runtime).handler(request(), args)
      );
      const resumedObservations = yield* Ref.get(resumed.observations);
      const forkedObservations = yield* Ref.get(forked.observations);

      assert.strictEqual(resumedResponse.status, 202);
      assert.deepStrictEqual(
        resumedObservations.map((observation) => observation._tag),
        [
          "Prepared",
          "SendStarted",
          "SendAccepted",
          "Continuity",
          "Exit",
          "Response",
        ]
      );
      assert.strictEqual(
        resumedObservations.some(
          (observation) =>
            observation._tag === "Continuity" &&
            observation.outcome === "Resumed"
        ),
        true
      );
      assert.strictEqual(forkedResponse.status, 503);
      assert.strictEqual(
        forkedObservations.some(
          (observation) =>
            observation._tag === "Continuity" &&
            observation.outcome === "ContinuityUncertain"
        ),
        true
      );
      assert.strictEqual(
        forkedObservations.some(
          (observation) =>
            observation._tag === "Response" && observation.status === 202
        ),
        false
      );
    }).pipe(Effect.scoped)
);

it.effect("returns no 202 for rejected or defective pre-response handoff", () =>
  Effect.gen(function* testChannelBackgroundFailureCompletion() {
    const typedFailure = yield* makeObservedSupervisionRuntime(Effect.void);
    const defect = yield* makeObservedSupervisionRuntime(
      Effect.die("synthetic channel completion defect")
    );
    yield* Effect.addFinalizer(() =>
      Effect.all(
        [typedFailure.runtime.disposeEffect, defect.runtime.disposeEffect],
        { discard: true }
      )
    );

    let typedFailureSends = 0;
    let typedFailureWaitUntilRegistrations = 0;
    const typedFailureResponse = yield* Effect.promise(() =>
      routeFor(typedFailure.runtime).handler(request(), {
        getSession: () => session,
        params: {},
        receive: () => Promise.resolve(session),
        requestIp: null,
        send: () => {
          typedFailureSends += 1;
          return Promise.reject(new Error("synthetic send rejection"));
        },
        waitUntil: () => {
          typedFailureWaitUntilRegistrations += 1;
        },
      })
    );
    assert.strictEqual(typedFailureResponse.status, 503);
    assert.strictEqual(typedFailureWaitUntilRegistrations, 0);
    assert.strictEqual(typedFailureSends, 1);
    const typedFailureObservations = yield* Ref.get(typedFailure.observations);
    assert.strictEqual(
      typedFailureObservations.some(
        (observation) =>
          observation._tag === "SendRejected" &&
          observation.outcome === "uncertain"
      ),
      true
    );
    assert.strictEqual(
      typedFailureObservations.some(
        (observation) =>
          observation._tag === "Exit" && observation.outcome === "failed"
      ),
      true
    );

    let defectSends = 0;
    let defectWaitUntilRegistrations = 0;
    const defectExit = yield* Effect.promise(() =>
      routeFor(defect.runtime).handler(request(), {
        getSession: () => session,
        params: {},
        receive: () => Promise.resolve(session),
        requestIp: null,
        send: () => {
          defectSends += 1;
          return Promise.resolve(session);
        },
        waitUntil: () => {
          defectWaitUntilRegistrations += 1;
        },
      })
    ).pipe(Effect.exit);
    assert.strictEqual(Exit.hasDies(defectExit), true);
    assert.strictEqual(defectWaitUntilRegistrations, 0);
    assert.strictEqual(defectSends, 1);
    const defectObservations = yield* Ref.get(defect.observations);
    assert.strictEqual(
      defectObservations.some(
        (observation) => observation._tag === "SendAccepted"
      ),
      true
    );
    assert.strictEqual(
      defectObservations.some(
        (observation) =>
          observation._tag === "Exit" && observation.outcome === "defect"
      ),
      true
    );
  }).pipe(Effect.scoped)
);

it.effect(
  "times out before 202 and quarantines the outcome-uncertain inbound event",
  () =>
    Effect.gen(function* testChannelHandoffTimeout() {
      const fixture = yield* fixtures;
      const pending = yield* Deferred.make<Session>();
      const runPromise = Effect.runPromiseWith(Context.empty());
      const observed = yield* makeObservedRuntime(
        Effect.succeed(fixture.accepted),
        Duration.millis(10)
      );
      yield* Effect.addFinalizer(() => observed.runtime.disposeEffect);

      let sends = 0;
      let waitUntilRegistrations = 0;
      const route = routeFor(observed.runtime);
      const args = {
        getSession: () => session,
        params: {},
        receive: () => Promise.resolve(session),
        requestIp: null,
        send: () => {
          sends += 1;
          return runPromise(Deferred.await(pending));
        },
        waitUntil: () => {
          waitUntilRegistrations += 1;
        },
      } satisfies RouteHandlerArgs<ChannelMutableAdapterStateEncoded>;
      const timedOut = yield* Effect.promise(() =>
        route.handler(request(), args)
      );
      const duplicate = yield* Effect.promise(() =>
        route.handler(request(), args)
      );
      const observations = yield* Ref.get(observed.observations);

      assert.strictEqual(timedOut.status, 503);
      assert.strictEqual(duplicate.status, 204);
      assert.strictEqual(sends, 1);
      assert.strictEqual(waitUntilRegistrations, 0);
      assert.strictEqual(
        observations.some(
          (observation) =>
            observation._tag === "SendRejected" &&
            observation.outcome === "timeout"
        ),
        true
      );
      assert.strictEqual(
        observations.some(
          (observation) =>
            observation._tag === "Response" && observation.status === 202
        ),
        false
      );
    }).pipe(Effect.scoped)
);

it.effect(
  "withholds 202 and runs the acceptance finalizer when runtime disposal interrupts",
  () =>
    Effect.gen(function* testChannelBackgroundRuntimeDisposal() {
      const started = yield* Deferred.make<null>();
      const finalized = yield* Deferred.make<null>();
      const observed = yield* makeObservedSupervisionRuntime(
        Deferred.succeed(started, null).pipe(
          Effect.andThen(Effect.never),
          Effect.ensuring(Deferred.succeed(finalized, null).pipe(Effect.asVoid))
        )
      );
      yield* Effect.addFinalizer(() => observed.runtime.disposeEffect);

      let sends = 0;
      let waitUntilRegistrations = 0;
      const handlerFiber = yield* Effect.forkChild(
        Effect.promise(() =>
          routeFor(observed.runtime).handler(request(), {
            getSession: () => session,
            params: {},
            receive: () => Promise.resolve(session),
            requestIp: null,
            send: () => {
              sends += 1;
              return Promise.resolve(session);
            },
            waitUntil: () => {
              waitUntilRegistrations += 1;
            },
          })
        ).pipe(Effect.exit)
      );
      yield* Deferred.await(started);
      yield* observed.runtime.disposeEffect;
      yield* Deferred.await(finalized);
      const handlerExit = yield* Fiber.join(handlerFiber);
      assert.strictEqual(handlerExit._tag, "Failure");
      assert.strictEqual(waitUntilRegistrations, 0);
      assert.strictEqual(sends, 1);
      const observations = yield* Ref.get(observed.observations);
      assert.strictEqual(
        observations.some(
          (observation) =>
            observation._tag === "Exit" && observation.outcome === "interrupted"
        ),
        true
      );
    }).pipe(Effect.scoped)
);

it.effect(
  "keeps accepted work independent from the ingress request abort signal",
  () =>
    Effect.gen(function* testAcceptedChannelRequestAbort() {
      const started = yield* Deferred.make<null>();
      const release = yield* Deferred.make<null>();
      const completed = yield* Deferred.make<null>();
      const runtime = yield* makeSupervisionRuntime(
        Deferred.succeed(started, null).pipe(
          Effect.andThen(Deferred.await(release)),
          Effect.andThen(Deferred.succeed(completed, null)),
          Effect.asVoid
        )
      );
      yield* Effect.addFinalizer(() => runtime.disposeEffect);

      let sends = 0;
      const controller = new AbortController();
      let waitUntilRegistrations = 0;
      let responseResolved = false;
      const responseFiber = yield* Effect.forkChild(
        Effect.promise(() =>
          routeFor(runtime)
            .handler(
              new Request("https://agent.test/eve/v1/sendblue/webhook", {
                method: "POST",
                signal: controller.signal,
              }),
              {
                getSession: () => session,
                params: {},
                receive: () => Promise.resolve(session),
                requestIp: null,
                send: () => {
                  sends += 1;
                  return Promise.resolve(session);
                },
                waitUntil: () => {
                  waitUntilRegistrations += 1;
                },
              }
            )
            .then((response) => {
              responseResolved = true;
              return response;
            })
        )
      );
      yield* Deferred.await(started);
      assert.strictEqual(responseResolved, false);
      controller.abort();
      assert.strictEqual(controller.signal.aborted, true);
      yield* Deferred.succeed(release, null);
      yield* Deferred.await(completed);
      const response = yield* Fiber.join(responseFiber);
      assert.strictEqual(response.status, 202);
      assert.strictEqual(waitUntilRegistrations, 0);
      assert.strictEqual(sends, 1);
    }).pipe(Effect.scoped)
);

it.effect("returns 503 when routing fails before dispatch", () =>
  Effect.gen(function* testSendblueRouteDependencyFailure() {
    const fixture = yield* fixtures;
    const transport = Layer.succeed(
      ChannelTransport,
      ChannelTransport.of({
        decodeWebhook: () => Effect.succeed(fixture.accepted),
        sendMessage: () => Effect.succeed(fixture.send),
        setPresence: () => Effect.succeed("accepted"),
      })
    );
    const dependencies = Layer.mergeAll(
      transport,
      ChannelIdentityMemory(fixture.identities),
      Layer.succeed(
        ChannelRouter,
        ChannelRouter.of({
          route: () =>
            Effect.fail(new ChannelRoutingError({ reason: "unavailable" })),
        })
      ),
      ChannelReplayMemory(fixture.replay).pipe(Layer.provide(PersistenceMemory))
    );
    const observations = yield* Ref.make<
      readonly (typeof ChannelHandoffObservation.Type)[]
    >([]);
    const runtime = ManagedRuntime.make(
      Layer.merge(
        ChannelLive.pipe(Layer.provide(dependencies)),
        ChannelHandoffMemory(fixture.routingSecret, observations)
      )
    );
    yield* Effect.addFinalizer(() => runtime.disposeEffect);
    const route = routeFor(runtime);
    const args = {
      getSession: () => session,
      params: {},
      receive: () => Promise.resolve(session),
      requestIp: null,
      send: () => Promise.resolve(session),
      waitUntil: () => {},
    } satisfies RouteHandlerArgs<ChannelMutableAdapterStateEncoded>;

    assert.strictEqual(
      (yield* Effect.promise(() => route.handler(request(), args))).status,
      503
    );
  }).pipe(Effect.scoped)
);

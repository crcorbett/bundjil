import {
  ChannelSendAccepted,
  ChannelTransport,
  ChannelWebhookAuthenticationError,
  ChannelWebhookResult,
  ChannelWebhookSchemaError,
} from "@bundjil/channel";
import { PersistenceMemory } from "@bundjil/store/memory";
import { assert, it } from "@effect/vitest";
import { Deferred, Effect, Layer, ManagedRuntime, Schema } from "effect";
import type { RouteHandlerArgs, Session } from "eve/channels";

import { makeSendblueEveChannel } from "../agent/channels/sendblue.js";
import {
  Channel,
  ChannelIdentityMemory,
  ChannelLive,
  ChannelReplayMemory,
  ChannelRouter,
  ChannelRouterMemory,
  ChannelRoutingError,
} from "../agent/lib/channel/index.js";
import {
  ChannelIdentityRecords,
  ChannelPrepareInboundResult,
  ChannelReplayOptions,
} from "../agent/lib/channel/schemas.js";
import type { ChannelMutableAdapterStateEncoded } from "../agent/lib/channel/schemas.js";

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
  return { accepted, identities, ignored, prepared, replay, send };
});

const makeRuntime = Effect.fn("SendblueChannelTest.makeRuntime")(function* (
  webhook: Effect.Effect<
    typeof ChannelWebhookResult.Type,
    ChannelWebhookAuthenticationError | ChannelWebhookSchemaError
  >
) {
  const fixture = yield* fixtures;
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
  return ManagedRuntime.make(ChannelLive.pipe(Layer.provide(dependencies)));
});

const makeSupervisionRuntime = Effect.fn(
  "SendblueChannelTest.makeSupervisionRuntime"
)(function* (completeInbound: Effect.Effect<void>) {
  const fixture = yield* fixtures;
  return ManagedRuntime.make(
    Layer.succeed(
      Channel,
      Channel.of({
        completeInbound: () => completeInbound,
        decodeWebhook: () => Effect.succeed(fixture.accepted),
        handleEvent: () => Effect.die("channel event is not used in this test"),
        prepareInbound: () => Effect.succeed(fixture.prepared),
      })
    )
  );
});

const routeFor = (runtime: ManagedRuntime.ManagedRuntime<Channel, never>) => {
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
    const pending: Promise<unknown>[] = [];
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
        pending.push(task);
      },
    } satisfies RouteHandlerArgs<ChannelMutableAdapterStateEncoded>;

    const acceptedRoute = routeFor(acceptedRuntime);
    const acceptedResponse = yield* Effect.promise(() =>
      acceptedRoute.handler(request(), args).then((response) => {
        assert.strictEqual(waitUntilRegistrations, 1);
        return response;
      })
    );
    assert.strictEqual(acceptedResponse.status, 202);
    assert.strictEqual(pending.length, 1);
    yield* Effect.promise(() => Promise.all(pending));
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
  "settles waitUntil after typed failure and defect without another dispatch",
  () =>
    Effect.gen(function* testChannelBackgroundFailureCompletion() {
      const typedFailureRuntime = yield* makeSupervisionRuntime(Effect.void);
      const defectRuntime = yield* makeSupervisionRuntime(
        Effect.die("synthetic channel completion defect")
      );
      yield* Effect.addFinalizer(() =>
        Effect.all(
          [typedFailureRuntime.disposeEffect, defectRuntime.disposeEffect],
          { discard: true }
        )
      );

      let typedFailureSends = 0;
      let typedFailureRegistered = false;
      const typedFailurePending: Promise<unknown>[] = [];
      const typedFailureResponse = yield* Effect.promise(() =>
        routeFor(typedFailureRuntime)
          .handler(request(), {
            getSession: () => session,
            params: {},
            receive: () => Promise.resolve(session),
            requestIp: null,
            send: () => {
              typedFailureSends += 1;
              return Promise.reject(new Error("synthetic send rejection"));
            },
            waitUntil: (task) => {
              typedFailureRegistered = true;
              typedFailurePending.push(task);
            },
          })
          .then((response) => {
            assert.strictEqual(typedFailureRegistered, true);
            return response;
          })
      );
      assert.strictEqual(typedFailureResponse.status, 202);
      assert.strictEqual(typedFailurePending.length, 1);
      yield* Effect.promise(() => Promise.all(typedFailurePending));
      assert.strictEqual(typedFailureSends, 1);

      let defectSends = 0;
      let defectRegistered = false;
      const defectPending: Promise<unknown>[] = [];
      const defectResponse = yield* Effect.promise(() =>
        routeFor(defectRuntime)
          .handler(request(), {
            getSession: () => session,
            params: {},
            receive: () => Promise.resolve(session),
            requestIp: null,
            send: () => {
              defectSends += 1;
              return Promise.resolve(session);
            },
            waitUntil: (task) => {
              defectRegistered = true;
              defectPending.push(task);
            },
          })
          .then((response) => {
            assert.strictEqual(defectRegistered, true);
            return response;
          })
      );
      assert.strictEqual(defectResponse.status, 202);
      assert.strictEqual(defectPending.length, 1);
      yield* Effect.promise(() => Promise.all(defectPending));
      assert.strictEqual(defectSends, 1);
    }).pipe(Effect.scoped)
);

it.effect(
  "interrupts accepted work and runs its finalizer when the runtime is disposed",
  () =>
    Effect.gen(function* testChannelBackgroundRuntimeDisposal() {
      const started = yield* Deferred.make<null>();
      const finalized = yield* Deferred.make<null>();
      const runtime = yield* makeSupervisionRuntime(
        Deferred.succeed(started, null).pipe(
          Effect.andThen(Effect.never),
          Effect.ensuring(Deferred.succeed(finalized, null).pipe(Effect.asVoid))
        )
      );
      yield* Effect.addFinalizer(() => runtime.disposeEffect);

      let sends = 0;
      const pending: Promise<unknown>[] = [];
      const response = yield* Effect.promise(() =>
        routeFor(runtime).handler(request(), {
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
        })
      );
      assert.strictEqual(response.status, 202);
      assert.strictEqual(pending.length, 1);
      yield* Deferred.await(started);
      yield* runtime.disposeEffect;
      yield* Deferred.await(finalized);
      yield* Effect.promise(() => Promise.all(pending));
      assert.strictEqual(sends, 1);
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
      const pending: Promise<unknown>[] = [];
      const response = yield* Effect.promise(() =>
        routeFor(runtime).handler(
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
            waitUntil: (task) => {
              pending.push(task);
            },
          }
        )
      );
      assert.strictEqual(response.status, 202);
      assert.strictEqual(pending.length, 1);
      yield* Deferred.await(started);
      controller.abort();
      assert.strictEqual(controller.signal.aborted, true);
      yield* Deferred.succeed(release, null);
      yield* Deferred.await(completed);
      yield* Effect.promise(() => Promise.all(pending));
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
    const runtime = ManagedRuntime.make(
      ChannelLive.pipe(Layer.provide(dependencies))
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

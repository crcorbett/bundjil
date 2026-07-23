import {
  ChannelSendAccepted,
  ChannelTransport,
  ChannelWebhookAuthenticationError,
  ChannelWebhookResult,
  ChannelWebhookSchemaError,
} from "@bundjil/channel";
import { PersistenceMemory } from "@bundjil/store/memory";
import { assert, it } from "@effect/vitest";
import { Effect, Layer, ManagedRuntime, Schema } from "effect";
import type { RouteHandlerArgs, Session } from "eve/channels";

import { makeSendblueEveChannel } from "../agent/channels/sendblue.js";
import type { Channel } from "../agent/lib/channel/index.js";
import {
  ChannelIdentityMemory,
  ChannelLive,
  ChannelReplayMemory,
  ChannelRouter,
  ChannelRouterMemory,
  ChannelRoutingError,
} from "../agent/lib/channel/index.js";
import {
  ChannelIdentityRecords,
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
  return { accepted, identities, ignored, replay, send };
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
    } satisfies RouteHandlerArgs<ChannelMutableAdapterStateEncoded>;

    const acceptedRoute = routeFor(acceptedRuntime);
    assert.strictEqual(
      (yield* Effect.promise(() => acceptedRoute.handler(request(), args)))
        .status,
      202
    );
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

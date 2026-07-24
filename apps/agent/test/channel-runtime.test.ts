import {
  ChannelSendAccepted,
  ChannelTransport,
  ChannelWebhookResult,
} from "@bundjil/channel";
import { layerMemory as PhotonTransportMemory } from "@bundjil/photon/memory";
import { layerMemory as SendblueTransportMemory } from "@bundjil/sendblue/memory";
import { PersistenceMemory } from "@bundjil/store/memory";
import { assert, it } from "@effect/vitest";
import {
  Cause,
  Deferred,
  Effect,
  Exit,
  Layer,
  ManagedRuntime,
  Option,
  Ref,
  Schema,
} from "effect";

import {
  Channel,
  ChannelConfigError,
  ChannelIdentityMemory,
  ChannelLive,
  ChannelReplayMemory,
  ChannelRouterMemory,
} from "../agent/lib/channel/index.js";
import {
  ChannelIdentityRecords,
  ChannelReplayOptions,
} from "../agent/lib/channel/schemas.js";

const fixtures = Effect.gen(function* decodeChannelRuntimeFixtures() {
  const sendblueWebhook = yield* Schema.decodeEffect(ChannelWebhookResult)({
    _tag: "Accepted",
    message: {
      conversation: {
        conversationId: "sendblue-conversation",
        participantId: "+61400000001",
        provider: "sendblue",
        providerAgentId: "+61400000002",
      },
      messageId: "sendblue-inbound",
      text: "hello",
    },
  });
  const photonWebhook = yield* Schema.decodeEffect(ChannelWebhookResult)({
    _tag: "Accepted",
    message: {
      conversation: {
        conversationId: "photon-conversation",
        participantId: "photon-participant",
        provider: "photon",
      },
      messageId: "photon-inbound",
      text: "hello",
    },
  });
  const sendblueSend = yield* Schema.decodeEffect(ChannelSendAccepted)({
    messageId: "sendblue-outbound",
    provider: "sendblue",
  });
  const photonSend = yield* Schema.decodeEffect(ChannelSendAccepted)({
    messageId: "photon-outbound",
    provider: "photon",
  });
  const identities = yield* Schema.decodeEffect(ChannelIdentityRecords)([
    { participantId: "+61400000001", principalId: "sendblue-principal" },
    {
      participantId: "photon-participant",
      principalId: "photon-principal",
    },
  ]);
  const replay = yield* Schema.decodeEffect(ChannelReplayOptions)({
    leaseMilliseconds: 30_000,
    prefix: "channel:v1:runtime-test:",
    ttlMilliseconds: 86_400_000,
  });
  return {
    identities,
    photonSend,
    photonWebhook,
    replay,
    sendblueSend,
    sendblueWebhook,
  };
});

it.effect(
  "builds independent provider runtimes once and runs concurrent invocations",
  () =>
    Effect.gen(function* testProviderRuntimeBuildAndConcurrency() {
      const fixture = yield* fixtures;
      const sendblueBuilds = yield* Ref.make(0);
      const photonBuilds = yield* Ref.make(0);
      const sendblueDisposals = yield* Ref.make(0);
      const photonDisposals = yield* Ref.make(0);
      const sendblueChannel = ChannelLive.pipe(
        Layer.provide(
          Layer.mergeAll(
            SendblueTransportMemory({
              presence: "accepted",
              send: fixture.sendblueSend,
              webhook: fixture.sendblueWebhook,
            }),
            ChannelIdentityMemory(fixture.identities),
            ChannelRouterMemory,
            ChannelReplayMemory(fixture.replay).pipe(
              Layer.provide(PersistenceMemory)
            )
          )
        )
      );
      const photonChannel = ChannelLive.pipe(
        Layer.provide(
          Layer.mergeAll(
            PhotonTransportMemory({
              presence: "accepted",
              send: fixture.photonSend,
              webhook: fixture.photonWebhook,
            }),
            ChannelIdentityMemory(fixture.identities),
            ChannelRouterMemory,
            ChannelReplayMemory(fixture.replay).pipe(
              Layer.provide(PersistenceMemory)
            )
          )
        )
      );
      const sendblueRuntime = ManagedRuntime.make(
        Layer.merge(
          sendblueChannel,
          Layer.effectDiscard(
            Effect.acquireRelease(
              Ref.update(sendblueBuilds, (count) => count + 1),
              () => Ref.update(sendblueDisposals, (count) => count + 1)
            )
          )
        )
      );
      const photonRuntime = ManagedRuntime.make(
        Layer.merge(
          photonChannel,
          Layer.effectDiscard(
            Effect.acquireRelease(
              Ref.update(photonBuilds, (count) => count + 1),
              () => Ref.update(photonDisposals, (count) => count + 1)
            )
          )
        )
      );
      yield* Effect.addFinalizer(() =>
        Effect.all(
          [sendblueRuntime.disposeEffect, photonRuntime.disposeEffect],
          { discard: true }
        )
      );

      const firstStarted = yield* Deferred.make<null>();
      const secondStarted = yield* Deferred.make<null>();
      const release = yield* Deferred.make<null>();
      const first = sendblueRuntime.runPromise(
        Effect.gen(function* runFirstInvocation() {
          yield* Channel;
          yield* Deferred.succeed(firstStarted, null);
          yield* Deferred.await(release);
          return "first";
        })
      );
      const second = sendblueRuntime.runPromise(
        Effect.gen(function* runSecondInvocation() {
          yield* Channel;
          yield* Deferred.succeed(secondStarted, null);
          yield* Deferred.await(release);
          return "second";
        })
      );

      yield* Deferred.await(firstStarted);
      yield* Deferred.await(secondStarted);
      assert.strictEqual(yield* Ref.get(sendblueBuilds), 1);
      yield* Deferred.succeed(release, null);
      assert.deepStrictEqual(
        yield* Effect.promise(() => Promise.all([first, second])),
        ["first", "second"]
      );

      const sendblueProvider = yield* Effect.promise(() =>
        sendblueRuntime.runPromise(
          Effect.gen(function* runSendblueInvocation() {
            const channel = yield* Channel;
            const decoded = yield* channel.decodeWebhook(
              new Request("https://example.invalid/sendblue")
            );
            return decoded._tag === "Accepted"
              ? decoded.message.conversation.provider
              : "ignored";
          })
        )
      );
      const photonProvider = yield* Effect.promise(() =>
        photonRuntime.runPromise(
          Effect.gen(function* runPhotonInvocation() {
            const channel = yield* Channel;
            const decoded = yield* channel.decodeWebhook(
              new Request("https://example.invalid/photon")
            );
            return decoded._tag === "Accepted"
              ? decoded.message.conversation.provider
              : "ignored";
          })
        )
      );
      assert.strictEqual(sendblueProvider, "sendblue");
      assert.strictEqual(photonProvider, "photon");
      assert.strictEqual(yield* Ref.get(photonBuilds), 1);

      yield* Effect.promise(() => sendblueRuntime.runPromise(Channel));
      assert.strictEqual(yield* Ref.get(sendblueBuilds), 1);

      yield* sendblueRuntime.disposeEffect;
      yield* photonRuntime.disposeEffect;
      assert.strictEqual(yield* Ref.get(sendblueDisposals), 1);
      assert.strictEqual(yield* Ref.get(photonDisposals), 1);
    }).pipe(Effect.scoped)
);

it.effect(
  "isolates a cached provider build failure and recovers with a fresh runtime",
  () =>
    Effect.gen(function* testProviderRuntimeFailureAndRecovery() {
      const fixture = yield* fixtures;
      const failedBuilds = yield* Ref.make(0);
      const sendblueBuilds = yield* Ref.make(0);
      const recoveryBuilds = yield* Ref.make(0);
      const failingPhotonTransport = Layer.effect(
        ChannelTransport,
        Ref.update(failedBuilds, (count) => count + 1).pipe(
          Effect.andThen(
            Effect.fail(new ChannelConfigError({ reason: "invalid" }))
          )
        )
      );
      const failedDependencies = Layer.mergeAll(
        ChannelIdentityMemory(fixture.identities),
        ChannelRouterMemory,
        ChannelReplayMemory(fixture.replay).pipe(
          Layer.provide(PersistenceMemory)
        )
      );
      const failedRuntime = ManagedRuntime.make(
        ChannelLive.pipe(
          Layer.provide(Layer.merge(failingPhotonTransport, failedDependencies))
        )
      );
      const sendblueDependencies = Layer.mergeAll(
        ChannelIdentityMemory(fixture.identities),
        ChannelRouterMemory,
        ChannelReplayMemory(fixture.replay).pipe(
          Layer.provide(PersistenceMemory)
        )
      );
      const sendblueRuntime = ManagedRuntime.make(
        Layer.merge(
          ChannelLive.pipe(
            Layer.provide(
              Layer.merge(
                SendblueTransportMemory({
                  presence: "accepted",
                  send: fixture.sendblueSend,
                  webhook: fixture.sendblueWebhook,
                }),
                sendblueDependencies
              )
            )
          ),
          Layer.effectDiscard(Ref.update(sendblueBuilds, (count) => count + 1))
        )
      );
      yield* Effect.addFinalizer(() =>
        Effect.all(
          [failedRuntime.disposeEffect, sendblueRuntime.disposeEffect],
          { discard: true }
        )
      );

      const firstFailure = yield* Effect.promise(() =>
        failedRuntime.runPromiseExit(Effect.void)
      );
      const unaffectedProvider = yield* Effect.promise(() =>
        sendblueRuntime.runPromise(
          Effect.gen(function* runUnaffectedProvider() {
            const channel = yield* Channel;
            const decoded = yield* channel.decodeWebhook(
              new Request("https://example.invalid/sendblue")
            );
            return decoded._tag === "Accepted"
              ? decoded.message.conversation.provider
              : "ignored";
          })
        )
      );
      const retainedFailure = yield* Effect.promise(() =>
        failedRuntime.runPromiseExit(Effect.void)
      );

      assert.strictEqual(unaffectedProvider, "sendblue");
      assert.strictEqual(yield* Ref.get(sendblueBuilds), 1);
      assert.strictEqual(yield* Ref.get(failedBuilds), 1);
      assert.strictEqual(Exit.isFailure(firstFailure), true);
      assert.strictEqual(Exit.isFailure(retainedFailure), true);
      if (!Exit.isFailure(firstFailure) || !Exit.isFailure(retainedFailure)) {
        return yield* Effect.die("typed runtime build failures required");
      }
      const firstError = Cause.findErrorOption(firstFailure.cause);
      const retainedError = Cause.findErrorOption(retainedFailure.cause);
      assert.strictEqual(Option.isSome(firstError), true);
      assert.strictEqual(Option.isSome(retainedError), true);
      if (Option.isNone(firstError) || Option.isNone(retainedError)) {
        return yield* Effect.die("typed runtime build errors required");
      }
      assert.strictEqual(Schema.is(ChannelConfigError)(firstError.value), true);
      assert.strictEqual(
        Schema.is(ChannelConfigError)(retainedError.value),
        true
      );

      const recoveryDependencies = Layer.mergeAll(
        ChannelIdentityMemory(fixture.identities),
        ChannelRouterMemory,
        ChannelReplayMemory(fixture.replay).pipe(
          Layer.provide(PersistenceMemory)
        )
      );
      const repairedRuntime = ManagedRuntime.make(
        Layer.merge(
          ChannelLive.pipe(
            Layer.provide(
              Layer.merge(
                PhotonTransportMemory({
                  presence: "accepted",
                  send: fixture.photonSend,
                  webhook: fixture.photonWebhook,
                }),
                recoveryDependencies
              )
            )
          ),
          Layer.effectDiscard(Ref.update(recoveryBuilds, (count) => count + 1))
        )
      );
      yield* Effect.addFinalizer(() => repairedRuntime.disposeEffect);
      const recoveredProvider = yield* Effect.promise(() =>
        repairedRuntime.runPromise(
          Effect.gen(function* runRecoveredProvider() {
            const channel = yield* Channel;
            const decoded = yield* channel.decodeWebhook(
              new Request("https://example.invalid/photon")
            );
            return decoded._tag === "Accepted"
              ? decoded.message.conversation.provider
              : "ignored";
          })
        )
      );

      assert.strictEqual(recoveredProvider, "photon");
      assert.strictEqual(yield* Ref.get(recoveryBuilds), 1);
      assert.strictEqual(yield* Ref.get(failedBuilds), 1);
      return yield* Effect.void;
    }).pipe(Effect.scoped)
);

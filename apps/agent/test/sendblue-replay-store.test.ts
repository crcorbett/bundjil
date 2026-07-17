import { PersistenceMemory } from "@bundjil/effect-persistence/memory";
import { assert, it } from "@effect/vitest";
import { Clock, Effect, Layer, Match, Redacted, Ref, Schema } from "effect";
import { TestClock } from "effect/testing";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import { SendblueConfigService } from "../agent/lib/sendblue/config.js";
import { SendblueReplayStoreError } from "../agent/lib/sendblue/errors.js";
import { SendblueReplayClaimIdGenerator } from "../agent/lib/sendblue/replay-claim-id-generator.service.js";
import {
  makeSendblueReplayStore,
  SendblueReplayStore,
  SendblueReplayStoreLive,
  SendblueReplayStoreMemory,
} from "../agent/lib/sendblue/replay-store.service.js";
import {
  SendblueConfig,
  SendblueInboundClaimKey,
  SendblueMessageHandle,
  SendblueOutboundEventCoordinates,
  SendblueReplayClaimId,
  SendblueReplayRecord,
  SendblueSenderIdentities,
} from "../agent/lib/sendblue/schemas.js";
import type { SendblueReplayClaimResult } from "../agent/lib/sendblue/schemas.js";
import { keyedSendblueDigest } from "../agent/lib/sendblue/session-router.service.js";

const replayOptions = {
  leaseSeconds: 60,
  prefix: "sendblue:test:",
  routingKey: Redacted.make("test-routing-key"),
  ttlSeconds: 86_400,
};
const configLayer = Layer.succeed(
  SendblueConfigService,
  Schema.decodeUnknownSync(SendblueConfig)({
    allowedServices: ["iMessage"],
    apiBaseUrl: new URL("https://api.sendblue.test"),
    apiKey: Redacted.make("test-api-key"),
    apiSecret: Redacted.make("test-api-secret"),
    fromNumber: "+14155550177",
    replayStore: {
      leaseSeconds: replayOptions.leaseSeconds,
      prefix: replayOptions.prefix,
      token: Redacted.make("test-replay-token"),
      ttlSeconds: replayOptions.ttlSeconds,
      url: Redacted.make("https://example.test/redis"),
    },
    routingKey: replayOptions.routingKey,
    senderIdentities: Schema.decodeUnknownSync(SendblueSenderIdentities)({
      "+14155550100": "owner",
    }),
    webhookSecret: Redacted.make("test-webhook-secret"),
  })
);
const messageHandle = Schema.decodeUnknownSync(SendblueMessageHandle)(
  "message-handle-private"
);
const coordinates = Schema.decodeUnknownSync(SendblueOutboundEventCoordinates)({
  sequence: 1,
  sessionId: "session-private",
  stepIndex: 0,
  turnId: "turn-private",
});
const replayRecordJson = Schema.fromJsonString(
  Schema.toCodecJson(SendblueReplayRecord)
);

const SendblueReplayClaimIdGeneratorTest = Layer.effect(
  SendblueReplayClaimIdGenerator,
  Effect.gen(function* makeTestClaimIdGenerator() {
    const next = yield* Ref.make(0);
    return SendblueReplayClaimIdGenerator.of({
      next: Ref.updateAndGet(next, (value) => value + 1).pipe(
        Effect.flatMap((value) =>
          Schema.decodeUnknownEffect(SendblueReplayClaimId)(
            `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`
          )
        ),
        Effect.mapError(
          () =>
            new SendblueReplayStoreError({
              message: "Unable to create test replay claim.",
            })
        )
      ),
    });
  })
);

const replayMemoryLayer = Layer.mergeAll(
  PersistenceMemory,
  SendblueReplayClaimIdGeneratorTest
);

const claimedReplay = (result: SendblueReplayClaimResult) =>
  Match.value(result).pipe(
    Match.when({ status: "claimed" }, ({ claim }) => Effect.succeed(claim)),
    Match.orElse(() => Effect.die("Expected Sendblue replay claim."))
  );

it.effect("uses one shared coherent memory persistence layer", () =>
  Effect.gen(function* testSharedMemoryLayer() {
    const store = yield* makeSendblueReplayStore(replayOptions);
    const native = yield* KeyValueStore.KeyValueStore;
    const claimed = yield* store.claimInbound(messageHandle);
    const claim = yield* claimedReplay(claimed);
    const digest = yield* keyedSendblueDigest(replayOptions.routingKey, [
      "replay",
      "inbound",
      messageHandle,
    ]);
    const logicalKey = `inbound:${digest}`;
    const physicalKey = `${replayOptions.prefix}${logicalKey}`;
    const encoded = yield* native.get(logicalKey);

    assert.strictEqual(claim.key, physicalKey);
    assert.strictEqual(physicalKey, `sendblue:test:inbound:${digest}`);
    assert.strictEqual(
      encoded,
      Schema.encodeSync(replayRecordJson)({
        claimedAtEpochMillis: claim.claimedAtEpochMillis,
        claimId: claim.claimId,
        key: claim.key,
        status: "claimed",
      })
    );
    const completedAtEpochMillis = yield* Clock.currentTimeMillis;
    yield* store.complete(claim);
    assert.strictEqual(
      yield* native.get(logicalKey),
      Schema.encodeSync(replayRecordJson)({
        claimedAtEpochMillis: claim.claimedAtEpochMillis,
        claimId: claim.claimId,
        completedAtEpochMillis,
        key: claim.key,
        providerMessageHandle: undefined,
        status: "complete",
      })
    );
  }).pipe(Effect.provide(replayMemoryLayer))
);

it.effect(
  "atomically admits one concurrent inbound and outbound claim per coordinate",
  () =>
    Effect.gen(function* testConcurrentMemoryClaims() {
      const store = yield* makeSendblueReplayStore(replayOptions);
      const claims = yield* Effect.all(
        Array.from({ length: 12 }, () => store.claimInbound(messageHandle)),
        { concurrency: "unbounded" }
      );
      const admitted = claims.filter((claim) => claim.status === "claimed");
      const outboundClaims = yield* Effect.all(
        Array.from({ length: 12 }, () => store.claimOutbound(coordinates)),
        { concurrency: "unbounded" }
      );
      const outboundAdmitted = outboundClaims.filter(
        (claim) => claim.status === "claimed"
      );
      const independentInbound = yield* store.claimInbound(
        Schema.decodeUnknownSync(SendblueMessageHandle)("message-handle-other")
      );
      const independentOutbound = yield* store.claimOutbound({
        ...coordinates,
        sequence: 2,
      });

      assert.strictEqual(admitted.length, 1);
      assert.strictEqual(outboundAdmitted.length, 1);
      assert.strictEqual(independentInbound.status, "claimed");
      assert.strictEqual(independentOutbound.status, "claimed");
    }).pipe(Effect.provide(replayMemoryLayer))
);

it.effect(
  "keeps lease and retention expiry with duplicate, retryable, and uncertain policy",
  () =>
    Effect.gen(function* testMemoryTransitions() {
      const store = yield* makeSendblueReplayStore(replayOptions);
      const initial = yield* store.claimInbound(messageHandle);
      const initialClaim = yield* claimedReplay(initial);

      yield* store.retryable(initialClaim);
      const stale = yield* store.complete(initialClaim).pipe(Effect.flip);
      assert.strictEqual(stale._tag, "SendblueReplayStoreError");
      const retried = yield* store.claimInbound(messageHandle);
      const retriedClaim = yield* claimedReplay(retried);
      yield* store.uncertain(retriedClaim);
      assert.strictEqual(
        (yield* store.claimInbound(messageHandle)).status,
        "duplicate"
      );
      yield* TestClock.adjust("86401 seconds");
      assert.strictEqual(
        (yield* store.claimInbound(messageHandle)).status,
        "claimed"
      );

      const leaseHandle = Schema.decodeUnknownSync(SendblueMessageHandle)(
        "message-handle-lease"
      );
      const leased = yield* store.claimInbound(leaseHandle);
      assert.strictEqual(leased.status, "claimed");
      yield* TestClock.adjust("61 seconds");
      assert.strictEqual(
        (yield* store.claimInbound(leaseHandle)).status,
        "claimed"
      );

      const completedHandle = Schema.decodeUnknownSync(SendblueMessageHandle)(
        "message-handle-complete"
      );
      const completed = yield* store.claimInbound(completedHandle);
      const completedClaim = yield* claimedReplay(completed);
      yield* store.complete(completedClaim);
      assert.strictEqual(
        (yield* store.claimInbound(completedHandle)).status,
        "duplicate"
      );
    }).pipe(Effect.provide(replayMemoryLayer))
);

it.effect("fences a stale owner after a retryable replay removal", () =>
  Effect.gen(function* testStaleOwnerFencing() {
    const store = yield* makeSendblueReplayStore(replayOptions);
    const initial = yield* store.claimOutbound(coordinates);
    const initialClaim = yield* claimedReplay(initial);
    yield* store.retryable(initialClaim);
    const replacement = yield* store.claimOutbound(coordinates);
    const stale = yield* store.uncertain(initialClaim).pipe(Effect.flip);

    assert.strictEqual(replacement.status, "claimed");
    assert.strictEqual(stale._tag, "SendblueReplayStoreError");
  }).pipe(Effect.provide(replayMemoryLayer))
);

it.effect("rejects a replay claim outside the configured prefix", () =>
  Effect.gen(function* testReplayClaimPrefix() {
    const store = yield* makeSendblueReplayStore(replayOptions);
    const claimed = yield* store.claimInbound(messageHandle);
    const claim = yield* claimedReplay(claimed);
    const invalidKey = yield* Schema.decodeUnknownEffect(
      SendblueInboundClaimKey
    )("outside:replay-claim");
    const error = yield* store
      .complete({ ...claim, key: invalidKey })
      .pipe(Effect.flip);

    assert.strictEqual(error._tag, "SendblueReplayStoreError");
  }).pipe(Effect.provide(replayMemoryLayer))
);

it.effect(
  "constructs the app replay layer only when atomic persistence is provided",
  () =>
    Effect.all([
      SendblueReplayStore.pipe(
        Effect.provide(
          SendblueReplayStoreMemory.pipe(Layer.provide(configLayer))
        )
      ),
      SendblueReplayStore.pipe(
        Effect.provide(
          SendblueReplayStoreLive.pipe(
            Layer.provide(replayMemoryLayer),
            Layer.provide(configLayer)
          )
        )
      ),
    ])
);

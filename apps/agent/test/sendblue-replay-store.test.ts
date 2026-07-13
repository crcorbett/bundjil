import { assert, it } from "@effect/vitest";
import { Effect, Layer, Match, Redacted, Ref, Schema } from "effect";
import { TestClock } from "effect/testing";

import { SendblueConfigService } from "../agent/lib/sendblue/config.js";
import { SendblueReplayStoreError } from "../agent/lib/sendblue/errors.js";
import { SendblueReplayClaimIdGenerator } from "../agent/lib/sendblue/replay-claim-id-generator.service.js";
import {
  makeSendblueReplayStoreMemory,
  makeSendblueReplayStoreUpstash,
  SendblueReplayStore,
  SendblueReplayStoreMemory,
  SendblueReplayStoreUpstashLive,
} from "../agent/lib/sendblue/replay-store.service.js";
import type { UpstashReplayClient } from "../agent/lib/sendblue/replay-store.service.js";
import {
  SendblueMessageHandle,
  SendblueConfig,
  SendblueOutboundEventCoordinates,
  SendblueReplayClaimId,
  SendblueSenderIdentities,
} from "../agent/lib/sendblue/schemas.js";
import type { SendblueReplayClaimResult } from "../agent/lib/sendblue/schemas.js";

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
    fromNumber: "+13472760577",
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

const claimedReplay = (result: SendblueReplayClaimResult) =>
  Match.value(result).pipe(
    Match.when({ status: "claimed" }, ({ claim }) => Effect.succeed(claim)),
    Match.orElse(() => Effect.die("Expected Sendblue replay claim."))
  );

it.effect(
  "atomically admits one concurrent inbound and outbound claim per coordinate",
  () =>
    Effect.gen(function* testConcurrentMemoryClaims() {
      const store = yield* makeSendblueReplayStoreMemory(replayOptions);
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
    }).pipe(Effect.provide(SendblueReplayClaimIdGeneratorTest))
);

it.effect(
  "constructs config-backed memory and Upstash live replay layers",
  () =>
    Effect.all([
      SendblueReplayStore.pipe(
        Effect.provide(
          SendblueReplayStoreMemory.pipe(Layer.provide(configLayer))
        )
      ),
      SendblueReplayStore.pipe(
        Effect.provide(
          SendblueReplayStoreUpstashLive.pipe(Layer.provide(configLayer))
        )
      ),
    ])
);

it.effect(
  "models lease expiry and replay completion, retryable, and uncertain transitions",
  () =>
    Effect.gen(function* testMemoryTransitions() {
      const store = yield* makeSendblueReplayStoreMemory(replayOptions);
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

      const otherHandle = Schema.decodeUnknownSync(SendblueMessageHandle)(
        "message-handle-lease"
      );
      const leased = yield* store.claimInbound(otherHandle);
      assert.strictEqual(leased.status, "claimed");
      yield* TestClock.adjust("61 seconds");
      assert.strictEqual(
        (yield* store.claimInbound(otherHandle)).status,
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
    }).pipe(Effect.provide(SendblueReplayClaimIdGeneratorTest))
);

it.effect("uses one opaque Upstash SET NX EX claim command", () =>
  Effect.gen(function* testUpstashClaimShape() {
    const commands: (readonly [string, string, { ex: number; nx: true }])[] =
      [];
    const client: UpstashReplayClient = {
      eval: async () => 0,
      set: async (key, value, options) => {
        commands.push([key, value, options]);
        return "OK";
      },
    };
    const store = yield* makeSendblueReplayStoreUpstash(replayOptions, client);
    const result = yield* store.claimInbound(messageHandle);
    const replayClaim = yield* claimedReplay(result);
    const stale = yield* store.complete(replayClaim).pipe(Effect.flip);
    const [command] = commands;

    assert.strictEqual(result.status, "claimed");
    assert.strictEqual(stale._tag, "SendblueReplayStoreError");
    assert.strictEqual(commands.length, 1);
    assert.strictEqual(command?.[2].nx, true);
    assert.strictEqual(command?.[2].ex, replayOptions.leaseSeconds);
    assert.notInclude(command?.[0] ?? "", messageHandle);
    assert.notInclude(command?.[1] ?? "", messageHandle);
    assert.notInclude(
      command?.[1] ?? "",
      Redacted.value(replayOptions.routingKey)
    );
  }).pipe(Effect.provide(SendblueReplayClaimIdGeneratorTest))
);

it.effect(
  "fences Upstash complete, uncertain, and retryable replay transitions",
  () =>
    Effect.gen(function* testStatefulUpstashTransitions() {
      const records: {
        key: string;
        ttlSeconds: number;
        value: string;
      }[] = [];
      const setCommands: (readonly [
        string,
        string,
        { ex: number; nx: true },
      ])[] = [];
      const evalCommands: (readonly [
        string,
        readonly string[],
        readonly string[],
        number,
      ])[] = [];
      const client: UpstashReplayClient = {
        eval: async (script, keys, args) => {
          const key = keys[0] ?? "";
          const position = records.findIndex((record) => record.key === key);
          const record = records[position];
          let result = 0;
          if (record !== undefined && record.value === (args[0] ?? "")) {
            if (args.length === 1) {
              records.splice(position, 1);
            } else {
              records[position] = {
                key,
                ttlSeconds: Number(args[2] ?? "0"),
                value: args[1] ?? "",
              };
            }
            result = 1;
          }
          evalCommands.push([script, keys, args, result]);
          return result;
        },
        set: async (key, value, options) => {
          setCommands.push([key, value, options]);
          if (records.some((record) => record.key === key)) {
            return null;
          }
          records.push({ key, ttlSeconds: options.ex, value });
          return "OK";
        },
      };
      const store = yield* makeSendblueReplayStoreUpstash(
        replayOptions,
        client
      );

      const completed = yield* store.claimInbound(messageHandle);
      const completedClaim = yield* claimedReplay(completed);
      yield* store.complete(completedClaim);
      assert.strictEqual(
        (yield* store.claimInbound(messageHandle)).status,
        "duplicate"
      );

      const uncertainHandle = Schema.decodeUnknownSync(SendblueMessageHandle)(
        "message-handle-uncertain"
      );
      const uncertain = yield* store.claimInbound(uncertainHandle);
      yield* store.uncertain(yield* claimedReplay(uncertain));
      assert.strictEqual(
        (yield* store.claimInbound(uncertainHandle)).status,
        "duplicate"
      );

      const retryableHandle = Schema.decodeUnknownSync(SendblueMessageHandle)(
        "message-handle-retryable"
      );
      const retryable = yield* store.claimInbound(retryableHandle);
      const retryableClaim = yield* claimedReplay(retryable);
      yield* store.retryable(retryableClaim);
      const reclaimed = yield* store.claimInbound(retryableHandle);
      const stale = yield* store.complete(retryableClaim).pipe(Effect.flip);

      assert.strictEqual(reclaimed.status, "claimed");
      assert.strictEqual(stale._tag, "SendblueReplayStoreError");
      assert.strictEqual(setCommands.length, 6);
      assert.strictEqual(
        setCommands.every(
          (command) =>
            command[2].nx && command[2].ex === replayOptions.leaseSeconds
        ),
        true
      );
      assert.strictEqual(evalCommands[0]?.[2].length, 3);
      assert.strictEqual(evalCommands[1]?.[2].length, 3);
      assert.strictEqual(evalCommands[2]?.[2].length, 1);
      assert.strictEqual(evalCommands[3]?.[3], 0);
      assert.strictEqual(
        evalCommands.some((command) => command[0].includes("del")),
        true
      );
      assert.strictEqual(
        evalCommands
          .filter((command) => command[2].length === 3)
          .every(
            (command) => command[2][2] === String(replayOptions.ttlSeconds)
          ),
        true
      );
    }).pipe(Effect.provide(SendblueReplayClaimIdGeneratorTest))
);

it.effect(
  "sanitizes Upstash failures without Redis values or replay inputs",
  () =>
    Effect.gen(function* testUpstashFailureSanitization() {
      const store = yield* makeSendblueReplayStoreUpstash(replayOptions, {
        eval: async () => 1,
        set: async () => {
          throw new Error("redis-body message-handle-private test-routing-key");
        },
      });
      const error = yield* store.claimInbound(messageHandle).pipe(Effect.flip);

      assert.strictEqual(error._tag, "SendblueReplayStoreError");
      assert.notInclude(String(error), messageHandle);
      assert.notInclude(
        String(error),
        Redacted.value(replayOptions.routingKey)
      );
      assert.notInclude(String(error), "redis-body");
    }).pipe(Effect.provide(SendblueReplayClaimIdGeneratorTest))
);

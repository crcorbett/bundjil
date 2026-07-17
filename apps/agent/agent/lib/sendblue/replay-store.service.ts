import {
  AtomicKeyValueStore,
  AtomicKeyValueStoreKey,
} from "@bundjil/effect-persistence";
import { PersistenceMemory } from "@bundjil/effect-persistence/memory";
import type { Redacted } from "effect";
import { Clock, Context, Duration, Effect, Layer, Match, Schema } from "effect";

import { SendblueConfigService } from "./config.js";
import { SendblueReplayStoreError } from "./errors.js";
import {
  SendblueReplayClaimIdGenerator,
  SendblueReplayClaimIdGeneratorLive,
} from "./replay-claim-id-generator.service.js";
import {
  SendblueInboundClaimKey,
  SendblueOutboundClaimKey,
  SendblueReplayRecord,
} from "./schemas.js";
import type {
  SendblueMessageHandle,
  SendblueOutboundEventCoordinates,
  SendblueReplayClaim,
  SendblueReplayClaimKey,
  SendblueReplayClaimResult,
  SendblueReplayCompletion,
  SendblueReplayRecord as SendblueReplayRecordType,
} from "./schemas.js";
import { keyedSendblueDigest } from "./session-router.service.js";

export interface SendblueReplayStoreShape {
  readonly claimInbound: (
    messageHandle: SendblueMessageHandle
  ) => Effect.Effect<SendblueReplayClaimResult, SendblueReplayStoreError>;
  readonly claimOutbound: (
    coordinates: SendblueOutboundEventCoordinates
  ) => Effect.Effect<SendblueReplayClaimResult, SendblueReplayStoreError>;
  readonly complete: (
    claim: SendblueReplayClaim,
    completion?: SendblueReplayCompletion
  ) => Effect.Effect<void, SendblueReplayStoreError>;
  readonly retryable: (
    claim: SendblueReplayClaim
  ) => Effect.Effect<void, SendblueReplayStoreError>;
  readonly uncertain: (
    claim: SendblueReplayClaim
  ) => Effect.Effect<void, SendblueReplayStoreError>;
}

export class SendblueReplayStore extends Context.Service<
  SendblueReplayStore,
  SendblueReplayStoreShape
>()("@bundjil/agent/SendblueReplayStore") {}

export type SendblueReplayStoreOptions = Readonly<{
  leaseSeconds: number;
  prefix: string;
  routingKey: Redacted.Redacted;
  ttlSeconds: number;
}>;

const replayRecordJson = Schema.fromJsonString(
  Schema.toCodecJson(SendblueReplayRecord)
);

const makeReplayClaim = Effect.fn("SendblueReplayStore.makeReplayClaim")(
  function* (
    claimIdGenerator: SendblueReplayClaimIdGenerator["Service"],
    key: SendblueReplayClaimKey
  ) {
    const claimedAtEpochMillis = yield* Clock.currentTimeMillis;
    const claimId = yield* claimIdGenerator.next;
    return { claimedAtEpochMillis, claimId, key, status: "claimed" as const };
  }
);

const encodeReplayRecord = (record: SendblueReplayRecordType) =>
  Schema.encodeEffect(replayRecordJson)(record).pipe(
    Effect.mapError(
      () =>
        new SendblueReplayStoreError({
          message: "Unable to encode the Sendblue replay record.",
        })
    )
  );

const claimRecord = (claim: SendblueReplayClaim): SendblueReplayRecordType => ({
  claimedAtEpochMillis: claim.claimedAtEpochMillis,
  claimId: claim.claimId,
  key: claim.key,
  status: "claimed",
});

const terminalRecord = (
  claim: SendblueReplayClaim,
  status: "complete" | "uncertain",
  completedAtEpochMillis: number,
  completion?: SendblueReplayCompletion
): SendblueReplayRecordType => ({
  claimedAtEpochMillis: claim.claimedAtEpochMillis,
  claimId: claim.claimId,
  completedAtEpochMillis,
  key: claim.key,
  providerMessageHandle: completion?.providerMessageHandle,
  status,
});

const deriveReplayKeys = (
  options: SendblueReplayStoreOptions,
  kind: "inbound" | "outbound",
  coordinates: readonly string[]
) =>
  keyedSendblueDigest(options.routingKey, [
    "replay",
    kind,
    ...coordinates,
  ]).pipe(
    Effect.flatMap((digest) => {
      const logicalKey = `${kind}:${digest}`;
      return Effect.all({
        key: Schema.decodeUnknownEffect(
          kind === "inbound"
            ? SendblueInboundClaimKey
            : SendblueOutboundClaimKey
        )(`${options.prefix}${logicalKey}`),
        logicalKey: Schema.decodeUnknownEffect(AtomicKeyValueStoreKey)(
          logicalKey
        ),
      });
    }),
    Effect.mapError(
      () =>
        new SendblueReplayStoreError({
          message: "Unable to derive the Sendblue replay key.",
        })
    )
  );

const logicalReplayKey = (
  options: SendblueReplayStoreOptions,
  key: SendblueReplayClaimKey
) =>
  Match.value(key.startsWith(options.prefix)).pipe(
    Match.when(true, () =>
      Schema.decodeUnknownEffect(AtomicKeyValueStoreKey)(
        key.slice(options.prefix.length)
      )
    ),
    Match.when(false, () =>
      Effect.fail(
        new SendblueReplayStoreError({
          message: "The Sendblue replay claim key is invalid.",
        })
      )
    ),
    Match.exhaustive,
    Effect.mapError(
      () =>
        new SendblueReplayStoreError({
          message: "The Sendblue replay claim key is invalid.",
        })
    )
  );

export const makeSendblueReplayStore = Effect.fn("SendblueReplayStore.make")(
  function* (options: SendblueReplayStoreOptions) {
    const atomic = yield* AtomicKeyValueStore;
    const claimIdGenerator = yield* SendblueReplayClaimIdGenerator;
    const claim = Effect.fn("SendblueReplayStore.claim")(function* (
      key: SendblueReplayClaimKey,
      logicalKey: typeof AtomicKeyValueStoreKey.Type
    ) {
      const replayClaim = yield* makeReplayClaim(claimIdGenerator, key);
      const encodedClaim = yield* encodeReplayRecord(claimRecord(replayClaim));
      const outcome = yield* atomic
        .transact({
          conditions: [{ _tag: "Absent", key: logicalKey }],
          mutations: [
            {
              _tag: "Set",
              key: logicalKey,
              ttl: Duration.millis(options.leaseSeconds * 1000),
              value: encodedClaim,
            },
          ],
        })
        .pipe(
          Effect.mapError(
            () =>
              new SendblueReplayStoreError({
                message: "Unable to claim the Sendblue replay record.",
              })
          )
        );
      return yield* Match.value(outcome).pipe(
        Match.when("applied", () =>
          Effect.succeed({
            claim: replayClaim,
            status: "claimed" as const,
          })
        ),
        Match.when("conflict", () =>
          Effect.succeed({ status: "duplicate" as const })
        ),
        Match.exhaustive
      );
    });
    const retain = Effect.fn("SendblueReplayStore.retain")(function* (
      replayClaim: SendblueReplayClaim,
      logicalKey: typeof AtomicKeyValueStoreKey.Type,
      status: "complete" | "uncertain",
      expected: string,
      completion?: SendblueReplayCompletion
    ) {
      const completedAtEpochMillis = yield* Clock.currentTimeMillis;
      const value = yield* encodeReplayRecord(
        terminalRecord(replayClaim, status, completedAtEpochMillis, completion)
      );
      return yield* atomic.transact({
        conditions: [{ _tag: "Equals", key: logicalKey, value: expected }],
        mutations: [
          {
            _tag: "Set",
            key: logicalKey,
            ttl: Duration.millis(options.ttlSeconds * 1000),
            value,
          },
        ],
      });
    });
    const transition = Effect.fn("SendblueReplayStore.transition")(function* (
      replayClaim: SendblueReplayClaim,
      status: "complete" | "retryable" | "uncertain",
      completion?: SendblueReplayCompletion
    ) {
      const logicalKey = yield* logicalReplayKey(options, replayClaim.key);
      const expected = yield* encodeReplayRecord(claimRecord(replayClaim));
      const outcome = yield* Match.value(status).pipe(
        Match.when("retryable", () =>
          atomic.transact({
            conditions: [{ _tag: "Equals", key: logicalKey, value: expected }],
            mutations: [{ _tag: "Remove", key: logicalKey }],
          })
        ),
        Match.when("complete", () =>
          retain(replayClaim, logicalKey, "complete", expected, completion)
        ),
        Match.when("uncertain", () =>
          retain(replayClaim, logicalKey, "uncertain", expected, completion)
        ),
        Match.exhaustive,
        Effect.mapError(
          () =>
            new SendblueReplayStoreError({
              message: "Unable to transition the Sendblue replay record.",
            })
        )
      );
      return yield* Match.value(outcome).pipe(
        Match.when("applied", () => Effect.void),
        Match.when("conflict", () =>
          Effect.fail(
            new SendblueReplayStoreError({
              message: "The Sendblue replay claim is no longer active.",
            })
          )
        ),
        Match.exhaustive
      );
    });
    return SendblueReplayStore.of({
      claimInbound: (messageHandle) =>
        deriveReplayKeys(options, "inbound", [messageHandle]).pipe(
          Effect.flatMap(({ key, logicalKey }) => claim(key, logicalKey))
        ),
      claimOutbound: (coordinates) =>
        deriveReplayKeys(options, "outbound", [
          coordinates.sessionId,
          coordinates.turnId,
          String(coordinates.stepIndex),
          String(coordinates.sequence),
        ]).pipe(
          Effect.flatMap(({ key, logicalKey }) => claim(key, logicalKey))
        ),
      complete: (replayClaim, completion) =>
        transition(replayClaim, "complete", completion),
      retryable: (replayClaim) => transition(replayClaim, "retryable"),
      uncertain: (replayClaim) => transition(replayClaim, "uncertain"),
    });
  }
);

export const SendblueReplayStoreLive = Layer.effect(
  SendblueReplayStore,
  Effect.gen(function* makeSendblueReplayStoreLive() {
    const config = yield* SendblueConfigService;
    return yield* makeSendblueReplayStore({
      leaseSeconds: config.replayStore.leaseSeconds,
      prefix: config.replayStore.prefix,
      routingKey: config.routingKey,
      ttlSeconds: config.replayStore.ttlSeconds,
    });
  })
).pipe(Layer.provide(SendblueReplayClaimIdGeneratorLive));

export const SendblueReplayStoreMemory = SendblueReplayStoreLive.pipe(
  Layer.provide(PersistenceMemory)
);

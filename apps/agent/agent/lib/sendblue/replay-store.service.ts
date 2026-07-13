import { Redis } from "@upstash/redis";
import {
  Clock,
  Context,
  Effect,
  HashMap,
  Layer,
  Option,
  Redacted,
  Schema,
  SynchronizedRef,
} from "effect";

import { SendblueConfigService } from "./config.js";
import { SendblueReplayStoreError } from "./errors.js";
import {
  SendblueReplayClaimIdGenerator,
  SendblueReplayClaimIdGeneratorLive,
} from "./replay-claim-id-generator.service.js";
import type { SendblueReplayClaimIdGeneratorShape } from "./replay-claim-id-generator.service.js";
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

export type UpstashReplaySetOptions = Readonly<{ ex: number; nx: true }>;

export interface UpstashReplayClient {
  readonly eval: (
    script: string,
    keys: string[],
    args: string[]
  ) => Promise<unknown>;
  readonly set: (
    key: string,
    value: string,
    options: UpstashReplaySetOptions
  ) => Promise<unknown>;
}

const replayRecordJson = Schema.fromJsonString(
  Schema.toCodecJson(SendblueReplayRecord)
);
const claimSetResponse = Schema.NullOr(Schema.Literal("OK"));
const transitionResponse = Schema.Literals([0, 1]);

const compareAndSetScript =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('set', KEYS[1], ARGV[2], 'EX', ARGV[3]) and 1 else return 0 end";
const compareAndDeleteScript =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

const makeReplayClaim = Effect.fn("SendblueReplayStore.makeReplayClaim")(
  function* (
    claimIdGenerator: SendblueReplayClaimIdGeneratorShape,
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

const transitionRecord = (
  claim: SendblueReplayClaim,
  status: "complete" | "retryable" | "uncertain",
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

const deriveReplayKey = (
  options: SendblueReplayStoreOptions,
  kind: "inbound" | "outbound",
  coordinates: readonly string[]
) =>
  keyedSendblueDigest(options.routingKey, [
    "replay",
    kind,
    ...coordinates,
  ]).pipe(
    Effect.flatMap((digest) =>
      Schema.decodeUnknownEffect(
        kind === "inbound" ? SendblueInboundClaimKey : SendblueOutboundClaimKey
      )(`${options.prefix}${kind}:${digest}`)
    ),
    Effect.mapError(
      () =>
        new SendblueReplayStoreError({
          message: "Unable to derive the Sendblue replay key.",
        })
    )
  );

const inboundClaimKey = (
  options: SendblueReplayStoreOptions,
  messageHandle: SendblueMessageHandle
) => deriveReplayKey(options, "inbound", [messageHandle]);

const outboundClaimKey = (
  options: SendblueReplayStoreOptions,
  coordinates: SendblueOutboundEventCoordinates
) =>
  deriveReplayKey(options, "outbound", [
    coordinates.sessionId,
    coordinates.turnId,
    String(coordinates.stepIndex),
    String(coordinates.sequence),
  ]);

const makeClaimOperations = (
  options: SendblueReplayStoreOptions,
  claim: (
    key: SendblueReplayClaimKey
  ) => Effect.Effect<SendblueReplayClaimResult, SendblueReplayStoreError>,
  transition: (
    claim: SendblueReplayClaim,
    status: "complete" | "retryable" | "uncertain",
    completion?: SendblueReplayCompletion
  ) => Effect.Effect<void, SendblueReplayStoreError>
) =>
  SendblueReplayStore.of({
    claimInbound: (messageHandle) =>
      inboundClaimKey(options, messageHandle).pipe(Effect.flatMap(claim)),
    claimOutbound: (coordinates) =>
      outboundClaimKey(options, coordinates).pipe(Effect.flatMap(claim)),
    complete: (replayClaim, completion) =>
      transition(replayClaim, "complete", completion),
    retryable: (replayClaim) => transition(replayClaim, "retryable"),
    uncertain: (replayClaim) => transition(replayClaim, "uncertain"),
  });

type MemoryReplayRecord = Readonly<{
  expiresAtEpochMillis: number;
  record: SendblueReplayRecordType;
}>;

type MemoryReplayState = HashMap.HashMap<
  SendblueReplayClaimKey,
  MemoryReplayRecord
>;

export const makeSendblueReplayStoreMemory = Effect.fn(
  "SendblueReplayStoreMemory.make"
)(function* (options: SendblueReplayStoreOptions) {
  const claimIdGenerator = yield* SendblueReplayClaimIdGenerator;
  const records = yield* SynchronizedRef.make<MemoryReplayState>(
    HashMap.empty<SendblueReplayClaimKey, MemoryReplayRecord>()
  );

  const claim = Effect.fn("SendblueReplayStoreMemory.claim")(function* (
    key: SendblueReplayClaimKey
  ) {
    const replayClaim = yield* makeReplayClaim(claimIdGenerator, key);
    const now = yield* Clock.currentTimeMillis;
    return yield* SynchronizedRef.modify(
      records,
      (
        current: MemoryReplayState
      ): readonly [SendblueReplayClaimResult, MemoryReplayState] => {
        const existing = Option.getOrUndefined(HashMap.get(current, key));
        const canClaim =
          existing === undefined || existing.expiresAtEpochMillis <= now;
        if (!canClaim) {
          return [
            { status: "duplicate" } satisfies SendblueReplayClaimResult,
            current,
          ];
        }
        return [
          {
            claim: replayClaim,
            status: "claimed",
          } satisfies SendblueReplayClaimResult,
          HashMap.set(current, key, {
            expiresAtEpochMillis: now + options.leaseSeconds * 1000,
            record: claimRecord(replayClaim),
          }),
        ];
      }
    );
  });

  const transition = Effect.fn("SendblueReplayStoreMemory.transition")(
    function* (
      replayClaim: SendblueReplayClaim,
      status: "complete" | "retryable" | "uncertain",
      completion?: SendblueReplayCompletion
    ) {
      const now = yield* Clock.currentTimeMillis;
      const transitioned = yield* SynchronizedRef.modify(records, (current) => {
        const existing = Option.getOrUndefined(
          HashMap.get(current, replayClaim.key)
        );
        if (
          existing === undefined ||
          existing.record.status !== "claimed" ||
          existing.record.claimId !== replayClaim.claimId
        ) {
          return [false, current];
        }
        return status === "retryable"
          ? [true, HashMap.remove(current, replayClaim.key)]
          : [
              true,
              HashMap.set(current, replayClaim.key, {
                expiresAtEpochMillis: now + options.ttlSeconds * 1000,
                record: {
                  ...transitionRecord(replayClaim, status, now, completion),
                  completedAtEpochMillis: now,
                },
              }),
            ];
      });
      if (!transitioned) {
        return yield* new SendblueReplayStoreError({
          message: "The Sendblue replay claim is no longer active.",
        });
      }
      return yield* Effect.void;
    }
  );

  return makeClaimOperations(options, claim, transition);
});

export const SendblueReplayStoreMemory = Layer.effect(
  SendblueReplayStore,
  Effect.gen(function* makeSendblueReplayStoreMemoryLayer() {
    const config = yield* SendblueConfigService;
    return yield* makeSendblueReplayStoreMemory({
      leaseSeconds: config.replayStore.leaseSeconds,
      prefix: config.replayStore.prefix,
      routingKey: config.routingKey,
      ttlSeconds: config.replayStore.ttlSeconds,
    });
  })
).pipe(Layer.provide(SendblueReplayClaimIdGeneratorLive));

export const makeSendblueReplayStoreUpstash = Effect.fn(
  "SendblueReplayStoreUpstash.make"
)(function* (options: SendblueReplayStoreOptions, client: UpstashReplayClient) {
  const claimIdGenerator = yield* SendblueReplayClaimIdGenerator;
  const claim = Effect.fn("SendblueReplayStoreUpstash.claim")(function* (
    key: SendblueReplayClaimKey
  ) {
    const replayClaim = yield* makeReplayClaim(claimIdGenerator, key);
    const encoded = yield* encodeReplayRecord(claimRecord(replayClaim));
    const result = yield* Effect.tryPromise({
      try: () =>
        client.set(key, encoded, { ex: options.leaseSeconds, nx: true }),
      catch: () =>
        new SendblueReplayStoreError({
          message: "Unable to claim the Sendblue replay record.",
        }),
    });
    const claimed = yield* Schema.decodeUnknownEffect(claimSetResponse)(
      result
    ).pipe(
      Effect.mapError(
        () =>
          new SendblueReplayStoreError({
            message: "The Sendblue replay claim response is invalid.",
          })
      )
    );
    return claimed === "OK"
      ? ({
          claim: replayClaim,
          status: "claimed",
        } satisfies SendblueReplayClaimResult)
      : ({ status: "duplicate" } satisfies SendblueReplayClaimResult);
  });

  const transition = Effect.fn("SendblueReplayStoreUpstash.transition")(
    function* (
      replayClaim: SendblueReplayClaim,
      status: "complete" | "retryable" | "uncertain",
      completion?: SendblueReplayCompletion
    ) {
      const expected = yield* encodeReplayRecord(claimRecord(replayClaim));
      if (status === "retryable") {
        const result = yield* Effect.tryPromise({
          try: () =>
            client.eval(compareAndDeleteScript, [replayClaim.key], [expected]),
          catch: () =>
            new SendblueReplayStoreError({
              message: "Unable to transition the Sendblue replay record.",
            }),
        });
        const released = yield* Schema.decodeUnknownEffect(transitionResponse)(
          result
        ).pipe(
          Effect.mapError(
            () =>
              new SendblueReplayStoreError({
                message: "The Sendblue replay transition response is invalid.",
              })
          )
        );
        if (released === 0) {
          return yield* new SendblueReplayStoreError({
            message: "The Sendblue replay claim is no longer active.",
          });
        }
        return yield* Effect.void;
      }

      const completedAtEpochMillis = yield* Clock.currentTimeMillis;
      const next = yield* encodeReplayRecord(
        transitionRecord(
          replayClaim,
          status,
          completedAtEpochMillis,
          completion
        )
      );
      const result = yield* Effect.tryPromise({
        try: () =>
          client.eval(
            compareAndSetScript,
            [replayClaim.key],
            [expected, next, String(options.ttlSeconds)]
          ),
        catch: () =>
          new SendblueReplayStoreError({
            message: "Unable to transition the Sendblue replay record.",
          }),
      });
      const transitioned = yield* Schema.decodeUnknownEffect(
        transitionResponse
      )(result).pipe(
        Effect.mapError(
          () =>
            new SendblueReplayStoreError({
              message: "The Sendblue replay transition response is invalid.",
            })
        )
      );
      if (transitioned === 0) {
        return yield* new SendblueReplayStoreError({
          message: "The Sendblue replay claim is no longer active.",
        });
      }
      return yield* Effect.void;
    }
  );

  return makeClaimOperations(options, claim, transition);
});

export const SendblueReplayStoreUpstashLive = Layer.effect(
  SendblueReplayStore,
  Effect.gen(function* makeSendblueReplayStoreUpstashLive() {
    const config = yield* SendblueConfigService;
    const client: UpstashReplayClient = new Redis({
      token: Redacted.value(config.replayStore.token),
      url: Redacted.value(config.replayStore.url),
    });
    return yield* makeSendblueReplayStoreUpstash(
      {
        leaseSeconds: config.replayStore.leaseSeconds,
        prefix: config.replayStore.prefix,
        routingKey: config.routingKey,
        ttlSeconds: config.replayStore.ttlSeconds,
      },
      client
    );
  })
).pipe(Layer.provide(SendblueReplayClaimIdGeneratorLive));

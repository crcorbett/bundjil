import type { ChannelInboundTextMessageType } from "@bundjil/channel";
import {
  AtomicKeyValueStore,
  AtomicKeyValueStoreKey,
  AtomicKeyValueStoreTransaction,
  AtomicKeyValueStoreValue,
} from "@bundjil/store";
import { Context, Effect, Layer, Match, Schema } from "effect";

import { ChannelReplayError } from "./errors.js";
import { ChannelReplayKey, ChannelReplayRecord } from "./schemas.js";
import type {
  ChannelOutboundCoordinates,
  ChannelReplayClaim,
  ChannelReplayClaimResult,
  ChannelReplayOptions,
} from "./schemas.js";

export interface ChannelReplayShape {
  readonly claimInbound: (
    message: ChannelInboundTextMessageType
  ) => Effect.Effect<ChannelReplayClaimResult, ChannelReplayError>;
  readonly claimOutbound: (
    coordinates: ChannelOutboundCoordinates
  ) => Effect.Effect<ChannelReplayClaimResult, ChannelReplayError>;
  readonly complete: (
    claim: ChannelReplayClaim
  ) => Effect.Effect<void, ChannelReplayError>;
  readonly retryable: (
    claim: ChannelReplayClaim
  ) => Effect.Effect<void, ChannelReplayError>;
  readonly uncertain: (
    claim: ChannelReplayClaim
  ) => Effect.Effect<void, ChannelReplayError>;
}

export class ChannelReplay extends Context.Service<
  ChannelReplay,
  ChannelReplayShape
>()("@bundjil/agent/ChannelReplay") {}

const replayRecordJson = Schema.fromJsonString(
  Schema.toCodecJson(ChannelReplayRecord)
);

export const layerMemory = (options: ChannelReplayOptions) =>
  Layer.effect(
    ChannelReplay,
    Effect.gen(function* makeChannelReplay() {
      const atomic = yield* AtomicKeyValueStore;
      const claim = Effect.fn("ChannelReplay.claim")(function* (
        replayKey: typeof ChannelReplayKey.Type
      ) {
        const key = yield* Schema.decodeEffect(AtomicKeyValueStoreKey)(
          replayKey
        ).pipe(
          Effect.mapError(() => new ChannelReplayError({ operation: "claim" }))
        );
        const encodedClaim = yield* Schema.encodeEffect(replayRecordJson)({
          status: "claimed",
        }).pipe(
          Effect.mapError(() => new ChannelReplayError({ operation: "claim" }))
        );
        const claimedValue = yield* Schema.decodeEffect(
          AtomicKeyValueStoreValue
        )(encodedClaim).pipe(
          Effect.mapError(() => new ChannelReplayError({ operation: "claim" }))
        );
        const transaction = yield* Schema.decodeEffect(
          AtomicKeyValueStoreTransaction
        )({
          conditions: [{ _tag: "Absent", key }],
          mutations: [
            {
              _tag: "Set",
              key,
              ttl: options.leaseMilliseconds,
              value: claimedValue,
            },
          ],
        }).pipe(
          Effect.mapError(() => new ChannelReplayError({ operation: "claim" }))
        );
        const outcome = yield* atomic
          .transact(transaction)
          .pipe(
            Effect.mapError(
              () => new ChannelReplayError({ operation: "claim" })
            )
          );
        return yield* Match.value(outcome).pipe(
          Match.when("applied", () => {
            const result: ChannelReplayClaimResult = {
              _tag: "Claimed",
              claim: { key: replayKey, claimedValue },
            };
            return Effect.succeed(result);
          }),
          Match.when("conflict", () => {
            const result: ChannelReplayClaimResult = { _tag: "Duplicate" };
            return Effect.succeed(result);
          }),
          Match.exhaustive
        );
      });
      const retain = Effect.fn("ChannelReplay.retain")(function* (
        replayClaim: ChannelReplayClaim,
        operation: "complete" | "uncertain"
      ) {
        const key = yield* Schema.decodeEffect(AtomicKeyValueStoreKey)(
          replayClaim.key
        ).pipe(Effect.mapError(() => new ChannelReplayError({ operation })));
        const encodedValue = yield* Schema.encodeEffect(replayRecordJson)({
          status: operation,
        }).pipe(Effect.mapError(() => new ChannelReplayError({ operation })));
        const value = yield* Schema.decodeEffect(AtomicKeyValueStoreValue)(
          encodedValue
        ).pipe(Effect.mapError(() => new ChannelReplayError({ operation })));
        const transaction = yield* Schema.decodeEffect(
          AtomicKeyValueStoreTransaction
        )({
          conditions: [
            { _tag: "Equals", key, value: replayClaim.claimedValue },
          ],
          mutations: [
            { _tag: "Set", key, ttl: options.ttlMilliseconds, value },
          ],
        }).pipe(Effect.mapError(() => new ChannelReplayError({ operation })));
        const outcome = yield* atomic
          .transact(transaction)
          .pipe(Effect.mapError(() => new ChannelReplayError({ operation })));
        return yield* Match.value(outcome).pipe(
          Match.when("applied", () => Effect.void),
          Match.when("conflict", () =>
            Effect.fail(new ChannelReplayError({ operation }))
          ),
          Match.exhaustive
        );
      });
      const retryable = Effect.fn("ChannelReplay.retryable")(function* (
        replayClaim: ChannelReplayClaim
      ) {
        const key = yield* Schema.decodeEffect(AtomicKeyValueStoreKey)(
          replayClaim.key
        ).pipe(
          Effect.mapError(
            () => new ChannelReplayError({ operation: "retryable" })
          )
        );
        const transaction = yield* Schema.decodeEffect(
          AtomicKeyValueStoreTransaction
        )({
          conditions: [
            { _tag: "Equals", key, value: replayClaim.claimedValue },
          ],
          mutations: [{ _tag: "Remove", key }],
        }).pipe(
          Effect.mapError(
            () => new ChannelReplayError({ operation: "retryable" })
          )
        );
        const outcome = yield* atomic
          .transact(transaction)
          .pipe(
            Effect.mapError(
              () => new ChannelReplayError({ operation: "retryable" })
            )
          );
        return yield* Match.value(outcome).pipe(
          Match.when("applied", () => Effect.void),
          Match.when("conflict", () =>
            Effect.fail(new ChannelReplayError({ operation: "retryable" }))
          ),
          Match.exhaustive
        );
      });

      return ChannelReplay.of({
        claimInbound: Effect.fn("ChannelReplay.claimInbound")(
          function* (message) {
            const key = yield* Schema.decodeEffect(ChannelReplayKey)(
              `${options.prefix}inbound:${message.conversation.provider}:${message.messageId}`
            ).pipe(
              Effect.mapError(
                () => new ChannelReplayError({ operation: "claim" })
              )
            );
            return yield* claim(key);
          }
        ),
        claimOutbound: Effect.fn("ChannelReplay.claimOutbound")(
          function* (coordinates) {
            const key = yield* Schema.decodeEffect(ChannelReplayKey)(
              `${options.prefix}outbound:${coordinates.sessionId}:${coordinates.turnId}:${coordinates.sequence}`
            ).pipe(
              Effect.mapError(
                () => new ChannelReplayError({ operation: "claim" })
              )
            );
            return yield* claim(key);
          }
        ),
        complete: (replayClaim) => retain(replayClaim, "complete"),
        retryable,
        uncertain: (replayClaim) => retain(replayClaim, "uncertain"),
      });
    })
  );

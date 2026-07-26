import type { ChannelInboundTextMessageType } from "@bundjil/channel";
import {
  AtomicKeyValueStore,
  AtomicKeyValueStoreKey,
  AtomicKeyValueStoreTransaction,
  AtomicKeyValueStoreValue,
} from "@bundjil/store";
import { Context, Effect, Layer, Match, Schema } from "effect";

import { ChannelReplayError } from "./errors.js";
import {
  ChannelContinuityRecord,
  ChannelReplayKey,
  ChannelReplayRecord,
  ChannelTerminalFailureRecord,
} from "./schemas.js";
import type {
  ChannelContinuationToken,
  ChannelHandoffAcceptance,
  ChannelInboundAcceptance,
  ChannelOutboundCoordinates,
  ChannelReplayClaim,
  ChannelReplayClaimResult,
  ChannelReplayOptions,
  ChannelSessionFingerprint,
  ChannelSessionSettlement,
  ChannelSessionTerminalOutcome,
} from "./schemas.js";

export interface ChannelReplayShape {
  readonly claimInbound: (
    message: ChannelInboundTextMessageType
  ) => Effect.Effect<ChannelReplayClaimResult, ChannelReplayError>;
  readonly claimOutbound: (
    coordinates: ChannelOutboundCoordinates
  ) => Effect.Effect<ChannelReplayClaimResult, ChannelReplayError>;
  readonly acceptInbound: (
    claim: ChannelReplayClaim,
    continuationToken: ChannelContinuationToken,
    acceptance: ChannelHandoffAcceptance
  ) => Effect.Effect<ChannelInboundAcceptance, ChannelReplayError>;
  readonly complete: (
    claim: ChannelReplayClaim
  ) => Effect.Effect<void, ChannelReplayError>;
  readonly retryable: (
    claim: ChannelReplayClaim
  ) => Effect.Effect<void, ChannelReplayError>;
  readonly uncertain: (
    claim: ChannelReplayClaim
  ) => Effect.Effect<void, ChannelReplayError>;
  readonly settleSession: (
    continuationToken: ChannelContinuationToken,
    sessionFingerprint: ChannelSessionFingerprint,
    outcome: ChannelSessionTerminalOutcome
  ) => Effect.Effect<ChannelSessionSettlement, ChannelReplayError>;
}

export class ChannelReplay extends Context.Service<
  ChannelReplay,
  ChannelReplayShape
>()("@bundjil/agent/ChannelReplay") {}

const replayRecordJson = Schema.fromJsonString(
  Schema.toCodecJson(ChannelReplayRecord)
);
const continuityRecordJson = Schema.fromJsonString(
  Schema.toCodecJson(ChannelContinuityRecord)
);
const terminalFailureRecordJson = Schema.fromJsonString(
  Schema.toCodecJson(ChannelTerminalFailureRecord)
);

const makeLayer = (options: ChannelReplayOptions) =>
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
      const acceptInbound = Effect.fn("ChannelReplay.acceptInbound")(function* (
        replayClaim: ChannelReplayClaim,
        continuationToken: ChannelContinuationToken,
        acceptance: ChannelHandoffAcceptance
      ) {
        const replayKey = yield* Schema.decodeEffect(AtomicKeyValueStoreKey)(
          replayClaim.key
        ).pipe(
          Effect.mapError(() => new ChannelReplayError({ operation: "accept" }))
        );
        const continuityKey = yield* Schema.decodeEffect(
          AtomicKeyValueStoreKey
        )(`${options.prefix}continuity:${continuationToken}`).pipe(
          Effect.mapError(() => new ChannelReplayError({ operation: "accept" }))
        );
        const completedValue = yield* Schema.encodeEffect(replayRecordJson)({
          status: "complete",
        }).pipe(
          Effect.flatMap(Schema.decodeEffect(AtomicKeyValueStoreValue)),
          Effect.mapError(() => new ChannelReplayError({ operation: "accept" }))
        );
        const continuityValue = yield* Schema.encodeEffect(
          continuityRecordJson
        )({
          sessionFingerprint: acceptance.sessionFingerprint,
        }).pipe(
          Effect.flatMap(Schema.decodeEffect(AtomicKeyValueStoreValue)),
          Effect.mapError(() => new ChannelReplayError({ operation: "accept" }))
        );
        const newTransaction = yield* Schema.decodeEffect(
          AtomicKeyValueStoreTransaction
        )({
          conditions: [
            {
              _tag: "Equals",
              key: replayKey,
              value: replayClaim.claimedValue,
            },
            { _tag: "Absent", key: continuityKey },
          ],
          mutations: [
            {
              _tag: "Set",
              key: replayKey,
              ttl: options.ttlMilliseconds,
              value: completedValue,
            },
            {
              _tag: "Set",
              key: continuityKey,
              ttl: options.ttlMilliseconds,
              value: continuityValue,
            },
          ],
        }).pipe(
          Effect.mapError(() => new ChannelReplayError({ operation: "accept" }))
        );
        const newOutcome = yield* atomic
          .transact(newTransaction)
          .pipe(
            Effect.mapError(
              () => new ChannelReplayError({ operation: "accept" })
            )
          );
        if (newOutcome === "applied") {
          const result: ChannelInboundAcceptance = {
            _tag: "New",
            acceptance,
          };
          return result;
        }
        const resumeTransaction = yield* Schema.decodeEffect(
          AtomicKeyValueStoreTransaction
        )({
          conditions: [
            {
              _tag: "Equals",
              key: replayKey,
              value: replayClaim.claimedValue,
            },
            {
              _tag: "Equals",
              key: continuityKey,
              value: continuityValue,
            },
          ],
          mutations: [
            {
              _tag: "Set",
              key: replayKey,
              ttl: options.ttlMilliseconds,
              value: completedValue,
            },
            {
              _tag: "Set",
              key: continuityKey,
              ttl: options.ttlMilliseconds,
              value: continuityValue,
            },
          ],
        }).pipe(
          Effect.mapError(() => new ChannelReplayError({ operation: "accept" }))
        );
        const resumeOutcome = yield* atomic
          .transact(resumeTransaction)
          .pipe(
            Effect.mapError(
              () => new ChannelReplayError({ operation: "accept" })
            )
          );
        if (resumeOutcome === "applied") {
          const result: ChannelInboundAcceptance = {
            _tag: "Resumed",
            acceptance,
          };
          return result;
        }
        yield* retain(replayClaim, "uncertain");
        const result: ChannelInboundAcceptance = {
          _tag: "ContinuityUncertain",
          acceptance,
        };
        return result;
      });
      const settleSession = Effect.fn("ChannelReplay.settleSession")(function* (
        continuationToken: ChannelContinuationToken,
        sessionFingerprint: ChannelSessionFingerprint,
        outcome: ChannelSessionTerminalOutcome
      ) {
        const continuityKey = yield* Schema.decodeEffect(
          AtomicKeyValueStoreKey
        )(`${options.prefix}continuity:${continuationToken}`).pipe(
          Effect.mapError(
            () => new ChannelReplayError({ operation: "settleSession" })
          )
        );
        const continuityValue = yield* Schema.encodeEffect(
          continuityRecordJson
        )({ sessionFingerprint }).pipe(
          Effect.flatMap(Schema.decodeEffect(AtomicKeyValueStoreValue)),
          Effect.mapError(
            () => new ChannelReplayError({ operation: "settleSession" })
          )
        );
        const failedValue = yield* Schema.encodeEffect(
          terminalFailureRecordJson
        )({ status: "failed" }).pipe(
          Effect.flatMap(Schema.decodeEffect(AtomicKeyValueStoreValue)),
          Effect.mapError(
            () => new ChannelReplayError({ operation: "settleSession" })
          )
        );
        const terminalKey = yield* Schema.decodeEffect(AtomicKeyValueStoreKey)(
          `${options.prefix}terminal:${sessionFingerprint}`
        ).pipe(
          Effect.mapError(
            () => new ChannelReplayError({ operation: "settleSession" })
          )
        );
        const transaction = yield* Schema.decodeEffect(
          AtomicKeyValueStoreTransaction
        )({
          conditions: [
            {
              _tag: "Equals",
              key: continuityKey,
              value: continuityValue,
            },
          ],
          mutations:
            outcome === "failed"
              ? [
                  { _tag: "Remove", key: continuityKey },
                  {
                    _tag: "Set",
                    key: terminalKey,
                    ttl: options.ttlMilliseconds,
                    value: failedValue,
                  },
                ]
              : [{ _tag: "Remove", key: continuityKey }],
        }).pipe(
          Effect.mapError(
            () => new ChannelReplayError({ operation: "settleSession" })
          )
        );
        const transactionOutcome = yield* atomic
          .transact(transaction)
          .pipe(
            Effect.mapError(
              () => new ChannelReplayError({ operation: "settleSession" })
            )
          );
        return transactionOutcome === "applied" ? "retired" : "stale";
      });

      return ChannelReplay.of({
        acceptInbound,
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
        settleSession,
        uncertain: (replayClaim) => retain(replayClaim, "uncertain"),
      });
    })
  );

export const layerMemory = (options: ChannelReplayOptions) =>
  makeLayer(options);

export const layerLive = (options: ChannelReplayOptions) => makeLayer(options);

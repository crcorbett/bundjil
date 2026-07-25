import { ChannelInboundTextMessage } from "@bundjil/channel";
import { PersistenceMemory } from "@bundjil/store/memory";
import { assert, it } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import {
  ChannelReplay,
  ChannelReplayMemory,
} from "../agent/lib/channel/index.js";
import {
  ChannelContinuationToken,
  ChannelHandoffAcceptance,
  ChannelReplayOptions,
  ChannelTerminalFailureRecord,
} from "../agent/lib/channel/schemas.js";

const fixtures = Effect.gen(function* decodeChannelContinuityFixtures() {
  const messages = yield* Schema.decodeUnknownEffect(
    Schema.Array(ChannelInboundTextMessage)
  )(
    Array.from({ length: 6 }, (_, index) => ({
      conversation: {
        conversationId: "conversation-1",
        participantId: "participant-1",
        provider: "sendblue",
        providerAgentId: "provider-agent-1",
      },
      messageId: `message-${index + 1}`,
      text: "hello",
    }))
  );
  const acceptances = yield* Schema.decodeUnknownEffect(
    Schema.Array(ChannelHandoffAcceptance)
  )(
    ["a", "b", "c"].map((fingerprint, index) => ({
      acceptedAtEpochMilliseconds: index + 1,
      sessionFingerprint: fingerprint.repeat(64),
      workFingerprint: String(index + 1).repeat(64),
    }))
  );
  const continuationToken = yield* Schema.decodeUnknownEffect(
    ChannelContinuationToken
  )("channel:v1:continuity-test");
  const replay = yield* Schema.decodeUnknownEffect(ChannelReplayOptions)({
    leaseMilliseconds: 30_000,
    prefix: "channel:v1:continuity-test:",
    ttlMilliseconds: 86_400_000,
  });
  return { acceptances, continuationToken, messages, replay };
});

it.effect(
  "atomically classifies new, resumed, uncertain, failed-repair and terminal restart",
  () =>
    Effect.gen(function* testChannelContinuityFence() {
      const fixture = yield* fixtures;
      const [first, second, third, fourth, fifth, sixth] = fixture.messages;
      const [sessionA, sessionB, sessionC] = fixture.acceptances;
      assert.isDefined(first);
      assert.isDefined(second);
      assert.isDefined(third);
      assert.isDefined(fourth);
      assert.isDefined(fifth);
      assert.isDefined(sixth);
      assert.isDefined(sessionA);
      assert.isDefined(sessionB);
      assert.isDefined(sessionC);

      const result = yield* Effect.gen(function* runContinuityTransitions() {
        const replay = yield* ChannelReplay;
        const store = yield* KeyValueStore.KeyValueStore;

        const firstClaim = yield* replay.claimInbound(first);
        assert.strictEqual(firstClaim._tag, "Claimed");
        if (firstClaim._tag !== "Claimed") {
          return yield* Effect.die("first claim required");
        }
        const newSession = yield* replay.acceptInbound(
          firstClaim.claim,
          fixture.continuationToken,
          sessionA
        );

        const secondClaim = yield* replay.claimInbound(second);
        assert.strictEqual(secondClaim._tag, "Claimed");
        if (secondClaim._tag !== "Claimed") {
          return yield* Effect.die("second claim required");
        }
        const resumedSession = yield* replay.acceptInbound(
          secondClaim.claim,
          fixture.continuationToken,
          sessionA
        );

        const thirdClaim = yield* replay.claimInbound(third);
        assert.strictEqual(thirdClaim._tag, "Claimed");
        if (thirdClaim._tag !== "Claimed") {
          return yield* Effect.die("third claim required");
        }
        const uncertainSession = yield* replay.acceptInbound(
          thirdClaim.claim,
          fixture.continuationToken,
          sessionB
        );
        const uncertainDuplicate = yield* replay.claimInbound(third);

        const failedSettlement = yield* replay.settleSession(
          fixture.continuationToken,
          sessionA.sessionFingerprint,
          "failed"
        );
        const terminalFailure = yield* store.get(
          `${fixture.replay.prefix}terminal:${sessionA.sessionFingerprint}`
        );

        const fourthClaim = yield* replay.claimInbound(fourth);
        assert.strictEqual(fourthClaim._tag, "Claimed");
        if (fourthClaim._tag !== "Claimed") {
          return yield* Effect.die("fourth claim required");
        }
        const repairedSession = yield* replay.acceptInbound(
          fourthClaim.claim,
          fixture.continuationToken,
          sessionB
        );

        const staleSettlement = yield* replay.settleSession(
          fixture.continuationToken,
          sessionA.sessionFingerprint,
          "completed"
        );
        const fifthClaim = yield* replay.claimInbound(fifth);
        assert.strictEqual(fifthClaim._tag, "Claimed");
        if (fifthClaim._tag !== "Claimed") {
          return yield* Effect.die("fifth claim required");
        }
        const preservedSession = yield* replay.acceptInbound(
          fifthClaim.claim,
          fixture.continuationToken,
          sessionB
        );

        const completedSettlement = yield* replay.settleSession(
          fixture.continuationToken,
          sessionB.sessionFingerprint,
          "completed"
        );
        const sixthClaim = yield* replay.claimInbound(sixth);
        assert.strictEqual(sixthClaim._tag, "Claimed");
        if (sixthClaim._tag !== "Claimed") {
          return yield* Effect.die("sixth claim required");
        }
        const deliberateRestart = yield* replay.acceptInbound(
          sixthClaim.claim,
          fixture.continuationToken,
          sessionC
        );

        return {
          completedSettlement,
          deliberateRestart,
          failedSettlement,
          newSession,
          preservedSession,
          repairedSession,
          resumedSession,
          staleSettlement,
          terminalFailure,
          uncertainDuplicate,
          uncertainSession,
        };
      }).pipe(
        Effect.provide(
          ChannelReplayMemory(fixture.replay).pipe(
            Layer.provideMerge(PersistenceMemory)
          )
        )
      );

      assert.strictEqual(result.newSession._tag, "New");
      assert.strictEqual(result.resumedSession._tag, "Resumed");
      assert.strictEqual(result.uncertainSession._tag, "ContinuityUncertain");
      assert.strictEqual(result.uncertainDuplicate._tag, "Duplicate");
      assert.strictEqual(result.failedSettlement, "retired");
      assert.strictEqual(
        result.terminalFailure,
        yield* Schema.encodeEffect(
          Schema.fromJsonString(ChannelTerminalFailureRecord)
        )({ status: "failed" })
      );
      assert.strictEqual(result.repairedSession._tag, "New");
      assert.strictEqual(result.staleSettlement, "stale");
      assert.strictEqual(result.preservedSession._tag, "Resumed");
      assert.strictEqual(result.completedSettlement, "retired");
      assert.strictEqual(result.deliberateRestart._tag, "New");
    })
);

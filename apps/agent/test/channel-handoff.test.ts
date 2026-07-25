import { EveSessionId } from "@bundjil/eve";
import { assert, it } from "@effect/vitest";
import { Effect, Redacted, Ref, Schema } from "effect";

import {
  ChannelHandoff,
  ChannelHandoffMemory,
} from "../agent/lib/channel/index.js";
import {
  ChannelHandoffObservation,
  ChannelReplayClaim,
  ChannelRoutingSecret,
} from "../agent/lib/channel/schemas.js";

const fixtures = Effect.gen(function* decodeChannelHandoffFixtures() {
  const claim = yield* Schema.decodeUnknownEffect(ChannelReplayClaim)({
    claimedValue: '{"status":"claimed"}',
    key: "channel:v1:test:inbound:sendblue:message-sensitive",
  });
  const sessionId =
    yield* Schema.decodeUnknownEffect(EveSessionId)("session-sensitive");
  const firstSecret = yield* Schema.decodeUnknownEffect(ChannelRoutingSecret)(
    Redacted.make("synthetic-channel-handoff-first-secret")
  );
  const secondSecret = yield* Schema.decodeUnknownEffect(ChannelRoutingSecret)(
    Redacted.make("synthetic-channel-handoff-second-secret")
  );
  return { claim, firstSecret, secondSecret, sessionId };
});

it.effect(
  "derives deterministic environment-separated work and session fingerprints",
  () =>
    Effect.gen(function* testChannelHandoffFingerprints() {
      const fixture = yield* fixtures;
      const firstObservations = yield* Ref.make<
        readonly (typeof ChannelHandoffObservation.Type)[]
      >([]);
      const secondObservations = yield* Ref.make<
        readonly (typeof ChannelHandoffObservation.Type)[]
      >([]);

      const first = yield* Effect.gen(function* observeFirstEnvironment() {
        const handoff = yield* ChannelHandoff;
        const firstAttempt = yield* handoff.prepared(fixture.claim);
        const secondAttempt = yield* handoff.prepared(fixture.claim);
        const firstAcceptance = yield* handoff.sendAccepted(
          firstAttempt,
          fixture.sessionId
        );
        const secondAcceptance = yield* handoff.sendAccepted(
          secondAttempt,
          fixture.sessionId
        );
        return {
          firstAcceptance,
          firstAttempt,
          secondAcceptance,
          secondAttempt,
        };
      }).pipe(
        Effect.provide(
          ChannelHandoffMemory(fixture.firstSecret, firstObservations)
        )
      );
      const second = yield* Effect.gen(function* observeSecondEnvironment() {
        const handoff = yield* ChannelHandoff;
        const attempt = yield* handoff.prepared(fixture.claim);
        const acceptance = yield* handoff.sendAccepted(
          attempt,
          fixture.sessionId
        );
        return { acceptance, attempt };
      }).pipe(
        Effect.provide(
          ChannelHandoffMemory(fixture.secondSecret, secondObservations)
        )
      );

      assert.strictEqual(
        first.firstAttempt.workFingerprint,
        first.secondAttempt.workFingerprint
      );
      assert.strictEqual(
        first.firstAcceptance.sessionFingerprint,
        first.secondAcceptance.sessionFingerprint
      );
      assert.notStrictEqual(
        first.firstAttempt.workFingerprint,
        second.attempt.workFingerprint
      );
      assert.notStrictEqual(
        first.firstAcceptance.sessionFingerprint,
        second.acceptance.sessionFingerprint
      );
      assert.strictEqual(
        new Set([
          first.firstAttempt.workFingerprint,
          first.firstAcceptance.sessionFingerprint,
        ]).size,
        2
      );
    })
);

it.effect("encodes only bounded safe handoff observations", () =>
  Effect.gen(function* testSafeChannelHandoffObservationEncoding() {
    const fixture = yield* fixtures;
    const observations = yield* Ref.make<
      readonly (typeof ChannelHandoffObservation.Type)[]
    >([]);
    yield* Effect.gen(function* recordChannelHandoffPhases() {
      const handoff = yield* ChannelHandoff;
      const attempt = yield* handoff.prepared(fixture.claim);
      yield* handoff.sendStarted(attempt);
      yield* handoff.sendAccepted(attempt, fixture.sessionId);
      yield* handoff.sendRejected(attempt);
      yield* handoff.response(attempt, 202);
      yield* handoff.response(attempt, 503);
      yield* Effect.forEach(
        ["succeeded", "failed", "defect", "interrupted"] as const,
        (outcome) => handoff.settled(attempt, outcome),
        { discard: true }
      );
    }).pipe(
      Effect.provide(ChannelHandoffMemory(fixture.firstSecret, observations))
    );

    const recorded = yield* Ref.get(observations);
    const encoded = yield* Effect.all(
      recorded.map((observation) =>
        Schema.encodeEffect(ChannelHandoffObservation)(observation)
      )
    );
    const retained = yield* Schema.encodeEffect(
      Schema.fromJsonString(Schema.Array(ChannelHandoffObservation))
    )(recorded);
    for (const forbidden of [
      fixture.claim.key,
      fixture.sessionId,
      "message-sensitive",
      "session-sensitive",
      "content",
      "cause",
      "stack",
      "hookToken",
      "continuationToken",
    ]) {
      assert.strictEqual(retained.includes(forbidden), false);
    }
    assert.deepStrictEqual(
      recorded.map((observation) => observation._tag),
      [
        "Prepared",
        "SendStarted",
        "SendAccepted",
        "SendRejected",
        "Response",
        "Response",
        "Exit",
        "Exit",
        "Exit",
        "Exit",
      ]
    );

    const accepted = encoded.find(
      (observation) => observation._tag === "SendAccepted"
    );
    assert.isDefined(accepted);
    const excessPropertyExit = yield* Schema.decodeUnknownEffect(
      ChannelHandoffObservation,
      { onExcessProperty: "error" }
    )({ ...accepted, content: "forbidden-content" }).pipe(Effect.exit);
    assert.strictEqual(excessPropertyExit._tag, "Failure");
  })
);

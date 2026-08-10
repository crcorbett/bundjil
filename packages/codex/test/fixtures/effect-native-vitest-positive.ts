import { assert, it } from "@effect/vitest";
import { Effect, Fiber } from "effect";
import { TestClock } from "effect/testing";

export const deterministicEffectNativeVitestFixture = Effect.gen(
  function* effectNativeVitestFixture() {
    const fiber = yield* Effect.forkChild(Effect.sleep("1 second"));
    yield* TestClock.adjust("1 second");
    yield* Fiber.join(fiber);
    assert.isTrue(true);
  }
);

it.effect(
  "advances Effect time without a live-clock escape",
  () => deterministicEffectNativeVitestFixture
);

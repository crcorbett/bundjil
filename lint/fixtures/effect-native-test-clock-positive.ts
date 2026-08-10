import { Effect, Fiber } from "effect";
import { TestClock } from "effect/testing";

export const deterministicTimingFixture = Effect.gen(
  function* effectNativeTimingFixture() {
    const fiber = yield* Effect.forkChild(Effect.sleep("1 second"));
    yield* TestClock.adjust("1 second");
    yield* Fiber.join(fiber);
  }
);

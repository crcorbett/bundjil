import { Effect, Layer } from "effect";

Date.now();

export const asyncService = async () => await fetch("https://example.invalid");

export const bareAttempt = Effect.tryPromise(() =>
  fetch("https://example.invalid")
);

Effect.runPromise(Effect.void);

Effect.fail("primitive-failure");

Layer.orDie(Layer.empty);

export const nativeCollection = new Set(["domain-value"]);

export const exportedGenerator = () =>
  Effect.gen(function* exportedGenerator() {
    return yield* Effect.void;
  });

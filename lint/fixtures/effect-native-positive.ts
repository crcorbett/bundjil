import { Clock, Effect } from "effect";

class FixtureBoundaryError extends Error {
  override name = "FixtureBoundaryError";
}

export const positiveProgram = Effect.gen(function* positiveFixture() {
  const now = yield* Clock.currentTimeMillis;
  const response = yield* Effect.tryPromise({
    try: () => fetch(`https://example.invalid/${now}`),
    catch: () => new FixtureBoundaryError(),
  });
  return response.status;
});

export const positiveOperation = Effect.fnUntraced(
  function* positiveOperation() {
    return yield* positiveProgram;
  }
);

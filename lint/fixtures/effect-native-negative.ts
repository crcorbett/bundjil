import { Effect } from "effect";

Date.now();

export const asyncService = async () => fetch("https://example.invalid");

export const bareAttempt = Effect.tryPromise(() =>
  fetch("https://example.invalid")
);

Effect.runPromise(Effect.void);

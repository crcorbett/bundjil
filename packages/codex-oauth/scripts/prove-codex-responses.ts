import process from "node:process";

import { ConfigProvider, Console, Effect, Exit, Layer, Schema } from "effect";

import {
  CodexResponsesProofResult,
  loadCodexResponsesProofInput,
  runCodexResponsesProof,
} from "../src/index.js";
import { CodexResponsesProofFetchLive } from "../src/live.layer.js";

const program = Effect.gen(function* proveCodexResponses() {
  const input = yield* loadCodexResponsesProofInput;

  return yield* runCodexResponsesProof(input);
}).pipe(
  Effect.provide(
    Layer.merge(
      CodexResponsesProofFetchLive,
      ConfigProvider.layer(ConfigProvider.fromEnv())
    )
  )
);

const ProofSuccessOutput = Schema.Struct({
  status: Schema.Literal("proved"),
  result: CodexResponsesProofResult,
});

const ProofBlockedOutput = Schema.Struct({
  status: Schema.Literal("blocked"),
  message: Schema.String,
});

const main = Effect.gen(function* renderCodexResponsesProof() {
  const exit = yield* Effect.exit(program);

  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(ProofSuccessOutput)
    )({
      status: "proved",
      result: exit.value,
    });
    return yield* Console.log(output);
  }

  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(ProofBlockedOutput)
  )({
    status: "blocked",
    message:
      "Codex Responses live proof requires CODEX_ACCESS_TOKEN and a working subscription-backed Codex endpoint. No token, prompt, authorization code, or response body was printed.",
  });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

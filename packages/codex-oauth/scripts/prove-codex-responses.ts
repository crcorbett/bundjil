import process from "node:process";

import { ConfigProvider, Effect, Exit, Schema } from "effect";

import {
  CodexResponsesProofResult,
  loadCodexResponsesProofInput,
  runCodexResponsesProof,
} from "../src/index.js";
import {
  CodexResponsesFetchLive,
  CodexResponsesProofLive,
} from "../src/live.layer.js";

const program = Effect.gen(function* proveCodexResponses() {
  const input = yield* loadCodexResponsesProofInput;

  return yield* runCodexResponsesProof(input);
}).pipe(
  Effect.provide(CodexResponsesProofLive),
  Effect.provide(CodexResponsesFetchLive),
  Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv()))
);

const ProofSuccessOutput = Schema.Struct({
  status: Schema.Literal("proved"),
  result: CodexResponsesProofResult,
});

const ProofBlockedOutput = Schema.Struct({
  status: Schema.Literal("blocked"),
  message: Schema.String,
});

const encodeProofSuccessOutput = Schema.encodeSync(
  Schema.fromJsonString(ProofSuccessOutput)
);

const encodeProofBlockedOutput = Schema.encodeSync(
  Schema.fromJsonString(ProofBlockedOutput)
);

const exit = await Effect.runPromiseExit(program);

if (Exit.isSuccess(exit)) {
  process.stdout.write(
    `${encodeProofSuccessOutput({
      status: "proved",
      result: exit.value,
    })}\n`
  );
} else {
  process.stderr.write(
    `${encodeProofBlockedOutput({
      status: "blocked",
      message:
        "Codex Responses live proof requires CODEX_ACCESS_TOKEN and a working subscription-backed Codex endpoint. No token, prompt, authorization code, or response body was printed.",
    })}\n`
  );
  process.exitCode = 1;
}

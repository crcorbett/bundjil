import process from "node:process";

import { ConfigProvider, Effect, Exit } from "effect";

import {
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

const exit = await Effect.runPromiseExit(program);

if (Exit.isSuccess(exit)) {
  process.stdout.write(
    `${JSON.stringify(
      {
        status: "proved",
        result: exit.value,
      },
      null,
      2
    )}\n`
  );
} else {
  process.stderr.write(
    `${JSON.stringify(
      {
        status: "blocked",
        message:
          "Codex Responses live proof requires CODEX_ACCESS_TOKEN and a working subscription-backed Codex endpoint. No token, prompt, authorization code, or response body was printed.",
      },
      null,
      2
    )}\n`
  );
  process.exitCode = 1;
}

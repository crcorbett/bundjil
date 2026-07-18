import { Context, Effect, Schema } from "effect";

import { CodexResponsesRequest } from "./contracts.js";
import type {
  CodexResponsesProofInput,
  CodexResponsesProofResult,
} from "./contracts.js";
import { CodexResponsesRequestError } from "./errors.js";
import type { CodexHttpClientFailure } from "./http-client.js";
import { CodexHttpClient } from "./http-client.js";

export type CodexResponsesProofFailure =
  | CodexResponsesRequestError
  | CodexHttpClientFailure;

export interface CodexResponsesProofShape {
  readonly run: (
    input: CodexResponsesProofInput
  ) => Effect.Effect<CodexResponsesProofResult, CodexResponsesProofFailure>;
}

export class CodexResponsesProof extends Context.Service<
  CodexResponsesProof,
  CodexResponsesProofShape
>()("@bundjil/codex/CodexResponsesProof") {}

export const makeCodexResponsesProof = Effect.gen(
  function* makeCodexResponsesProofService() {
    const httpClient = yield* CodexHttpClient;

    return CodexResponsesProof.of({
      run: Effect.fn("CodexResponsesProof.run")(function* (
        input: CodexResponsesProofInput
      ) {
        const request = yield* Schema.decodeUnknownEffect(
          CodexResponsesRequest
        )({
          model: input.model,
          input: [
            {
              role: "user",
              content: [{ type: "input_text", text: input.prompt }],
            },
          ],
          store: false,
          instructions: "Return a concise confirmation.",
          stream: true,
          reasoning: { effort: "low" },
        }).pipe(
          Effect.mapError(
            (cause) =>
              new CodexResponsesRequestError({
                boundary: "CodexResponsesRequest",
                message: "Unable to build Codex Responses proof request.",
                cause,
              })
          )
        );

        return yield* httpClient.postResponses({
          accessToken: input.accessToken,
          ...(input.accountId === undefined
            ? {}
            : { accountId: input.accountId }),
          request,
        });
      }),
    });
  }
).pipe(Effect.withSpan("CodexResponsesProofLive"));

export const runCodexResponsesProof = (input: CodexResponsesProofInput) =>
  Effect.gen(function* runCodexResponsesProofOperation() {
    const proof = yield* CodexResponsesProof;

    return yield* proof.run(input);
  });

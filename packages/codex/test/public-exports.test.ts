import { assert, it as effectIt } from "@effect/vitest";
import { Context, Effect, Layer, Option } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { describe, it } from "vitest";

import * as Codex from "../src/index.js";
import * as CodexLocal from "../src/local.js";
import { CodexHttpClient } from "../src/provider/http-client.js";
import { CodexRequestMapper } from "../src/provider/request-mapper.js";
import { CodexStreamMapper } from "../src/provider/stream-mapper.js";
import * as CodexRuntime from "../src/runtime.js";
import { CodexResponsesProofLive } from "../src/runtime.js";
import * as CodexFileSystemStore from "../src/storage/filesystem.js";
import * as CodexTesting from "../src/testing/index.js";
import {
  CodexOAuthMemory,
  makeCodexDirectProviderHttpClientTestLayer,
} from "../src/testing/index.js";

const assertPrivateServicesAbsent = <A>(context: Context.Context<A>) => {
  assert.isTrue(Option.isNone(Context.getOption(context, CodexHttpClient)));
  assert.isTrue(Option.isNone(Context.getOption(context, CodexRequestMapper)));
  assert.isTrue(Option.isNone(Context.getOption(context, CodexStreamMapper)));
};

describe("@bundjil/codex public exports", () => {
  it("keeps raw provider transports out of every public subpath", () => {
    for (const privateExport of [
      "CodexHttpClient",
      "CodexRequestMapper",
      "CodexStreamMapper",
      "makeCodexHttpClient",
      "makeCodexRequestMapper",
      "makeCodexStreamMapper",
      "postResponses",
      "postResponsesStream",
      "toOpenAICompatibleStream",
      "toCodexResponses",
    ]) {
      for (const [subpath, exports] of [
        [".", Codex],
        ["./runtime", CodexRuntime],
        ["./local", CodexLocal],
        ["./testing", CodexTesting],
        ["./filesystem-store", CodexFileSystemStore],
      ] as const) {
        assert.isFalse(
          Object.hasOwn(exports, privateExport),
          `${privateExport} must remain private from ${subpath}.`
        );
      }
    }
  });

  effectIt.effect("keeps private services out of exported Layer contexts", () =>
    Effect.scoped(
      Effect.gen(function* inspectExportedLayerContexts() {
        const proofContext = yield* Layer.build(CodexResponsesProofLive);
        const directContext = yield* Layer.build(
          makeCodexDirectProviderHttpClientTestLayer(
            { reasoningEffort: "low" },
            HttpClient.make((request) =>
              Effect.succeed(
                HttpClientResponse.fromWeb(
                  request,
                  new Response(null, {
                    headers: { "content-type": "text/event-stream" },
                    status: 200,
                  })
                )
              )
            )
          ).pipe(Layer.provide(CodexOAuthMemory()))
        );

        assertPrivateServicesAbsent(proofContext);
        assertPrivateServicesAbsent(directContext);
      })
    )
  );
});

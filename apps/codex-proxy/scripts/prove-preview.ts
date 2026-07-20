import {
  CodexResponsesModelId,
  OpenAICompatibleChatCompletionRequest,
  OpenAICompatibleProxyInternalToken,
} from "@bundjil/codex";
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import {
  Config,
  ConfigProvider,
  Console,
  Data,
  Effect,
  Exit,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";
import { HttpClient, HttpClientRequest } from "effect/unstable/http";

import {
  CodexProxyErrorResponse,
  CodexProxyHealthResponse,
  CodexProxyVercelProtectionBypass,
} from "../src/schemas.js";

declare const process: {
  exitCode: number | undefined;
};

const previewUrlConfig = Config.url("BUNDJIL_CODEX_PROXY_PREVIEW_URL");
const internalTokenConfig = Config.schema(
  OpenAICompatibleProxyInternalToken,
  "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"
);
const protectionBypassConfig = Config.option(
  Config.schema(
    CodexProxyVercelProtectionBypass,
    "BUNDJIL_CODEX_PROXY_VERCEL_BYPASS"
  )
);

const previewProofModel = CodexResponsesModelId.make("gpt-5.6-terra");

const PreviewProofResult = Schema.Struct({
  authenticatedStatus: Schema.Number,
  authorizationCodeLeak: Schema.Boolean,
  healthModeLive: Schema.Boolean,
  healthReady: Schema.Boolean,
  healthReasoningEffortHigh: Schema.Boolean,
  healthStatus: Schema.Number,
  invalidTokenStatus: Schema.Number,
  rawPayloadLeak: Schema.Boolean,
  requestedModelTerra: Schema.Boolean,
  streamContentTypeSse: Schema.Boolean,
  streamDataLines: Schema.Int,
  streamDone: Schema.Boolean,
  tokenLeak: Schema.Boolean,
  unauthenticatedStatus: Schema.Number,
});

const PreviewProofSuccess = Schema.Struct({
  result: PreviewProofResult,
  status: Schema.Literal("proved"),
});

const PreviewProofBlocked = Schema.Struct({
  status: Schema.Literal("blocked"),
});

const PreviewProofContract = Schema.Struct({
  authenticatedStatus: Schema.Literal(200),
  authorizationCodeLeak: Schema.Literal(false),
  healthModeLive: Schema.Literal(true),
  healthReady: Schema.Literal(true),
  healthReasoningEffortHigh: Schema.Literal(true),
  healthStatus: Schema.Literal(200),
  invalidTokenStatus: Schema.Literal(401),
  rawPayloadLeak: Schema.Literal(false),
  requestedModelTerra: Schema.Literal(true),
  streamContentTypeSse: Schema.Literal(true),
  streamDataLines: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(1))),
  streamDone: Schema.Literal(true),
  tokenLeak: Schema.Literal(false),
  unauthenticatedStatus: Schema.Literal(401),
});

class PreviewProofError extends Data.TaggedError("PreviewProofError")<{
  readonly cause: unknown;
  readonly operation: "assert" | "request";
  readonly result?: typeof PreviewProofResult.Type;
}> {}

const program = Effect.gen(function* provePreview() {
  const previewUrl = yield* previewUrlConfig;
  const internalToken = yield* internalTokenConfig;
  const protectionBypass = yield* protectionBypassConfig;
  const client = yield* HttpClient.HttpClient;
  const previewProofRequest = yield* Schema.encodeEffect(
    Schema.fromJsonString(OpenAICompatibleChatCompletionRequest)
  )(
    OpenAICompatibleChatCompletionRequest.make({
      messages: [{ content: "Reply only: OK.", role: "user" }],
      model: previewProofModel,
      stream: true,
    })
  );
  const bypassHeaders = Option.isNone(protectionBypass)
    ? {}
    : {
        "x-vercel-protection-bypass": Redacted.value(protectionBypass.value),
      };
  const health = yield* client
    .execute(
      HttpClientRequest.get(new URL("/health", previewUrl)).pipe(
        HttpClientRequest.setHeaders(bypassHeaders)
      )
    )
    .pipe(
      Effect.mapError(
        (cause) => new PreviewProofError({ cause, operation: "request" })
      )
    );
  const healthBody = yield* health.text.pipe(
    Effect.mapError(
      (cause) => new PreviewProofError({ cause, operation: "request" })
    )
  );
  const healthPayload = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(CodexProxyHealthResponse)
  )(healthBody);
  const completionsUrl = new URL("/v1/chat/completions", previewUrl);
  const post = (authorization?: string) =>
    client
      .execute(
        HttpClientRequest.post(completionsUrl).pipe(
          HttpClientRequest.setHeaders({
            "content-type": "application/json",
            ...bypassHeaders,
            ...(authorization === undefined ? {} : { authorization }),
          }),
          HttpClientRequest.bodyText(previewProofRequest, "application/json")
        )
      )
      .pipe(
        Effect.mapError(
          (cause) => new PreviewProofError({ cause, operation: "request" })
        )
      );
  const unauthenticated = yield* post();
  const invalid = yield* post("Bearer preview-proof-invalid");
  const authenticated = yield* post(`Bearer ${Redacted.value(internalToken)}`);
  const authenticatedBody = yield* authenticated.text;
  const dataLines = authenticatedBody
    .split("\n")
    .filter((line) => line.startsWith("data: "));
  const unauthorizedBody = yield* unauthenticated.text;
  const invalidBody = yield* invalid.text;
  const decodeError = Schema.decodeUnknownEffect(
    Schema.fromJsonString(CodexProxyErrorResponse)
  );

  yield* decodeError(unauthorizedBody);
  yield* decodeError(invalidBody);

  const result = PreviewProofResult.make({
    authenticatedStatus: authenticated.status,
    authorizationCodeLeak:
      authenticatedBody.includes("authorization_code") ||
      authenticatedBody.includes("code_verifier"),
    healthModeLive: healthPayload.mode === "live",
    healthReady: healthPayload.ok,
    healthReasoningEffortHigh: healthPayload.reasoningEffort === "high",
    healthStatus: health.status,
    invalidTokenStatus: invalid.status,
    rawPayloadLeak: authenticatedBody.includes("Reply only: OK."),
    requestedModelTerra: previewProofRequest.includes("gpt-5.6-terra"),
    streamContentTypeSse:
      authenticated.headers["content-type"]
        ?.split(";", 1)[0]
        ?.trim()
        .toLowerCase() === "text/event-stream",
    streamDataLines: dataLines.length,
    streamDone: authenticatedBody.includes("data: [DONE]"),
    tokenLeak:
      authenticatedBody.includes(Redacted.value(internalToken)) ||
      (!Option.isNone(protectionBypass) &&
        authenticatedBody.includes(Redacted.value(protectionBypass.value))),
    unauthenticatedStatus: unauthenticated.status,
  });

  yield* Schema.decodeUnknownEffect(PreviewProofContract)(result).pipe(
    Effect.mapError(
      (cause) =>
        new PreviewProofError({
          cause,
          operation: "assert",
          result,
        })
    )
  );

  return result;
}).pipe(
  Effect.provide(
    Layer.merge(
      BunHttpClient.layer,
      ConfigProvider.layer(ConfigProvider.fromEnv())
    )
  )
);

const main = Effect.gen(function* renderPreviewProof() {
  const exit = yield* Effect.exit(program);

  if (Exit.isSuccess(exit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(PreviewProofSuccess)
    )({
      result: exit.value,
      status: "proved",
    });
    return yield* Console.log(output);
  }

  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(PreviewProofBlocked)
  )({
    status: "blocked",
  });
  yield* Console.error(output);
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
});

await Effect.runPromise(main);

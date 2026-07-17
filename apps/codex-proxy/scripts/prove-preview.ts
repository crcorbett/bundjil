import { OpenAICompatibleChatCompletionRequest } from "@bundjil/codex-oauth";
import {
  Config,
  ConfigProvider,
  Data,
  Effect,
  Exit,
  Option,
  Redacted,
  Schema,
} from "effect";

import {
  CodexProxyErrorResponse,
  CodexProxyHealthResponse,
} from "../src/schemas.js";

declare const process: {
  exitCode: number | undefined;
};

const previewUrlConfig = Config.url("BUNDJIL_CODEX_PROXY_PREVIEW_URL");
const internalTokenConfig = Config.redacted(
  "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"
);
const protectionBypassConfig = Config.option(
  Config.redacted("BUNDJIL_CODEX_PROXY_VERCEL_BYPASS")
);

const previewProofRequest = Schema.encodeSync(
  Schema.fromJsonString(OpenAICompatibleChatCompletionRequest)
)(
  Schema.decodeUnknownSync(OpenAICompatibleChatCompletionRequest)({
    messages: [{ content: "Reply only: OK.", role: "user" }],
    model: "gpt-5.5",
    stream: true,
  })
);

const PreviewProofResult = Schema.Struct({
  authenticatedStatus: Schema.Number,
  authorizationCodeLeak: Schema.Boolean,
  healthModeLive: Schema.Boolean,
  healthReady: Schema.Boolean,
  healthStatus: Schema.Number,
  invalidTokenStatus: Schema.Number,
  rawPayloadLeak: Schema.Boolean,
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
  healthStatus: Schema.Literal(200),
  invalidTokenStatus: Schema.Literal(401),
  rawPayloadLeak: Schema.Literal(false),
  streamContentTypeSse: Schema.Literal(true),
  streamDataLines: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(1))),
  streamDone: Schema.Literal(true),
  tokenLeak: Schema.Literal(false),
  unauthenticatedStatus: Schema.Literal(401),
});

const encodePreviewProofSuccess = Schema.encodeSync(
  Schema.fromJsonString(PreviewProofSuccess)
);
const encodePreviewProofBlocked = Schema.encodeSync(
  Schema.fromJsonString(PreviewProofBlocked)
);

class PreviewProofError extends Data.TaggedError("PreviewProofError")<{
  readonly cause: unknown;
  readonly operation: "assert" | "request";
  readonly result?: typeof PreviewProofResult.Type;
}> {}

const fetchResponse = (request: Request) =>
  Effect.tryPromise({
    catch: (cause) => new PreviewProofError({ cause, operation: "request" }),
    try: () => fetch(request),
  });

const responseText = (response: Response) =>
  Effect.tryPromise({
    catch: (cause) => new PreviewProofError({ cause, operation: "request" }),
    try: () => response.text(),
  });

const program = Effect.gen(function* provePreview() {
  const previewUrl = yield* previewUrlConfig;
  const internalToken = yield* internalTokenConfig;
  const protectionBypass = yield* protectionBypassConfig;
  const makePreviewRequest = (
    url: URL,
    request: {
      readonly authorization?: string;
      readonly body?: string;
      readonly method: "GET" | "POST";
    }
  ) => {
    const headers = {
      "content-type": "application/json",
      ...(request.authorization === undefined
        ? {}
        : { authorization: request.authorization }),
      ...(Option.isNone(protectionBypass)
        ? {}
        : {
            "x-vercel-protection-bypass": Redacted.value(
              protectionBypass.value
            ),
          }),
    };

    return new Request(url, {
      headers,
      method: request.method,
      ...(request.body === undefined ? {} : { body: request.body }),
    });
  };
  const health = yield* fetchResponse(
    makePreviewRequest(new URL("/health", previewUrl), { method: "GET" })
  );
  const healthBody = yield* responseText(health);
  const healthPayload = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(CodexProxyHealthResponse)
  )(healthBody);
  const completionsUrl = new URL("/v1/chat/completions", previewUrl);
  const unauthenticated = yield* fetchResponse(
    makePreviewRequest(completionsUrl, {
      body: previewProofRequest,
      method: "POST",
    })
  );
  const invalid = yield* fetchResponse(
    makePreviewRequest(completionsUrl, {
      authorization: "Bearer preview-proof-invalid",
      body: previewProofRequest,
      method: "POST",
    })
  );
  const authenticated = yield* fetchResponse(
    makePreviewRequest(completionsUrl, {
      authorization: `Bearer ${Redacted.value(internalToken)}`,
      body: previewProofRequest,
      method: "POST",
    })
  );
  const authenticatedBody = yield* responseText(authenticated);
  const dataLines = authenticatedBody
    .split("\n")
    .filter((line) => line.startsWith("data: "));
  const unauthorizedBody = yield* responseText(unauthenticated);
  const invalidBody = yield* responseText(invalid);
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
    healthStatus: health.status,
    invalidTokenStatus: invalid.status,
    rawPayloadLeak: authenticatedBody.includes("Reply only: OK."),
    streamContentTypeSse:
      authenticated.headers.get("content-type") === "text/event-stream",
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
}).pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv())));

const exit = await Effect.runPromiseExit(program);

if (Exit.isSuccess(exit)) {
  console.log(
    encodePreviewProofSuccess({
      result: exit.value,
      status: "proved",
    })
  );
} else {
  console.error(encodePreviewProofBlocked({ status: "blocked" }));
  process.exitCode = 1;
}

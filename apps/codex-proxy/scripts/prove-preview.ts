import { createHash } from "node:crypto";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";

import {
  CodexResponsesModelId,
  OpenAICompatibleChatCompletionRequest,
  OpenAICompatibleProxyInternalToken,
} from "@bundjil/codex";
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
import {
  Config,
  ConfigProvider,
  Data,
  Effect,
  Exit,
  FileSystem,
  Layer,
  Option,
  Redacted,
  Schema,
  Stream,
} from "effect";
import { HttpClient, HttpClientRequest } from "effect/unstable/http";

import {
  CodexProxyErrorResponse,
  CodexProxyHealthResponse,
  CodexProxyVercelProtectionBypass,
} from "../src/schemas.js";

type ProofClassification =
  | "assertion_failed"
  | "config_failed"
  | "decode_failed"
  | "detail_artifact_failed"
  | "interrupted"
  | "output_closed"
  | "proved"
  | "request_failed"
  | "rerun_avoided"
  | "unexpected";

const proofIdentityPart = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-z0-9][a-z0-9._-]{0,63}$/))
);
const proofOutputDirectory = Schema.String.pipe(
  Schema.check(
    Schema.isPattern(/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9._/-]{1,160}$/)
  )
);
const PreviewProofClassification = Schema.Union([
  Schema.Literal("assertion_failed"),
  Schema.Literal("config_failed"),
  Schema.Literal("decode_failed"),
  Schema.Literal("detail_artifact_failed"),
  Schema.Literal("interrupted"),
  Schema.Literal("output_closed"),
  Schema.Literal("proved"),
  Schema.Literal("request_failed"),
  Schema.Literal("rerun_avoided"),
  Schema.Literal("unexpected"),
]);
const PreviewProofIdentity = Schema.Struct({
  candidateId: proofIdentityPart,
  packetId: proofIdentityPart,
});
const PreviewProofAttempt = Schema.Struct({
  identity: PreviewProofIdentity,
  requestAttempted: Schema.Literal(true),
  version: Schema.Literal(1),
});
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
const PreviewProofDetail = Schema.Struct({
  classification: PreviewProofClassification,
  identity: PreviewProofIdentity,
  priorDetail: Schema.optional(
    Schema.Struct({
      path: Schema.String,
      sha256: Schema.String.pipe(
        Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/))
      ),
    })
  ),
  requestAttempted: Schema.Boolean,
  result: Schema.optional(PreviewProofResult),
  version: Schema.Literal(1),
});
const PreviewProofReceipt = Schema.Struct({
  command: Schema.Literal(
    "bun run --filter @bundjil/codex-proxy proof:preview"
  ),
  classification: PreviewProofClassification,
  detail: Schema.optional(
    Schema.Struct({
      path: Schema.String,
      sha256: Schema.String.pipe(
        Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/))
      ),
    })
  ),
  identity: PreviewProofIdentity,
  intendedExitCode: Schema.Union([Schema.Literal(0), Schema.Literal(1)]),
  invariant: Schema.Literal(
    "Health, auth oracles, and authenticated SSE satisfy the bounded Preview proof contract."
  ),
  journeyId: Schema.Literal("BND-J03-proxy-health-auth-sse"),
  limitation: Schema.Literal(
    "This receipt proves only one named Preview probe run; it is not deployment, Production, provider-state, or source-identity proof."
  ),
  nonClaim: Schema.Literal(
    "No URL, secret, response body, SSE payload, provider log, or raw failure cause is retained or emitted."
  ),
  observedExitCode: Schema.Union([Schema.Literal(0), Schema.Literal(1)]),
  postcondition: Schema.Literal(
    "A bounded receipt is emitted and any available sanitized detail artifact is content-addressed."
  ),
  requestAttempted: Schema.Boolean,
  recoveryHint: Schema.Literal(
    "For a blocked receipt, inspect the bounded classification and detail artifact, correct the precondition, then use a new packet identity unless requestAttempted is false."
  ),
  result: Schema.optional(PreviewProofResult),
  status: Schema.Union([Schema.Literal("blocked"), Schema.Literal("proved")]),
  target: Schema.Literal("bundjil-codex-proxy Preview candidate"),
});

const previewProofReceiptContext = {
  command: "bun run --filter @bundjil/codex-proxy proof:preview" as const,
  invariant:
    "Health, auth oracles, and authenticated SSE satisfy the bounded Preview proof contract." as const,
  journeyId: "BND-J03-proxy-health-auth-sse" as const,
  limitation:
    "This receipt proves only one named Preview probe run; it is not deployment, Production, provider-state, or source-identity proof." as const,
  nonClaim:
    "No URL, secret, response body, SSE payload, provider log, or raw failure cause is retained or emitted." as const,
  postcondition:
    "A bounded receipt is emitted and any available sanitized detail artifact is content-addressed." as const,
  recoveryHint:
    "For a blocked receipt, inspect the bounded classification and detail artifact, correct the precondition, then use a new packet identity unless requestAttempted is false." as const,
  target: "bundjil-codex-proxy Preview candidate" as const,
};

class PreviewProofFailure extends Data.TaggedError("PreviewProofFailure")<{
  readonly classification: ProofClassification;
  readonly retainedDetail?: {
    readonly path: string;
    readonly sha256: string;
  };
  readonly result?: typeof PreviewProofResult.Type;
}> {}

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
const candidateIdConfig = Config.schema(
  proofIdentityPart,
  "BUNDJIL_PROOF_CANDIDATE_ID"
);
const packetIdConfig = Config.schema(
  proofIdentityPart,
  "BUNDJIL_PROOF_PACKET_ID"
);
const outputDirectoryConfig = Config.withDefault(
  Config.schema(proofOutputDirectory, "BUNDJIL_PROOF_OUTPUT_DIRECTORY"),
  "tmp/preview-proof"
);
const previewProofModel = CodexResponsesModelId.make("gpt-5.6-terra");
const previewProofMaxBodyBytes = 64 * 1024;

const sha256 = (content: string) =>
  createHash("sha256").update(content).digest("hex");

const writeJsonAtomically = Effect.fn("PreviewProof.writeJsonAtomically")(
  function* (path: string, encodedJson: string) {
    const fileSystem = yield* FileSystem.FileSystem;
    const content = `${encodedJson}\n`;
    const temporaryPath = `${path}.tmp`;
    return yield* fileSystem
      .makeDirectory(dirname(path), { recursive: true, mode: 0o700 })
      .pipe(
        Effect.andThen(
          fileSystem.writeFileString(temporaryPath, content, { mode: 0o600 })
        ),
        Effect.andThen(fileSystem.chmod(temporaryPath, 0o600)),
        Effect.andThen(fileSystem.rename(temporaryPath, path)),
        Effect.as({ sha256: sha256(content) }),
        Effect.mapError(
          () =>
            new PreviewProofFailure({
              classification: "detail_artifact_failed",
            })
        )
      );
  }
);

/* oxlint-disable eslint-plugin-promise/prefer-await-to-callbacks -- stdout close is an error-first callback boundary. */
const writeReceipt = (
  stream: {
    write: (
      chunk: string,
      callback: (error: Error | null | undefined) => void
    ) => boolean;
  },
  output: string
) =>
  // oxlint-disable-next-line typescript-eslint/no-invalid-void-type -- callback completion has no value.
  Effect.callback<void, PreviewProofFailure>((resume) => {
    stream.write(`${output}\n`, (error) => {
      resume(
        error === null || error === undefined
          ? Effect.void
          : Effect.fail(
              new PreviewProofFailure({ classification: "output_closed" })
            )
      );
    });
  });
/* oxlint-enable eslint-plugin-promise/prefer-await-to-callbacks */

const readBoundedBody = <E>(response: {
  readonly stream: Stream.Stream<Uint8Array, E>;
}) =>
  Stream.runFoldEffect(
    response.stream,
    () => ({ bytes: 0, chunks: [] as Uint8Array[] }),
    (state, chunk) => {
      const bytes = state.bytes + chunk.byteLength;
      if (bytes > previewProofMaxBodyBytes) {
        return Effect.fail(
          new PreviewProofFailure({ classification: "request_failed" })
        );
      }
      return Effect.succeed({ bytes, chunks: [...state.chunks, chunk] });
    }
  ).pipe(
    Effect.map((state) => {
      const body = new Uint8Array(state.bytes);
      let offset = 0;
      for (const chunk of state.chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return new TextDecoder().decode(body);
    })
  );

const context = Effect.gen(function* loadContext() {
  const candidateId = yield* candidateIdConfig.pipe(
    Effect.mapError(
      () => new PreviewProofFailure({ classification: "config_failed" })
    )
  );
  const packetId = yield* packetIdConfig.pipe(
    Effect.mapError(
      () => new PreviewProofFailure({ classification: "config_failed" })
    )
  );
  const outputDirectory = yield* outputDirectoryConfig.pipe(
    Effect.mapError(
      () => new PreviewProofFailure({ classification: "config_failed" })
    )
  );
  const outputRoot = resolve(process.cwd(), outputDirectory);
  if (relative(process.cwd(), outputRoot).startsWith("..")) {
    return yield* new PreviewProofFailure({ classification: "config_failed" });
  }
  const identity = PreviewProofIdentity.make({ candidateId, packetId });
  const artifactBase = `${candidateId}--${packetId}`;
  return {
    attemptPath: resolve(outputRoot, `${artifactBase}.attempt.json`),
    detailPath: resolve(outputRoot, `${artifactBase}.detail.json`),
    identity,
  };
}).pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv())));

const runProof = (
  proof: typeof PreviewProofIdentity.Type,
  attemptPath: string,
  detailPath: string
) =>
  Effect.gen(function* provePreview() {
    const fileSystem = yield* FileSystem.FileSystem;
    const attemptExists = yield* fileSystem.exists(attemptPath).pipe(
      Effect.mapError(
        () =>
          new PreviewProofFailure({
            classification: "detail_artifact_failed",
          })
      )
    );
    if (attemptExists) {
      const detailExists = yield* fileSystem.exists(detailPath).pipe(
        Effect.mapError(
          () =>
            new PreviewProofFailure({
              classification: "detail_artifact_failed",
            })
        )
      );
      if (!detailExists) {
        return yield* new PreviewProofFailure({
          classification: "detail_artifact_failed",
        });
      }
      const retainedDetailContent = yield* fileSystem
        .readFileString(detailPath)
        .pipe(
          Effect.mapError(
            () =>
              new PreviewProofFailure({
                classification: "detail_artifact_failed",
              })
          )
        );
      const retainedDetail = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(PreviewProofDetail),
        { onExcessProperty: "error" }
      )(retainedDetailContent).pipe(
        Effect.mapError(
          () =>
            new PreviewProofFailure({
              classification: "detail_artifact_failed",
            })
        )
      );
      if (
        retainedDetail.identity.candidateId !== proof.candidateId ||
        retainedDetail.identity.packetId !== proof.packetId
      ) {
        return yield* new PreviewProofFailure({
          classification: "detail_artifact_failed",
        });
      }
      return yield* new PreviewProofFailure({
        classification: "rerun_avoided",
        retainedDetail: {
          path: relative(process.cwd(), detailPath),
          sha256: sha256(retainedDetailContent),
        },
      });
    }
    const previewUrl = yield* previewUrlConfig.pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "config_failed" })
      )
    );
    const internalToken = yield* internalTokenConfig.pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "config_failed" })
      )
    );
    const protectionBypass = yield* protectionBypassConfig.pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "config_failed" })
      )
    );
    const client = yield* HttpClient.HttpClient;
    const previewProofRequest = yield* Schema.encodeEffect(
      Schema.fromJsonString(OpenAICompatibleChatCompletionRequest)
    )(
      OpenAICompatibleChatCompletionRequest.make({
        messages: [{ content: "Reply only: OK.", role: "user" }],
        model: previewProofModel,
        stream: true,
      })
    ).pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "decode_failed" })
      )
    );
    const bypassHeaders = Option.isNone(protectionBypass)
      ? {}
      : {
          "x-vercel-protection-bypass": Redacted.value(protectionBypass.value),
        };
    const encodedAttempt = yield* Schema.encodeEffect(
      Schema.fromJsonString(PreviewProofAttempt)
    )(
      PreviewProofAttempt.make({
        identity: proof,
        requestAttempted: true,
        version: 1,
      })
    ).pipe(
      Effect.mapError(
        () =>
          new PreviewProofFailure({
            classification: "detail_artifact_failed",
          })
      )
    );
    yield* writeJsonAtomically(attemptPath, encodedAttempt);
    const health = yield* client
      .execute(
        HttpClientRequest.get(new URL("/health", previewUrl)).pipe(
          HttpClientRequest.setHeaders(bypassHeaders)
        )
      )
      .pipe(
        Effect.mapError(
          () => new PreviewProofFailure({ classification: "request_failed" })
        )
      );
    const healthBody = yield* readBoundedBody(health).pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "request_failed" })
      )
    );
    const healthPayload = yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(CodexProxyHealthResponse)
    )(healthBody).pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "decode_failed" })
      )
    );
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
            () => new PreviewProofFailure({ classification: "request_failed" })
          )
        );
    const unauthenticated = yield* post();
    const invalid = yield* post("Bearer preview-proof-invalid");
    const authenticated = yield* post(
      `Bearer ${Redacted.value(internalToken)}`
    );
    const authenticatedBody = yield* readBoundedBody(authenticated).pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "request_failed" })
      )
    );
    const unauthorizedBody = yield* readBoundedBody(unauthenticated).pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "request_failed" })
      )
    );
    const invalidBody = yield* readBoundedBody(invalid).pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "request_failed" })
      )
    );
    const decodeError = Schema.decodeUnknownEffect(
      Schema.fromJsonString(CodexProxyErrorResponse)
    );
    yield* decodeError(unauthorizedBody).pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "decode_failed" })
      )
    );
    yield* decodeError(invalidBody).pipe(
      Effect.mapError(
        () => new PreviewProofFailure({ classification: "decode_failed" })
      )
    );
    const dataLines = authenticatedBody
      .split("\n")
      .filter((line) => line.startsWith("data: "));
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
        () =>
          new PreviewProofFailure({
            classification: "assertion_failed",
            result,
          })
      )
    );
    return result;
  });

const main = Effect.gen(function* renderPreviewProof() {
  const contextExit = yield* Effect.exit(context);
  if (Exit.isFailure(contextExit)) {
    const output = yield* Schema.encodeEffect(
      Schema.fromJsonString(PreviewProofReceipt)
    )(
      PreviewProofReceipt.make({
        ...previewProofReceiptContext,
        classification: "config_failed",
        identity: PreviewProofIdentity.make({
          candidateId: "unknown",
          packetId: "unknown",
        }),
        intendedExitCode: 1,
        observedExitCode: 1,
        requestAttempted: false,
        status: "blocked",
      })
    );
    yield* writeReceipt(process.stderr, output).pipe(
      Effect.catch(() => Effect.void)
    );
    return yield* Effect.sync(() => {
      process.exitCode = 1;
    });
  }
  const proof = contextExit.value;
  const boundedOutcome = yield* Effect.raceFirst(
    runProof(proof.identity, proof.attemptPath, proof.detailPath),
    Effect.callback<never, PreviewProofFailure>((resume) => {
      const interrupt = () => {
        resume(
          Effect.fail(
            new PreviewProofFailure({ classification: "interrupted" })
          )
        );
      };
      process.once("SIGINT", interrupt);
      process.once("SIGTERM", interrupt);
      return Effect.sync(() => {
        process.off("SIGINT", interrupt);
        process.off("SIGTERM", interrupt);
      });
    })
  ).pipe(
    Effect.map((result) => ({
      classification: "proved" as const,
      retainedDetail: undefined,
      result,
    })),
    Effect.catch((error) =>
      Effect.succeed({
        classification: error.classification,
        retainedDetail: error.retainedDetail,
        result: error.result,
      })
    )
  );
  const fileSystem = yield* FileSystem.FileSystem;
  const requestAttempted = yield* fileSystem
    .exists(proof.attemptPath)
    .pipe(
      Effect.mapError(
        () =>
          new PreviewProofFailure({ classification: "detail_artifact_failed" })
      )
    );
  let detail = boundedOutcome.retainedDetail;
  if (detail === undefined) {
    const encodedDetail = yield* Schema.encodeEffect(
      Schema.fromJsonString(PreviewProofDetail)
    )(
      PreviewProofDetail.make({
        classification: boundedOutcome.classification,
        identity: proof.identity,
        requestAttempted,
        ...(boundedOutcome.result === undefined
          ? {}
          : { result: boundedOutcome.result }),
        version: 1,
      })
    );
    detail = yield* writeJsonAtomically(proof.detailPath, encodedDetail).pipe(
      Effect.map(({ sha256: artifactSha256 }) => ({
        path: relative(process.cwd(), proof.detailPath),
        sha256: artifactSha256,
      }))
    );
  }
  const receipt = PreviewProofReceipt.make({
    ...previewProofReceiptContext,
    classification: boundedOutcome.classification,
    detail,
    identity: proof.identity,
    intendedExitCode: boundedOutcome.classification === "proved" ? 0 : 1,
    observedExitCode: boundedOutcome.classification === "proved" ? 0 : 1,
    requestAttempted,
    ...(boundedOutcome.result === undefined
      ? {}
      : { result: boundedOutcome.result }),
    status: boundedOutcome.classification === "proved" ? "proved" : "blocked",
  });
  const output = yield* Schema.encodeEffect(
    Schema.fromJsonString(PreviewProofReceipt)
  )(receipt);
  if (receipt.status === "proved") {
    const stdoutExit = yield* Effect.exit(writeReceipt(process.stdout, output));
    if (Exit.isSuccess(stdoutExit)) {
      return yield* Effect.void;
    }
    const outputClosedDetailPath = proof.detailPath.replace(
      /\.detail\.json$/,
      ".output-closed.detail.json"
    );
    const encodedOutputClosedDetail = yield* Schema.encodeEffect(
      Schema.fromJsonString(PreviewProofDetail)
    )(
      PreviewProofDetail.make({
        classification: "output_closed",
        identity: proof.identity,
        priorDetail: detail,
        requestAttempted: true,
        version: 1,
      })
    );
    const outputClosedDetail = yield* writeJsonAtomically(
      outputClosedDetailPath,
      encodedOutputClosedDetail
    ).pipe(
      Effect.map(({ sha256: artifactSha256 }) => ({
        path: relative(process.cwd(), outputClosedDetailPath),
        sha256: artifactSha256,
      }))
    );
    const blockedOutput = yield* Schema.encodeEffect(
      Schema.fromJsonString(PreviewProofReceipt)
    )(
      PreviewProofReceipt.make({
        ...previewProofReceiptContext,
        classification: "output_closed",
        detail: outputClosedDetail,
        identity: proof.identity,
        intendedExitCode: 1,
        observedExitCode: 1,
        requestAttempted: true,
        status: "blocked",
      })
    );
    yield* writeReceipt(process.stderr, blockedOutput).pipe(
      Effect.catch(() => Effect.void)
    );
    return yield* Effect.sync(() => {
      process.exitCode = 1;
    });
  }
  yield* writeReceipt(process.stderr, output).pipe(
    Effect.catch(() => Effect.void)
  );
  return yield* Effect.sync(() => {
    process.exitCode = 1;
  });
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      BunFileSystem.layer,
      BunHttpClient.layer,
      ConfigProvider.layer(ConfigProvider.fromEnv())
    )
  )
);

await Effect.runPromise(main);

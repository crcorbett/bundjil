import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { join, relative } from "node:path";
import process from "node:process";

import {
  OpenAICompatibleChatCompletionChunk,
  OpenAICompatibleChatCompletionRequest,
} from "@bundjil/codex";
import { Schema } from "effect";
import { describe, it } from "vitest";

import {
  CodexProxyErrorResponse,
  CodexProxyHealthResponse,
} from "../src/schemas.js";

const encodeHealthResponse = Schema.encodeSync(
  Schema.fromJsonString(CodexProxyHealthResponse)
);
const encodeErrorResponse = Schema.encodeSync(
  Schema.fromJsonString(CodexProxyErrorResponse)
);
const encodeChatCompletionChunk = Schema.encodeSync(
  Schema.fromJsonString(OpenAICompatibleChatCompletionChunk)
);
const decodeChatCompletionRequest = Schema.decodeUnknownSync(
  Schema.fromJsonString(OpenAICompatibleChatCompletionRequest)
);

const liveHealthResponse = encodeHealthResponse(
  CodexProxyHealthResponse.make({
    mode: "live",
    ok: true,
    reasoningEffort: "high",
    service: "bundjil-codex-proxy",
  })
);
const missingBearerResponse = encodeErrorResponse(
  CodexProxyErrorResponse.make({
    error: {
      code: "unauthorized",
      message: "Missing bearer.",
    },
  })
);
const invalidBearerResponse = encodeErrorResponse(
  CodexProxyErrorResponse.make({
    error: {
      code: "unauthorized",
      message: "Invalid bearer.",
    },
  })
);
const fixtureSse = `data: ${encodeChatCompletionChunk(
  Schema.decodeUnknownSync(OpenAICompatibleChatCompletionChunk)({
    choices: [
      {
        delta: {
          content: "fixture model body",
        },
        index: 0,
      },
    ],
    created: 1_700_000_000,
    id: "chatcmpl-preview-proof-fixture",
    model: "gpt-5.5",
    object: "chat.completion.chunk",
  })
)}\n\ndata: [DONE]\n\n`;

const runProofFixture = async (
  authenticatedStatus: number,
  protectionBypass?: string,
  authenticatedContentType = "text/event-stream",
  existingOutputDirectory?: string,
  authenticatedBody = fixtureSse,
  closeOutputConsumer = false,
  hangAuthenticatedResponse = false,
  interruptHangingProof = false,
  omitInternalToken = false
) => {
  const internalToken = "preview-proof-test-token";
  const bypassHeaders: (string | undefined)[] = [];
  const requestBodies: string[] = [];
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    request.on("end", () => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const bypassHeader = request.headers["x-vercel-protection-bypass"];
      bypassHeaders.push(
        Array.isArray(bypassHeader) ? bypassHeader.at(0) : bypassHeader
      );
      requestBodies.push(Buffer.concat(chunks).toString());

      if (url.pathname === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(liveHealthResponse);
        return;
      }

      if (request.headers.authorization === undefined) {
        response.writeHead(401, { "content-type": "application/json" });
        response.end(missingBearerResponse);
        return;
      }

      if (request.headers.authorization === "Bearer preview-proof-invalid") {
        response.writeHead(401, { "content-type": "application/json" });
        response.end(invalidBearerResponse);
        return;
      }

      response.writeHead(authenticatedStatus, {
        "content-type": authenticatedContentType,
      });
      if (hangAuthenticatedResponse) {
        if (interruptHangingProof) {
          setTimeout(() => {
            // oxlint-disable-next-line eslint/no-use-before-define -- the delayed callback runs after child creation.
            interruptChild();
          }, 25);
        }
        return;
      }
      response.end(authenticatedBody, () => {
        if (closeOutputConsumer) {
          // oxlint-disable-next-line eslint/no-use-before-define -- the callback runs after child creation.
          closeStdout();
        }
      });
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("Preview proof fixture did not bind a TCP port.");
  }

  const fixtureRoot = join(process.cwd(), "tmp");
  if (existingOutputDirectory === undefined) {
    mkdirSync(fixtureRoot, { recursive: true });
  }
  const outputDirectory =
    existingOutputDirectory ?? mkdtempSync(join(fixtureRoot, "preview-proof-"));
  const env: typeof process.env = {
    ...process.env,
    BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN: internalToken,
    BUNDJIL_CODEX_PROXY_PREVIEW_URL: `http://127.0.0.1:${address.port}`,
    BUNDJIL_PROOF_CANDIDATE_ID: "candidate-preview-proof",
    BUNDJIL_PROOF_OUTPUT_DIRECTORY: relative(process.cwd(), outputDirectory),
    BUNDJIL_PROOF_PACKET_ID: "packet-preview-proof",
  };
  delete env["BUNDJIL_CODEX_PROXY_VERCEL_BYPASS"];
  if (omitInternalToken) {
    delete env["BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"];
  }
  if (protectionBypass !== undefined) {
    env["BUNDJIL_CODEX_PROXY_VERCEL_BYPASS"] = protectionBypass;
  }

  const child = spawn(
    "bun",
    [
      "--conditions=@bundjil/source",
      new URL("../scripts/prove-preview.ts", import.meta.url).pathname,
    ],
    {
      env,
    }
  );
  if (child.stderr === null || child.stdout === null) {
    throw new Error("Preview proof fixture did not create output streams.");
  }
  const closeStdout = () => {
    child.stdout?.destroy();
  };
  const interruptChild = () => {
    child.kill("SIGTERM");
  };

  const stderrChunks: Buffer[] = [];
  const stdoutChunks: Buffer[] = [];
  child.stderr.on("data", (chunk: Buffer) => {
    stderrChunks.push(chunk);
  });
  child.stdout.on("data", (chunk: Buffer) => {
    stdoutChunks.push(chunk);
  });

  const exit = Promise.withResolvers<number | null>();
  child.once("error", exit.reject);
  child.once("close", exit.resolve);
  const exitCode = await exit.promise;
  const stderr = Buffer.concat(stderrChunks).toString();
  const stdout = Buffer.concat(stdoutChunks).toString();
  const closed = once(server, "close");
  server.close();
  await closed;

  return {
    bypassHeaders,
    exitCode,
    outputDirectory,
    requestBodies,
    stderr,
    stdout,
  };
};

describe("preview proof", () => {
  it("proves a complete live preview contract without emitting secret material", async () => {
    const result = await runProofFixture(200);

    assert.equal(result.exitCode, 0, result.stderr);
    assert.match(result.stdout, /"status":"proved"/);
    assert.match(
      result.stdout,
      /"command":"bun run --filter @bundjil\/codex-proxy proof:preview"/
    );
    assert.match(result.stdout, /"journeyId":"BND-J03-proxy-health-auth-sse"/);
    assert.match(
      result.stdout,
      /"target":"bundjil-codex-proxy Preview candidate"/
    );
    assert.match(result.stdout, /"invariant":"Health, auth oracles/);
    assert.match(result.stdout, /"recoveryHint":"For a blocked receipt/);
    assert.match(result.stdout, /"postcondition":"A bounded receipt/);
    assert.match(result.stdout, /"limitation":"This receipt proves only/);
    assert.match(result.stdout, /"nonClaim":"No URL, secret/);
    assert.match(result.stdout, /"intendedExitCode":0/);
    assert.match(result.stdout, /"observedExitCode":0/);
    assert.match(result.stdout, /"healthReasoningEffortHigh":true/);
    assert.match(result.stdout, /"requestedModelTerra":true/);
    assert.match(
      result.stdout,
      /"detail":\{"path":".*detail.json","sha256":"[a-f0-9]{64}"\}/
    );
    assert.doesNotMatch(result.stdout, /preview-proof-test-token/);
    assert.doesNotMatch(result.stdout, /Reply only: OK\./);
    assert.doesNotMatch(result.stdout, /fixture model body/);
    assert.equal(result.stderr, "");
    assert.deepEqual(result.bypassHeaders, [
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    assert.equal(result.requestBodies.length, 4);
    for (const body of result.requestBodies.slice(1)) {
      const payload = decodeChatCompletionRequest(body);
      assert.equal(payload.model, "gpt-5.6-terra");
      assert.doesNotMatch(body, /"reasoning"/);
    }
    const detailPath = join(
      result.outputDirectory,
      "candidate-preview-proof--packet-preview-proof.detail.json"
    );
    const detail = readFileSync(detailPath, "utf-8");
    assert.doesNotMatch(
      detail,
      /preview-proof-test-token|Reply only: OK\.|fixture model body/
    );
    rmSync(result.outputDirectory, { force: true, recursive: true });
  });

  it("forwards the configured protection bypass without emitting it", async () => {
    const result = await runProofFixture(200, "preview-proof-bypass-token");

    assert.equal(result.exitCode, 0);
    assert.deepEqual(result.bypassHeaders, [
      "preview-proof-bypass-token",
      "preview-proof-bypass-token",
      "preview-proof-bypass-token",
      "preview-proof-bypass-token",
    ]);
    assert.doesNotMatch(result.stdout, /preview-proof-bypass-token/);
    assert.equal(result.stderr, "");
    rmSync(result.outputDirectory, { force: true, recursive: true });
  });

  it("accepts an SSE content type with a charset parameter", async () => {
    const result = await runProofFixture(
      200,
      undefined,
      "text/event-stream; charset=utf-8"
    );

    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /"streamContentTypeSse":true/);
    assert.equal(result.stderr, "");
    rmSync(result.outputDirectory, { force: true, recursive: true });
  });

  it("fails an unauthorized authenticated fixture instead of treating it as proof", async () => {
    const protectionBypass = "preview-proof-blocked-bypass-token";
    const result = await runProofFixture(401, protectionBypass);

    assert.equal(result.exitCode, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /"status":"blocked"/);
    assert.match(result.stderr, /"journeyId":"BND-J03-proxy-health-auth-sse"/);
    assert.match(result.stderr, /"intendedExitCode":1/);
    assert.match(result.stderr, /"observedExitCode":1/);
    assert.doesNotMatch(result.stderr, /preview-proof-test-token/);
    assert.doesNotMatch(result.stdout, /preview-proof-blocked-bypass-token/);
    assert.doesNotMatch(result.stderr, /preview-proof-blocked-bypass-token/);
    assert.doesNotMatch(result.stderr, /fixture model body/);
    rmSync(result.outputDirectory, { force: true, recursive: true });
  });

  it("does not repeat a completed request identity when a receipt must be retried", async () => {
    const first = await runProofFixture(200);
    const detailPath = join(
      first.outputDirectory,
      "candidate-preview-proof--packet-preview-proof.detail.json"
    );
    const retainedBeforeRetry = readFileSync(detailPath, "utf-8");
    const retry = await runProofFixture(
      200,
      undefined,
      "text/event-stream",
      first.outputDirectory
    );

    assert.equal(first.exitCode, 0, first.stderr);
    assert.equal(retry.exitCode, 1);
    assert.match(retry.stderr, /"classification":"rerun_avoided"/);
    assert.match(
      retry.stderr,
      /"target":"bundjil-codex-proxy Preview candidate"/
    );
    assert.match(retry.stderr, /"observedExitCode":1/);
    assert.match(retry.stderr, /"detail":\{"path":".*\.detail\.json"/);
    assert.equal(retry.requestBodies.length, 0);
    assert.equal(readFileSync(detailPath, "utf-8"), retainedBeforeRetry);
    rmSync(first.outputDirectory, { force: true, recursive: true });
  });

  it("does not mark missing preflight configuration as attempted and permits correction", async () => {
    const missing = await runProofFixture(
      200,
      undefined,
      "text/event-stream",
      undefined,
      fixtureSse,
      false,
      false,
      false,
      true
    );
    const corrected = await runProofFixture(
      200,
      undefined,
      "text/event-stream",
      missing.outputDirectory
    );

    assert.equal(missing.exitCode, 1);
    assert.equal(missing.requestBodies.length, 0);
    assert.match(missing.stderr, /"classification":"config_failed"/);
    assert.match(missing.stderr, /"requestAttempted":false/);
    assert.match(missing.stderr, /"journeyId":"BND-J03-proxy-health-auth-sse"/);
    assert.match(missing.stderr, /"intendedExitCode":1/);
    assert.equal(corrected.exitCode, 0, corrected.stderr);
    assert.equal(corrected.requestBodies.length, 4);
    rmSync(missing.outputDirectory, { force: true, recursive: true });
  });

  it("blocks a missing or corrupt retained detail without repeating the model request", async () => {
    const first = await runProofFixture(200);
    const detailPath = join(
      first.outputDirectory,
      "candidate-preview-proof--packet-preview-proof.detail.json"
    );
    unlinkSync(detailPath);
    const missing = await runProofFixture(
      200,
      undefined,
      "text/event-stream",
      first.outputDirectory
    );
    writeFileSync(detailPath, "not-json");
    const corrupt = await runProofFixture(
      200,
      undefined,
      "text/event-stream",
      first.outputDirectory
    );

    assert.equal(missing.exitCode, 1);
    assert.match(missing.stderr, /"classification":"detail_artifact_failed"/);
    assert.equal(missing.requestBodies.length, 0);
    assert.equal(corrupt.exitCode, 1);
    assert.match(corrupt.stderr, /"classification":"detail_artifact_failed"/);
    assert.equal(corrupt.requestBodies.length, 0);
    rmSync(first.outputDirectory, { force: true, recursive: true });
  });

  it("bounds an oversized authenticated response without retaining its content", async () => {
    const oversizedPayload = fixtureSse.repeat(10_000);
    const result = await runProofFixture(
      200,
      undefined,
      "text/event-stream",
      undefined,
      oversizedPayload
    );

    assert.equal(result.exitCode, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /"classification":"request_failed"/);
    assert.doesNotMatch(result.stderr, /fixture model body/);
    const detailPath = join(
      result.outputDirectory,
      "candidate-preview-proof--packet-preview-proof.detail.json"
    );
    assert.doesNotMatch(
      readFileSync(detailPath, "utf-8"),
      /fixture model body/
    );
    rmSync(result.outputDirectory, { force: true, recursive: true });
  });

  it("blocks a closed stdout consumer after proof instead of preserving a proved exit", async () => {
    const result = await runProofFixture(
      200,
      undefined,
      "text/event-stream",
      undefined,
      fixtureSse,
      true
    );

    assert.equal(result.exitCode, 1, result.stderr);
    assert.match(result.stderr, /"classification":"output_closed"/);
    assert.match(result.stderr, /\.output-closed\.detail\.json/);
    assert.match(result.stderr, /"journeyId":"BND-J03-proxy-health-auth-sse"/);
    assert.match(result.stderr, /"observedExitCode":1/);
    assert.doesNotMatch(result.stderr, /fixture model body/);
    const detailPath = join(
      result.outputDirectory,
      "candidate-preview-proof--packet-preview-proof.detail.json"
    );
    const retainedProof = readFileSync(detailPath, "utf-8");
    assert.match(retainedProof, /"classification":"proved"/);
    const outputClosedDetail = readFileSync(
      join(
        result.outputDirectory,
        "candidate-preview-proof--packet-preview-proof.output-closed.detail.json"
      ),
      "utf-8"
    );
    assert.match(outputClosedDetail, /"classification":"output_closed"/);
    assert.match(outputClosedDetail, /"priorDetail":\{/);
    assert.match(
      outputClosedDetail,
      new RegExp(createHash("sha256").update(retainedProof).digest("hex"))
    );
    rmSync(result.outputDirectory, { force: true, recursive: true });
  });

  it("interrupts a hanging authenticated stream promptly and retains a blocked receipt", async () => {
    const startedAt = Date.now();
    const result = await runProofFixture(
      200,
      undefined,
      "text/event-stream",
      undefined,
      fixtureSse,
      false,
      true,
      true
    );

    assert.ok(Date.now() - startedAt < 2000);
    assert.equal(result.exitCode, 1, result.stderr);
    assert.equal(result.requestBodies.length, 4);
    assert.match(result.stderr, /"classification":"interrupted"/);
    assert.match(result.stderr, /"journeyId":"BND-J03-proxy-health-auth-sse"/);
    assert.match(result.stderr, /"intendedExitCode":1/);
    assert.doesNotMatch(result.stderr, /fixture model body|Reply only: OK\./);
    const detailPath = join(
      result.outputDirectory,
      "candidate-preview-proof--packet-preview-proof.detail.json"
    );
    assert.match(
      readFileSync(detailPath, "utf-8"),
      /"classification":"interrupted"/
    );
    rmSync(result.outputDirectory, { force: true, recursive: true });
  });
});

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import process from "node:process";

import { OpenAICompatibleChatCompletionChunk } from "@bundjil/codex-oauth";
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

const liveHealthResponse = encodeHealthResponse(
  CodexProxyHealthResponse.make({
    mode: "live",
    ok: true,
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
  authenticatedContentType = "text/event-stream"
) => {
  const internalToken = "preview-proof-test-token";
  const bypassHeaders: (string | undefined)[] = [];
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const bypassHeader = request.headers["x-vercel-protection-bypass"];
    bypassHeaders.push(
      Array.isArray(bypassHeader) ? bypassHeader.at(0) : bypassHeader
    );

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
    response.end(fixtureSse);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("Preview proof fixture did not bind a TCP port.");
  }

  const env: typeof process.env = {
    ...process.env,
    BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN: internalToken,
    BUNDJIL_CODEX_PROXY_PREVIEW_URL: `http://127.0.0.1:${address.port}`,
  };
  delete env["BUNDJIL_CODEX_PROXY_VERCEL_BYPASS"];
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

  return { bypassHeaders, exitCode, stderr, stdout };
};

describe("preview proof", () => {
  it("proves a complete live preview contract without emitting secret material", async () => {
    const result = await runProofFixture(200);

    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /"status":"proved"/);
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
  });

  it("fails an unauthorized authenticated fixture instead of treating it as proof", async () => {
    const protectionBypass = "preview-proof-blocked-bypass-token";
    const result = await runProofFixture(401, protectionBypass);

    assert.equal(result.exitCode, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /"status":"blocked"/);
    assert.doesNotMatch(result.stderr, /preview-proof-test-token/);
    assert.doesNotMatch(result.stdout, /preview-proof-blocked-bypass-token/);
    assert.doesNotMatch(result.stderr, /preview-proof-blocked-bypass-token/);
    assert.doesNotMatch(result.stderr, /fixture model body/);
  });
});

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

import { Schema } from "effect";
import { describe, it } from "vitest";

import { ProductionPreflightReceipt } from "../agent/production-preflight.js";

const fingerprint = (character: string) => character.repeat(64);
const sourceSha = "0f30d3b000000000000000000000000000000000";
const projects = {
  agent: {
    deploymentProtection: true,
    project: "bundjil-agent",
    scope: "personal",
    stableDomain: "bundjil-agent.vercel.app",
    teamId: "team_1LX7ZujbijowTv8J9k0aU7nD",
  },
  proxy: {
    deploymentProtection: true,
    project: "bundjil-codex-proxy",
    scope: "personal",
    stableDomain: "bundjil-codex-proxy.vercel.app",
    teamId: "team_1LX7ZujbijowTv8J9k0aU7nD",
  },
} as const;

const beforeFirstMutation = {
  adapter: "vercel-readonly-metadata-v1",
  agent: projects.agent,
  operationAuthority: "external-receipt-required",
  inventory: {
    previewIdentityReuse: false,
    productionAgentActivation: "absent",
    productionProxyActivation: "absent",
  },
  proxy: projects.proxy,
  readOnly: true,
  source: { clean: true, pushedSha: sourceSha },
  stage: "before-first-mutation",
} as const;

const blockedProxyProvisioned = {
  ...beforeFirstMutation,
  inventory: {
    previewIdentityReuse: false,
    productionAgentActivation: "absent",
    productionProxyActivation: "provisioned",
  },
  previewIdentity: {
    cipherKeyId: "preview-key",
    derivedFenceKeyFingerprint: fingerprint("a"),
    derivedLockKeyFingerprint: fingerprint("b"),
    derivedProfileKeyFingerprint: fingerprint("c"),
    namespaceFingerprint: fingerprint("d"),
    subjectFingerprint: fingerprint("e"),
  },
  productionIdentity: {
    cipherKeyId: "production-key",
    derivedFenceKeyFingerprint: fingerprint("f"),
    derivedLockKeyFingerprint: fingerprint("0"),
    derivedProfileKeyFingerprint: fingerprint("1"),
    namespaceFingerprint: fingerprint("2"),
    subjectFingerprint: fingerprint("3"),
  },
  proxy: {
    ...projects.proxy,
    mode: "live",
    variables: [],
  },
  stage: "proxy-provisioned",
  storedProfileProof: {
    ciphertextPresent: true,
    envelopeVersion2: true,
    expiryValid: true,
    found: true,
    markerLeakFalse: true,
    profileKindSubscription: true,
    refreshCapable: true,
    requiresReauthenticationFalse: true,
  },
} as const;

const runPreflight = async (
  snapshot: string,
  options: { readonly detailPath?: string; readonly mode?: number } = {}
) => {
  const cwd = await mkdtemp(join(tmpdir(), "bundjil-preflight-"));
  const snapshotPath = join(cwd, "snapshot.json");
  await writeFile(snapshotPath, snapshot, { mode: options.mode ?? 0o600 });
  await chmod(snapshotPath, options.mode ?? 0o600);
  const child = spawn(
    "bun",
    [new URL("../scripts/production-preflight.ts", import.meta.url).pathname],
    {
      cwd,
      env: {
        ...process.env,
        BUNDJIL_PRODUCTION_PREFLIGHT_DETAILS_PATH:
          options.detailPath ?? "details/preflight.json",
        BUNDJIL_PRODUCTION_PREFLIGHT_SNAPSHOT: snapshotPath,
      },
    }
  );
  if (child.stderr === null || child.stdout === null) {
    throw new Error("Production preflight did not create output streams.");
  }
  const stderr: Buffer[] = [];
  const stdout: Buffer[] = [];
  child.stderr.on("data", (chunk: Buffer) => {
    stderr.push(chunk);
  });
  child.stdout.on("data", (chunk: Buffer) => {
    stdout.push(chunk);
  });
  const exit = Promise.withResolvers<number | null>();
  child.once("error", exit.reject);
  child.once("close", exit.resolve);
  const exitCode = await exit.promise;
  return {
    cleanup: () => rm(cwd, { force: true, recursive: true }),
    cwd,
    exitCode,
    stderr: Buffer.concat(stderr).toString(),
    stdout: Buffer.concat(stdout).toString(),
  };
};

describe("Production preflight command", () => {
  it("emits one bounded passed receipt and a matching mode-0600 detail artifact", async () => {
    const result = await runPreflight(JSON.stringify(beforeFirstMutation));
    try {
      assert.equal(result.exitCode, 0);
      assert.equal(result.stderr, "");
      const receipt = Schema.decodeUnknownSync(
        Schema.fromJsonString(ProductionPreflightReceipt)
      )(result.stdout);
      assert.equal(receipt.status, "passed");
      assert.equal(receipt.classification, "passed");
      assert.equal(receipt.candidateCommit, sourceSha);
      assert.equal(receipt.journeyId, "BND-J09-deployment-promotion-readback");
      assert.equal(receipt.detailArtifact.path, "details/preflight.json");
      assert.equal(receipt.detailArtifact.state, "available");
      assert.match(receipt.nonClaim, /never mutation authority/);
      const detail = await readFile(
        join(result.cwd, receipt.detailArtifact.path),
        "utf-8"
      );
      assert.match(detail, /"go":true/);
      assert.doesNotMatch(result.stdout, new RegExp(result.cwd));
    } finally {
      await result.cleanup();
    }
  });

  it("preserves a rejected gate as blocked with exit 2 instead of shell success", async () => {
    const result = await runPreflight(JSON.stringify(blockedProxyProvisioned));
    try {
      assert.equal(result.exitCode, 2);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /"status":"blocked"/);
      assert.match(result.stderr, /missing-production-variable/);
      assert.doesNotMatch(result.stderr, /snapshot\.json/);
      const receipt = Schema.decodeUnknownSync(
        Schema.fromJsonString(ProductionPreflightReceipt)
      )(result.stderr);
      assert.equal(receipt.classification, "staged-invariant-rejected");
    } finally {
      await result.cleanup();
    }
  });

  it("emits an inconclusive bounded receipt for malformed or unsafe snapshot input", async () => {
    for (const input of [
      {
        classification: "snapshot-invalid",
        mode: 0o600,
        snapshot: "not-json",
      },
      {
        classification: "snapshot-too-large",
        mode: 0o600,
        snapshot: "x".repeat(256 * 1024 + 1),
      },
      {
        classification: "snapshot-permission-invalid",
        mode: 0o644,
        snapshot: JSON.stringify(beforeFirstMutation),
      },
    ]) {
      const result = await runPreflight(input.snapshot, { mode: input.mode });
      try {
        assert.equal(result.exitCode, 1);
        assert.equal(result.stdout, "");
        assert.match(result.stderr, /"status":"inconclusive"/);
        assert.match(result.stderr, /"candidateCommit":"unresolved"/);
        assert.doesNotMatch(result.stderr, /not-json/);
        assert.doesNotMatch(result.stderr, new RegExp(result.cwd));
        const receipt = Schema.decodeUnknownSync(
          Schema.fromJsonString(ProductionPreflightReceipt)
        )(result.stderr);
        assert.equal(receipt.classification, input.classification);
      } finally {
        await result.cleanup();
      }
    }
  });

  it("does not report passed when the detail artifact cannot be persisted", async () => {
    const result = await runPreflight(JSON.stringify(beforeFirstMutation), {
      detailPath: "snapshot.json/detail.json",
    });
    try {
      assert.equal(result.exitCode, 1);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /"status":"inconclusive"/);
      assert.match(result.stderr, /"state":"unavailable"/);
      assert.match(result.stderr, /"sha256":null/);
      const receipt = Schema.decodeUnknownSync(
        Schema.fromJsonString(ProductionPreflightReceipt)
      )(result.stderr);
      assert.equal(receipt.classification, "detail-artifact-unavailable");
    } finally {
      await result.cleanup();
    }
  });

  it("bounds an unsafe detail-path configuration without echoing it", async () => {
    const unsafePath = "../outside/secret\npath.json";
    const result = await runPreflight(JSON.stringify(beforeFirstMutation), {
      detailPath: unsafePath,
    });
    try {
      assert.equal(result.exitCode, 1);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /"status":"inconclusive"/);
      assert.match(
        result.stderr,
        /"classification":"configuration-unavailable"/
      );
      assert.doesNotMatch(result.stderr, /outside|secret|path\.json/);
    } finally {
      await result.cleanup();
    }
  });
});

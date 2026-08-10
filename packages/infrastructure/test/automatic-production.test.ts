import { ConfigProvider, Effect, Exit, Layer, Schema } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  makeProductionDeploymentsMemory,
  ProductionDeployment,
  ProductionDeployments,
  ProductionDeploymentsLive,
  ProductionDeploymentMemoryControl,
  runAutomaticProduction,
  VercelGitSha,
} from "../src/vercel/index.js";
import type { ProductionMemoryFailure } from "../src/vercel/index.js";

const previousSha = VercelGitSha.make("a".repeat(40));
const candidateSha = VercelGitSha.make("b".repeat(40));
const staleSha = VercelGitSha.make("c".repeat(40));

const deployment = (
  project: "agent" | "proxy",
  version: "previous" | "candidate"
) =>
  Schema.decodeUnknownSync(ProductionDeployment)({
    project,
    deploymentId: `dpl_${project}_${version}`,
    projectId: `prj_${project}`,
    url: `https://bundjil-${project}-${version}.vercel.app`,
    target: "production",
    readyState: "READY",
    sourceSha: version === "previous" ? previousSha : candidateSha,
  });

const memoryInput = (
  failure: ProductionMemoryFailure = "none",
  mainSha = candidateSha
) => ({
  currentProxy: deployment("proxy", "previous"),
  currentAgent: deployment("agent", "previous"),
  candidateProxy: deployment("proxy", "candidate"),
  candidateAgent: deployment("agent", "candidate"),
  mainSha,
  failure,
});

const run = (
  failure: ProductionMemoryFailure = "none",
  mainSha = candidateSha
) =>
  Effect.gen(function* testAutomaticProduction() {
    const receipt = yield* runAutomaticProduction(candidateSha);
    const snapshot = yield* ProductionDeploymentMemoryControl;
    return { receipt, snapshot: yield* snapshot };
  }).pipe(
    Effect.provide(
      makeProductionDeploymentsMemory(memoryInput(failure, mainSha))
    )
  );

const runExitWithSnapshot = (failure: ProductionMemoryFailure) =>
  Effect.gen(function* failureScenario() {
    const exit = yield* Effect.exit(runAutomaticProduction(candidateSha));
    const control = yield* ProductionDeploymentMemoryControl;
    return { exit, snapshot: yield* control };
  }).pipe(
    Effect.provide(makeProductionDeploymentsMemory(memoryInput(failure)))
  );

describe("automatic Production deployment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decodes the current Vercel project target without an embedded projectId", async () => {
    const spawn = vi.fn<
      () => {
        readonly exited: Promise<number>;
        readonly stderr: ReadableStream<Uint8Array>;
        readonly stdout: ReadableStream<Uint8Array>;
      }
    >(() => ({
      exited: Promise.resolve(0),
      stderr: new Blob([]).stream(),
      stdout: new Blob([
        JSON.stringify({
          id: "prj_agent",
          targets: {
            production: {
              id: "dpl_agent_previous",
              meta: { gitCommitSha: previousSha },
              readyState: "READY",
              target: "production",
              url: "bundjil-agent-previous.vercel.app",
            },
          },
        }),
      ]).stream(),
    }));
    vi.stubGlobal("Bun", { spawn });
    const config = ConfigProvider.layer(
      ConfigProvider.fromEnv({
        env: {
          BUNDJIL_PRODUCTION_AGENT_VERCEL_PROJECT_ID: "prj_agent",
          BUNDJIL_PRODUCTION_AGENT_VERCEL_TOKEN: "agent-token",
          BUNDJIL_PRODUCTION_PROXY_HEALTH_URL:
            "https://bundjil-codex-proxy.vercel.app/health",
          BUNDJIL_PRODUCTION_PROXY_VERCEL_PROJECT_ID: "prj_proxy",
          BUNDJIL_PRODUCTION_PROXY_VERCEL_TOKEN: "proxy-token",
          BUNDJIL_PRODUCTION_VERCEL_TEAM_ID: "team_personal",
        },
      })
    );
    const current = await Effect.runPromise(
      Effect.gen(function* currentProductionTarget() {
        const deployments = yield* ProductionDeployments;
        return yield* deployments.current("agent");
      }).pipe(
        Effect.provide(ProductionDeploymentsLive.pipe(Layer.provide(config)))
      )
    );

    expect(current.projectId).toBe("prj_agent");
    expect(current.sourceSha).toBe(previousSha);
    expect(spawn).toHaveBeenCalledWith(
      expect.arrayContaining(["/v9/projects/prj_agent"]),
      expect.anything()
    );
  });

  it("stages both exact-SHA candidates before ordered promotion", async () => {
    const result = await Effect.runPromise(run());

    expect(result.receipt.status).toBe("promoted");
    expect(result.snapshot.promotions).toStrictEqual(["proxy", "agent"]);
    expect(result.snapshot.rollbacks).toStrictEqual([]);
    expect(result.snapshot.currentProxy.sourceSha).toBe(candidateSha);
    expect(result.snapshot.currentAgent.sourceSha).toBe(candidateSha);
  });

  it("is an idempotent no-op when both stable targets already match", async () => {
    const currentProxy = deployment("proxy", "candidate");
    const currentAgent = deployment("agent", "candidate");
    const layer = makeProductionDeploymentsMemory({
      ...memoryInput(),
      currentProxy,
      currentAgent,
    });
    const result = await Effect.runPromise(
      Effect.gen(function* idempotent() {
        const receipt = yield* runAutomaticProduction(candidateSha);
        const control = yield* ProductionDeploymentMemoryControl;
        return { receipt, snapshot: yield* control };
      }).pipe(Effect.provide(layer))
    );

    expect(result.receipt.status).toBe("already-current");
    expect(result.snapshot.promotions).toStrictEqual([]);
  });

  it("leaves aliases untouched when main becomes stale", async () => {
    const result = await Effect.runPromise(run("none", staleSha));

    expect(result.receipt.status).toBe("stale");
    expect(result.snapshot.promotions).toStrictEqual([]);
    expect(result.snapshot.currentProxy.sourceSha).toBe(previousSha);
    expect(result.snapshot.currentAgent.sourceSha).toBe(previousSha);
  });

  it.each(["proxy-stage", "agent-stage", "wrong-inspect"] as const)(
    "fails before alias movement on %s",
    async (failure) => {
      const result = await Effect.runPromise(runExitWithSnapshot(failure));
      expect(Exit.isFailure(result.exit)).toBeTruthy();
      expect(result.snapshot.promotions).toStrictEqual([]);
    }
  );

  it("restores the possibly moved proxy after proxy promotion fails", async () => {
    const result = await Effect.runPromise(
      runExitWithSnapshot("proxy-promote")
    );
    expect(Exit.isFailure(result.exit)).toBeTruthy();
    expect(result.snapshot.promotions).toStrictEqual([]);
    expect(result.snapshot.rollbacks).toStrictEqual(["proxy"]);
    expect(result.snapshot.currentProxy.sourceSha).toBe(previousSha);
  });

  it("restores agent then proxy after agent promotion fails", async () => {
    const result = await Effect.runPromise(
      runExitWithSnapshot("agent-promote")
    );
    expect(Exit.isFailure(result.exit)).toBeTruthy();
    expect(result.snapshot.promotions).toStrictEqual(["proxy"]);
    expect(result.snapshot.rollbacks).toStrictEqual(["agent", "proxy"]);
    expect(result.snapshot.currentAgent.sourceSha).toBe(previousSha);
    expect(result.snapshot.currentProxy.sourceSha).toBe(previousSha);
  });

  it("restores agent then proxy when stable health fails", async () => {
    const result = await Effect.runPromise(runExitWithSnapshot("health"));
    expect(Exit.isFailure(result.exit)).toBeTruthy();
    expect(result.snapshot.promotions).toStrictEqual(["proxy", "agent"]);
    expect(result.snapshot.rollbacks).toStrictEqual(["agent", "proxy"]);
    expect(result.snapshot.currentAgent.sourceSha).toBe(previousSha);
    expect(result.snapshot.currentProxy.sourceSha).toBe(previousSha);
  });

  it("surfaces rollback failure without claiming restoration", async () => {
    const result = await Effect.runPromise(
      runExitWithSnapshot("health-rollback")
    );
    expect(Exit.isFailure(result.exit)).toBeTruthy();
  });
});

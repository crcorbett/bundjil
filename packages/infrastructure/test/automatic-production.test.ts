import {
  ConfigProvider,
  Effect,
  Exit,
  Layer,
  Schema,
  Sink,
  Stream,
} from "effect";
import { ChildProcessSpawner } from "effect/unstable/process";
import type { ChildProcess } from "effect/unstable/process";
import { describe, expect, it } from "vitest";

import {
  AutomaticProductionBlockedReceipt,
  AutomaticProductionBlockedReceiptJson,
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

const productionConfig = ConfigProvider.layer(
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

const processHandle = (stdout: string) => {
  const encoded = new TextEncoder().encode(stdout);
  return ChildProcessSpawner.makeHandle({
    pid: ChildProcessSpawner.ProcessId(1),
    exitCode: Effect.succeed(ChildProcessSpawner.ExitCode(0)),
    isRunning: Effect.succeed(false),
    kill: () => Effect.void,
    stdin: Sink.drain,
    stdout: Stream.fromIterable([encoded]),
    stderr: Stream.empty,
    all: Stream.fromIterable([encoded]),
    getInputFd: () => Sink.drain,
    getOutputFd: () => Stream.empty,
    unref: Effect.succeed(Effect.void),
  });
};

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
  it("encodes a secret-negative deployment failure receipt", () => {
    const encoded = Schema.encodeUnknownSync(
      AutomaticProductionBlockedReceiptJson
    )(
      AutomaticProductionBlockedReceipt.make({
        status: "blocked",
        category: "deployment",
        operation: "current",
        project: "proxy",
        reason: "commandFailed",
        retry: "after-readback",
      })
    );

    expect(encoded).toBe(
      '{"status":"blocked","category":"deployment","operation":"current","project":"proxy","reason":"commandFailed","retry":"after-readback"}'
    );
  });

  it("decodes the current Vercel project target without an embedded projectId", async () => {
    const commands: ChildProcess.Command[] = [];
    const stdout = Schema.encodeUnknownSync(Schema.UnknownFromJsonString)({
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
    });
    const spawner = ChildProcessSpawner.make((command) => {
      commands.push(command);
      return Effect.succeed(processHandle(stdout));
    });
    const processLayer = Layer.succeed(
      ChildProcessSpawner.ChildProcessSpawner,
      spawner
    );
    const current = await Effect.runPromise(
      Effect.gen(function* currentProductionTarget() {
        const deployments = yield* ProductionDeployments;
        return yield* deployments.current("agent");
      }).pipe(
        Effect.provide(
          ProductionDeploymentsLive.pipe(
            Layer.provide(productionConfig),
            Layer.provide(processLayer)
          )
        )
      )
    );

    expect(current.projectId).toBe("prj_agent");
    expect(current.sourceSha).toBe(previousSha);
    const [command] = commands;
    expect(command?._tag).toBe("StandardCommand");
    if (command?._tag !== "StandardCommand") {
      throw new Error("expected one standard Vercel command");
    }
    expect([command.command, ...command.args]).toStrictEqual(
      expect.arrayContaining(["/v9/projects/prj_agent?teamId=team_personal"])
    );
    expect(command.options).toMatchObject({
      env: {
        VERCEL_ORG_ID: "team_personal",
        VERCEL_PROJECT_ID: "prj_agent",
        VERCEL_TOKEN: "agent-token",
      },
      extendEnv: true,
      stderr: "ignore",
    });
    expect(command.args).not.toContain("--scope");
  });

  it("stages with exact CI project bindings and inspects by direct API", async () => {
    const commands: ChildProcess.Command[] = [];
    const spawner = ChildProcessSpawner.make((command) => {
      commands.push(command);
      const args = command._tag === "StandardCommand" ? command.args : [];
      const output = args.includes("deploy")
        ? Schema.encodeUnknownSync(Schema.UnknownFromJsonString)({
            id: "dpl_proxy_candidate",
            readyState: "READY",
            target: "production",
            url: "https://bundjil-proxy-candidate.vercel.app",
          })
        : Schema.encodeUnknownSync(Schema.UnknownFromJsonString)({
            id: "dpl_proxy_candidate",
            meta: { gitCommitSha: candidateSha },
            projectId: "prj_proxy",
            readyState: "READY",
            target: "production",
            url: "bundjil-proxy-candidate.vercel.app",
          });
      return Effect.succeed(processHandle(output));
    });
    const staged = await Effect.runPromise(
      Effect.gen(function* stageCandidate() {
        const deployments = yield* ProductionDeployments;
        return yield* deployments.stage({
          project: "proxy",
          sourceSha: candidateSha,
        });
      }).pipe(
        Effect.provide(
          ProductionDeploymentsLive.pipe(
            Layer.provide(productionConfig),
            Layer.provide(
              Layer.succeed(ChildProcessSpawner.ChildProcessSpawner, spawner)
            )
          )
        )
      )
    );

    expect(staged.sourceSha).toBe(candidateSha);
    const [deployCommand, inspectCommand] = commands;
    if (
      deployCommand?._tag !== "StandardCommand" ||
      inspectCommand?._tag !== "StandardCommand"
    ) {
      throw new Error("expected Vercel deploy and inspect commands");
    }
    expect(deployCommand.args).toContain("deploy");
    expect(deployCommand.args).toContain(".");
    expect(deployCommand.args).not.toContain("apps/agent");
    expect(deployCommand.args).not.toContain("apps/codex-proxy");
    expect(deployCommand.args).not.toContain("--scope");
    expect(deployCommand.args).not.toContain("--project");
    expect(deployCommand.options.env).toMatchObject({
      VERCEL_ORG_ID: "team_personal",
      VERCEL_PROJECT_ID: "prj_proxy",
      VERCEL_TOKEN: "proxy-token",
    });
    expect(inspectCommand.args).toContain(
      "/v13/deployments/dpl_proxy_candidate?teamId=team_personal"
    );
  });

  it("promotes and rolls back through project-scoped API routes", async () => {
    const commands: ChildProcess.Command[] = [];
    let stableVersion: "previous" | "candidate" = "previous";
    const spawner = ChildProcessSpawner.make((command) => {
      commands.push(command);
      const args = command._tag === "StandardCommand" ? command.args : [];
      if (args.some((arg) => arg.includes("/promote/"))) {
        stableVersion = "candidate";
        return Effect.succeed(processHandle("{}"));
      }
      if (args.some((arg) => arg.includes("/rollback/"))) {
        stableVersion = "previous";
        return Effect.succeed(processHandle("{}"));
      }
      return Effect.succeed(
        processHandle(
          Schema.encodeUnknownSync(Schema.UnknownFromJsonString)({
            id: "prj_proxy",
            targets: {
              production: {
                id: `dpl_proxy_${stableVersion}`,
                meta: {
                  gitCommitSha:
                    stableVersion === "candidate" ? candidateSha : previousSha,
                },
                readyState: "READY",
                target: "production",
                url: `bundjil-proxy-${stableVersion}.vercel.app`,
              },
            },
          })
        )
      );
    });
    await Effect.runPromise(
      Effect.gen(function* promoteAndRollback() {
        const deployments = yield* ProductionDeployments;
        yield* deployments.promote(deployment("proxy", "candidate"));
        yield* deployments.rollback(deployment("proxy", "previous"));
      }).pipe(
        Effect.provide(
          ProductionDeploymentsLive.pipe(
            Layer.provide(productionConfig),
            Layer.provide(
              Layer.succeed(ChildProcessSpawner.ChildProcessSpawner, spawner)
            )
          )
        )
      )
    );

    const standardCommands = commands.filter(
      (command): command is ChildProcess.StandardCommand =>
        command._tag === "StandardCommand"
    );
    expect(
      standardCommands.some((command) =>
        command.args.includes(
          "/v10/projects/prj_proxy/promote/dpl_proxy_candidate?teamId=team_personal"
        )
      )
    ).toBeTruthy();
    expect(
      standardCommands.some((command) =>
        command.args.includes(
          "/v9/projects/prj_proxy/rollback/dpl_proxy_previous?teamId=team_personal"
        )
      )
    ).toBeTruthy();
    expect(
      standardCommands.every((command) => !command.args.includes("--scope"))
    ).toBeTruthy();
    const mutationCommands = standardCommands.filter((command) =>
      command.args.some(
        (argument) =>
          argument.includes("/promote/") || argument.includes("/rollback/")
      )
    );
    expect(mutationCommands).toHaveLength(2);
    expect(
      mutationCommands.every(
        (command) =>
          command.args.includes("--input") &&
          command.args.includes("-") &&
          command.options.stdin !== "ignore"
      )
    ).toBeTruthy();
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

  it.each(["agent-promote-interrupt", "agent-promote-defect"] as const)(
    "restores agent then proxy after an after-write %s",
    async (failure) => {
      const result = await Effect.runPromise(runExitWithSnapshot(failure));
      expect(Exit.isFailure(result.exit)).toBeTruthy();
      expect(result.snapshot.promotions).toStrictEqual(["proxy", "agent"]);
      expect(result.snapshot.rollbacks).toStrictEqual(["agent", "proxy"]);
      expect(result.snapshot.currentAgent.sourceSha).toBe(previousSha);
      expect(result.snapshot.currentProxy.sourceSha).toBe(previousSha);
    }
  );

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

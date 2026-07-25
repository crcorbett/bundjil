import { readFile } from "node:fs/promises";

import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

const appDirectory = new URL("..", import.meta.url);
const repositoryDirectory = new URL("../../..", import.meta.url);
const generatedOutputDirectory = new URL(".vercel/output/", appDirectory);
const installedEveDirectory = new URL("node_modules/eve/", repositoryDirectory);

const AgentPackage = Schema.Struct({
  dependencies: Schema.Struct({
    eve: Schema.Literal("0.20.0"),
  }),
});

const InstalledEvePackage = Schema.Struct({
  dependencies: Schema.Struct({
    nitro: Schema.Literal("3.0.260610-beta"),
  }),
  name: Schema.Literal("eve"),
  version: Schema.Literal("0.20.0"),
});

const VercelConfig = Schema.Struct({
  buildCommand: Schema.Literal(
    "cd ../.. && bun run build --filter=@bundjil/agent"
  ),
});

const BuildRoute = Schema.Struct({
  dest: Schema.optional(Schema.String),
  handle: Schema.optional(Schema.String),
  src: Schema.optional(Schema.String),
});

const BuildOutputConfig = Schema.Struct({
  framework: Schema.Struct({
    name: Schema.Literal("nitro"),
    version: Schema.Literal("0.20.0"),
  }),
  routes: Schema.Array(BuildRoute),
  version: Schema.Literal(3),
});

const FunctionConfig = Schema.Struct({
  experimentalTriggers: Schema.optional(
    Schema.Array(
      Schema.Struct({
        consumer: Schema.Literal("default"),
        initialDelaySeconds: Schema.Literal(0),
        retryAfterSeconds: Schema.Literal(5),
        topic: Schema.String,
        type: Schema.Literal("queue/v2beta"),
      })
    )
  ),
  handler: Schema.Literal("index.mjs"),
  launcherType: Schema.Literal("Nodejs"),
  maxDuration: Schema.optional(Schema.Union([Schema.Number, Schema.String])),
  runtime: Schema.Literal("nodejs24.x"),
  shouldAddHelpers: Schema.Literal(false),
  supportsResponseStreaming: Schema.Literal(true),
});

describe("Vercel packaging", () => {
  it("pins the lock-resolved Eve lifecycle owner", async () => {
    const packageConfig = await Effect.runPromise(
      Schema.decodeUnknownEffect(Schema.fromJsonString(AgentPackage))(
        await readFile(new URL("package.json", appDirectory), "utf-8")
      )
    );
    const lock = await readFile(
      new URL("bun.lock", repositoryDirectory),
      "utf-8"
    );
    const installedPackage = await Effect.runPromise(
      Schema.decodeUnknownEffect(Schema.fromJsonString(InstalledEvePackage))(
        await readFile(new URL("package.json", installedEveDirectory), "utf-8")
      )
    );

    expect(packageConfig.dependencies.eve).toBe("0.20.0");
    expect(lock).toContain(
      '"eve": ["eve@0.20.0", "", { "dependencies": { "nitro": "3.0.260610-beta" }'
    );
    expect(installedPackage.name).toBe("eve");
    expect(installedPackage.version).toBe("0.20.0");
    expect(installedPackage.dependencies.nitro).toBe("3.0.260610-beta");
  });

  it("retains Eve send, session workflow and child-turn ownership", async () => {
    const sendSource = await readFile(
      new URL("dist/src/channel/send.js", installedEveDirectory),
      "utf-8"
    );
    const workflowRuntimeSource = await readFile(
      new URL("dist/src/execution/workflow-runtime.js", installedEveDirectory),
      "utf-8"
    );
    const workflowEntrySource = await readFile(
      new URL("dist/src/execution/workflow-entry.js", installedEveDirectory),
      "utf-8"
    );
    const workflowStepsSource = await readFile(
      new URL("dist/src/execution/workflow-steps.js", installedEveDirectory),
      "utf-8"
    );

    expect(sendSource).toContain("await t.deliver");
    expect(sendSource).toContain("await t.run");
    expect(sendSource).toContain("isRuntimeNoActiveSessionError(e)||log.warn");
    expect(sendSource).toContain(
      "deliver failed, falling back to starting a new session"
    );
    expect(workflowRuntimeSource).toContain(
      "await resumeHook(e.continuationToken"
    );
    expect(workflowRuntimeSource).toContain(
      "HookNotFoundError.is(r)?new RuntimeNoActiveSessionError"
    );
    expect(workflowRuntimeSource).toContain(
      "await startWorkflowPreferLatest(workflowEntryReference"
    );
    expect(workflowEntrySource).toContain(
      'async function workflowEntry(n){"use workflow"'
    );
    expect(workflowEntrySource).toContain("dispatchAndAwaitTurn");
    expect(workflowStepsSource).toContain(
      "await startWorkflowPreferLatest(turnWorkflowReference"
    );
  });

  it("keeps the root filtered build and Eve-owned Nitro configuration seam", async () => {
    const config = await Effect.runPromise(
      Schema.decodeUnknownEffect(Schema.fromJsonString(VercelConfig))(
        await readFile(new URL("vercel.json", appDirectory), "utf-8")
      )
    );
    const applicationBuilder = await readFile(
      new URL(
        "dist/src/internal/nitro/host/create-application-nitro.js",
        installedEveDirectory
      ),
      "utf-8"
    );
    const vercelOptions = await readFile(
      new URL(
        "dist/src/internal/nitro/host/vercel-build-output-config.js",
        installedEveDirectory
      ),
      "utf-8"
    );

    expect(config.buildCommand).toBe(
      "cd ../.. && bun run build --filter=@bundjil/agent"
    );
    expect(applicationBuilder).toContain("vercel:createEveVercelOptions");
    expect(vercelOptions).toContain(
      "function createEveVercelOptions(e){if(e)return{config:"
    );
    expect(vercelOptions).not.toContain("functions:");
  });

  it("decodes the generated route and function owners without inferring hosted state", async () => {
    const output = await Effect.runPromise(
      Schema.decodeUnknownEffect(Schema.fromJsonString(BuildOutputConfig))(
        await readFile(
          new URL("config.json", generatedOutputDirectory),
          "utf-8"
        )
      )
    );
    const server = await Effect.runPromise(
      Schema.decodeUnknownEffect(Schema.fromJsonString(FunctionConfig))(
        await readFile(
          new URL(
            "functions/__server.func/.vc-config.json",
            generatedOutputDirectory
          ),
          "utf-8"
        )
      )
    );
    const workflow = await Effect.runPromise(
      Schema.decodeUnknownEffect(Schema.fromJsonString(FunctionConfig))(
        await readFile(
          new URL(
            "functions/.well-known/workflow/v1/flow.func/.vc-config.json",
            generatedOutputDirectory
          ),
          "utf-8"
        )
      )
    );

    expect(
      output.routes.some(
        (route) =>
          route.src === "/eve/v1/sendblue/webhook" &&
          route.dest === "/eve/v1/sendblue/webhook"
      )
    ).toBeTruthy();
    expect(
      output.routes.some(
        (route) =>
          route.src === "/eve/v1/photon/webhook" &&
          route.dest === "/eve/v1/photon/webhook"
      )
    ).toBeTruthy();
    expect(
      output.routes.some(
        (route) => route.src === "/(.*)" && route.dest === "/__server"
      )
    ).toBeTruthy();
    expect(server.runtime).toBe("nodejs24.x");
    expect(server.maxDuration).toBeUndefined();
    expect(server.experimentalTriggers).toBeUndefined();
    expect(workflow.runtime).toBe("nodejs24.x");
    expect(workflow.maxDuration).toBe("max");
    expect(workflow.experimentalTriggers).toHaveLength(1);
    expect(workflow.experimentalTriggers?.[0]?.topic).toMatch(
      /^__eve[0-9a-f]+_wkf_workflow_\*$/
    );
  });
});

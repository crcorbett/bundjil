import { fileURLToPath } from "node:url";

import {
  Config,
  Context,
  Effect,
  Layer,
  Redacted,
  Schema,
  Stream,
} from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

import { ProductionDeploymentError } from "./production.errors.js";
import type {
  InspectProductionDeployment,
  ProductionDeployment,
  ProductionProject,
  StageProductionDeployment,
} from "./production.schemas.js";
import {
  ProductionDeployment as ProductionDeploymentSchema,
  ProductionDeploymentUrl,
  ProductionProxyHealth,
} from "./production.schemas.js";
import { ProductionDeployments } from "./production.service.js";
import {
  VercelDeploymentId,
  VercelGitSha,
  VercelProjectId,
  VercelTeamId,
} from "./schemas.js";

const ProductionVercelToken = Schema.Redacted(Schema.NonEmptyString);
type ProductionVercelToken = typeof ProductionVercelToken.Type;

const ProductionHealthUrl = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^https:\/\/[a-z0-9-]+\.vercel\.app\/health$/))
);

const ProductionDeploymentConfig = Schema.Struct({
  teamId: VercelTeamId,
  agentProjectId: VercelProjectId,
  proxyProjectId: VercelProjectId,
  agentToken: ProductionVercelToken,
  proxyToken: ProductionVercelToken,
  proxyHealthUrl: ProductionHealthUrl,
});
type ProductionDeploymentConfig = typeof ProductionDeploymentConfig.Type;

const loadProductionDeploymentConfig: Config.Config<ProductionDeploymentConfig> =
  Config.all({
    teamId: Config.schema(VercelTeamId, "BUNDJIL_PRODUCTION_VERCEL_TEAM_ID"),
    agentProjectId: Config.schema(
      VercelProjectId,
      "BUNDJIL_PRODUCTION_AGENT_VERCEL_PROJECT_ID"
    ),
    proxyProjectId: Config.schema(
      VercelProjectId,
      "BUNDJIL_PRODUCTION_PROXY_VERCEL_PROJECT_ID"
    ),
    agentToken: Config.schema(
      ProductionVercelToken,
      "BUNDJIL_PRODUCTION_AGENT_VERCEL_TOKEN"
    ),
    proxyToken: Config.schema(
      ProductionVercelToken,
      "BUNDJIL_PRODUCTION_PROXY_VERCEL_TOKEN"
    ),
    proxyHealthUrl: Config.schema(
      ProductionHealthUrl,
      "BUNDJIL_PRODUCTION_PROXY_HEALTH_URL"
    ),
  });

export class ProductionDeploymentConfigService extends Context.Service<
  ProductionDeploymentConfigService,
  ProductionDeploymentConfig
>()("@bundjil/infrastructure/vercel/ProductionDeploymentConfig") {}

export const ProductionDeploymentConfigLive = Layer.effect(
  ProductionDeploymentConfigService,
  loadProductionDeploymentConfig
);

const CommandOutput = Schema.Struct({
  exitCode: Schema.Int,
  stdout: Schema.String,
});
type CommandOutput = typeof CommandOutput.Type;

const CliDeployment = Schema.Struct({
  id: VercelDeploymentId,
  url: ProductionDeploymentUrl,
  readyState: Schema.Literal("READY"),
  target: Schema.Literal("production"),
});
type CliDeployment = typeof CliDeployment.Type;

const CliDeploymentOutput = Schema.Union([
  CliDeployment,
  Schema.Struct({
    status: Schema.Literal("ok"),
    deployment: CliDeployment,
  }),
]);

const ProviderDeploymentTarget = Schema.Struct({
  id: VercelDeploymentId,
  url: Schema.NonEmptyString,
  readyState: Schema.Literal("READY"),
  target: Schema.Literal("production"),
  meta: Schema.Struct({ gitCommitSha: VercelGitSha }),
});

const ProviderDeployment = Schema.Struct({
  ...ProviderDeploymentTarget.fields,
  projectId: VercelProjectId,
});

const ProviderProject = Schema.Struct({
  id: VercelProjectId,
  targets: Schema.Struct({ production: ProviderDeploymentTarget }),
});

const repositoryDirectory = fileURLToPath(
  new URL("../../../../", import.meta.url)
);

const commandError = (
  operation: ProductionDeploymentError["operation"],
  project: ProductionProject | null,
  reason: ProductionDeploymentError["reason"] = "commandFailed"
) =>
  new ProductionDeploymentError({
    operation,
    project,
    reason,
    retry: "after-readback",
  });

const selectProject = (
  config: ProductionDeploymentConfig,
  project: ProductionProject
) =>
  project === "agent"
    ? {
        projectId: config.agentProjectId,
        token: config.agentToken,
        directory: "apps/agent",
      }
    : {
        projectId: config.proxyProjectId,
        token: config.proxyToken,
        directory: "apps/codex-proxy",
      };

const decodeProviderDeployment = (
  project: ProductionProject,
  projectId: VercelProjectId,
  provider: typeof ProviderDeploymentTarget.Type
): Effect.Effect<ProductionDeployment, ProductionDeploymentError> =>
  Schema.decodeUnknownEffect(ProductionDeploymentSchema)({
    project,
    deploymentId: provider.id,
    projectId,
    url: `https://${provider.url}`,
    target: provider.target,
    readyState: provider.readyState,
    sourceSha: provider.meta.gitCommitSha,
  }).pipe(
    Effect.mapError(() => commandError("inspect", project, "invalidResponse"))
  );

const decodeCurrentProductionProject = Effect.fn(
  "ProductionDeploymentsLive.decodeCurrentProject"
)(function* (
  project: ProductionProject,
  expectedProjectId: VercelProjectId,
  output: string
) {
  const provider = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(ProviderProject)
  )(output).pipe(
    Effect.mapError(() => commandError("current", project, "invalidResponse"))
  );
  if (provider.id !== expectedProjectId) {
    return yield* commandError("current", project, "targetMismatch");
  }
  return yield* decodeProviderDeployment(
    project,
    provider.id,
    provider.targets.production
  );
});

export const ProductionDeploymentsLive = Layer.effect(
  ProductionDeployments,
  Effect.gen(function* makeProductionDeployments() {
    const config = yield* ProductionDeploymentConfigService;
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    const runCommand = (
      [executable, ...args]: readonly string[],
      token: ProductionVercelToken | null,
      operation: ProductionDeploymentError["operation"],
      project: ProductionProject | null
    ) =>
      executable === undefined
        ? Effect.fail(commandError(operation, project))
        : Effect.scoped(
            Effect.gen(function* runProductionCommand() {
              const handle = yield* spawner.spawn(
                ChildProcess.make(executable, args, {
                  cwd: repositoryDirectory,
                  env:
                    token === null
                      ? undefined
                      : { VERCEL_TOKEN: Redacted.value(token) },
                  extendEnv: true,
                  stdin: "ignore",
                  stdout: "pipe",
                  stderr: "ignore",
                })
              );
              const [stdout, exitCode] = yield* Effect.all(
                [
                  Stream.mkString(Stream.decodeText(handle.stdout)),
                  handle.exitCode,
                ],
                { concurrency: "unbounded" }
              );
              return { exitCode, stdout };
            })
          ).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(CommandOutput)),
            Effect.mapError(() => commandError(operation, project)),
            Effect.flatMap((output) =>
              output.exitCode === 0
                ? Effect.succeed(output.stdout)
                : Effect.fail(commandError(operation, project))
            )
          );

    const inspect = Effect.fn("ProductionDeploymentsLive.inspect")(function* (
      input: InspectProductionDeployment
    ) {
      const selected = selectProject(config, input.project);
      const output = yield* runCommand(
        [
          "bunx",
          "--bun",
          "vercel",
          "api",
          `/v13/deployments/${input.deploymentId}`,
          "--scope",
          config.teamId,
          "--raw",
        ],
        selected.token,
        "inspect",
        input.project
      );
      const provider = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(ProviderDeployment)
      )(output).pipe(
        Effect.mapError(() =>
          commandError("inspect", input.project, "invalidResponse")
        )
      );
      if (provider.projectId !== selected.projectId) {
        return yield* commandError("inspect", input.project, "targetMismatch");
      }
      return yield* decodeProviderDeployment(
        input.project,
        provider.projectId,
        provider
      );
    });

    const current = Effect.fn("ProductionDeploymentsLive.current")(function* (
      project: ProductionProject
    ) {
      const selected = selectProject(config, project);
      const output = yield* runCommand(
        [
          "bunx",
          "--bun",
          "vercel",
          "api",
          `/v9/projects/${selected.projectId}`,
          "--scope",
          config.teamId,
          "--raw",
        ],
        selected.token,
        "current",
        project
      );
      return yield* decodeCurrentProductionProject(
        project,
        selected.projectId,
        output
      );
    });

    return ProductionDeployments.of({
      current,
      inspect,
      stage: Effect.fn("ProductionDeploymentsLive.stage")(function* (
        input: StageProductionDeployment
      ) {
        const selected = selectProject(config, input.project);
        const output = yield* runCommand(
          [
            "bunx",
            "--bun",
            "vercel",
            "deploy",
            selected.directory,
            "--prod",
            "--skip-domain",
            "--yes",
            "--scope",
            config.teamId,
            "--project",
            selected.projectId,
            "--meta",
            `gitCommitSha=${input.sourceSha}`,
            "--meta",
            "gitCommitRef=main",
            "--json",
          ],
          selected.token,
          "stage",
          input.project
        );
        const decoded = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(CliDeploymentOutput)
        )(output).pipe(
          Effect.mapError(() =>
            commandError("stage", input.project, "invalidResponse")
          )
        );
        const deployment =
          "deployment" in decoded ? decoded.deployment : decoded;
        return yield* inspect({
          project: input.project,
          deploymentId: deployment.id,
        });
      }),
      promote: Effect.fn("ProductionDeploymentsLive.promote")(function* (
        deployment: ProductionDeployment
      ) {
        const selected = selectProject(config, deployment.project);
        yield* runCommand(
          [
            "bunx",
            "--bun",
            "vercel",
            "promote",
            deployment.deploymentId,
            "--yes",
            "--scope",
            config.teamId,
          ],
          selected.token,
          "promote",
          deployment.project
        );
      }),
      rollback: Effect.fn("ProductionDeploymentsLive.rollback")(function* (
        deployment: ProductionDeployment
      ) {
        const selected = selectProject(config, deployment.project);
        yield* runCommand(
          [
            "bunx",
            "--bun",
            "vercel",
            "rollback",
            deployment.deploymentId,
            "--yes",
            "--scope",
            config.teamId,
          ],
          selected.token,
          "rollback",
          deployment.project
        );
      }),
      readMainSha: runCommand(
        ["git", "ls-remote", "origin", "refs/heads/main"],
        null,
        "readMainSha",
        null
      ).pipe(
        Effect.map((output) => output.trim().split(/\s+/u)[0]),
        Effect.flatMap(Schema.decodeUnknownEffect(VercelGitSha)),
        Effect.mapError(() =>
          commandError("readMainSha", null, "mainReadFailed")
        )
      ),
      probeProxyHealth: runCommand(
        ["curl", "--fail", "--silent", "--show-error", config.proxyHealthUrl],
        null,
        "probe",
        "proxy"
      ).pipe(
        Effect.flatMap(
          Schema.decodeUnknownEffect(
            Schema.fromJsonString(ProductionProxyHealth)
          )
        ),
        Effect.mapError(() => commandError("probe", "proxy", "healthFailed"))
      ),
    });
  })
).pipe(Layer.provide(ProductionDeploymentConfigLive));

import { assert, it } from "@effect/vitest";
import { Effect, Exit, Inspectable, Layer, Redacted, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import {
  DiscoverVercelProject,
  layerVercelMemory,
  ListVercelDeployments,
  ListVercelEnvironmentVariables,
  ListVercelMarketplaceBindings,
  ListVercelProjectDomains,
  ListVercelProjects,
  ObserveVercelDeployment,
  ObserveVercelEnvironmentVariable,
  ObserveVercelMarketplaceBinding,
  ObserveVercelProject,
  ObserveVercelProjectDomain,
  VercelCredentials,
  VercelDeployments,
  VercelDomains,
  VercelEnvironmentVariables,
  VercelLive,
  VercelMarketplaceBindings,
  VercelMemoryControl,
  VercelProjects,
  VercelReadOnlyInventory,
  VercelTeamId,
} from "../src/vercel/index.js";

const rawInventory = {
  projects: [
    {
      stage: "preview",
      teamId: "team-preview",
      projectId: "prj-agent",
      name: "bundjil-agent",
      framework: "vite",
      rootDirectory: "apps/agent",
      ownership: "Unowned",
    },
    {
      stage: "preview",
      teamId: "team-preview",
      projectId: "prj-proxy",
      name: "bundjil-proxy",
      framework: "other",
      rootDirectory: "apps/codex-proxy",
      ownership: "Unowned",
    },
  ],
  domains: [
    {
      stage: "preview",
      teamId: "team-preview",
      projectId: "prj-agent",
      domain: "agent-preview.example.com",
      verified: true,
      ownership: "Unowned",
    },
  ],
  environmentVariables: [
    {
      stage: "preview",
      teamId: "team-preview",
      projectId: "prj-agent",
      environmentVariableId: "env-agent-token",
      key: "BUNDJIL_AGENT_TOKEN",
      type: "sensitive",
      targets: ["preview"],
      gitBranch: "codex/alchemy-vercel-photon-infrastructure",
      sensitive: true,
      ownership: "Unowned",
    },
  ],
  marketplaceBindings: [
    {
      stage: "preview",
      teamId: "team-preview",
      projectId: "prj-agent",
      integrationId: "integration-upstash",
      configurationId: "configuration-upstash",
      resourceId: "resource-upstash",
      databaseId: "database-upstash",
      ownership: "Unowned",
    },
  ],
  deployments: [
    {
      stage: "preview",
      teamId: "team-preview",
      projectId: "prj-agent",
      deploymentId: "deployment-agent",
      gitSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      target: "preview",
      status: "READY",
      aliases: ["agent-preview.example.com"],
      ownership: "Unowned",
    },
  ],
};

const inventory = Schema.decodeUnknownEffect(VercelReadOnlyInventory)(
  rawInventory
);

it.effect(
  "round trips the complete two-project inventory without secret values",
  () =>
    Effect.gen(function* testVercelInventoryCodecs() {
      const decoded = yield* inventory;
      const encoded = yield* Schema.encodeEffect(VercelReadOnlyInventory)(
        decoded
      );
      const roundTripped = yield* Schema.decodeEffect(VercelReadOnlyInventory)(
        encoded
      );
      assert.deepStrictEqual(roundTripped, decoded);
      const rendered = Inspectable.toStringUnknown(encoded);
      assert.strictEqual(rendered.includes("vercel-token-sentinel"), false);
      assert.strictEqual(
        rendered.includes("environment-value-sentinel"),
        false
      );
      assert.strictEqual(
        rendered.includes("integration-credential-sentinel"),
        false
      );

      const malformed = yield* Schema.decodeUnknownEffect(
        VercelReadOnlyInventory
      )({
        ...rawInventory,
        deployments: [
          {
            ...rawInventory.deployments[0],
            gitSha: "not-a-git-sha",
          },
        ],
      }).pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(malformed), true);
    })
);

it.effect(
  "observes every memory inventory class with zero provider writes",
  () =>
    Effect.gen(function* testVercelMemoryInventory() {
      const decoded = yield* inventory;
      const [project] = decoded.projects;
      const [domain] = decoded.domains;
      const [environmentVariable] = decoded.environmentVariables;
      const [marketplaceBinding] = decoded.marketplaceBindings;
      const [deployment] = decoded.deployments;
      if (
        project === undefined ||
        domain === undefined ||
        environmentVariable === undefined ||
        marketplaceBinding === undefined ||
        deployment === undefined
      ) {
        return yield* Effect.die("The Vercel memory fixture is incomplete.");
      }
      return yield* Effect.gen(function* exerciseVercelMemory() {
        const projects = yield* VercelProjects;
        const domains = yield* VercelDomains;
        const environmentVariables = yield* VercelEnvironmentVariables;
        const marketplaceBindings = yield* VercelMarketplaceBindings;
        const deployments = yield* VercelDeployments;

        const projectResult = yield* projects.listProjects(
          ListVercelProjects.make(project)
        );
        const domainResult = yield* domains.listDomains(
          ListVercelProjectDomains.make(project)
        );
        const environmentResult =
          yield* environmentVariables.listEnvironmentVariables(
            ListVercelEnvironmentVariables.make(project)
          );
        const marketplaceResult =
          yield* marketplaceBindings.listMarketplaceBindings(
            ListVercelMarketplaceBindings.make(project)
          );
        const deploymentResult = yield* deployments.listDeployments(
          ListVercelDeployments.make(project)
        );

        assert.strictEqual(projectResult.projects.length, 2);
        assert.strictEqual(domainResult.domains.length, 1);
        assert.strictEqual(environmentResult.environmentVariables.length, 1);
        assert.strictEqual(marketplaceResult.bindings.length, 1);
        assert.strictEqual(deploymentResult.deployments.length, 1);

        assert.strictEqual(
          (yield* projects.observeProject(ObserveVercelProject.make(project)))
            ._tag,
          "Found"
        );
        assert.strictEqual(
          (yield* domains.observeDomain(
            ObserveVercelProjectDomain.make(domain)
          ))._tag,
          "Found"
        );
        assert.strictEqual(
          (yield* environmentVariables.observeEnvironmentVariable(
            ObserveVercelEnvironmentVariable.make(environmentVariable)
          ))._tag,
          "Found"
        );
        assert.strictEqual(
          (yield* marketplaceBindings.observeMarketplaceBinding(
            ObserveVercelMarketplaceBinding.make(marketplaceBinding)
          ))._tag,
          "Found"
        );
        assert.strictEqual(
          (yield* deployments.observeDeployment(
            ObserveVercelDeployment.make(deployment)
          ))._tag,
          "Found"
        );
        const control = yield* VercelMemoryControl;
        assert.strictEqual(yield* control.providerWriteCount, 0);
      }).pipe(Effect.provide(layerVercelMemory(decoded)));
    })
);

it.effect("fails ambiguous project discovery and isolates team scope", () =>
  Effect.gen(function* testVercelMemoryAmbiguityAndTeamScope() {
    const duplicated = yield* Schema.decodeUnknownEffect(
      VercelReadOnlyInventory
    )({
      ...rawInventory,
      projects: [
        rawInventory.projects[0],
        { ...rawInventory.projects[1], name: "bundjil-agent" },
      ],
    });
    const [project] = duplicated.projects;
    if (project === undefined) {
      return yield* Effect.die("The Vercel ambiguity fixture is incomplete.");
    }
    return yield* Effect.gen(function* exerciseVercelAmbiguity() {
      const projects = yield* VercelProjects;
      const ambiguous = yield* projects
        .discoverProject(
          DiscoverVercelProject.make({
            stage: project.stage,
            teamId: project.teamId,
            name: project.name,
          })
        )
        .pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(ambiguous), true);

      const mismatchedTeamId =
        yield* Schema.decodeUnknownEffect(VercelTeamId)("team-other");
      const mismatched = yield* projects.observeProject(
        ObserveVercelProject.make({
          stage: project.stage,
          teamId: mismatchedTeamId,
          projectId: project.projectId,
        })
      );
      assert.strictEqual(mismatched._tag, "Missing");
    }).pipe(Effect.provide(layerVercelMemory(duplicated)));
  })
);

const liveLayer = (client: HttpClient.HttpClient) =>
  VercelLive.pipe(
    Layer.provide(
      Layer.merge(
        Layer.succeed(HttpClient.HttpClient, client),
        Layer.succeed(
          VercelCredentials,
          Effect.succeed(Redacted.make("vercel-token-sentinel"))
        )
      )
    )
  );

it.effect(
  "decodes full live envelopes, paginates projects, and keeps env values absent",
  () =>
    Effect.gen(function* testVercelLiveContracts() {
      let projectPage = 0;
      const client = HttpClient.make((request) =>
        Effect.sync(() => {
          assert.strictEqual(
            request.headers["authorization"],
            "Bearer vercel-token-sentinel"
          );
          const url = new URL(request.url);
          const response = (() => {
            if (url.pathname === "/v9/projects") {
              projectPage += 1;
              return {
                projects: [
                  {
                    id: projectPage === 1 ? "prj-agent" : "prj-proxy",
                    name: projectPage === 1 ? "bundjil-agent" : "bundjil-proxy",
                    framework: projectPage === 1 ? "vite" : null,
                    rootDirectory:
                      projectPage === 1 ? "apps/agent" : "apps/codex-proxy",
                  },
                ],
                pagination: { next: projectPage === 1 ? "page-two" : null },
              };
            }
            if (url.pathname.endsWith("/domains")) {
              return {
                domains: [
                  { name: "agent-preview.example.com", verified: true },
                ],
                pagination: { next: null },
              };
            }
            if (url.pathname.endsWith("/env")) {
              return {
                envs: [
                  {
                    id: "env-agent-token",
                    key: "BUNDJIL_AGENT_TOKEN",
                    type: "sensitive",
                    target: ["preview"],
                    sensitive: true,
                  },
                ],
                pagination: { next: null },
              };
            }
            if (url.pathname === "/v1/integrations/resources") {
              return {
                resources: [
                  {
                    id: "resource-upstash",
                    integrationId: "integration-upstash",
                    configurationId: "configuration-upstash",
                    databaseId: "database-upstash",
                    projectId: "prj-agent",
                  },
                ],
                pagination: { next: null },
              };
            }
            return {
              deployments: [
                {
                  uid: "deployment-agent",
                  projectId: "prj-agent",
                  target: "preview",
                  readyState: "READY",
                  alias: ["agent-preview.example.com"],
                  meta: {
                    githubCommitSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                  },
                },
              ],
              pagination: { next: null },
            };
          })();
          return HttpClientResponse.fromWeb(
            request,
            Response.json(response, {
              status: 200,
              headers: {
                "x-ratelimit-remaining": "99",
                "x-ratelimit-reset": "1",
              },
            })
          );
        })
      );

      const decoded = yield* inventory;
      const [project] = decoded.projects;
      if (project === undefined) {
        return yield* Effect.die("The Vercel live fixture is incomplete.");
      }
      const result = yield* Effect.gen(function* exerciseVercelLive() {
        const projectsService = yield* VercelProjects;
        const domainsService = yield* VercelDomains;
        const environmentVariablesService = yield* VercelEnvironmentVariables;
        const marketplaceBindingsService = yield* VercelMarketplaceBindings;
        const deploymentsService = yield* VercelDeployments;
        const projects = yield* projectsService.listProjects(
          ListVercelProjects.make(project)
        );
        const domains = yield* domainsService.listDomains(
          ListVercelProjectDomains.make(project)
        );
        const environmentVariables =
          yield* environmentVariablesService.listEnvironmentVariables(
            ListVercelEnvironmentVariables.make(project)
          );
        const marketplaceBindings =
          yield* marketplaceBindingsService.listMarketplaceBindings(
            ListVercelMarketplaceBindings.make(project)
          );
        const deployments = yield* deploymentsService.listDeployments(
          ListVercelDeployments.make(project)
        );
        return {
          projects,
          domains,
          environmentVariables,
          marketplaceBindings,
          deployments,
        };
      }).pipe(Effect.provide(liveLayer(client)));
      assert.strictEqual(result.projects.projects.length, 2);
      assert.strictEqual(result.domains.domains.length, 1);
      assert.strictEqual(
        result.environmentVariables.environmentVariables.length,
        1
      );
      assert.strictEqual(result.marketplaceBindings.bindings.length, 1);
      assert.strictEqual(result.deployments.deployments.length, 1);
      assert.strictEqual(
        result.environmentVariables.environmentVariables[0] !== undefined &&
          "value" in result.environmentVariables.environmentVariables[0],
        false
      );
      return yield* Effect.void;
    })
);

it.effect("classifies 404, 429, and malformed live envelopes safely", () =>
  Effect.gen(function* testVercelLiveFailures() {
    const decoded = yield* inventory;
    const [project] = decoded.projects;
    if (project === undefined) {
      return yield* Effect.die("The Vercel failure fixture is incomplete.");
    }
    const responseFor = (status: number, body: unknown) =>
      HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            Response.json(body, {
              status,
              headers: {
                "retry-after": "2",
                "x-ratelimit-remaining": "0",
                "x-ratelimit-reset": "10",
              },
            })
          )
        )
      );
    const missing = yield* Effect.gen(function* observeMissingProject() {
      const projects = yield* VercelProjects;
      return yield* projects.observeProject(ObserveVercelProject.make(project));
    }).pipe(
      Effect.provide(
        liveLayer(
          responseFor(404, {
            error: { code: "not_found", message: "sentinel raw body" },
          })
        )
      )
    );
    assert.strictEqual(missing._tag, "Missing");

    const limited = yield* Effect.gen(function* listLimitedProjects() {
      const projects = yield* VercelProjects;
      return yield* projects.listProjects(ListVercelProjects.make(project));
    }).pipe(
      Effect.provide(
        liveLayer(
          responseFor(429, {
            error: { code: "rate_limited", message: "sentinel raw body" },
          })
        )
      ),
      Effect.exit
    );
    assert.strictEqual(Exit.isFailure(limited), true);
    assert.strictEqual(
      Inspectable.toStringUnknown(limited).includes("sentinel raw body"),
      false
    );

    const malformed = yield* Effect.gen(function* listMalformedProjects() {
      const projects = yield* VercelProjects;
      return yield* projects.listProjects(ListVercelProjects.make(project));
    }).pipe(
      Effect.provide(liveLayer(responseFor(200, { projects: "wrong" }))),
      Effect.exit
    );
    assert.strictEqual(Exit.isFailure(malformed), true);

    const transient = yield* Effect.gen(function* listTransientProjects() {
      const projects = yield* VercelProjects;
      return yield* projects.listProjects(ListVercelProjects.make(project));
    }).pipe(
      Effect.provide(
        liveLayer(
          responseFor(503, {
            error: { code: "unavailable", message: "sentinel raw body" },
          })
        )
      ),
      Effect.exit
    );
    assert.strictEqual(Exit.isFailure(transient), true);
    return yield* Effect.void;
  })
);

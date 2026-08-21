import { assert, it } from "@effect/vitest";
import {
  ConfigProvider,
  Effect,
  Exit,
  Inspectable,
  Layer,
  Redacted,
  Schema,
} from "effect";
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
  VercelProjectCredentialsLive,
  VercelProjectId,
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
      valueOwnership: { _tag: "ObservedUnknown", configured: true },
      deploymentRequired: false,
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

it.effect("fails ambiguous project discovery and isolates project scope", () =>
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
          VercelCredentials.of({
            accessToken: () =>
              Effect.succeed(Redacted.make("vercel-token-sentinel")),
          })
        )
      )
    )
  );

it.effect(
  "routes project-scoped token bindings by branded project ID and rejects team-wide project enumeration",
  () => {
    const config = ConfigProvider.fromUnknown({
      BUNDJIL_INFRASTRUCTURE_VERCEL_PROJECT_CREDENTIALS_JSON:
        '[{"projectId":"prj-agent","accessToken":"agent-token-sentinel"},{"projectId":"prj-proxy","accessToken":"proxy-token-sentinel"}]',
    });
    return Effect.gen(function* testProjectRoutedCredentials() {
      const credentials = yield* VercelCredentials;
      const agentToken = yield* credentials.accessToken({
        _tag: "Project",
        projectId: VercelProjectId.make("prj-agent"),
      });
      const proxyToken = yield* credentials.accessToken({
        _tag: "Project",
        projectId: VercelProjectId.make("prj-proxy"),
      });
      const unknownProject = yield* credentials
        .accessToken({
          _tag: "Project",
          projectId: VercelProjectId.make("prj-unknown"),
        })
        .pipe(Effect.exit);
      const teamEnumeration = yield* credentials
        .accessToken({
          _tag: "Team",
          teamId: VercelTeamId.make("team-preview"),
        })
        .pipe(Effect.exit);

      assert.strictEqual(Redacted.value(agentToken), "agent-token-sentinel");
      assert.strictEqual(Redacted.value(proxyToken), "proxy-token-sentinel");
      assert.strictEqual(Exit.isFailure(unknownProject), true);
      assert.strictEqual(Exit.isFailure(teamEnumeration), true);
      assert.strictEqual(
        Inspectable.toStringUnknown([unknownProject, teamEnumeration]).includes(
          "token-sentinel"
        ),
        false
      );
    }).pipe(
      Effect.provide(VercelProjectCredentialsLive),
      Effect.provideService(ConfigProvider.ConfigProvider, config)
    );
  }
);

it.effect(
  "rejects duplicate project credential bindings without leaking",
  () => {
    const config = ConfigProvider.fromUnknown({
      BUNDJIL_INFRASTRUCTURE_VERCEL_PROJECT_CREDENTIALS_JSON:
        '[{"projectId":"prj-agent","accessToken":"first-token-sentinel"},{"projectId":"prj-agent","accessToken":"second-token-sentinel"}]',
    });
    return Effect.gen(function* testDuplicateProjectCredentials() {
      const credentials = yield* VercelCredentials;
      const result = yield* credentials
        .accessToken({
          _tag: "Project",
          projectId: VercelProjectId.make("prj-agent"),
        })
        .pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(result), true);
      assert.strictEqual(
        Inspectable.toStringUnknown(result).includes("token-sentinel"),
        false
      );
    }).pipe(
      Effect.provide(VercelProjectCredentialsLive),
      Effect.provideService(ConfigProvider.ConfigProvider, config)
    );
  }
);

it.effect(
  "selects the matching project token at the Vercel HTTP boundary",
  () => {
    const config = ConfigProvider.fromUnknown({
      BUNDJIL_INFRASTRUCTURE_VERCEL_PROJECT_CREDENTIALS_JSON:
        '[{"projectId":"prj-agent","accessToken":"agent-token-sentinel"},{"projectId":"prj-proxy","accessToken":"proxy-token-sentinel"}]',
    });
    const client = HttpClient.make((request) =>
      Effect.sync(() => {
        const projectId = new URL(request.url).pathname.split("/").at(-1);
        assert.strictEqual(
          request.headers["authorization"],
          projectId === "prj-agent"
            ? "Bearer agent-token-sentinel"
            : "Bearer proxy-token-sentinel"
        );
        return HttpClientResponse.fromWeb(
          request,
          Response.json(
            {
              id: projectId,
              name:
                projectId === "prj-agent" ? "bundjil-agent" : "bundjil-proxy",
              framework: null,
              rootDirectory:
                projectId === "prj-agent" ? "apps/agent" : "apps/codex-proxy",
            },
            { status: 200 }
          )
        );
      })
    );
    const projectLayer = VercelLive.pipe(
      Layer.provide(
        Layer.merge(
          Layer.succeed(HttpClient.HttpClient, client),
          VercelProjectCredentialsLive
        )
      )
    );
    return Effect.gen(function* testProjectCredentialHttpRouting() {
      const projects = yield* VercelProjects;
      const agent = yield* projects.observeProject(
        ObserveVercelProject.make({
          stage: "preview",
          teamId: VercelTeamId.make("team-preview"),
          projectId: VercelProjectId.make("prj-agent"),
        })
      );
      const proxy = yield* projects.observeProject(
        ObserveVercelProject.make({
          stage: "preview",
          teamId: VercelTeamId.make("team-preview"),
          projectId: VercelProjectId.make("prj-proxy"),
        })
      );
      assert.strictEqual(agent._tag, "Found");
      assert.strictEqual(proxy._tag, "Found");
    }).pipe(
      Effect.provide(projectLayer),
      Effect.provideService(ConfigProvider.ConfigProvider, config)
    );
  }
);

it.effect(
  "decodes full live envelopes, paginates projects, and keeps env values absent",
  () =>
    Effect.gen(function* testVercelLiveContracts() {
      let projectPage = 0;
      let deploymentPage = 0;
      const deploymentCursors: (string | null)[] = [];
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
                    contentHint: {
                      integrationConfigurationId: "configuration-upstash",
                      integrationId: "integration-upstash",
                      storeId: "resource-upstash",
                    },
                  },
                  {
                    id: "env-production-only",
                    key: "PRODUCTION_ONLY_SECRET",
                    type: "sensitive",
                    target: ["production"],
                    sensitive: true,
                  },
                ],
                pagination: { next: null },
              };
            }
            assert.strictEqual(url.pathname, "/v6/deployments");
            deploymentPage += 1;
            let deploymentCursor: string | null = null;
            for (const [key, value] of request.urlParams) {
              if (key === "until") {
                deploymentCursor = value;
              }
            }
            deploymentCursors.push(deploymentCursor);
            if (deploymentPage === 1) {
              return {
                deployments: [
                  {
                    uid: "deployment-agent",
                    projectId: "prj-agent",
                    target: null,
                    readyState: "READY",
                    meta: {
                      githubCommitSha:
                        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    },
                  },
                  {
                    uid: "deployment-custom-staging",
                    projectId: "prj-agent",
                    target: "staging",
                    readyState: "READY",
                    meta: {
                      githubCommitSha:
                        "cccccccccccccccccccccccccccccccccccccccc",
                    },
                  },
                ],
                pagination: { count: 2, next: 123, prev: 124 },
              };
            }
            return {
              deployments: [
                {
                  uid: "deployment-without-git-provenance",
                  projectId: "prj-agent",
                  target: null,
                  readyState: "READY",
                  meta: {},
                },
                {
                  uid: "deployment-production",
                  projectId: "prj-agent",
                  target: "production",
                  readyState: "READY",
                  meta: {
                    githubCommitSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                  },
                },
              ],
              pagination: { count: 2, next: null, prev: 123 },
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
      const [expectedMarketplaceBinding] = decoded.marketplaceBindings;
      if (project === undefined || expectedMarketplaceBinding === undefined) {
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
        const productionEnvironmentVariables =
          yield* environmentVariablesService.listEnvironmentVariables(
            ListVercelEnvironmentVariables.make({
              ...project,
              stage: "prod",
            })
          );
        const marketplaceBindings =
          yield* marketplaceBindingsService.listMarketplaceBindings(
            ListVercelMarketplaceBindings.make(project)
          );
        const marketplaceBinding =
          yield* marketplaceBindingsService.observeMarketplaceBinding(
            ObserveVercelMarketplaceBinding.make(expectedMarketplaceBinding)
          );
        const deployments = yield* deploymentsService.listDeployments(
          ListVercelDeployments.make(project)
        );
        const productionDeployments = yield* deploymentsService.listDeployments(
          ListVercelDeployments.make({
            ...project,
            stage: "prod",
          })
        );
        return {
          projects,
          domains,
          environmentVariables,
          productionEnvironmentVariables,
          marketplaceBinding,
          marketplaceBindings,
          deployments,
          productionDeployments,
        };
      }).pipe(Effect.provide(liveLayer(client)));
      assert.strictEqual(result.projects.projects.length, 2);
      assert.strictEqual(result.domains.domains.length, 1);
      assert.strictEqual(
        result.environmentVariables.environmentVariables.length,
        1
      );
      assert.strictEqual(
        result.productionEnvironmentVariables.environmentVariables.length,
        1
      );
      assert.strictEqual(
        result.productionEnvironmentVariables.environmentVariables[0]?.key,
        "PRODUCTION_ONLY_SECRET"
      );
      assert.strictEqual(result.marketplaceBindings.bindings.length, 1);
      assert.strictEqual(
        result.marketplaceBindings.bindings[0]?.databaseId,
        "not-exposed-by-project-scope"
      );
      assert.strictEqual(result.marketplaceBinding._tag, "Found");
      assert.strictEqual(
        result.marketplaceBinding._tag === "Found"
          ? result.marketplaceBinding.attributes.databaseId
          : undefined,
        expectedMarketplaceBinding.databaseId
      );
      assert.strictEqual(result.deployments.deployments.length, 1);
      assert.deepStrictEqual(deploymentCursors, [null, "123", null]);
      assert.strictEqual(result.deployments.deployments[0]?.target, "preview");
      assert.deepStrictEqual(result.deployments.deployments[0]?.aliases, []);
      assert.strictEqual(result.productionDeployments.deployments.length, 1);
      assert.strictEqual(
        result.productionDeployments.deployments[0]?.stage,
        "prod"
      );
      assert.strictEqual(
        result.productionDeployments.deployments[0]?.target,
        "production"
      );
      assert.strictEqual(
        result.environmentVariables.environmentVariables[0] !== undefined &&
          "value" in result.environmentVariables.environmentVariables[0],
        false
      );
      return yield* Effect.void;
    })
);

it.effect(
  "returns missing when project-scoped Marketplace hints do not match the accepted binding",
  () =>
    Effect.gen(function* testMarketplaceContentHintMismatch() {
      const decoded = yield* inventory;
      const [project] = decoded.projects;
      const [binding] = decoded.marketplaceBindings;
      if (project === undefined || binding === undefined) {
        return yield* Effect.die(
          "The Vercel Marketplace mismatch fixture is incomplete."
        );
      }
      const client = HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            Response.json(
              {
                envs: [
                  {
                    id: "env-marketplace",
                    key: "MARKETPLACE_SECRET",
                    type: "sensitive",
                    target: ["preview"],
                    contentHint: {
                      integrationConfigurationId: "configuration-upstash",
                      integrationId: "integration-upstash",
                      storeId: "different-resource",
                    },
                  },
                ],
                pagination: { next: null },
              },
              { status: 200 }
            )
          )
        )
      );
      const mismatch = yield* Effect.gen(function* observeMarketplaceBinding() {
        const marketplaceBindings = yield* VercelMarketplaceBindings;
        return yield* marketplaceBindings.observeMarketplaceBinding(
          ObserveVercelMarketplaceBinding.make(binding)
        );
      }).pipe(Effect.provide(liveLayer(client)));
      assert.strictEqual(mismatch._tag, "Missing");
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

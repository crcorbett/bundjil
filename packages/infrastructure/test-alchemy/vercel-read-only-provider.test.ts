// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */
/* oxlint-disable eslint-plugin-vitest/prefer-importing-vitest-globals -- Alchemy Test/Bun registers these assertions with Bun. */

import { expect } from "bun:test";

import { adopt } from "alchemy/AdoptPolicy";
import { destroy } from "alchemy/RemovalPolicy";
import * as Test from "alchemy/Test/Bun";
import { Effect, Exit, Layer, Schema } from "effect";

import {
  layerVercelMemory,
  layerVercelReadOnlyProviders,
  VercelPreviewPhotonBindingValuesDenied,
  VercelDeploymentObservationResource,
  VercelEnvironmentVariable,
  VercelInventoryScope,
  VercelMarketplaceBinding,
  VercelMemoryControl,
  VercelProject,
  VercelProjectDomain,
  VercelReadOnlyInventory,
  VercelStableEnvironmentBindingsDenied,
} from "../src/vercel/index.js";

const fixture = Effect.gen(function* decodeVercelProviderFixture() {
  const inventory = yield* Schema.decodeUnknownEffect(VercelReadOnlyInventory)({
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
  });
  const scope = yield* Schema.decodeUnknownEffect(VercelInventoryScope)({
    projects: inventory.projects.map((project) => ({
      stage: project.stage,
      teamId: project.teamId,
      projectId: project.projectId,
    })),
  });
  const [project] = inventory.projects;
  const [domain] = inventory.domains;
  const [environmentVariable] = inventory.environmentVariables;
  const [marketplaceBinding] = inventory.marketplaceBindings;
  const [deployment] = inventory.deployments;
  if (
    project === undefined ||
    domain === undefined ||
    environmentVariable === undefined ||
    marketplaceBinding === undefined ||
    deployment === undefined
  ) {
    return yield* Effect.die("The Vercel provider fixture is incomplete.");
  }
  return {
    inventory,
    scope,
    expectedGitSha: deployment.gitSha,
    props: {
      project: {
        stage: project.stage,
        teamId: project.teamId,
        projectId: project.projectId,
      },
      domain: {
        stage: domain.stage,
        teamId: domain.teamId,
        projectId: domain.projectId,
        domain: domain.domain,
      },
      environmentVariable: {
        stage: environmentVariable.stage,
        teamId: environmentVariable.teamId,
        projectId: environmentVariable.projectId,
        environmentVariableId: environmentVariable.environmentVariableId,
      },
      marketplaceBinding: {
        stage: marketplaceBinding.stage,
        teamId: marketplaceBinding.teamId,
        projectId: marketplaceBinding.projectId,
        integrationId: marketplaceBinding.integrationId,
        configurationId: marketplaceBinding.configurationId,
        resourceId: marketplaceBinding.resourceId,
        databaseId: marketplaceBinding.databaseId,
      },
      deployment: {
        stage: deployment.stage,
        teamId: deployment.teamId,
        projectId: deployment.projectId,
        deploymentId: deployment.deploymentId,
      },
    },
  };
});

const decoded = await Effect.runPromise(fixture);
const memory = layerVercelMemory(decoded.inventory);
const providers = Layer.merge(
  layerVercelReadOnlyProviders(decoded.scope).pipe(
    Layer.provide(VercelPreviewPhotonBindingValuesDenied),
    Layer.provide(VercelStableEnvironmentBindingsDenied),
    Layer.provide(memory)
  ),
  memory
);
const { test } = Test.make({ providers, stage: "preview" });

test.provider(
  "plans and adopts the complete two-project inventory without provider writes",
  (stack) =>
    Effect.gen(function* adoptVercelInventory() {
      const denied = yield* stack
        .plan(VercelProject("VercelProject", decoded.props.project))
        .pipe(Effect.exit);
      expect(Exit.isFailure(denied)).toBe(true);

      const before = yield* VercelMemoryControl;
      const writesBefore = yield* before.providerWriteCount;
      const outputs = yield* stack.deploy(
        Effect.all({
          project: VercelProject("VercelProject", decoded.props.project).pipe(
            adopt(true)
          ),
          domain: VercelProjectDomain(
            "VercelProjectDomain",
            decoded.props.domain
          ).pipe(adopt(true)),
          environmentVariable: VercelEnvironmentVariable(
            "VercelEnvironmentVariable",
            decoded.props.environmentVariable
          ).pipe(adopt(true)),
          marketplaceBinding: VercelMarketplaceBinding(
            "VercelMarketplaceBinding",
            decoded.props.marketplaceBinding
          ).pipe(adopt(true)),
          deployment: VercelDeploymentObservationResource(
            "VercelDeploymentObservation",
            decoded.props.deployment
          ).pipe(adopt(true)),
        })
      );
      expect(outputs.project.projectId).toBe(decoded.props.project.projectId);
      expect(outputs.domain.domain).toBe(decoded.props.domain.domain);
      expect(outputs.environmentVariable.sensitive).toBe(true);
      expect(outputs.marketplaceBinding.databaseId).toBe(
        decoded.props.marketplaceBinding.databaseId
      );
      expect(outputs.deployment.gitSha).toBe(decoded.expectedGitSha);
      expect(yield* before.providerWriteCount).toBe(writesBefore);
    })
);

test.provider("fails closed when explicit deletion is requested", (stack) =>
  Effect.gen(function* rejectVercelDeletion() {
    yield* stack.deploy(
      VercelProject("ProtectedVercelProject", decoded.props.project).pipe(
        adopt(true),
        destroy()
      )
    );
    const deletion = yield* stack.destroy().pipe(Effect.exit);
    expect(Exit.isFailure(deletion)).toBe(true);
    const control = yield* VercelMemoryControl;
    expect(yield* control.providerWriteCount).toBe(0);
  })
);

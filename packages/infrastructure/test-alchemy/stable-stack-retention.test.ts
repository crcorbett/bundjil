// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */
/* oxlint-disable eslint-plugin-vitest/prefer-importing-vitest-globals -- Alchemy Test/Bun registers these assertions with Bun. */

import { expect } from "bun:test";

import { adopt } from "alchemy/AdoptPolicy";
import * as Test from "alchemy/Test/Bun";
import { Effect, Layer, Schema } from "effect";

import { BundjilInfrastructureStack } from "../../../stacks/bundjil.js";
import { AdoptionManifest } from "../src/adoption-manifest.js";
import {
  layerVercelMemory,
  layerVercelReadOnlyProviders,
  VercelInventoryScope,
  VercelMemoryControl,
  VercelPreviewPhotonBindingValuesDenied,
  VercelReadOnlyInventory,
  VercelStableEnvironmentBindingsDenied,
} from "../src/vercel/index.js";

const fixture = Effect.gen(function* decodeStableStackRetentionFixture() {
  const inventory = yield* Schema.decodeUnknownEffect(VercelReadOnlyInventory)({
    projects: [
      {
        stage: "preview",
        teamId: "team-preview",
        projectId: "project-retained",
        name: "bundjil-agent",
        framework: "vite",
        rootDirectory: "apps/agent",
        ownership: "Unowned",
      },
      {
        stage: "preview",
        teamId: "team-preview",
        projectId: "project-successor",
        name: "bundjil-codex-proxy",
        framework: "other",
        rootDirectory: "apps/codex-proxy",
        ownership: "Unowned",
      },
    ],
    domains: [],
    environmentVariables: [],
    marketplaceBindings: [],
    deployments: [],
  });
  const scope = yield* Schema.decodeUnknownEffect(VercelInventoryScope)({
    projects: [
      {
        stage: "preview",
        teamId: "team-preview",
        projectId: "project-retained",
      },
      {
        stage: "preview",
        teamId: "team-preview",
        projectId: "project-successor",
      },
    ],
  });
  const retained = yield* Schema.decodeUnknownEffect(AdoptionManifest)({
    schemaVersion: "1",
    stage: "preview",
    digest: "a".repeat(64),
    resources: [
      {
        stage: "preview",
        provider: "vercel",
        resourceKind: "vercelProject",
        logicalId: "vercel-project:project-retained",
        physicalId: {
          teamId: "team-preview",
          projectId: "project-retained",
        },
        owner: { _tag: "VercelTeam", teamId: "team-preview" },
        removalPolicy: "retain",
        observedMetadataDigest: "a".repeat(64),
      },
    ],
  });
  const retired = yield* Schema.decodeUnknownEffect(AdoptionManifest)({
    schemaVersion: "1",
    stage: "preview",
    digest: "c".repeat(64),
    resources: [
      {
        stage: "preview",
        provider: "vercel",
        resourceKind: "vercelProject",
        logicalId: "vercel-project:project-successor",
        physicalId: {
          teamId: "team-preview",
          projectId: "project-successor",
        },
        owner: { _tag: "VercelTeam", teamId: "team-preview" },
        removalPolicy: "retain",
        observedMetadataDigest: "c".repeat(64),
      },
    ],
  });
  return { inventory, retained, retired, scope };
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
  "propagates the manifest retain policy through adoption and retirement",
  (stack) =>
    Effect.gen(function* retainAdoptedResource() {
      yield* stack.deploy(
        BundjilInfrastructureStack(decoded.retained).pipe(adopt(true))
      );
      const control = yield* VercelMemoryControl;
      const writesBeforeRetirement = yield* control.providerWriteCount;
      const output = yield* stack.deploy(
        BundjilInfrastructureStack(decoded.retired).pipe(adopt(true))
      );
      expect(output.retainedResourceCount).toBe(1);
      expect(yield* control.providerWriteCount).toBe(writesBeforeRetirement);
    })
);

import { assert, it } from "@effect/vitest";
import { Effect, Exit, Schema } from "effect";

import {
  AdoptionManifest,
  InfrastructureStateReadmissionLogicalIds,
  InfrastructureStateReadmissionPlan,
  validateInfrastructureStateReadmissionConvergence,
  validateInfrastructureStateReadmissionPlan,
} from "../src/index.js";

const digest =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const approvedProjectIds = [
  "prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB",
  "prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN",
] as const;
const manifest = Schema.decodeUnknownSync(AdoptionManifest)({
  schemaVersion: "1",
  stage: "preview",
  digest,
  resources: Array.from({ length: 155 }, (_, index) => {
    const approvedLogicalId =
      InfrastructureStateReadmissionLogicalIds.at(index);
    const projectId =
      approvedProjectIds.at(Math.floor(index / 4)) ?? "prj_preview";
    const environmentVariableId =
      approvedLogicalId?.split(":").at(-1) ?? `env_${index}`;
    return {
      provider: "vercel",
      resourceKind: "vercelEnvironmentVariable",
      owner: { _tag: "VercelTeam", teamId: "team_preview" },
      physicalId: {
        teamId: "team_preview",
        projectId,
        environmentVariableId,
      },
      desired: {
        key: `BUNDJIL_TEST_${index}`,
        type: "sensitive",
        targets: ["preview"],
        valueOwnership: { _tag: "ObservedUnknown", configured: true },
      },
      stage: "preview",
      logicalId:
        approvedLogicalId ?? `vercel-environment:prj_preview:env_${index}`,
      removalPolicy: "retain",
      observedMetadataDigest: digest,
    };
  }),
});
const approvedIds = [...InfrastructureStateReadmissionLogicalIds];

const makePlan = (updates: readonly string[]) =>
  Schema.decodeUnknownSync(InfrastructureStateReadmissionPlan)({
    resources: Object.fromEntries(
      manifest.resources.map((resource, index) => [
        `resource-${index}`,
        {
          action: updates.includes(resource.logicalId) ? "update" : "noop",
          resource: {
            LogicalId: resource.logicalId,
            Type: "Bundjil.Infrastructure.VercelEnvironmentVariable",
          },
        },
      ])
    ),
    actions: {},
    deletions: {},
    actionDeletions: {},
  });

it.effect("accepts only the exact eight state refresh updates", () =>
  Effect.gen(function* () {
    const summary = yield* validateInfrastructureStateReadmissionPlan(
      manifest,
      approvedIds,
      makePlan(approvedIds)
    );
    assert.deepStrictEqual(summary, {
      action: 0,
      create: 0,
      delete: 0,
      noOp: 147,
      replace: 0,
      resourceCount: 155,
      update: 8,
    });
    const convergence =
      yield* validateInfrastructureStateReadmissionConvergence(makePlan([]));
    assert.strictEqual(convergence.noOp, 155);
  })
);

it.effect("fails closed when the plan updates an unapproved identity", () =>
  Effect.gen(function* () {
    const wrongIdentity = manifest.resources.at(8)?.logicalId;
    const wrongIds =
      wrongIdentity === undefined
        ? []
        : [...approvedIds.slice(0, 7), wrongIdentity];
    const exit = yield* Effect.exit(
      validateInfrastructureStateReadmissionPlan(
        manifest,
        approvedIds,
        makePlan(wrongIds)
      )
    );
    assert.strictEqual(Exit.isFailure(exit), true);
  })
);

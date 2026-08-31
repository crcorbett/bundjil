import { assert, it as effectIt } from "@effect/vitest";
import { Effect, Exit, Schema } from "effect";

import {
  AdoptionManifest,
  InfrastructureStateReadmissionLogicalIds,
  InfrastructureStateReadmissionPlan,
  InfrastructureStateReadmissionRunIdentity,
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
const plannedUpdateIds = approvedIds.filter(
  (logicalId) => !logicalId.endsWith(":gyJ7AADGYjvMH88V")
);
const providerRevisionOnlyLogicalId = approvedIds.find((logicalId) =>
  logicalId.endsWith(":gyJ7AADGYjvMH88V")
);

effectIt.effect("accepts a bounded local operator receipt identity", () =>
  Effect.sync(() => {
    assert.strictEqual(
      Schema.is(InfrastructureStateReadmissionRunIdentity)(
        "local:cooper:bundjil:stg_repair:2026-08-31:attempt2"
      ),
      true
    );
    assert.strictEqual(
      Schema.is(InfrastructureStateReadmissionRunIdentity)("unsafe identity"),
      false
    );
    assert.strictEqual(
      Schema.is(InfrastructureStateReadmissionRunIdentity)(
        "dp.st.bundjil_stg_repair_token-shaped"
      ),
      false
    );
  })
);

const makePlan = (
  updates: readonly string[],
  logicalIdFor: (logicalId: string) => string = (logicalId) => logicalId
) =>
  Schema.decodeUnknownSync(InfrastructureStateReadmissionPlan)({
    resources: Object.fromEntries(
      manifest.resources.map((resource, index) => [
        `resource-${index}`,
        {
          action: updates.includes(resource.logicalId) ? "update" : "noop",
          resource: {
            LogicalId: logicalIdFor(resource.logicalId),
            Type: "Bundjil.Infrastructure.VercelEnvironmentVariable",
          },
        },
      ])
    ),
    actions: {},
    deletions: {},
    actionDeletions: {},
  });

effectIt.effect(
  "accepts exactly seven state updates across eight approved identities",
  () =>
    Effect.gen(function* () {
      const summary = yield* validateInfrastructureStateReadmissionPlan(
        manifest,
        approvedIds,
        makePlan(plannedUpdateIds)
      );
      assert.deepStrictEqual(summary, {
        action: 0,
        create: 0,
        delete: 0,
        noOp: 148,
        replace: 0,
        resourceCount: 155,
        update: 7,
      });
      const convergence =
        yield* validateInfrastructureStateReadmissionConvergence(
          manifest,
          makePlan([])
        );
      assert.strictEqual(convergence.noOp, 155);
    })
);

effectIt.effect(
  "fails closed when the plan updates an unapproved identity",
  () =>
    Effect.gen(function* () {
      const wrongIdentity = manifest.resources.at(8)?.logicalId;
      const wrongIds =
        wrongIdentity === undefined
          ? []
          : [...plannedUpdateIds.slice(0, 6), wrongIdentity];
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

effectIt.effect(
  "fails closed when the revision-only identity becomes an update",
  () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        validateInfrastructureStateReadmissionPlan(
          manifest,
          approvedIds,
          makePlan(approvedIds)
        )
      );
      assert.strictEqual(Exit.isFailure(exit), true);
    })
);

effectIt.effect(
  "fails closed when a no-op identity is duplicated and the revision-only identity is missing",
  () =>
    Effect.gen(function* () {
      const substituteLogicalId = String(
        manifest.resources.at(8)?.logicalId ?? "missing-substitute-logical-id"
      );
      const exit = yield* Effect.exit(
        validateInfrastructureStateReadmissionPlan(
          manifest,
          approvedIds,
          makePlan(plannedUpdateIds, (logicalId) =>
            logicalId === providerRevisionOnlyLogicalId
              ? substituteLogicalId
              : logicalId
          )
        )
      );
      assert.strictEqual(Exit.isFailure(exit), true);
      const convergenceExit = yield* Effect.exit(
        validateInfrastructureStateReadmissionConvergence(
          manifest,
          makePlan([], (logicalId) =>
            logicalId === providerRevisionOnlyLogicalId
              ? substituteLogicalId
              : logicalId
          )
        )
      );
      assert.strictEqual(Exit.isFailure(convergenceExit), true);
    })
);

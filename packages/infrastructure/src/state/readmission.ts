import { Effect, HashSet, Schema } from "effect";

import type { AdoptionManifest } from "../adoption-manifest.js";
import { AlchemyLogicalResourceId } from "../schemas.js";

const ReadmissionPlanResource = Schema.Struct({
  action: Schema.Literals(["create", "update", "replace", "noop"]),
  resource: Schema.Struct({
    LogicalId: AlchemyLogicalResourceId,
    Type: Schema.NonEmptyString,
  }),
});

const ReadmissionPlanDeletion = Schema.Struct({
  action: Schema.Literal("delete"),
  resource: Schema.Struct({
    LogicalId: AlchemyLogicalResourceId,
    Type: Schema.NonEmptyString,
  }),
});

export const InfrastructureStateReadmissionPlan = Schema.Struct({
  resources: Schema.Record(Schema.String, ReadmissionPlanResource),
  actions: Schema.Record(Schema.String, Schema.Unknown),
  deletions: Schema.Record(Schema.String, ReadmissionPlanDeletion),
  actionDeletions: Schema.Record(Schema.String, Schema.Unknown),
});
export type InfrastructureStateReadmissionPlan =
  typeof InfrastructureStateReadmissionPlan.Type;

export const InfrastructureStateReadmissionLogicalIdsJson =
  Schema.fromJsonString(Schema.NonEmptyArray(AlchemyLogicalResourceId));
export type InfrastructureStateReadmissionLogicalIdsJson =
  typeof InfrastructureStateReadmissionLogicalIdsJson.Type;

export const InfrastructureStateReadmissionPlanSummary = Schema.Struct({
  create: Schema.Literal(0),
  update: Schema.Number,
  replace: Schema.Literal(0),
  delete: Schema.Literal(0),
  noOp: Schema.Number,
  action: Schema.Literal(0),
  resourceCount: Schema.Number,
});
export type InfrastructureStateReadmissionPlanSummary =
  typeof InfrastructureStateReadmissionPlanSummary.Type;

export const InfrastructureStateReadmissionFailureReason = Schema.Literals([
  "candidateScopeInvalid",
  "candidateResourceInvalid",
  "planInvalid",
  "planScopeInvalid",
  "convergenceInvalid",
]);
export class InfrastructureStateReadmissionError extends Schema.TaggedErrorClass<InfrastructureStateReadmissionError>()(
  "InfrastructureStateReadmissionError",
  { reason: InfrastructureStateReadmissionFailureReason }
) {}

const expectedResourceCount = 155;
const expectedUpdateCount = 8;
const expectedNoOpCount = expectedResourceCount - expectedUpdateCount;
const environmentResourceType =
  "Bundjil.Infrastructure.VercelEnvironmentVariable";

export const InfrastructureStateReadmissionLogicalIds = [
  AlchemyLogicalResourceId.make(
    "vercel-environment:prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB:hZ4Ea3hhN741T0TZ"
  ),
  AlchemyLogicalResourceId.make(
    "vercel-environment:prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB:ibc2M4AaGdOfePVg"
  ),
  AlchemyLogicalResourceId.make(
    "vercel-environment:prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB:MPmsWURGwVFb0xGT"
  ),
  AlchemyLogicalResourceId.make(
    "vercel-environment:prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB:ysasVLtSKmcJfzFN"
  ),
  AlchemyLogicalResourceId.make(
    "vercel-environment:prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN:gyJ7AADGYjvMH88V"
  ),
  AlchemyLogicalResourceId.make(
    "vercel-environment:prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN:V2TJ2607F2AS8X3S"
  ),
  AlchemyLogicalResourceId.make(
    "vercel-environment:prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN:vUrZ5VqhnPAeI0sQ"
  ),
  AlchemyLogicalResourceId.make(
    "vercel-environment:prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN:w6YGQ6AyZ2Sws1H9"
  ),
];

const validateCandidateScope = Effect.fn(
  "InfrastructureStateReadmissionCandidate.validate"
)(function* (
  manifest: AdoptionManifest,
  logicalIds: readonly (typeof AlchemyLogicalResourceId.Type)[]
) {
  const uniqueIds = HashSet.fromIterable(logicalIds);
  const approvedIds = HashSet.fromIterable(
    InfrastructureStateReadmissionLogicalIds
  );
  if (
    manifest.stage !== "preview" ||
    manifest.resources.length !== expectedResourceCount ||
    logicalIds.length !== expectedUpdateCount ||
    HashSet.size(uniqueIds) !== expectedUpdateCount ||
    [...approvedIds].some((logicalId) => !HashSet.has(uniqueIds, logicalId))
  ) {
    return yield* new InfrastructureStateReadmissionError({
      reason: "candidateScopeInvalid",
    });
  }
  for (const logicalId of uniqueIds) {
    const resource = manifest.resources.find(
      (candidate) => candidate.logicalId === logicalId
    );
    if (
      resource?.resourceKind !== "vercelEnvironmentVariable" ||
      resource.desired.valueOwnership._tag !== "ObservedUnknown"
    ) {
      return yield* new InfrastructureStateReadmissionError({
        reason: "candidateResourceInvalid",
      });
    }
  }
  return uniqueIds;
});

export const validateInfrastructureStateReadmissionPlan = Effect.fn(
  "InfrastructureStateReadmissionPlan.validate"
)(function* (
  manifest: AdoptionManifest,
  logicalIds: readonly (typeof AlchemyLogicalResourceId.Type)[],
  plan: InfrastructureStateReadmissionPlan
) {
  const expectedIds = yield* validateCandidateScope(manifest, logicalIds);
  const resources = Object.values(plan.resources);
  const updates = resources.filter((resource) => resource.action === "update");
  const noOps = resources.filter((resource) => resource.action === "noop");
  const actualIds = HashSet.fromIterable(
    updates.map((resource) => resource.resource.LogicalId)
  );
  if (
    resources.length !== expectedResourceCount ||
    updates.length !== expectedUpdateCount ||
    noOps.length !== expectedNoOpCount ||
    Object.keys(plan.actions).length !== 0 ||
    Object.keys(plan.deletions).length !== 0 ||
    Object.keys(plan.actionDeletions).length !== 0 ||
    HashSet.size(actualIds) !== HashSet.size(expectedIds) ||
    [...expectedIds].some((logicalId) => !HashSet.has(actualIds, logicalId)) ||
    updates.some(
      (resource) => resource.resource.Type !== environmentResourceType
    ) ||
    resources.some(
      (resource) => resource.action !== "update" && resource.action !== "noop"
    )
  ) {
    return yield* new InfrastructureStateReadmissionError({
      reason: "planScopeInvalid",
    });
  }
  return InfrastructureStateReadmissionPlanSummary.make({
    action: 0,
    create: 0,
    delete: 0,
    noOp: noOps.length,
    replace: 0,
    resourceCount: resources.length,
    update: updates.length,
  });
});

export const validateInfrastructureStateReadmissionConvergence = Effect.fn(
  "InfrastructureStateReadmissionConvergence.validate"
)(function* (plan: InfrastructureStateReadmissionPlan) {
  const resources = Object.values(plan.resources);
  if (
    resources.length !== expectedResourceCount ||
    resources.some((resource) => resource.action !== "noop") ||
    Object.keys(plan.actions).length !== 0 ||
    Object.keys(plan.deletions).length !== 0 ||
    Object.keys(plan.actionDeletions).length !== 0
  ) {
    return yield* new InfrastructureStateReadmissionError({
      reason: "convergenceInvalid",
    });
  }
  return InfrastructureStateReadmissionPlanSummary.make({
    action: 0,
    create: 0,
    delete: 0,
    noOp: resources.length,
    replace: 0,
    resourceCount: resources.length,
    update: 0,
  });
});

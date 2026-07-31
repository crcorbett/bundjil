import { Effect, Match, Schema } from "effect";

import {
  InfrastructureArtifactDigest,
  InfrastructureBoundedReceipt,
  InfrastructureReceiptStatus,
} from "./receipt.js";
import {
  InfrastructureOutcomeCertainty,
  InfrastructureOwnershipState,
  InfrastructureResourceKind,
  InfrastructureRetryClass,
  InfrastructureStage,
} from "./schemas.js";

const NonNegativeInt = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(0))
);

export const InfrastructureDriftArtifactPath = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((value) =>
      value.length > 0 &&
      value.length <= 240 &&
      /^[A-Za-z0-9._/-]+$/.test(value) &&
      !value.startsWith("/") &&
      !value.split("/").includes("..")
        ? undefined
        : "Drift artifact paths must be safe repository-relative paths."
    )
  ),
  Schema.brand("@bundjil/infrastructure/InfrastructureDriftArtifactPath")
);
export type InfrastructureDriftArtifactPath =
  typeof InfrastructureDriftArtifactPath.Type;
export type InfrastructureDriftArtifactPathEncoded =
  typeof InfrastructureDriftArtifactPath.Encoded;

export const InfrastructureDriftResourceFingerprint = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
  Schema.brand("@bundjil/infrastructure/InfrastructureDriftResourceFingerprint")
);
export type InfrastructureDriftResourceFingerprint =
  typeof InfrastructureDriftResourceFingerprint.Type;
export type InfrastructureDriftResourceFingerprintEncoded =
  typeof InfrastructureDriftResourceFingerprint.Encoded;

export const InfrastructureDriftSourceSha = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{40}$/)),
  Schema.brand("@bundjil/infrastructure/InfrastructureDriftSourceSha")
);
export type InfrastructureDriftSourceSha =
  typeof InfrastructureDriftSourceSha.Type;
export type InfrastructureDriftSourceShaEncoded =
  typeof InfrastructureDriftSourceSha.Encoded;

export const InfrastructureDriftAction = Schema.Literals([
  "unchanged",
  "drifted",
  "missing",
  "skipped",
  "unavailable",
]);
export type InfrastructureDriftAction = typeof InfrastructureDriftAction.Type;
export type InfrastructureDriftActionEncoded =
  typeof InfrastructureDriftAction.Encoded;

export const InfrastructureDriftReadback = Schema.Literals([
  "available",
  "unavailable",
  "ambiguous",
]);
export type InfrastructureDriftReadback =
  typeof InfrastructureDriftReadback.Type;
export type InfrastructureDriftReadbackEncoded =
  typeof InfrastructureDriftReadback.Encoded;

export const InfrastructureDriftSecretRevision = Schema.Literals([
  "known",
  "unknown",
  "notApplicable",
]);
export type InfrastructureDriftSecretRevision =
  typeof InfrastructureDriftSecretRevision.Type;
export type InfrastructureDriftSecretRevisionEncoded =
  typeof InfrastructureDriftSecretRevision.Encoded;

export const InfrastructureDriftProviderRead = Schema.Literals([
  "performed",
  "skipped",
]);
export type InfrastructureDriftProviderRead =
  typeof InfrastructureDriftProviderRead.Type;
export type InfrastructureDriftProviderReadEncoded =
  typeof InfrastructureDriftProviderRead.Encoded;

export const InfrastructureDriftBaselineDisposition = Schema.Literals([
  "accepted",
  "rejected",
]);
export type InfrastructureDriftBaselineDisposition =
  typeof InfrastructureDriftBaselineDisposition.Type;
export type InfrastructureDriftBaselineDispositionEncoded =
  typeof InfrastructureDriftBaselineDisposition.Encoded;

export const InfrastructureDriftDiffClass = Schema.Literals([
  "no_op",
  "update",
  "replace",
  "unknown",
]);
export type InfrastructureDriftDiffClass =
  typeof InfrastructureDriftDiffClass.Type;
export type InfrastructureDriftDiffClassEncoded =
  typeof InfrastructureDriftDiffClass.Encoded;

export const InfrastructureDriftAttempts = Schema.Union([
  Schema.TaggedStruct("Observed", { count: NonNegativeInt }),
  Schema.TaggedStruct("NotExposed", {}),
]);
export type InfrastructureDriftAttempts =
  typeof InfrastructureDriftAttempts.Type;
export type InfrastructureDriftAttemptsEncoded =
  typeof InfrastructureDriftAttempts.Encoded;

export const InfrastructureDriftDuration = Schema.Union([
  Schema.TaggedStruct("Observed", { milliseconds: NonNegativeInt }),
  Schema.TaggedStruct("NotExposed", {}),
]);
export type InfrastructureDriftDuration =
  typeof InfrastructureDriftDuration.Type;
export type InfrastructureDriftDurationEncoded =
  typeof InfrastructureDriftDuration.Encoded;

export const InfrastructureDriftResourceKind = Schema.Union([
  InfrastructureResourceKind,
  Schema.Literal("infrastructureStack"),
]);
export type InfrastructureDriftResourceKind =
  typeof InfrastructureDriftResourceKind.Type;
export type InfrastructureDriftResourceKindEncoded =
  typeof InfrastructureDriftResourceKind.Encoded;

export const InfrastructureDriftObservation = Schema.Struct({
  action: InfrastructureDriftAction,
  attempts: InfrastructureDriftAttempts,
  baselineDisposition: InfrastructureDriftBaselineDisposition,
  certainty: InfrastructureOutcomeCertainty,
  diffClass: InfrastructureDriftDiffClass,
  duration: InfrastructureDriftDuration,
  ownership: Schema.Union([
    InfrastructureOwnershipState,
    Schema.Literal("Unknown"),
  ]),
  providerRead: InfrastructureDriftProviderRead,
  readback: InfrastructureDriftReadback,
  resourceFingerprint: InfrastructureDriftResourceFingerprint,
  resourceKind: InfrastructureDriftResourceKind,
  retry: InfrastructureRetryClass,
  secretRevision: InfrastructureDriftSecretRevision,
  source: Schema.Literals(["desiredPlan", "nativeSync"]),
  stage: InfrastructureStage,
});
export type InfrastructureDriftObservation =
  typeof InfrastructureDriftObservation.Type;
export type InfrastructureDriftObservationEncoded =
  typeof InfrastructureDriftObservation.Encoded;

export const InfrastructureDriftCategory = Schema.Literals([
  "expectedProviderNormalization",
  "unownedResource",
  "missingResource",
  "inPlaceDrift",
  "destructiveDrift",
  "unavailableOrAmbiguousReadback",
  "unknownSecretRevision",
  "skippedProviderRead",
  "deploymentDrift",
  "desiredStatePlanChange",
]);
export type InfrastructureDriftCategory =
  typeof InfrastructureDriftCategory.Type;
export type InfrastructureDriftCategoryEncoded =
  typeof InfrastructureDriftCategory.Encoded;

export const InfrastructureDriftDisposition = Schema.Literals([
  "accepted",
  "report",
  "blocking",
  "inconclusive",
]);
export type InfrastructureDriftDisposition =
  typeof InfrastructureDriftDisposition.Type;
export type InfrastructureDriftDispositionEncoded =
  typeof InfrastructureDriftDisposition.Encoded;

export const InfrastructureDriftFinding = Schema.Struct({
  category: InfrastructureDriftCategory,
  disposition: InfrastructureDriftDisposition,
  resourceFingerprint: InfrastructureDriftResourceFingerprint,
  resourceKind: InfrastructureDriftResourceKind,
  source: Schema.Literals(["desiredPlan", "nativeSync"]),
});
export type InfrastructureDriftFinding = typeof InfrastructureDriftFinding.Type;
export type InfrastructureDriftFindingEncoded =
  typeof InfrastructureDriftFinding.Encoded;

const InfrastructureDriftDesiredPlanCounts = Schema.Struct({
  create: NonNegativeInt,
  delete: NonNegativeInt,
  noOp: NonNegativeInt,
  replace: NonNegativeInt,
  update: NonNegativeInt,
});

export const InfrastructureDriftDesiredPlan = Schema.Union([
  Schema.TaggedStruct("Observed", InfrastructureDriftDesiredPlanCounts.fields),
  Schema.TaggedStruct("NotExposed", {}),
]);
export type InfrastructureDriftDesiredPlan =
  typeof InfrastructureDriftDesiredPlan.Type;
export type InfrastructureDriftDesiredPlanEncoded =
  typeof InfrastructureDriftDesiredPlan.Encoded;

export const InfrastructureDriftReportInput = Schema.Struct({
  authorityFingerprint: InfrastructureDriftResourceFingerprint,
  observedAt: Schema.String.pipe(
    Schema.check(
      Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/)
    )
  ),
  desiredPlan: InfrastructureDriftDesiredPlan,
  observations: Schema.Array(InfrastructureDriftObservation).pipe(
    Schema.check(Schema.isMinLength(1))
  ),
  runDurationMilliseconds: NonNegativeInt,
  sourceSha: InfrastructureDriftSourceSha,
  stage: InfrastructureStage,
});
export type InfrastructureDriftReportInput =
  typeof InfrastructureDriftReportInput.Type;
export type InfrastructureDriftReportInputEncoded =
  typeof InfrastructureDriftReportInput.Encoded;
export const InfrastructureDriftReportInputJson = Schema.fromJsonString(
  InfrastructureDriftReportInput
);

export const InfrastructureDriftReportStatus = Schema.Literals([
  "no_op",
  "passed",
  "failed",
  "inconclusive",
]);
export type InfrastructureDriftReportStatus =
  typeof InfrastructureDriftReportStatus.Type;
export type InfrastructureDriftReportStatusEncoded =
  typeof InfrastructureDriftReportStatus.Encoded;

export const InfrastructureDriftReport = Schema.Struct({
  authorityFingerprint: InfrastructureDriftResourceFingerprint,
  counts: Schema.Struct({
    accepted: NonNegativeInt,
    blocking: NonNegativeInt,
    inconclusive: NonNegativeInt,
    report: NonNegativeInt,
  }),
  desiredPlan: InfrastructureDriftDesiredPlan,
  findings: Schema.Array(InfrastructureDriftFinding),
  nonClaims: Schema.Array(Schema.NonEmptyString).pipe(
    Schema.check(Schema.isMinLength(1))
  ),
  observedAt: InfrastructureDriftReportInput.fields.observedAt,
  runDurationMilliseconds: NonNegativeInt,
  schemaVersion: Schema.Literal(1),
  sourceSha: InfrastructureDriftSourceSha,
  stage: InfrastructureStage,
  status: InfrastructureDriftReportStatus,
});
export type InfrastructureDriftReport = typeof InfrastructureDriftReport.Type;
export type InfrastructureDriftReportEncoded =
  typeof InfrastructureDriftReport.Encoded;
export const InfrastructureDriftReportJson = Schema.fromJsonString(
  InfrastructureDriftReport
);

export const InfrastructureDriftReceiptInput = Schema.Struct({
  authorityReceipt: InfrastructureDriftArtifactPath,
  detailDigest: InfrastructureArtifactDigest,
  report: InfrastructureDriftReport,
  reportPath: InfrastructureDriftArtifactPath,
});
export type InfrastructureDriftReceiptInput =
  typeof InfrastructureDriftReceiptInput.Type;
export type InfrastructureDriftReceiptInputEncoded =
  typeof InfrastructureDriftReceiptInput.Encoded;

const categoryFor = (observation: InfrastructureDriftObservation) =>
  Match.value(observation).pipe(
    Match.when(
      ({ action, source }) =>
        source === "desiredPlan" && action !== "unchanged",
      () => InfrastructureDriftCategory.make("desiredStatePlanChange")
    ),
    Match.when(
      ({ readback }) => readback !== "available",
      () => InfrastructureDriftCategory.make("unavailableOrAmbiguousReadback")
    ),
    Match.when(
      ({ providerRead }) => providerRead === "skipped",
      () => InfrastructureDriftCategory.make("skippedProviderRead")
    ),
    Match.when(
      ({ secretRevision }) => secretRevision === "unknown",
      () => InfrastructureDriftCategory.make("unknownSecretRevision")
    ),
    Match.when(
      ({ action, resourceKind }) =>
        resourceKind === "vercelDeploymentObservation" &&
        action !== "unchanged",
      () => InfrastructureDriftCategory.make("deploymentDrift")
    ),
    Match.when(
      ({ ownership }) => ownership === "Unowned",
      () => InfrastructureDriftCategory.make("unownedResource")
    ),
    Match.when(
      ({ action }) => action === "missing",
      () => InfrastructureDriftCategory.make("missingResource")
    ),
    Match.when(
      ({ action, diffClass }) =>
        action === "drifted" && diffClass === "replace",
      () => InfrastructureDriftCategory.make("destructiveDrift")
    ),
    Match.when(
      ({ action }) => action === "drifted",
      () => InfrastructureDriftCategory.make("inPlaceDrift")
    ),
    Match.orElse(() =>
      InfrastructureDriftCategory.make("expectedProviderNormalization")
    )
  );

const dispositionFor = (
  observation: InfrastructureDriftObservation,
  category: InfrastructureDriftCategory
) =>
  Match.value(category).pipe(
    Match.when("expectedProviderNormalization", () =>
      InfrastructureDriftDisposition.make("accepted")
    ),
    Match.when("unownedResource", () =>
      InfrastructureDriftDisposition.make(
        observation.baselineDisposition === "accepted" ? "accepted" : "report"
      )
    ),
    Match.when(
      (value) =>
        value === "unavailableOrAmbiguousReadback" ||
        value === "unknownSecretRevision" ||
        value === "skippedProviderRead",
      () => InfrastructureDriftDisposition.make("inconclusive")
    ),
    Match.orElse(() => InfrastructureDriftDisposition.make("blocking"))
  );

export const buildInfrastructureDriftReport = Effect.fn(
  "InfrastructureDriftReport.build"
)(function* (input: InfrastructureDriftReportInput) {
  const findings = yield* Effect.forEach(
    input.observations,
    (observation) => {
      const category = categoryFor(observation);
      const disposition = dispositionFor(observation, category);
      return Effect.succeed(
        InfrastructureDriftFinding.make({
          category,
          disposition,
          resourceFingerprint: observation.resourceFingerprint,
          resourceKind: observation.resourceKind,
          source: observation.source,
        })
      ).pipe(
        Effect.withSpan("infrastructure.drift.resource", {
          attributes: {
            "infrastructure.drift.action": observation.action,
            "infrastructure.drift.category": category,
            "infrastructure.drift.certainty": observation.certainty._tag,
            "infrastructure.drift.disposition": disposition,
            "infrastructure.drift.resource_fingerprint":
              observation.resourceFingerprint,
            "infrastructure.drift.resource_kind": observation.resourceKind,
            "infrastructure.drift.retry": observation.retry,
            "infrastructure.drift.stage": observation.stage,
          },
        })
      );
    },
    { concurrency: 1 }
  );
  const counts = {
    accepted: findings.filter(({ disposition }) => disposition === "accepted")
      .length,
    blocking: findings.filter(({ disposition }) => disposition === "blocking")
      .length,
    inconclusive: findings.filter(
      ({ disposition }) => disposition === "inconclusive"
    ).length,
    report: findings.filter(({ disposition }) => disposition === "report")
      .length,
  };
  const status = Match.value(counts).pipe(
    Match.when(
      ({ blocking }) => blocking > 0,
      () => InfrastructureDriftReportStatus.make("failed")
    ),
    Match.when(
      ({ inconclusive }) => inconclusive > 0,
      () => InfrastructureDriftReportStatus.make("inconclusive")
    ),
    Match.when(
      ({ report }) => report > 0,
      () => InfrastructureDriftReportStatus.make("passed")
    ),
    Match.orElse(() => InfrastructureDriftReportStatus.make("no_op"))
  );
  return InfrastructureDriftReport.make({
    authorityFingerprint: input.authorityFingerprint,
    counts,
    findings,
    desiredPlan: input.desiredPlan,
    nonClaims: [
      "A report-only run does not authorize repair, apply, deployment, promotion, credential change, provider mutation, or Production access.",
      "Repository source and local fixtures do not prove GitHub settings, secret availability, a hosted run, future provider state, or alert delivery.",
      "Pass, command, run, duration and finding counts are activity data; only the classified resource postconditions are acceptance evidence.",
    ],
    observedAt: input.observedAt,
    runDurationMilliseconds: input.runDurationMilliseconds,
    schemaVersion: 1,
    sourceSha: input.sourceSha,
    stage: input.stage,
    status,
  });
});

export const buildInfrastructureDriftReceipt = Effect.fn(
  "InfrastructureDriftReceipt.build"
)(function* (input: InfrastructureDriftReceiptInput) {
  const { report } = input;
  const desiredPlanObservations = Match.value(report.desiredPlan).pipe(
    Match.tag(
      "Observed",
      ({ create, delete: deletes, noOp, replace, update }) => [
        `plan-create:${create}`,
        `plan-update:${update}`,
        `plan-replace:${replace}`,
        `plan-delete:${deletes}`,
        `plan-noop:${noOp}`,
      ]
    ),
    Match.tag("NotExposed", () => ["plan:not-exposed"]),
    Match.exhaustive
  );
  return yield* Effect.succeed(
    InfrastructureBoundedReceipt.make({
      actor: report.sourceSha,
      authorityReceipt: input.authorityReceipt,
      candidateIdentity: report.sourceSha,
      claim:
        "One report-only native Alchemy Preview drift observation completed with a sanitized classified result.",
      detailArtifacts: [{ path: input.reportPath, sha256: input.detailDigest }],
      environment: report.stage,
      journeyIds: ["BND-J14-preview-infrastructure-drift-report"],
      limitations: [
        "Per-resource retry attempt and duration counts are not exposed by the pinned native sync result and remain explicitly NotExposed.",
        "The alert transport remains outside the accepted SPEC; the report is a GitHub run/check signal only.",
      ],
      nonClaims: report.nonClaims,
      observations: [
        `status:${report.status}`,
        `accepted:${report.counts.accepted}`,
        `report:${report.counts.report}`,
        `blocking:${report.counts.blocking}`,
        `inconclusive:${report.counts.inconclusive}`,
        ...desiredPlanObservations,
        "provider-writes:0",
      ],
      observedAt: report.observedAt,
      postconditions: [
        "The native Alchemy sync observation ran with dry-run semantics and no reconcile or state write.",
        "The specialized detail report and bounded receipt passed their owning encoders.",
      ],
      rollbackOrRecovery:
        "No provider rollback is required. Discard the local report and revoke the read-only workflow environment if identity, scope, or redaction drifts.",
      schemaVersion: "1",
      status: Match.value(report.status).pipe(
        Match.when("no_op", () => InfrastructureReceiptStatus.make("no_op")),
        Match.when("passed", () => InfrastructureReceiptStatus.make("passed")),
        Match.when("failed", () => InfrastructureReceiptStatus.make("failed")),
        Match.when("inconclusive", () =>
          InfrastructureReceiptStatus.make("inconclusive")
        ),
        Match.exhaustive
      ),
      target: "alchemy:BundjilInfrastructure:preview",
    })
  );
});

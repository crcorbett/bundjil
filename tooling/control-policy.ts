import { Schema } from "effect";

import type { BoundaryException } from "./boundary-exceptions.js";
import type { FreshnessCandidate } from "./documentation/freshness-candidate.js";
import { freshnessCandidateFindings } from "./documentation/freshness-candidate.js";

const TextArray = Schema.Array(Schema.NonEmptyString);
const MetricPlan = Schema.Struct({
  acceptedOutcome: Schema.NonEmptyString,
  falsePositive: Schema.NonEmptyString,
  feedbackLatency: Schema.NonEmptyString,
  synchronousHumanAttention: Schema.NonEmptyString,
  workerDuration: Schema.NonEmptyString,
});

const ControlRecord = Schema.Struct({
  admissionEvidence: Schema.NonEmptyString,
  carryingCost: Schema.NonEmptyString,
  commands: TextArray,
  earliestOwnerPaths: TextArray,
  failureClass: Schema.NonEmptyString,
  falsePositiveCost: Schema.NonEmptyString,
  fixturePaths: TextArray,
  id: Schema.NonEmptyString,
  invariant: Schema.NonEmptyString,
  metricPlan: MetricPlan,
  nonClaim: Schema.NonEmptyString,
  repairCost: Schema.NonEmptyString,
  retirement: Schema.NonEmptyString,
  reviewTrigger: Schema.NonEmptyString,
  rollback: Schema.NonEmptyString,
  state: Schema.Literals(["retained", "retired"]),
});
export const ControlRegister = Schema.Struct({
  controls: Schema.Array(ControlRecord),
  lastReviewed: Schema.NonEmptyString,
  owner: Schema.NonEmptyString,
  reviewTrigger: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
});
export type ControlRegister = typeof ControlRegister.Type;
export const ControlRegisterJson = Schema.fromJsonString(ControlRegister);

const AutomationRecord = Schema.Struct({
  acceptedOutcome: Schema.NonEmptyString,
  authorityOwner: Schema.NonEmptyString,
  carryingCost: Schema.NonEmptyString,
  convergence: Schema.NonEmptyString,
  durableState: Schema.NonEmptyString,
  duration: Schema.NonEmptyString,
  environment: Schema.NonEmptyString,
  escalation: Schema.NonEmptyString,
  externalReadback: Schema.NonEmptyString,
  fixturePaths: TextArray,
  id: Schema.NonEmptyString,
  metrics: MetricPlan,
  nonClaim: Schema.NonEmptyString,
  operation: Schema.NonEmptyString,
  principal: Schema.NonEmptyString,
  proof: Schema.NonEmptyString,
  publication: Schema.NonEmptyString,
  resource: Schema.NonEmptyString,
  retirement: Schema.NonEmptyString,
  reviewTrigger: Schema.NonEmptyString,
  rollback: Schema.NonEmptyString,
  selfFeedbackExcluded: Schema.Boolean,
  signal: Schema.NonEmptyString,
  state: Schema.Literals([
    "admitted",
    "foreground_only",
    "disabled_pending_proof",
    "retired",
    "report_only",
  ]),
  stateOwner: Schema.NonEmptyString,
  stopping: Schema.NonEmptyString,
});
export const AutomationRegister = Schema.Struct({
  lastReviewed: Schema.NonEmptyString,
  owner: Schema.NonEmptyString,
  records: Schema.Array(AutomationRecord),
  reviewTrigger: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
});
export type AutomationRegister = typeof AutomationRegister.Type;
export const AutomationRegisterJson = Schema.fromJsonString(AutomationRegister);

export const FeedbackPromotion = Schema.Struct({
  evidence: TextArray,
  enforcingControlId: Schema.NonEmptyString,
  id: Schema.NonEmptyString,
  nonClaim: Schema.NonEmptyString,
  priorReminderPaths: TextArray,
  promotedOwner: Schema.NonEmptyString,
  repeatedFinding: Schema.NonEmptyString,
  retiredReminderPaths: TextArray,
  rollback: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
});
export type FeedbackPromotion = typeof FeedbackPromotion.Type;
export const FeedbackPromotionJson = Schema.fromJsonString(FeedbackPromotion);

export const BoundaryControlDecision = Schema.Struct({
  decision: Schema.Literal("retain-occurrence-registry"),
  exceptionCount: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  measuredAt: Schema.NonEmptyString,
  measuredCost: Schema.NonEmptyString,
  nonClaims: TextArray,
  preservedProperties: TextArray,
  rationale: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
});
export type BoundaryControlDecision = typeof BoundaryControlDecision.Type;
export const BoundaryControlDecisionJson = Schema.fromJsonString(
  BoundaryControlDecision
);

export const ControlPolicyFinding = Schema.Struct({
  code: Schema.NonEmptyString,
  detail: Schema.NonEmptyString,
  invariant: Schema.NonEmptyString,
  repairHint: Schema.NonEmptyString,
  target: Schema.NonEmptyString,
});
export type ControlPolicyFinding = typeof ControlPolicyFinding.Type;

export const ControlPolicyReport = Schema.Struct({
  checkedAutomations: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  checkedControls: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  checkedFreshnessCandidates: Schema.Int.check(
    Schema.isGreaterThanOrEqualTo(0)
  ),
  detailPath: Schema.NonEmptyString,
  findings: Schema.Array(ControlPolicyFinding),
  generatedAt: Schema.NonEmptyString,
  ok: Schema.Boolean,
  schemaVersion: Schema.Literal(1),
});
export type ControlPolicyReport = typeof ControlPolicyReport.Type;
export const ControlPolicyReportJson =
  Schema.fromJsonString(ControlPolicyReport);

export interface ControlPolicySnapshot {
  readonly automationRegister: AutomationRegister;
  readonly boundaryDecision: BoundaryControlDecision;
  readonly boundaryExceptions: readonly BoundaryException[];
  readonly controlRegister: ControlRegister;
  readonly currentOwnerPaths: readonly string[];
  readonly feedbackPromotion: FeedbackPromotion;
  readonly freshnessCandidates: readonly FreshnessCandidate[];
  readonly repositoryPaths: readonly string[];
  readonly sourceDigests: Readonly<Record<string, string>>;
}

const requiredControls = [
  "effect-language-service",
  "boundary-provenance",
  "ultracite-lint-format",
  "documentation-owner-policy",
  "skill-mirror-policy",
  "workflow-authority-policy",
  "critical-journey-proof-policy",
  "dependency-export-hygiene",
] as const;

const requiredAutomations = new Map([
  ["github-ci", "admitted"],
  ["github-release-pr", "disabled_pending_proof"],
  ["github-claude-interactive", "foreground_only"],
  ["github-claude-auto-review", "retired"],
  ["vercel-deploy-promote", "foreground_only"],
  ["sendblue-inbound", "admitted"],
  ["sendblue-outbound", "foreground_only"],
  ["executor-operations", "foreground_only"],
  ["ai-gateway-eve", "foreground_only"],
  ["codex-model-proxy", "disabled_pending_proof"],
  ["docs-context-freshness", "report_only"],
] as const);

const finding = (
  code: string,
  invariant: string,
  target: string,
  repairHint: string,
  detail: string
): ControlPolicyFinding => ({ code, detail, invariant, repairHint, target });

const duplicateValues = (values: readonly string[]) =>
  values.filter((value, index) => values.indexOf(value) !== index);

const controlFindings = (
  snapshot: ControlPolicySnapshot
): readonly ControlPolicyFinding[] => {
  const findings: ControlPolicyFinding[] = [];
  const controlIds = snapshot.controlRegister.controls.map(({ id }) => id);
  for (const id of duplicateValues(controlIds)) {
    findings.push(
      finding(
        "CONTROL-DUPLICATE",
        "Control identities are unique",
        id,
        "Remove or merge the duplicate control row",
        `Duplicate control id: ${id}`
      )
    );
  }
  for (const id of requiredControls) {
    if (!controlIds.includes(id)) {
      findings.push(
        finding(
          "CONTROL-MISSING",
          "Every admitted failure class has one durable control owner",
          id,
          "Restore the required control row and its fixtures",
          `Missing control id: ${id}`
        )
      );
    }
  }
  for (const control of snapshot.controlRegister.controls) {
    for (const path of [
      ...control.earliestOwnerPaths,
      ...control.fixturePaths,
    ]) {
      if (!snapshot.repositoryPaths.includes(path)) {
        findings.push(
          finding(
            "CONTROL-PATH",
            "Control owners and fixtures are addressable",
            `${control.id}:${path}`,
            "Restore the path or update the control record atomically",
            `Missing repository path: ${path}`
          )
        );
      }
    }
    if (control.commands.length === 0 || control.fixturePaths.length < 2) {
      findings.push(
        finding(
          "CONTROL-EVIDENCE",
          "Every retained control has a command plus positive and negative fixture evidence",
          control.id,
          "Name the owning command and at least two fixture owners",
          "Control command or fixture evidence is incomplete"
        )
      );
    }
  }
  return findings;
};

const automationFindings = (
  snapshot: ControlPolicySnapshot
): readonly ControlPolicyFinding[] => {
  const findings: ControlPolicyFinding[] = [];
  const automationIds = snapshot.automationRegister.records.map(({ id }) => id);
  for (const id of duplicateValues(automationIds)) {
    findings.push(
      finding(
        "AUTOMATION-DUPLICATE",
        "Automation identities are unique",
        id,
        "Remove or merge the duplicate automation row",
        `Duplicate automation id: ${id}`
      )
    );
  }
  for (const [id, state] of requiredAutomations) {
    const record = snapshot.automationRegister.records.find(
      (candidate) => candidate.id === id
    );
    if (record?.state !== state) {
      findings.push(
        finding(
          "AUTOMATION-STATE",
          "Every automation loop retains its admitted, foreground, disabled, retired, or report-only state",
          id,
          `Restore ${id} with state ${state}`,
          `Expected ${state}; observed ${record?.state ?? "missing"}`
        )
      );
    }
  }
  for (const record of snapshot.automationRegister.records) {
    const missingFixtures = record.fixturePaths.filter(
      (path) => !snapshot.repositoryPaths.includes(path)
    );
    if (record.fixturePaths.length < 2 || missingFixtures.length > 0) {
      findings.push(
        finding(
          "AUTOMATION-FIXTURE",
          "Every automation state has addressable positive and adversarial fixture owners",
          record.id,
          "Name at least two existing fixture paths and update them with the loop contract",
          `Missing or insufficient fixtures: ${missingFixtures.join(", ") || record.fixturePaths.length}`
        )
      );
    }
  }
  const freshness = snapshot.automationRegister.records.find(
    ({ id }) => id === "docs-context-freshness"
  );
  if (
    freshness !== undefined &&
    (!freshness.selfFeedbackExcluded ||
      !/separate|approval|not authorized/i.test(freshness.publication))
  ) {
    findings.push(
      finding(
        "AUTOMATION-FRESHNESS-PUBLICATION",
        "Background freshness is report-only, excludes self-feedback, and cannot self-publish",
        freshness.id,
        "Restore self-feedback exclusion and a separate publisher/approval/readback contract",
        "Freshness automation could feed or publish itself"
      )
    );
  }
  for (const owner of snapshot.currentOwnerPaths) {
    if (owner.startsWith("docs/documentation-audit/freshness-candidates/")) {
      findings.push(
        finding(
          "FRESHNESS-DEFAULT-CONTEXT",
          "Freshness candidates remain outside default current-owner routing",
          owner,
          "Remove the candidate path from the current-owner policy",
          "Candidate evidence was promoted into default current context"
        )
      );
    }
  }
  return findings;
};

const boundaryFindings = (
  snapshot: ControlPolicySnapshot
): readonly ControlPolicyFinding[] => {
  const findings: ControlPolicyFinding[] = [];
  const boundaryKeys = snapshot.boundaryExceptions.map(
    ({ file, symbol, occurrence, rule }) =>
      `${file}|${symbol}|${occurrence}|${rule}`
  );
  for (const key of duplicateValues(boundaryKeys)) {
    findings.push(
      finding(
        "BOUNDARY-DUPLICATE",
        "Boundary exception identities are exact and unique before audit matching",
        key,
        "Remove the duplicate exact file/symbol/occurrence/rule entry",
        `Duplicate exact boundary exception: ${key}`
      )
    );
  }
  if (snapshot.boundaryDecision.exceptionCount !== boundaryKeys.length) {
    findings.push(
      finding(
        "BOUNDARY-MEASUREMENT",
        "The retained occurrence registry decision matches the measured real registry",
        "docs/documentation-audit/HGI-306-boundary-exceptions.decision.json",
        "Re-measure the exact registry and update the decision with the code change",
        `Decision count ${snapshot.boundaryDecision.exceptionCount}; observed ${boundaryKeys.length}`
      )
    );
  }
  const preserved = new Set(snapshot.boundaryDecision.preservedProperties);
  for (const property of [
    "exact match",
    "duplicate rejection",
    "occurrence isolation",
    "stale detection",
  ]) {
    if (!preserved.has(property)) {
      findings.push(
        finding(
          "BOUNDARY-EQUIVALENCE",
          "Boundary control retains all four accepted equivalence properties",
          property,
          "Restore the missing property or reject the replacement",
          `Missing preserved property: ${property}`
        )
      );
    }
  }
  return findings;
};

const feedbackAndFreshnessFindings = (
  snapshot: ControlPolicySnapshot
): readonly ControlPolicyFinding[] => {
  const findings: ControlPolicyFinding[] = [];
  if (
    snapshot.feedbackPromotion.enforcingControlId !==
      "documentation-owner-policy" ||
    !snapshot.repositoryPaths.includes(snapshot.feedbackPromotion.promotedOwner)
  ) {
    findings.push(
      finding(
        "FEEDBACK-PROMOTION",
        "Repeated feedback is promoted to an addressable earlier durable owner",
        snapshot.feedbackPromotion.id,
        "Point the trace at the typed freshness contract and documentation control",
        "Feedback promotion owner or enforcing control is invalid"
      )
    );
  }
  for (const candidate of snapshot.freshnessCandidates) {
    const digest = snapshot.sourceDigests[candidate.source.path];
    if (digest !== candidate.source.sha256) {
      findings.push(
        finding(
          "FRESHNESS-SOURCE-DIGEST",
          "A freshness candidate binds the exact observed source bytes",
          candidate.id,
          "Regenerate or quarantine the candidate against the exact source revision",
          `Declared ${candidate.source.sha256}; observed ${digest ?? "missing"}`
        )
      );
    }
    for (const issue of freshnessCandidateFindings(candidate)) {
      findings.push(
        finding(
          issue.code,
          "Freshness candidates remain isolated, non-self-authorizing, and recovery-bounded",
          candidate.id,
          "Correct the candidate or quarantine it without publishing",
          issue.detail
        )
      );
    }
  }
  return findings;
};

/** Audits the already-decoded repository contracts without external access. */
export const auditControlPolicy = (
  snapshot: ControlPolicySnapshot,
  options: Readonly<{ detailPath: string; generatedAt: string }>
): ControlPolicyReport => {
  const findings = [
    ...controlFindings(snapshot),
    ...automationFindings(snapshot),
    ...boundaryFindings(snapshot),
    ...feedbackAndFreshnessFindings(snapshot),
  ];
  return {
    checkedAutomations: snapshot.automationRegister.records.length,
    checkedControls: snapshot.controlRegister.controls.length,
    checkedFreshnessCandidates: snapshot.freshnessCandidates.length,
    detailPath: options.detailPath,
    findings,
    generatedAt: options.generatedAt,
    ok: findings.length === 0,
    schemaVersion: 1,
  };
};

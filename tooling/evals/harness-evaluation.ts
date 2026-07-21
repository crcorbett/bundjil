import { Schema } from "effect";

const Digest = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/));
const Commit = Schema.String.check(Schema.isPattern(/^[a-f0-9]{40}$/));
const TextArray = Schema.Array(Schema.NonEmptyString);
const Clock = Schema.NullOr(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)));

const Receipt = Schema.Struct({
  path: Schema.NonEmptyString,
  sha256: Digest,
});

const ScenarioCase = Schema.Struct({
  expectedDecision: Schema.NonEmptyString,
  expectedOwners: TextArray,
  failureClass: Schema.NonEmptyString,
  id: Schema.NonEmptyString,
  nonClaim: Schema.NonEmptyString,
  prompt: Schema.NonEmptyString,
});

export const HarnessScenarioManifest = Schema.Struct({
  baseCommit: Commit,
  cases: Schema.Array(ScenarioCase),
  schemaVersion: Schema.Literal(1),
  taskId: Schema.Literal("HGI-307"),
});
export type HarnessScenarioManifest = typeof HarnessScenarioManifest.Type;
export const HarnessScenarioManifestJson = Schema.fromJsonString(
  HarnessScenarioManifest
);

const TimingClocks = Schema.Struct({
  feedbackLatencyMs: Clock,
  synchronousHumanAttentionMs: Clock,
  timeToAcceptedOutcomeMs: Clock,
  workerDurationMs: Clock,
});

const ScenarioResult = Schema.Struct({
  decision: Schema.NonEmptyString,
  evaluator: Schema.NonEmptyString,
  evidence: TextArray,
  id: Schema.NonEmptyString,
  limitations: TextArray,
  nonClaims: TextArray,
  observedAt: Schema.NonEmptyString,
  report: Receipt,
  selectedOwners: TextArray,
  status: Schema.Literals(["passed", "failed", "inconclusive"]),
  timing: TimingClocks,
});

const SkillIdentity = Schema.Struct({
  path: Schema.NonEmptyString,
  sha256: Digest,
  sourceRevision: Schema.NonEmptyString,
});

const VersionedItem = Schema.Struct({
  name: Schema.NonEmptyString,
  version: Schema.NonEmptyString,
});

const InterventionDecision = Schema.Struct({
  carryingCost: Schema.NonEmptyString,
  decision: Schema.Literals(["retain", "revise", "remove"]),
  disconfirmingResult: Schema.NonEmptyString,
  evidence: TextArray,
  expectedMechanism: Schema.NonEmptyString,
  id: Schema.NonEmptyString,
  owner: Schema.NonEmptyString,
  retirement: Schema.NonEmptyString,
  reviewTrigger: Schema.NonEmptyString,
});

export const HarnessEpoch = Schema.Struct({
  authority: Schema.Struct({
    externalAccess: Schema.Literal("none"),
    localWrite: Schema.Boolean,
    providerReadbackPerformed: Schema.Literal(false),
    scope: Schema.NonEmptyString,
    stopping: TextArray,
  }),
  baseCommit: Commit,
  budget: Schema.NonEmptyString,
  contextProjectionRevision: Schema.NonEmptyString,
  epochId: Schema.NonEmptyString,
  host: Schema.NonEmptyString,
  interventions: Schema.Array(InterventionDecision),
  metrics: TimingClocks,
  model: Schema.NonEmptyString,
  modelIdentityLimitation: Schema.NonEmptyString,
  nativeActionInterface: Schema.NonEmptyString,
  runtime: Schema.Array(VersionedItem),
  scenarioManifest: Receipt,
  scenarios: Schema.Array(ScenarioResult),
  schemaVersion: Schema.Literal(1),
  skills: Schema.Array(SkillIdentity),
  status: Schema.Literal("accepted"),
  taskId: Schema.Literal("HGI-307"),
  tools: Schema.Array(VersionedItem),
});
export type HarnessEpoch = typeof HarnessEpoch.Type;
export const HarnessEpochJson = Schema.fromJsonString(HarnessEpoch);

const ImpactArea = Schema.Struct({
  area: Schema.NonEmptyString,
  decision: Schema.Literals(["changed", "preserved", "not_applicable"]),
  evidence: TextArray,
  limitations: TextArray,
  ownerPaths: TextArray,
  reviewTrigger: Schema.NonEmptyString,
});

const DeferredFinding = Schema.Struct({
  id: Schema.NonEmptyString,
  limitation: Schema.NonEmptyString,
  nonClaim: Schema.NonEmptyString,
  owner: Schema.NonEmptyString,
  resumeTrigger: Schema.NonEmptyString,
});

export const HarnessImpactLedger = Schema.Struct({
  baseCommit: Commit,
  deferredFindings: Schema.Array(DeferredFinding),
  docsInventory: Schema.Struct({
    pathCount: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
    sortedPathSha256: Digest,
  }),
  impactAreas: Schema.Array(ImpactArea),
  readmeInventory: Schema.Struct({
    pathCount: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
    sortedPathSha256: Digest,
  }),
  schemaVersion: Schema.Literal(1),
  taskId: Schema.Literal("HGI-307"),
  unresolvedFindings: Schema.Array(Schema.NonEmptyString),
});
export type HarnessImpactLedger = typeof HarnessImpactLedger.Type;
export const HarnessImpactLedgerJson =
  Schema.fromJsonString(HarnessImpactLedger);

export interface HarnessEvaluationSnapshot {
  readonly contentDigests: Readonly<Record<string, string>>;
  readonly docsPaths: readonly string[];
  readonly epoch: HarnessEpoch;
  readonly impactLedger: HarnessImpactLedger;
  readonly manifest: HarnessScenarioManifest;
  readonly readmePaths: readonly string[];
  readonly repositoryPaths: readonly string[];
}

export type HarnessEvaluationFinding = Readonly<{
  code: string;
  detail: string;
  invariant: string;
  repairHint: string;
  target: string;
}>;

export const HarnessEvaluationReport = Schema.Struct({
  checkedImpactAreas: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  checkedScenarios: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  detailPath: Schema.NonEmptyString,
  findings: Schema.Array(
    Schema.Struct({
      code: Schema.NonEmptyString,
      detail: Schema.NonEmptyString,
      invariant: Schema.NonEmptyString,
      repairHint: Schema.NonEmptyString,
      target: Schema.NonEmptyString,
    })
  ),
  generatedAt: Schema.NonEmptyString,
  ok: Schema.Boolean,
  schemaVersion: Schema.Literal(1),
});
export const HarnessEvaluationReportJson = Schema.fromJsonString(
  HarnessEvaluationReport
);

const requiredScenarioIds = [
  "HGI307-BND-J01",
  "HGI307-BND-J02",
  "HGI307-BND-J03",
  "HGI307-BND-J04",
  "HGI307-BND-J05",
  "HGI307-BND-J06",
  "HGI307-BND-J07",
  "HGI307-BND-J08",
  "HGI307-BND-J09",
  "HGI307-BND-J10",
  "HGI307-SKILL-CODE-01",
  "HGI307-SEEDED-CONTRADICTION-01",
] as const;
const requiredScenarioSet = new Set<string>(requiredScenarioIds);

const requiredImpactAreas = [
  "docs",
  "readmes",
  "lint",
  "skills",
  "config",
  "tests",
  "ci",
  "runbooks",
  "rollback",
] as const;
const requiredImpactAreaSet = new Set<string>(requiredImpactAreas);

const finding = (
  code: string,
  invariant: string,
  target: string,
  repairHint: string,
  detail: string
): HarnessEvaluationFinding => ({
  code,
  detail,
  invariant,
  repairHint,
  target,
});

const duplicateValues = (values: readonly string[]) =>
  values.filter((value, index) => values.indexOf(value) !== index);

const sortedPathDigest = async (paths: readonly string[]) => {
  const content = `${paths.toSorted().join("\n")}\n`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content)
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const scenarioFindings = (
  snapshot: HarnessEvaluationSnapshot
): readonly HarnessEvaluationFinding[] => {
  const findings: HarnessEvaluationFinding[] = [];
  const manifestIds = snapshot.manifest.cases.map(({ id }) => id);
  const resultIds = snapshot.epoch.scenarios.map(({ id }) => id);
  for (const id of [
    ...duplicateValues(manifestIds),
    ...duplicateValues(resultIds),
  ]) {
    findings.push(
      finding(
        "HARNESS-DUPLICATE-SCENARIO",
        "Scenario and result identities are unique",
        id,
        "Remove or merge the duplicate scenario identity",
        `Duplicate scenario identity: ${id}`
      )
    );
  }
  for (const id of requiredScenarioIds) {
    if (!manifestIds.includes(id) || !resultIds.includes(id)) {
      findings.push(
        finding(
          "HARNESS-MISSING-SCENARIO",
          "The recorded epoch runs every required Bundjil qualification scenario",
          id,
          "Restore the scenario and its fresh-context result",
          `Missing manifest or result identity: ${id}`
        )
      );
    }
  }
  for (const id of new Set(
    [...manifestIds, ...resultIds].filter(
      (value) => !requiredScenarioSet.has(value)
    )
  )) {
    findings.push(
      finding(
        "HARNESS-UNEXPECTED-SCENARIO",
        "The epoch contains exactly the required qualification scenarios",
        id,
        "Remove the unowned scenario or add it through a new versioned evaluation contract",
        `Unexpected scenario identity: ${id}`
      )
    );
  }
  if (
    snapshot.manifest.baseCommit !== snapshot.epoch.baseCommit ||
    snapshot.manifest.baseCommit !== snapshot.impactLedger.baseCommit
  ) {
    findings.push(
      finding(
        "HARNESS-BASE-IDENTITY",
        "The manifest, epoch, and impact ledger bind one base commit",
        snapshot.manifest.baseCommit,
        "Regenerate every packet from one exact base commit",
        "Manifest, epoch, and impact-ledger base commits differ"
      )
    );
  }
  if (
    snapshot.epoch.scenarioManifest.path !==
    "tooling/evals/hgi-307/scenarios.json"
  ) {
    findings.push(
      finding(
        "HARNESS-MANIFEST-OWNER",
        "The epoch binds the single canonical scenario manifest",
        snapshot.epoch.scenarioManifest.path,
        "Point the epoch at tooling/evals/hgi-307/scenarios.json and recompute its digest",
        "Epoch points at a non-canonical scenario source"
      )
    );
  }
  if (
    snapshot.epoch.scenarioManifest.sha256 !==
    snapshot.contentDigests[snapshot.epoch.scenarioManifest.path]
  ) {
    findings.push(
      finding(
        "HARNESS-MANIFEST-DIGEST",
        "The epoch binds the exact scenario manifest bytes",
        snapshot.epoch.scenarioManifest.path,
        "Recompute the manifest digest and rerun the epoch",
        "Scenario manifest digest is missing or stale"
      )
    );
  }
  for (const result of snapshot.epoch.scenarios) {
    const scenario = snapshot.manifest.cases.find(({ id }) => id === result.id);
    const missingOwner = result.selectedOwners.some(
      (path) => !snapshot.repositoryPaths.includes(path)
    );
    const missingExpectedOwner =
      scenario?.expectedOwners.some(
        (path) => !result.selectedOwners.includes(path)
      ) ?? true;
    const reportDigest = snapshot.contentDigests[result.report.path];
    if (
      result.status !== "passed" ||
      missingOwner ||
      missingExpectedOwner ||
      reportDigest !== result.report.sha256 ||
      result.evidence.length === 0 ||
      result.limitations.length === 0 ||
      result.nonClaims.length === 0
    ) {
      findings.push(
        finding(
          "HARNESS-SCENARIO-EVIDENCE",
          "A passed scenario has an addressable owner, retained report, evidence, limitation, and non-claim",
          result.id,
          "Correct the source or scenario, retain the fresh report, and rerun acceptance",
          "Scenario disposition or evidence is incomplete"
        )
      );
    }
  }
  return findings;
};

const impactFindings = (
  snapshot: HarnessEvaluationSnapshot,
  docsDigest: string,
  readmeDigest: string
): readonly HarnessEvaluationFinding[] => {
  const findings: HarnessEvaluationFinding[] = [];
  const impactAreas = new Set(
    snapshot.impactLedger.impactAreas.map(({ area }) => area)
  );
  for (const area of duplicateValues(
    snapshot.impactLedger.impactAreas.map(({ area }) => area)
  )) {
    findings.push(
      finding(
        "HARNESS-DUPLICATE-IMPACT",
        "Each required impact surface has one decision",
        area,
        "Merge duplicate impact rows into one owned decision",
        `Duplicate impact area: ${area}`
      )
    );
  }
  for (const area of requiredImpactAreas) {
    if (!impactAreas.has(area)) {
      findings.push(
        finding(
          "HARNESS-MISSING-IMPACT",
          "The closeout accounts for every required impact surface",
          area,
          "Add an owned changed, preserved, or not-applicable impact row",
          `Missing impact area: ${area}`
        )
      );
    }
  }
  for (const area of [...impactAreas].filter(
    (value) => !requiredImpactAreaSet.has(value)
  )) {
    findings.push(
      finding(
        "HARNESS-UNEXPECTED-IMPACT",
        "The closeout contains exactly the required impact surfaces",
        area,
        "Remove the unowned row or version the impact contract",
        `Unexpected impact area: ${area}`
      )
    );
  }
  for (const area of snapshot.impactLedger.impactAreas) {
    if (
      area.ownerPaths.some(
        (path) => !snapshot.repositoryPaths.includes(path)
      ) ||
      area.evidence.length === 0 ||
      area.limitations.length === 0
    ) {
      findings.push(
        finding(
          "HARNESS-IMPACT-EVIDENCE",
          "Every impact decision has addressable owners, evidence, limitation, and review trigger",
          area.area,
          "Restore the owner/evidence or correct the impact decision",
          "Impact-ledger evidence is incomplete"
        )
      );
    }
  }
  if (
    snapshot.impactLedger.docsInventory.pathCount !==
      snapshot.docsPaths.length ||
    snapshot.impactLedger.docsInventory.sortedPathSha256 !== docsDigest
  ) {
    findings.push(
      finding(
        "HARNESS-DOCS-INVENTORY",
        "All docs paths are accounted for by exact count and sorted-path digest",
        "docs/**",
        "Regenerate the docs inventory from the accepted candidate",
        "Docs inventory count or digest is stale"
      )
    );
  }
  if (
    snapshot.impactLedger.readmeInventory.pathCount !==
      snapshot.readmePaths.length ||
    snapshot.impactLedger.readmeInventory.sortedPathSha256 !== readmeDigest
  ) {
    findings.push(
      finding(
        "HARNESS-README-INVENTORY",
        "All repository README paths are accounted for by exact count and sorted-path digest",
        "README.md and */README.md",
        "Regenerate the README inventory from the accepted candidate",
        "README inventory count or digest is stale"
      )
    );
  }
  if (snapshot.impactLedger.unresolvedFindings.length > 0) {
    findings.push(
      finding(
        "HARNESS-UNRESOLVED-FINDING",
        "Every closeout finding is closed or explicitly deferred with an owner and trigger",
        "docs/verification/hgi-307-impact-ledger.json",
        "Close the finding or move it to deferredFindings with complete ownership",
        `${snapshot.impactLedger.unresolvedFindings.length} finding(s) remain unresolved`
      )
    );
  }
  return findings;
};

const interventionFindings = (
  snapshot: HarnessEvaluationSnapshot
): readonly HarnessEvaluationFinding[] =>
  snapshot.epoch.interventions.flatMap((intervention) =>
    intervention.evidence.length === 0 ||
    !snapshot.repositoryPaths.includes(intervention.owner)
      ? [
          finding(
            "HARNESS-INTERVENTION-EVIDENCE",
            "Retain, revise, and remove decisions have evidence and a disconfirming result",
            intervention.id,
            "Add accepted evidence or mark the intervention inconclusive in a new epoch",
            "Intervention decision has no evidence"
          ),
        ]
      : []
  );

const skillFindings = (
  snapshot: HarnessEvaluationSnapshot
): readonly HarnessEvaluationFinding[] =>
  snapshot.epoch.skills.flatMap((skill) =>
    snapshot.contentDigests[skill.path] === skill.sha256
      ? []
      : [
          finding(
            "HARNESS-SKILL-IDENTITY",
            "Every epoch skill identity binds the exact bytes evaluated",
            skill.path,
            "Recompute the skill digest and start a new epoch when its bytes changed",
            "Skill digest is missing or stale"
          ),
        ]
  );

export const auditHarnessEvaluation = async (
  snapshot: HarnessEvaluationSnapshot
): Promise<readonly HarnessEvaluationFinding[]> => {
  const [docsDigest, readmeDigest] = await Promise.all([
    sortedPathDigest(snapshot.docsPaths),
    sortedPathDigest(snapshot.readmePaths),
  ]);
  return [
    ...scenarioFindings(snapshot),
    ...impactFindings(snapshot, docsDigest, readmeDigest),
    ...interventionFindings(snapshot),
    ...skillFindings(snapshot),
  ];
};

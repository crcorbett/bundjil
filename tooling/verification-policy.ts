import { Schema } from "effect";

const BoundedText = Schema.NonEmptyString.check(Schema.isMaxLength(240));

export const VerificationFinding = Schema.Struct({
  code: BoundedText,
  detail: BoundedText,
  invariant: BoundedText,
  postcondition: BoundedText,
  repairHint: BoundedText,
  target: BoundedText,
});
export type VerificationFinding = typeof VerificationFinding.Type;

export const VerificationPolicyReport = Schema.Struct({
  detailPath: BoundedText,
  findings: Schema.Array(VerificationFinding),
  generatedAt: BoundedText,
  ok: Schema.Boolean,
  omittedFindings: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  schemaVersion: Schema.Literal(1),
  shownFindings: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
});
export type VerificationPolicyReport = typeof VerificationPolicyReport.Type;
export const VerificationPolicyReportJson = Schema.fromJsonString(
  VerificationPolicyReport
);

const DetailPath = Schema.String.pipe(
  Schema.check(Schema.isMaxLength(200)),
  Schema.check(
    Schema.isPattern(
      /^docs\/evidence\/verification\/details\/[A-Za-z0-9][A-Za-z0-9._/-]*\.json$/
    )
  ),
  Schema.check(
    Schema.makeFilter((path) =>
      path.includes("..")
        ? "Evidence paths cannot traverse directories."
        : undefined
    )
  )
);
const PacketPath = Schema.String.pipe(
  Schema.check(Schema.isMaxLength(200)),
  Schema.check(
    Schema.isPattern(
      /^docs\/evidence\/verification\/packets\/[A-Za-z0-9][A-Za-z0-9._/-]*\.json$/
    )
  ),
  Schema.check(
    Schema.makeFilter((path) =>
      path.includes("..")
        ? "Packet paths cannot traverse directories."
        : undefined
    )
  )
);
const Texts = Schema.Array(BoundedText)
  .check(Schema.isMinLength(1))
  .check(Schema.isMaxLength(20));
export const CriticalJourney = Schema.Struct({
  actorOrConsumer: BoundedText,
  authority: Schema.Literals(["none", "read_only", "mutation"]),
  boundary: BoundedText,
  environment: BoundedText,
  evidence: Texts,
  expectedBehavior: Texts,
  expectedSideEffects: Texts,
  id: BoundedText,
  inputs: Texts,
  nonClaims: Texts,
  oracle: BoundedText,
  preservedInvariants: Texts,
  startingState: BoundedText,
  stepsOrProcedureOwner: BoundedText,
});
export type CriticalJourney = typeof CriticalJourney.Type;
export const CriticalJourneys = Schema.Array(CriticalJourney)
  .check(Schema.isMinLength(10))
  .check(Schema.isMaxLength(10));
export const CriticalJourneysJson = Schema.fromJsonString(CriticalJourneys);

const CommandMapEntry = Schema.Struct({
  command: BoundedText,
  claimScope: Schema.Literals([
    "proved",
    "partial",
    "deferred",
    "approval_gated",
  ]),
  environment: BoundedText,
  externalReadback: BoundedText,
  journeyId: BoundedText,
  procedureOwner: BoundedText,
});
export const JourneyCommandMap = Schema.Struct({
  commands: Schema.Array(CommandMapEntry)
    .check(Schema.isMinLength(1))
    .check(Schema.isMaxLength(20)),
  lastReviewed: BoundedText,
  owner: BoundedText,
  reviewTrigger: BoundedText,
  schemaVersion: Schema.Literal(1),
});
export type JourneyCommandMap = typeof JourneyCommandMap.Type;
export const JourneyCommandMapJson = Schema.fromJsonString(JourneyCommandMap);

export const EvidenceIndex = Schema.Struct({
  defaultRouteRule: BoundedText,
  lastReviewed: BoundedText,
  lifecycles: Schema.Tuple([
    Schema.Literal("accepted"),
    Schema.Literal("failed"),
    Schema.Literal("blocked"),
    Schema.Literal("interrupted"),
    Schema.Literal("inconclusive"),
    Schema.Literal("deferred"),
    Schema.Literal("superseded"),
  ]),
  owner: BoundedText,
  packetRoot: Schema.String.check(
    Schema.isPattern(/^docs\/evidence\/verification\/packets\/$/)
  ),
  redactionRule: BoundedText,
  requiredProvenance: Texts,
  reviewTrigger: BoundedText,
  schemaVersion: Schema.Literal(1),
  transitionRule: BoundedText,
});
export const EvidenceIndexJson = Schema.fromJsonString(EvidenceIndex);

const Candidate = Schema.Struct({
  artifactDigest: Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
  repositoryCommit: Schema.String.check(Schema.isPattern(/^[a-f0-9]{40}$/)),
  sourceDigest: Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
});
const Authority = Schema.Struct({
  approvalReceipt: Schema.NullOr(BoundedText),
  externalAccess: Schema.Literals(["none", "read_only", "mutation"]),
  identitySource: BoundedText,
  principal: BoundedText,
  rollbackOwner: BoundedText,
});
const Environment = Schema.Struct({
  target: BoundedText,
  tier: Schema.Literals(["local", "preview", "production", "external"]),
});
const JourneyResult = Schema.Struct({
  journeyId: BoundedText,
  oracle: BoundedText,
  status: Schema.Literals(["passed", "failed", "blocked", "inconclusive"]),
});
const CommandReceipt = Schema.Struct({
  detailPath: DetailPath,
  detailSha256: Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
  exitCode: Schema.NullOr(Schema.Int),
  invariant: BoundedText,
  invocation: BoundedText,
  outcome: Schema.Literals([
    "passed",
    "failed",
    "blocked",
    "interrupted",
    "pipe_closed",
    "rerun_avoided",
  ]),
  postcondition: BoundedText,
  recoveryHint: BoundedText,
  target: BoundedText,
});
const Readback = Schema.Struct({
  outcome: Schema.Literals(["not_required", "available", "unavailable"]),
  receipt: BoundedText,
  required: Schema.Boolean,
});
const Lifecycle = Schema.Struct({
  reason: Schema.optional(BoundedText),
  state: Schema.Literals([
    "accepted",
    "failed",
    "blocked",
    "interrupted",
    "inconclusive",
    "deferred",
    "superseded",
  ]),
  successor: Schema.optional(PacketPath),
});
const ExternalConsequence = Schema.Struct({
  outcome: Schema.Literals([
    "none",
    "observed",
    "unavailable",
    "not_attempted",
  ]),
  target: BoundedText,
});
const Rollback = Schema.Struct({
  identity: BoundedText,
  outcome: Schema.Literals(["not_needed", "ready", "performed", "unavailable"]),
  owner: BoundedText,
});
const Evidence = Schema.Struct({
  path: DetailPath,
  provenance: BoundedText,
  sha256: Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/)),
});
export const ProofPacket = Schema.Struct({
  authority: Authority,
  candidate: Candidate,
  commandReceipt: CommandReceipt,
  environment: Environment,
  evidence: Schema.Array(Evidence)
    .check(Schema.isMinLength(1))
    .check(Schema.isMaxLength(20)),
  externalConsequence: ExternalConsequence,
  externalReadback: Readback,
  journeyResults: Schema.Array(JourneyResult)
    .check(Schema.isMinLength(1))
    .check(Schema.isMaxLength(10)),
  kind: Schema.Literals([
    "local",
    "preview",
    "production",
    "messaging",
    "approval_gated",
  ]),
  lifecycle: Lifecycle,
  limitations: Texts,
  nonClaims: Texts,
  observedAt: BoundedText,
  outcome: Schema.Literals([
    "passed",
    "failed",
    "blocked",
    "interrupted",
    "inconclusive",
    "not_attempted",
  ]),
  postconditions: Texts,
  rollback: Rollback,
  schemaVersion: Schema.Literal(1),
  status: Schema.Literals([
    "proved",
    "failed",
    "blocked",
    "interrupted",
    "inconclusive",
    "deferred",
  ]),
});
export type ProofPacket = typeof ProofPacket.Type;
export const ProofPacketJson = Schema.fromJsonString(ProofPacket);

export interface VerificationSnapshot {
  readonly commandMap: JourneyCommandMap;
  readonly detailArtifacts: readonly DetailArtifact[];
  readonly journeys: readonly CriticalJourney[];
  readonly packets: readonly ProofPacket[];
  readonly repositoryPaths: readonly string[];
}

export interface DetailArtifact {
  readonly path: string;
  readonly sha256: string;
  readonly sizeBytes: number;
  readonly validJson: boolean;
}

export interface VerificationPolicyOptions {
  readonly detailPath: string;
  readonly generatedAt: string;
  readonly maxFindings: number;
}

const expectedJourneyIds = [
  "BND-J01-workspace-status",
  "BND-J02-gateway-session-recovery",
  "BND-J03-proxy-health-auth-sse",
  "BND-J04-local-reauthentication",
  "BND-J05-sendblue-accepted-message",
  "BND-J06-sendblue-auth-provider-rejection",
  "BND-J07-executor-read-only",
  "BND-J08-executor-approval-resume",
  "BND-J09-deployment-promotion-readback",
  "BND-J10-incident-revocation-recovery",
] as const;

const prohibitedOutput =
  /(?:authorization:\s*(?:sk-|eyJ|[A-Fa-f0-9]{32,})\S*|bearer\s+(?:sk-|eyJ|[A-Fa-f0-9]{32,})\S*|(?:token|secret)\s*[:=]\s*\S+|\/Users\/|\/home\/)/i;
const insideEvidenceRoot = (path: string) =>
  /^docs\/evidence\/verification\/details\/[A-Za-z0-9][A-Za-z0-9._/-]*\.json$/.test(
    path
  ) && !path.includes("..");
const maximumDetailBytes = 256_000;
const finding = (
  code: string,
  invariant: string,
  target: string,
  repairHint: string,
  postcondition: string,
  detail = "Inspect the named verification contract and retained detail."
): VerificationFinding => ({
  code,
  detail,
  invariant,
  postcondition,
  repairHint,
  target,
});

export const boundedVerificationFindings = (report: VerificationPolicyReport) =>
  report.findings.slice(0, report.shownFindings);

type AddFinding = (...issue: Parameters<typeof finding>) => void;

const auditJourneyInventory = (
  snapshot: VerificationSnapshot,
  add: AddFinding
) => {
  const ids = snapshot.journeys.map((journey) => journey.id);
  const mapIds = snapshot.commandMap.commands.map((entry) => entry.journeyId);
  if (ids.length !== expectedJourneyIds.length) {
    add(
      "JOURNEY_COUNT",
      "The inventory contains exactly ten critical journeys.",
      "docs/verification/critical-journeys.json",
      "Restore the ten canonical Bundjil journey IDs.",
      "Exactly ten journeys are present."
    );
  }
  for (const id of expectedJourneyIds) {
    if (ids.filter((value) => value === id).length !== 1) {
      add(
        "JOURNEY_ID",
        "Each canonical journey ID appears exactly once.",
        id,
        "Add or deduplicate the canonical journey record.",
        "Every canonical journey is uniquely represented."
      );
    }
    if (mapIds.filter((value) => value === id).length !== 1) {
      add(
        "COMMAND_MAP",
        "Each canonical journey maps to one real command or runbook owner.",
        id,
        "Add exactly one command-map entry with environment and procedure owner.",
        "Every journey has one executable or authority-gated route."
      );
    }
  }
  for (const id of mapIds) {
    if (!ids.includes(id)) {
      add(
        "UNKNOWN_JOURNEY",
        "The command map references only declared journeys.",
        id,
        "Remove the unknown map entry or declare its journey.",
        "All command-map IDs resolve to the inventory."
      );
    }
  }
  for (const journey of snapshot.journeys) {
    if (prohibitedOutput.test(JSON.stringify(journey))) {
      add(
        "JOURNEY_SECRET",
        "Journey records contain no secret-shaped or personal-path output.",
        journey.id,
        "Replace the unsafe value with a bounded semantic description.",
        "Journey inventory remains safe to load by default."
      );
    }
  }
};

const auditPacketClaims = (packet: ProofPacket, add: AddFinding) => {
  const target = `${packet.kind}:${packet.environment.target}`;
  if (packet.kind === "local" && packet.environment.tier !== "local") {
    add(
      "LOCAL_TIER",
      "A local packet uses the local tier.",
      target,
      "Set a local packet to tier local.",
      "Local proof is unambiguously local."
    );
  }
  if (packet.kind === "local" && packet.authority.externalAccess !== "none") {
    add(
      "LOCAL_AUTHORITY",
      "A local packet has no external authority.",
      target,
      "Use external packet kinds and an authority receipt for non-local work.",
      "Local proof does not silently claim provider access."
    );
  }
  if (
    packet.kind === "local" &&
    (packet.externalReadback.required ||
      packet.externalReadback.outcome !== "not_required")
  ) {
    add(
      "LOCAL_READBACK",
      "A local packet has no external readback requirement or outcome.",
      target,
      "Set required false and outcome not_required for the local claim.",
      "Local proof remains independent of provider observation."
    );
  }
  if (packet.kind === "preview" && packet.environment.tier !== "preview") {
    add(
      "PREVIEW_TIER",
      "A Preview packet uses the Preview tier.",
      target,
      "Set a Preview packet to tier preview.",
      "Preview is not represented as another environment."
    );
  }
  if (
    packet.kind === "production" &&
    packet.environment.tier !== "production"
  ) {
    add(
      "PRODUCTION_TIER",
      "A Production packet uses the Production tier.",
      target,
      "Set a Production packet to tier production.",
      "Production proof is distinct from Preview."
    );
  }
  if (packet.kind !== "local" && packet.authority.externalAccess === "none") {
    add(
      "EXTERNAL_AUTHORITY",
      "An external packet identifies read-only or mutation authority.",
      target,
      "Attach the exact external authority envelope or keep a local-only packet.",
      "External access is never implicit."
    );
  }
  if (
    ["messaging", "approval_gated"].includes(packet.kind) &&
    (packet.authority.externalAccess !== "mutation" ||
      packet.authority.approvalReceipt === null)
  ) {
    add(
      "APPROVAL_GATE",
      "Messaging and approval-gated packets identify mutation authority and approval receipt.",
      target,
      "Attach the exact approval receipt or keep the operation blocked.",
      "Consequential work remains authority-bound."
    );
  }
};

const auditPacketReadback = (packet: ProofPacket, add: AddFinding) => {
  const target = `${packet.kind}:${packet.environment.target}`;
  if (packet.kind !== "local" && !packet.externalReadback.required) {
    add(
      "READBACK_REQUIRED",
      "External and proved claims require matching external readback.",
      target,
      "Mark readback required and attach its receipt, or narrow the claim.",
      "Claim scope matches its evidence boundary."
    );
  }
  if (
    packet.externalReadback.required &&
    packet.externalReadback.outcome === "not_required"
  ) {
    add(
      "READBACK_CONTRADICTION",
      "A required readback is available or unavailable, never not_required.",
      target,
      "Record available/unavailable or remove the requirement for a local claim.",
      "Readback requirement and outcome agree."
    );
  }
  if (
    packet.status === "proved" &&
    packet.kind !== "local" &&
    packet.externalReadback.outcome !== "available"
  ) {
    add(
      "FALSE_PROOF",
      "A proved packet has available matching external readback.",
      target,
      "Use inconclusive until matching readback is available.",
      "Proof does not outrun external observation."
    );
  }
  if (
    packet.externalReadback.required &&
    packet.externalReadback.outcome === "unavailable" &&
    packet.status !== "inconclusive"
  ) {
    add(
      "UNAVAILABLE_INCONCLUSIVE",
      "Unavailable required readback is inconclusive.",
      target,
      "Set the packet status to inconclusive.",
      "Unavailable observation is never healthy or proved."
    );
  }
  if (
    packet.kind === "production" &&
    packet.status === "proved" &&
    packet.externalReadback.outcome !== "available"
  ) {
    add(
      "PRODUCTION_READBACK",
      "Production proof includes fresh external readback.",
      target,
      "Retain an inconclusive packet until the target readback exists.",
      "No Production claim is made without live evidence."
    );
  }
};

const auditPacketExternalConsequence = (
  packet: ProofPacket,
  add: AddFinding
) => {
  const target = `${packet.kind}:${packet.environment.target}`;
  if (
    packet.externalConsequence.outcome === "observed" &&
    packet.externalReadback.outcome !== "available"
  ) {
    add(
      "CONSEQUENCE_READBACK",
      "An observed external consequence has matching available readback.",
      target,
      "Keep the consequence unavailable or not_attempted until readback exists.",
      "External consequence claims remain evidence-matched."
    );
  }
  if (
    packet.externalConsequence.outcome === "unavailable" &&
    (packet.externalReadback.outcome !== "unavailable" ||
      packet.status !== "inconclusive")
  ) {
    add(
      "CONSEQUENCE_UNAVAILABLE",
      "An unavailable external consequence is backed by unavailable readback and an inconclusive packet.",
      target,
      "Set readback unavailable and packet status inconclusive.",
      "Unavailable consequence is never represented as success."
    );
  }
  if (
    packet.kind !== "local" &&
    packet.status === "proved" &&
    packet.externalConsequence.outcome !== "observed"
  ) {
    add(
      "CONSEQUENCE_FALSE_PROOF",
      "A proved external packet identifies an observed consequence.",
      target,
      "Use inconclusive/deferred until the external consequence is observed.",
      "External proof names what actually happened."
    );
  }
};

const auditPacketLifecycle = (packet: ProofPacket, add: AddFinding) => {
  const target = `${packet.kind}:${packet.environment.target}`;
  const compatible = [
    { state: "accepted", status: "proved" },
    { state: "blocked", status: "blocked" },
    { state: "deferred", status: "deferred" },
    { state: "failed", status: "failed" },
    { state: "inconclusive", status: "inconclusive" },
    { state: "interrupted", status: "interrupted" },
  ] as const;
  const matching = compatible.find(
    (item) => item.state === packet.lifecycle.state
  );
  if (matching !== undefined && packet.status !== matching.status) {
    add(
      "LIFECYCLE_STATUS",
      "Lifecycle state and packet status agree.",
      target,
      "Use the compatible lifecycle/status pair.",
      "Packet lifecycle has one unambiguous outcome."
    );
  }
  if (
    packet.lifecycle.state === "superseded" &&
    (packet.lifecycle.successor === undefined ||
      packet.lifecycle.reason === undefined)
  ) {
    add(
      "SUPERSEDED_SUCCESSOR",
      "A superseded packet names successor and reason.",
      target,
      "Add the successor packet path and supersession reason.",
      "Superseded evidence remains traceable."
    );
  }
  if (
    packet.lifecycle.state !== "superseded" &&
    (packet.lifecycle.successor !== undefined ||
      packet.lifecycle.reason !== undefined)
  ) {
    add(
      "UNEXPECTED_SUCCESSOR",
      "Only a superseded packet names a successor and reason.",
      target,
      "Remove supersession fields or set lifecycle state superseded.",
      "Lifecycle provenance is unambiguous."
    );
  }
  const compatibleOutcomes = {
    blocked: ["blocked"],
    deferred: ["not_attempted"],
    failed: ["failed"],
    inconclusive: ["inconclusive", "not_attempted"],
    interrupted: ["interrupted"],
    proved: ["passed"],
  } as const;
  if (
    !compatibleOutcomes[packet.status].some(
      (outcome) => outcome === packet.outcome
    )
  ) {
    add(
      "STATUS_OUTCOME",
      "Packet status and outcome agree.",
      target,
      "Use the outcome paired with the packet status.",
      "Packet result has one semantic meaning."
    );
  }
  if (
    packet.kind === "local" &&
    packet.externalConsequence.outcome !== "none"
  ) {
    add(
      "LOCAL_CONSEQUENCE",
      "A local packet records no external consequence.",
      target,
      "Use none for local proof or an external packet kind for an external claim.",
      "Local proof remains provider-neutral."
    );
  }
  if (
    packet.kind !== "local" &&
    packet.externalConsequence.outcome === "none"
  ) {
    add(
      "EXTERNAL_CONSEQUENCE",
      "An external packet records observed, unavailable, or not_attempted consequence.",
      target,
      "Name the external consequence outcome without claiming success.",
      "External intent remains explicit."
    );
  }
  if (
    !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(packet.observedAt) ||
    Number.isNaN(Date.parse(packet.observedAt))
  ) {
    add(
      "OBSERVED_AT",
      "Packets use a valid UTC observedAt timestamp.",
      target,
      "Record an ISO-8601 UTC timestamp ending in Z.",
      "Observation time is unambiguous."
    );
  }
  const journeyIds = packet.journeyResults.map((result) => result.journeyId);
  for (const journeyId of journeyIds) {
    if (!expectedJourneyIds.some((expected) => expected === journeyId)) {
      add(
        "PACKET_JOURNEY_UNKNOWN",
        "Packet journey results reference only canonical journey IDs.",
        journeyId,
        "Use one of the ten declared critical journeys.",
        "Every packet result resolves to its durable journey contract."
      );
    }
    if (
      journeyIds.filter((candidate) => candidate === journeyId).length !== 1
    ) {
      add(
        "PACKET_JOURNEY_DUPLICATE",
        "Each journey appears at most once in a packet.",
        journeyId,
        "Merge duplicate results into one bounded oracle.",
        "Packet journey results are unique."
      );
    }
  }
};

const auditPacketReceipt = (packet: ProofPacket, add: AddFinding) => {
  const target = `${packet.kind}:${packet.environment.target}`;
  if (
    packet.commandReceipt.outcome === "interrupted" &&
    packet.commandReceipt.exitCode === 0
  ) {
    add(
      "INTERRUPTED_EXIT",
      "An interrupted command is not represented as successful exit zero.",
      target,
      "Record null when no exit was observed, or the nonzero wrapper exit.",
      "Receipt distinguishes handled interruption from success."
    );
  }
  if (
    packet.commandReceipt.outcome === "pipe_closed" &&
    packet.commandReceipt.exitCode === 0
  ) {
    add(
      "PIPE_CLOSE_EXIT",
      "Early pipe close is not represented as successful exit zero.",
      target,
      "Record the actual exit or null when unknown.",
      "Pipe-close remains distinct from success."
    );
  }
};

const auditPacketDetails = (
  packet: ProofPacket,
  snapshot: VerificationSnapshot,
  add: AddFinding
) => {
  for (const detail of [
    {
      path: packet.commandReceipt.detailPath,
      sha256: packet.commandReceipt.detailSha256,
    },
    ...packet.evidence,
  ]) {
    if (!insideEvidenceRoot(detail.path)) {
      add(
        "DETAIL_ROOT",
        "Retained detail stays under docs/evidence/.",
        detail.path,
        "Move or reference a sanitised detail artifact under docs/evidence/.",
        "Default routing stays bounded and details are addressable."
      );
    }
    const artifact = snapshot.detailArtifacts.find(
      (candidate) => candidate.path === detail.path
    );
    if (
      !snapshot.repositoryPaths.includes(detail.path) ||
      artifact === undefined
    ) {
      add(
        "DETAIL_MISSING",
        "Every receipt detail path resolves inside the candidate.",
        detail.path,
        "Add the sanitised detail artifact or record an explicit deferred packet.",
        "Every claimed detail is addressable."
      );
      continue;
    }
    if (!artifact.validJson) {
      add(
        "DETAIL_CORRUPT",
        "Retained detail is valid sanitised JSON.",
        detail.path,
        "Replace the corrupt detail with one sanitised JSON artifact.",
        "Receipts point to readable structured detail."
      );
    }
    if (artifact.sha256 !== detail.sha256) {
      add(
        "DETAIL_DIGEST",
        "Retained detail digest matches the packet reference.",
        detail.path,
        "Update the digest only after retaining the exact sanitised artifact.",
        "Packet evidence remains content-addressed."
      );
    }
    if (artifact.sizeBytes > maximumDetailBytes) {
      add(
        "DETAIL_OVERSIZED",
        "Retained detail stays within the bounded evidence budget.",
        detail.path,
        "Split or summarise sanitised detail and retain an index to omitted material.",
        "Default retrieval remains bounded."
      );
    }
  }
};

const auditPacket = (
  packet: ProofPacket,
  snapshot: VerificationSnapshot,
  add: AddFinding
) => {
  auditPacketClaims(packet, add);
  auditPacketReadback(packet, add);
  auditPacketExternalConsequence(packet, add);
  auditPacketLifecycle(packet, add);
  auditPacketReceipt(packet, add);
  auditPacketDetails(packet, snapshot, add);
  if (prohibitedOutput.test(JSON.stringify(packet))) {
    add(
      "UNSAFE_OUTPUT",
      "Packets contain no raw secret-shaped, bearer, or personal-path output.",
      `${packet.kind}:${packet.environment.target}`,
      "Redact the unsafe value and keep only bounded semantic evidence.",
      "Packet is safe for retained evidence."
    );
  }
};

export const auditVerification = (
  snapshot: VerificationSnapshot,
  options: VerificationPolicyOptions
): VerificationPolicyReport => {
  const findings: VerificationFinding[] = [];
  const add: AddFinding = (...issue) => {
    findings.push(finding(...issue));
  };
  auditJourneyInventory(snapshot, add);
  for (const packet of snapshot.packets) {
    auditPacket(packet, snapshot, add);
  }
  const ordered = findings.toSorted((left, right) =>
    `${left.code}:${left.target}`.localeCompare(`${right.code}:${right.target}`)
  );
  const shownFindings = Math.min(ordered.length, options.maxFindings);
  return {
    detailPath: options.detailPath,
    findings: ordered,
    generatedAt: options.generatedAt,
    ok: ordered.length === 0,
    omittedFindings: ordered.length - shownFindings,
    schemaVersion: 1,
    shownFindings,
  };
};

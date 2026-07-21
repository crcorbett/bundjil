import { Schema } from "effect";

const Digest = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/));
const Revision = Schema.String.check(Schema.isPattern(/^[a-f0-9]{40}$/));
const OptionalText = Schema.NullOr(Schema.NonEmptyString);

export const FreshnessCandidate = Schema.Struct({
  contradictions: Schema.Array(Schema.NonEmptyString),
  finding: Schema.Struct({
    audience: Schema.NonEmptyString,
    classification: Schema.NonEmptyString,
    summary: Schema.NonEmptyString,
  }),
  freshness: Schema.Struct({
    expiresAt: Schema.NonEmptyString,
    resumeTrigger: Schema.NonEmptyString,
  }),
  generatedAt: Schema.NonEmptyString,
  generatorIdentity: Schema.NonEmptyString,
  id: Schema.NonEmptyString,
  lifecycle: Schema.Literals([
    "report_only",
    "reviewed",
    "published",
    "quarantined",
    "retracted",
  ]),
  limitations: Schema.Array(Schema.NonEmptyString),
  nonClaims: Schema.Array(Schema.NonEmptyString),
  proposedOwnerPaths: Schema.Array(Schema.NonEmptyString),
  publication: Schema.Struct({
    approvalReceipt: OptionalText,
    atomicReadbackReceipt: OptionalText,
    publishedRevision: Schema.NullOr(Revision),
    publisherIdentity: OptionalText,
    status: Schema.Literals(["not_authorized", "approved", "published"]),
  }),
  recovery: Schema.Struct({
    lastKnownGood: Schema.NonEmptyString,
    quarantine: Schema.NonEmptyString,
    revocation: Schema.NonEmptyString,
    rollback: Schema.NonEmptyString,
  }),
  review: Schema.Struct({
    decision: Schema.Literals(["pending", "accepted", "rejected"]),
    receipt: OptionalText,
    reviewerIdentity: OptionalText,
  }),
  schemaVersion: Schema.Literal(1),
  source: Schema.Struct({
    observedAt: Schema.NonEmptyString,
    path: Schema.NonEmptyString,
    sha256: Digest,
    targetRevision: Revision,
  }),
});
export type FreshnessCandidate = typeof FreshnessCandidate.Type;
export const FreshnessCandidateJson = Schema.fromJsonString(FreshnessCandidate);

export type FreshnessCandidateFinding = Readonly<{
  code: string;
  detail: string;
}>;

const candidateRoot = "docs/documentation-audit/freshness-candidates/";

/** Enforces the semantic publication and self-feedback rules beyond decoding. */
export const freshnessCandidateFindings = (
  candidate: FreshnessCandidate
): readonly FreshnessCandidateFinding[] => {
  const findings: FreshnessCandidateFinding[] = [];
  if (candidate.source.path.startsWith(candidateRoot)) {
    findings.push({
      code: "FRESHNESS-SELF-SOURCE",
      detail:
        "A freshness candidate cannot use candidate output as its source.",
    });
  }
  if (
    candidate.proposedOwnerPaths.some((path) => path.startsWith(candidateRoot))
  ) {
    findings.push({
      code: "FRESHNESS-CANDIDATE-OWNER",
      detail: "Candidate storage cannot become the proposed semantic owner.",
    });
  }
  const { generatorIdentity } = candidate;
  if (
    candidate.review.reviewerIdentity === generatorIdentity ||
    candidate.publication.publisherIdentity === generatorIdentity
  ) {
    findings.push({
      code: "FRESHNESS-SELF-PUBLICATION",
      detail: "The generator cannot review or publish its own candidate.",
    });
  }
  const reportOnlyCarriesAuthority = [
    candidate.review.decision !== "pending",
    candidate.publication.status !== "not_authorized",
    candidate.publication.approvalReceipt !== null,
    candidate.publication.atomicReadbackReceipt !== null,
    candidate.publication.publishedRevision !== null,
    candidate.publication.publisherIdentity !== null,
  ].some(Boolean);
  if (candidate.lifecycle === "report_only" && reportOnlyCarriesAuthority) {
    findings.push({
      code: "FRESHNESS-REPORT-ONLY-MUTATION",
      detail:
        "A report-only candidate cannot carry review or publication authority.",
    });
  }
  const publicationIncomplete = [
    candidate.review.decision !== "accepted",
    candidate.review.reviewerIdentity === null,
    candidate.review.receipt === null,
    candidate.publication.status !== "published",
    candidate.publication.approvalReceipt === null,
    candidate.publication.atomicReadbackReceipt === null,
    candidate.publication.publishedRevision === null,
    candidate.publication.publisherIdentity === null,
    candidate.review.reviewerIdentity !== null &&
      candidate.review.reviewerIdentity ===
        candidate.publication.publisherIdentity,
  ].some(Boolean);
  if (candidate.lifecycle === "published" && publicationIncomplete) {
    findings.push({
      code: "FRESHNESS-PUBLICATION-INCOMPLETE",
      detail:
        "Published policy requires distinct review, approval, publisher, revision, and atomic readback receipts.",
    });
  }
  return findings;
};

import { readFile } from "node:fs/promises";

import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { boundaryExceptions } from "./boundary-exceptions.js";
import {
  auditControlPolicy,
  AutomationRegisterJson,
  BoundaryControlDecisionJson,
  ControlRegisterJson,
  FeedbackPromotionJson,
} from "./control-policy.js";
import type { ControlPolicySnapshot } from "./control-policy.js";
import {
  FreshnessCandidateJson,
  freshnessCandidateFindings,
} from "./documentation/freshness-candidate.js";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFile(new URL(path, root), "utf-8");
const decode = async <A, I>(path: string, schema: Schema.Codec<A, I>) =>
  Effect.runPromise(Schema.decodeUnknownEffect(schema)(await read(path)));

const validSnapshot = async (): Promise<ControlPolicySnapshot> => {
  const [
    automationRegister,
    boundaryDecision,
    controlRegister,
    feedbackPromotion,
    candidate,
  ] = await Promise.all([
    decode("docs/standards/automation-register.json", AutomationRegisterJson),
    decode(
      "docs/documentation-audit/HGI-306-boundary-exceptions.decision.json",
      BoundaryControlDecisionJson
    ),
    decode("docs/standards/control-register.json", ControlRegisterJson),
    decode(
      "docs/documentation-audit/HGI-306-feedback-promotion.json",
      FeedbackPromotionJson
    ),
    decode(
      "docs/documentation-audit/freshness-candidates/HGI-306-report-only-example.json",
      FreshnessCandidateJson
    ),
  ]);
  const repositoryPaths = [
    ...controlRegister.controls.flatMap((control) => [
      ...control.earliestOwnerPaths,
      ...control.fixturePaths,
    ]),
    ...automationRegister.records.flatMap(({ fixturePaths }) => fixturePaths),
    feedbackPromotion.promotedOwner,
  ];
  return {
    automationRegister,
    boundaryDecision,
    boundaryExceptions,
    controlRegister,
    currentOwnerPaths: [],
    feedbackPromotion,
    freshnessCandidates: [candidate],
    repositoryPaths: [...new Set(repositoryPaths)],
    sourceDigests: {
      [candidate.source.path]: candidate.source.sha256,
    },
  };
};

const findings = (snapshot: ControlPolicySnapshot) =>
  auditControlPolicy(snapshot, {
    detailPath: "tmp/control-policy-test.json",
    generatedAt: "2026-07-21T17:00:00+01:00",
  }).findings;

describe("HGI-306 control and automation policy", () => {
  it("accepts the current complete registers and isolated candidate", async () => {
    expect(findings(await validSnapshot())).toStrictEqual([]);
  });

  it("rejects a missing required control", async () => {
    const snapshot = await validSnapshot();
    const controlRegister = {
      ...snapshot.controlRegister,
      controls: snapshot.controlRegister.controls.filter(
        ({ id }) => id !== "boundary-provenance"
      ),
    };
    expect(
      findings({ ...snapshot, controlRegister }).map(({ code }) => code)
    ).toContain("CONTROL-MISSING");
  });

  it("rejects a missing owner or fixture path", async () => {
    const snapshot = await validSnapshot();
    expect(
      findings({ ...snapshot, repositoryPaths: [] }).map(({ code }) => code)
    ).toContain("CONTROL-PATH");
  });

  it("rejects automation classification drift", async () => {
    const snapshot = await validSnapshot();
    const automationRegister = {
      ...snapshot.automationRegister,
      records: snapshot.automationRegister.records.map((record) =>
        record.id === "github-release-pr"
          ? { ...record, state: "admitted" as const }
          : record
      ),
    };
    expect(
      findings({ ...snapshot, automationRegister }).map(({ code }) => code)
    ).toContain("AUTOMATION-STATE");
  });

  it("rejects freshness automation that can feed or publish itself", async () => {
    const snapshot = await validSnapshot();
    const automationRegister = {
      ...snapshot.automationRegister,
      records: snapshot.automationRegister.records.map((record) =>
        record.id === "docs-context-freshness"
          ? {
              ...record,
              publication: "The generator publishes automatically.",
              selfFeedbackExcluded: false,
            }
          : record
      ),
    };
    expect(
      findings({ ...snapshot, automationRegister }).map(({ code }) => code)
    ).toContain("AUTOMATION-FRESHNESS-PUBLICATION");
  });

  it("rejects an automation without addressable positive and negative fixtures", async () => {
    const snapshot = await validSnapshot();
    const automationRegister = {
      ...snapshot.automationRegister,
      records: snapshot.automationRegister.records.map((record) =>
        record.id === "github-ci" ? { ...record, fixturePaths: [] } : record
      ),
    };
    expect(
      findings({ ...snapshot, automationRegister }).map(({ code }) => code)
    ).toContain("AUTOMATION-FIXTURE");
  });

  it("rejects duplicate exact boundary identities before matching", async () => {
    const snapshot = await validSnapshot();
    const [firstException] = snapshot.boundaryExceptions;
    if (firstException === undefined) {
      throw new Error("boundary exception fixture missing");
    }
    expect(
      findings({
        ...snapshot,
        boundaryExceptions: [...snapshot.boundaryExceptions, firstException],
      }).map(({ code }) => code)
    ).toContain("BOUNDARY-DUPLICATE");
  });

  it("rejects stale boundary measurement and weakened equivalence", async () => {
    const snapshot = await validSnapshot();
    const boundaryDecision = {
      ...snapshot.boundaryDecision,
      exceptionCount: 1,
      preservedProperties: ["exact match"],
    };
    const codes = findings({ ...snapshot, boundaryDecision }).map(
      ({ code }) => code
    );
    expect(codes).toContain("BOUNDARY-MEASUREMENT");
    expect(codes).toContain("BOUNDARY-EQUIVALENCE");
  });

  it("rejects a feedback trace without its earlier durable owner", async () => {
    const snapshot = await validSnapshot();
    expect(
      findings({
        ...snapshot,
        feedbackPromotion: {
          ...snapshot.feedbackPromotion,
          promotedOwner: "missing-owner.ts",
        },
      }).map(({ code }) => code)
    ).toContain("FEEDBACK-PROMOTION");
  });

  it("rejects a candidate sourced from candidate output", async () => {
    const snapshot = await validSnapshot();
    const [candidate] = snapshot.freshnessCandidates;
    if (candidate === undefined) {
      throw new Error("candidate fixture missing");
    }
    const freshnessCandidates = [
      {
        ...candidate,
        source: {
          ...candidate.source,
          path: "docs/documentation-audit/freshness-candidates/self.json",
        },
      },
    ];
    expect(
      findings({ ...snapshot, freshnessCandidates }).map(({ code }) => code)
    ).toContain("FRESHNESS-SELF-SOURCE");
  });

  it("rejects generator review or publication identity", async () => {
    const snapshot = await validSnapshot();
    const [candidate] = snapshot.freshnessCandidates;
    if (candidate === undefined) {
      throw new Error("candidate fixture missing");
    }
    expect(
      freshnessCandidateFindings({
        ...candidate,
        review: {
          decision: "accepted",
          receipt: "review.json",
          reviewerIdentity: candidate.generatorIdentity,
        },
      }).map(({ code }) => code)
    ).toContain("FRESHNESS-SELF-PUBLICATION");
  });

  it("rejects publication fields on a report-only candidate", async () => {
    const snapshot = await validSnapshot();
    const [candidate] = snapshot.freshnessCandidates;
    if (candidate === undefined) {
      throw new Error("candidate fixture missing");
    }
    expect(
      freshnessCandidateFindings({
        ...candidate,
        publication: {
          ...candidate.publication,
          approvalReceipt: "approval.json",
          status: "approved",
        },
      }).map(({ code }) => code)
    ).toContain("FRESHNESS-REPORT-ONLY-MUTATION");
  });

  it("rejects published lifecycle without complete distinct receipts", async () => {
    const snapshot = await validSnapshot();
    const [candidate] = snapshot.freshnessCandidates;
    if (candidate === undefined) {
      throw new Error("candidate fixture missing");
    }
    expect(
      freshnessCandidateFindings({
        ...candidate,
        lifecycle: "published",
      }).map(({ code }) => code)
    ).toContain("FRESHNESS-PUBLICATION-INCOMPLETE");
  });

  it("rejects publication when reviewer and publisher identities match", async () => {
    const snapshot = await validSnapshot();
    const [candidate] = snapshot.freshnessCandidates;
    if (candidate === undefined) {
      throw new Error("candidate fixture missing");
    }
    expect(
      freshnessCandidateFindings({
        ...candidate,
        lifecycle: "published",
        publication: {
          approvalReceipt: "approval.json",
          atomicReadbackReceipt: "readback.json",
          publishedRevision: "1".repeat(40),
          publisherIdentity: "documentation-owner",
          status: "published",
        },
        review: {
          decision: "accepted",
          receipt: "review.json",
          reviewerIdentity: "documentation-owner",
        },
      }).map(({ code }) => code)
    ).toContain("FRESHNESS-PUBLICATION-INCOMPLETE");
  });

  it("rejects candidate evidence in default current-owner routing", async () => {
    const snapshot = await validSnapshot();
    expect(
      findings({
        ...snapshot,
        currentOwnerPaths: [
          "docs/documentation-audit/freshness-candidates/current.json",
        ],
      }).map(({ code }) => code)
    ).toContain("FRESHNESS-DEFAULT-CONTEXT");
  });

  it("rejects a candidate whose source digest no longer matches", async () => {
    const snapshot = await validSnapshot();
    const [candidate] = snapshot.freshnessCandidates;
    if (candidate === undefined) {
      throw new Error("candidate fixture missing");
    }
    expect(
      findings({
        ...snapshot,
        sourceDigests: { [candidate.source.path]: "0".repeat(64) },
      }).map(({ code }) => code)
    ).toContain("FRESHNESS-SOURCE-DIGEST");
  });

  it("rejects automation records missing metric evidence at decode", async () => {
    const raw = await read("docs/standards/automation-register.json");
    const invalid = raw.replace(
      /"acceptedOutcome":\s*"Accepted candidate outcomes by source SHA\.",/,
      ""
    );
    expect(invalid).not.toBe(raw);
    const result = await Effect.runPromise(
      Effect.result(Schema.decodeUnknownEffect(AutomationRegisterJson)(invalid))
    );
    expect(result._tag).toBe("Failure");
  });
});

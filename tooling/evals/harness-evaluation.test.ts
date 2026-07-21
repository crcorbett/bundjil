import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  auditHarnessEvaluation,
  HarnessScenarioManifestJson,
} from "./harness-evaluation.js";
import type { HarnessEvaluationSnapshot } from "./harness-evaluation.js";

const root = new URL("../../", import.meta.url);
const digest = (paths: readonly string[]) =>
  createHash("sha256")
    .update(`${paths.toSorted().join("\n")}\n`)
    .digest("hex");

const validSnapshot = async (): Promise<HarnessEvaluationSnapshot> => {
  const manifest = await Effect.runPromise(
    Schema.decodeUnknownEffect(HarnessScenarioManifestJson)(
      await readFile(
        new URL("tooling/evals/hgi-307/scenarios.json", root),
        "utf-8"
      )
    )
  );
  const ownerPaths = [
    ...new Set(manifest.cases.flatMap(({ expectedOwners }) => expectedOwners)),
  ];
  const reportPath = "docs/documentation-audit/hgi-307/test-report.md";
  const reportDigest = "a".repeat(64);
  const docsPaths = [
    "docs/README.md",
    "docs/verification/README.md",
    reportPath,
  ];
  const readmePaths = ["README.md", "docs/README.md"];
  const impactOwners = [
    "docs/README.md",
    "README.md",
    "oxlint.json",
    ".agents/skills/docs-maintainer/SKILL.md",
    "package.json",
    "tooling/evals/harness-evaluation.test.ts",
    ".github/workflows/ci.yml",
    "apps/agent/runbooks/README.md",
    "docs/verification/README.md",
  ];
  const repositoryPaths = [
    ...new Set([
      ...ownerPaths,
      ...docsPaths,
      ...readmePaths,
      ...impactOwners,
      "tooling/evals/hgi-307/scenarios.json",
    ]),
  ];
  return {
    contentDigests: {
      ".agents/skills/docs-maintainer/SKILL.md": "d".repeat(64),
      "tooling/evals/hgi-307/scenarios.json": "b".repeat(64),
      [reportPath]: reportDigest,
    },
    docsPaths,
    epoch: {
      authority: {
        externalAccess: "none",
        localWrite: true,
        providerReadbackPerformed: false,
        scope: "local repository evaluation only",
        stopping: ["Stop before provider access or mutation."],
      },
      baseCommit: manifest.baseCommit,
      budget: "Twelve bounded local scenarios.",
      contextProjectionRevision: "test projection",
      epochId: "hgi-307-test",
      host: "test host",
      interventions: [
        {
          carryingCost: "Fixture maintenance.",
          decision: "retain",
          disconfirmingResult: "The gate stops detecting its failure class.",
          evidence: ["focused fixture"],
          expectedMechanism: "Reject unsafe authority inference.",
          id: "authority-policy",
          owner: "docs/operations/authority-model.md",
          retirement: "A smaller earlier owner proves the same invariant.",
          reviewTrigger: "Authority boundary change.",
        },
      ],
      metrics: {
        feedbackLatencyMs: null,
        synchronousHumanAttentionMs: null,
        timeToAcceptedOutcomeMs: null,
        workerDurationMs: null,
      },
      model: "fresh test worker",
      modelIdentityLimitation: "The test interface does not expose identity.",
      nativeActionInterface: "read-only test",
      runtime: [{ name: "Effect", version: "test" }],
      scenarioManifest: {
        path: "tooling/evals/hgi-307/scenarios.json",
        sha256: "b".repeat(64),
      },
      scenarios: manifest.cases.map(({ expectedOwners, id }) => ({
        decision: "Passed the expected safety boundary.",
        evaluator: "fresh-test-worker",
        evidence: ["bounded source review"],
        id,
        limitations: ["Local source only."],
        nonClaims: ["No provider actuality."],
        observedAt: "2026-07-21T17:30:00+01:00",
        report: { path: reportPath, sha256: reportDigest },
        selectedOwners: expectedOwners,
        status: "passed" as const,
        timing: {
          feedbackLatencyMs: null,
          synchronousHumanAttentionMs: null,
          timeToAcceptedOutcomeMs: null,
          workerDurationMs: null,
        },
      })),
      schemaVersion: 1,
      skills: [
        {
          path: ".agents/skills/docs-maintainer/SKILL.md",
          sha256: "d".repeat(64),
          sourceRevision: "test-revision",
        },
      ],
      status: "accepted",
      taskId: "HGI-307",
      tools: [{ name: "git", version: "test" }],
    },
    impactLedger: {
      baseCommit: manifest.baseCommit,
      deferredFindings: [
        {
          id: "external-provider-qualification",
          limitation: "No external authority in this epoch.",
          nonClaim: "No provider state is established.",
          owner: "HGI-309",
          resumeTrigger: "Separately approved exact provider operation.",
        },
      ],
      docsInventory: {
        pathCount: docsPaths.length,
        sortedPathSha256: digest(docsPaths),
      },
      impactAreas: [
        "docs",
        "readmes",
        "lint",
        "skills",
        "config",
        "tests",
        "ci",
        "runbooks",
        "rollback",
      ].map((area, index) => ({
        area,
        decision: "preserved" as const,
        evidence: ["bounded impact review"],
        limitations: ["Local source only."],
        ownerPaths: [impactOwners[index] ?? "docs/README.md"],
        reviewTrigger: "Owning surface changes.",
      })),
      readmeInventory: {
        pathCount: readmePaths.length,
        sortedPathSha256: digest(readmePaths),
      },
      schemaVersion: 1,
      taskId: "HGI-307",
      unresolvedFindings: [],
    },
    manifest,
    readmePaths,
    repositoryPaths,
  };
};

const codes = async (snapshot: HarnessEvaluationSnapshot) => {
  const result = await auditHarnessEvaluation(snapshot);
  return result.map(({ code }) => code);
};

describe("HGI-307 harness evaluation policy", () => {
  it("accepts the complete twelve-scenario epoch and impact ledger", async () => {
    await expect(codes(await validSnapshot())).resolves.toStrictEqual([]);
  });

  it("rejects a missing required scenario result", async () => {
    const snapshot = await validSnapshot();
    await expect(
      codes({
        ...snapshot,
        epoch: {
          ...snapshot.epoch,
          scenarios: snapshot.epoch.scenarios.slice(1),
        },
      })
    ).resolves.toContain("HARNESS-MISSING-SCENARIO");
  });

  it("rejects a stale retained report digest", async () => {
    const snapshot = await validSnapshot();
    const [first, ...rest] = snapshot.epoch.scenarios;
    if (first === undefined) {
      throw new Error("scenario fixture missing");
    }
    await expect(
      codes({
        ...snapshot,
        epoch: {
          ...snapshot.epoch,
          scenarios: [
            { ...first, report: { ...first.report, sha256: "c".repeat(64) } },
            ...rest,
          ],
        },
      })
    ).resolves.toContain("HARNESS-SCENARIO-EVIDENCE");
  });

  it("rejects a missing required impact area", async () => {
    const snapshot = await validSnapshot();
    await expect(
      codes({
        ...snapshot,
        impactLedger: {
          ...snapshot.impactLedger,
          impactAreas: snapshot.impactLedger.impactAreas.filter(
            ({ area }) => area !== "rollback"
          ),
        },
      })
    ).resolves.toContain("HARNESS-MISSING-IMPACT");
  });

  it("rejects stale docs and README inventories", async () => {
    const snapshot = await validSnapshot();
    const result = await codes({
      ...snapshot,
      docsPaths: [...snapshot.docsPaths, "docs/new-owner.md"],
      readmePaths: [...snapshot.readmePaths, "apps/new/README.md"],
    });
    expect(result).toContain("HARNESS-DOCS-INVENTORY");
    expect(result).toContain("HARNESS-README-INVENTORY");
  });

  it("rejects an unresolved closeout finding", async () => {
    const snapshot = await validSnapshot();
    await expect(
      codes({
        ...snapshot,
        impactLedger: {
          ...snapshot.impactLedger,
          unresolvedFindings: ["unknown authority owner"],
        },
      })
    ).resolves.toContain("HARNESS-UNRESOLVED-FINDING");
  });

  it("rejects a result whose selected owner is absent", async () => {
    const snapshot = await validSnapshot();
    const [first, ...rest] = snapshot.epoch.scenarios;
    if (first === undefined) {
      throw new Error("scenario fixture missing");
    }
    await expect(
      codes({
        ...snapshot,
        epoch: {
          ...snapshot.epoch,
          scenarios: [
            { ...first, selectedOwners: ["missing-owner.md"] },
            ...rest,
          ],
        },
      })
    ).resolves.toContain("HARNESS-SCENARIO-EVIDENCE");
  });

  it("rejects an unexpected scenario result", async () => {
    const snapshot = await validSnapshot();
    const [first] = snapshot.epoch.scenarios;
    if (first === undefined) {
      throw new Error("scenario fixture missing");
    }
    await expect(
      codes({
        ...snapshot,
        epoch: {
          ...snapshot.epoch,
          scenarios: [
            ...snapshot.epoch.scenarios,
            { ...first, id: "HGI307-UNOWNED-01" },
          ],
        },
      })
    ).resolves.toContain("HARNESS-UNEXPECTED-SCENARIO");
  });

  it("rejects a duplicate impact decision", async () => {
    const snapshot = await validSnapshot();
    const [first] = snapshot.impactLedger.impactAreas;
    if (first === undefined) {
      throw new Error("impact fixture missing");
    }
    await expect(
      codes({
        ...snapshot,
        impactLedger: {
          ...snapshot.impactLedger,
          impactAreas: [...snapshot.impactLedger.impactAreas, first],
        },
      })
    ).resolves.toContain("HARNESS-DUPLICATE-IMPACT");
  });

  it("rejects divergent base identities", async () => {
    const snapshot = await validSnapshot();
    await expect(
      codes({
        ...snapshot,
        impactLedger: {
          ...snapshot.impactLedger,
          baseCommit: "f".repeat(40),
        },
      })
    ).resolves.toContain("HARNESS-BASE-IDENTITY");
  });

  it("rejects a stale evaluated skill digest", async () => {
    const snapshot = await validSnapshot();
    await expect(
      codes({
        ...snapshot,
        contentDigests: {
          ...snapshot.contentDigests,
          ".agents/skills/docs-maintainer/SKILL.md": "e".repeat(64),
        },
      })
    ).resolves.toContain("HARNESS-SKILL-IDENTITY");
  });
});

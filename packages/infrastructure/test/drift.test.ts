import { Ajv2020 } from "ajv/dist/2020.js";
import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import boundedReceiptSchema from "../../../.agents/skills/docs-maintainer/assets/harness/bounded-receipt.schema.json" with { type: "json" };
import controlRecordSchema from "../../../.agents/skills/docs-maintainer/assets/harness/control-record.schema.json" with { type: "json" };
import infrastructureDriftControl from "../../../docs/standards/alchemy-infrastructure-drift.control.json" with { type: "json" };
import driftAuthorityPolicy from "../schemas/drift-report-authority.schema.json" with { type: "json" };
import {
  buildInfrastructureDriftReceipt,
  buildInfrastructureDriftReport,
  InfrastructureDriftArtifactPath,
  InfrastructureDriftObservation,
  InfrastructureDriftReport,
  InfrastructureDriftReportInput,
  InfrastructureDriftReportJson,
  InfrastructureDriftResourceFingerprint,
  InfrastructureDriftSourceSha,
} from "../src/drift.js";
import type {
  InfrastructureDriftAction,
  InfrastructureDriftBaselineDisposition,
  InfrastructureDriftDiffClass,
  InfrastructureDriftProviderRead,
  InfrastructureDriftReadback,
  InfrastructureDriftResourceKind,
  InfrastructureDriftSecretRevision,
} from "../src/drift.js";
import {
  InfrastructureArtifactDigest,
  InfrastructureBoundedReceiptJson,
} from "../src/receipt.js";

const fingerprint = InfrastructureDriftResourceFingerprint.make("a".repeat(64));
const sourceSha = InfrastructureDriftSourceSha.make("b".repeat(40));

const observation = ({
  action = "unchanged",
  baselineDisposition = "accepted",
  diffClass = "no_op",
  ownership = "Owned",
  providerRead = "performed",
  readback = "available",
  resourceKind = "vercelProject",
  secretRevision = "notApplicable",
}: {
  readonly action?: InfrastructureDriftAction;
  readonly baselineDisposition?: InfrastructureDriftBaselineDisposition;
  readonly diffClass?: InfrastructureDriftDiffClass;
  readonly ownership?: "Owned" | "Unowned" | "Unknown";
  readonly providerRead?: InfrastructureDriftProviderRead;
  readonly readback?: InfrastructureDriftReadback;
  readonly resourceKind?: InfrastructureDriftResourceKind;
  readonly secretRevision?: InfrastructureDriftSecretRevision;
}) =>
  InfrastructureDriftObservation.make({
    action,
    attempts: { _tag: "Observed", count: 1 },
    baselineDisposition,
    certainty:
      readback === "available"
        ? { _tag: "Known" }
        : { _tag: "Uncertain", recovery: "operatorReview" },
    diffClass,
    duration: { _tag: "Observed", milliseconds: 12 },
    ownership,
    providerRead,
    readback,
    resourceFingerprint: fingerprint,
    resourceKind,
    retry: "backoff",
    secretRevision,
    source: "nativeSync",
    stage: "preview",
  });

const reportFor = (observations: readonly InfrastructureDriftObservation[]) =>
  Effect.runPromise(
    buildInfrastructureDriftReport(
      InfrastructureDriftReportInput.make({
        authorityFingerprint: fingerprint,
        desiredPlan: {
          _tag: "Observed",
          create: 0,
          delete: 0,
          noOp: observations.length,
          replace: 0,
          update: 0,
        },
        observedAt: "2026-07-31T01:00:00.000Z",
        observations,
        runDurationMilliseconds: 42,
        sourceSha,
        stage: "preview",
      })
    )
  );

describe("infrastructure drift report", () => {
  it("accepts the report-only control through the fixed harness contract", () => {
    const validate = new Ajv2020({
      allErrors: true,
      strict: false,
    }).compile(controlRecordSchema);
    expect(validate(infrastructureDriftControl)).toBeTruthy();
  });

  it("accepts only the fixed Preview read-only drift authority", () => {
    const authority = {
      schemaVersion: "1",
      principal: "github-actions:infrastructure-read-only-preview",
      identitySource: "exact source and GitHub run identity",
      localWrite: true,
      externalAccess: "read_only",
      operations: [
        "alchemy-plan-preview-read-only",
        "alchemy-sync-preview-dry-run",
      ],
      resources: [
        "alchemy:BundjilInfrastructure:preview",
        "r2:bundjil-alchemy-state:bundjil/v1",
        "vercel:bundjil-preview-read-only",
        "photon:bundjil-preview-read-only",
      ],
      environments: ["preview"],
      duration: "one bounded report-only run",
      revocation: "revoke the read-only environment",
      approvalRequired: true,
      approvalReceipt: "accepted Alchemy SPEC",
      stopConditions: ["stop on stage, identity, readback, or write drift"],
      readback: ["native desired plan and native sync dry-run"],
      rollback: ["no provider rollback; discard local receipts"],
      escalation: "repository and provider owners",
    };
    const options = { allErrors: true, strict: false } as const;
    expect(
      new Ajv2020(options).compile(authorityEnvelopeSchema)(authority)
    ).toBeTruthy();
    expect(
      new Ajv2020(options).compile(driftAuthorityPolicy)(authority)
    ).toBeTruthy();
    expect(
      new Ajv2020(options).compile(driftAuthorityPolicy)({
        ...authority,
        environments: ["production"],
      })
    ).toBeFalsy();
    expect(
      new Ajv2020(options).compile(driftAuthorityPolicy)({
        ...authority,
        operations: ["alchemy-sync-preview-apply"],
      })
    ).toBeFalsy();
    expect(
      new Ajv2020(options).compile(driftAuthorityPolicy)({
        ...authority,
        externalAccess: "mutation",
      })
    ).toBeFalsy();
    expect(
      new Ajv2020(options).compile(driftAuthorityPolicy)({
        ...authority,
        localWrite: false,
      })
    ).toBeFalsy();
    expect(
      new Ajv2020(options).compile(driftAuthorityPolicy)({
        ...authority,
        approvalRequired: false,
      })
    ).toBeFalsy();
    expect(
      new Ajv2020(options).compile(driftAuthorityPolicy)({
        ...authority,
        resources: ["alchemy:BundjilInfrastructure:prod"],
      })
    ).toBeFalsy();
  });

  it.each([
    ["expectedProviderNormalization", observation({})],
    [
      "unownedResource",
      observation({ ownership: "Unowned", baselineDisposition: "rejected" }),
    ],
    ["missingResource", observation({ action: "missing" })],
    ["inPlaceDrift", observation({ action: "drifted", diffClass: "update" })],
    [
      "destructiveDrift",
      observation({ action: "drifted", diffClass: "replace" }),
    ],
    [
      "unavailableOrAmbiguousReadback",
      observation({ action: "unavailable", readback: "ambiguous" }),
    ],
    [
      "unknownSecretRevision",
      observation({
        resourceKind: "vercelEnvironmentVariable",
        secretRevision: "unknown",
      }),
    ],
    [
      "skippedProviderRead",
      observation({ action: "skipped", providerRead: "skipped" }),
    ],
    [
      "deploymentDrift",
      observation({
        action: "drifted",
        diffClass: "update",
        resourceKind: "vercelDeploymentObservation",
      }),
    ],
  ])("classifies %s from its direct observable", async (category, input) => {
    const report = await reportFor([input]);
    expect(report.findings[0]?.category).toBe(category);
  });

  it("keeps accepted normalization no-op and fails closed on blocking drift", async () => {
    const noOp = await reportFor([observation({})]);
    const failed = await reportFor([
      observation({ action: "drifted", diffClass: "update" }),
    ]);
    expect(noOp.status).toBe("no_op");
    expect(failed.status).toBe("failed");
  });

  it("accepts an explicitly reviewed unowned baseline without hiding its classification", async () => {
    const report = await reportFor([
      observation({ ownership: "Unowned", baselineDisposition: "accepted" }),
    ]);
    expect(report.status).toBe("no_op");
    expect(report.findings[0]).toMatchObject({
      category: "unownedResource",
      disposition: "accepted",
    });
  });

  it("classifies a desired-state plan change separately from live drift", async () => {
    const input = {
      ...observation({ action: "drifted", diffClass: "update" }),
      source: "desiredPlan" as const,
    };
    const report = await reportFor([
      InfrastructureDriftObservation.make(input),
    ]);
    expect(report.findings[0]?.category).toBe("desiredStatePlanChange");
    expect(report.findings[0]?.source).toBe("desiredPlan");
  });

  it("keeps a destructive desired-state removal blocking", async () => {
    const input = {
      ...observation({ action: "drifted", diffClass: "replace" }),
      source: "desiredPlan" as const,
    };
    const report = await reportFor([
      InfrastructureDriftObservation.make(input),
    ]);
    expect(report.findings[0]).toMatchObject({
      category: "destructiveDrift",
      disposition: "blocking",
      source: "desiredPlan",
    });
  });

  it("keeps unavailable, unknown-secret and skipped reads inconclusive", async () => {
    const report = await reportFor([
      observation({ action: "unavailable", readback: "unavailable" }),
      observation({
        resourceKind: "vercelEnvironmentVariable",
        secretRevision: "unknown",
      }),
      observation({ action: "skipped", providerRead: "skipped" }),
    ]);
    expect(report.status).toBe("inconclusive");
    expect(report.counts.inconclusive).toBe(3);
  });

  it("retains an inconclusive native failure without inventing plan counts", async () => {
    const report = await Effect.runPromise(
      buildInfrastructureDriftReport(
        InfrastructureDriftReportInput.make({
          authorityFingerprint: fingerprint,
          desiredPlan: { _tag: "NotExposed" },
          observedAt: "2026-07-31T01:00:00.000Z",
          observations: [
            observation({ action: "unavailable", readback: "unavailable" }),
          ],
          runDurationMilliseconds: 42,
          sourceSha,
          stage: "preview",
        })
      )
    );
    const receipt = await Effect.runPromise(
      buildInfrastructureDriftReceipt({
        authorityReceipt: InfrastructureDriftArtifactPath.make(
          "tmp/proof/infrastructure-drift.authority.json"
        ),
        detailDigest: InfrastructureArtifactDigest.make("d".repeat(64)),
        report,
        reportPath: InfrastructureDriftArtifactPath.make(
          "tmp/proof/infrastructure-drift.report.json"
        ),
      })
    );
    expect(report.status).toBe("inconclusive");
    expect(report.desiredPlan).toStrictEqual({ _tag: "NotExposed" });
    expect(receipt.observations).toContain("plan:not-exposed");
    expect(receipt.observations).not.toContain("plan-create:0");
  });

  it("encodes only bounded fingerprints and classifications", async () => {
    const report = await reportFor([observation({})]);
    const encoded = await Effect.runPromise(
      Schema.encodeEffect(InfrastructureDriftReportJson)(report)
    );
    const decoded = await Effect.runPromise(
      Schema.decodeUnknownEffect(InfrastructureDriftReportJson)(encoded)
    );
    expect(decoded).toStrictEqual(report);
    expect(encoded).not.toContain("full-physical-id");
    expect(encoded).not.toContain("secret-value");
    expect(encoded).not.toContain("raw-provider-payload");
  });

  it("builds the actual fixed-contract bounded receipt without proxy proof", async () => {
    const report = await reportFor([observation({})]);
    const receipt = await Effect.runPromise(
      buildInfrastructureDriftReceipt({
        authorityReceipt: InfrastructureDriftArtifactPath.make(
          "tmp/proof/infrastructure-drift.authority.json"
        ),
        detailDigest: InfrastructureArtifactDigest.make("c".repeat(64)),
        report,
        reportPath: InfrastructureDriftArtifactPath.make(
          "tmp/proof/infrastructure-drift.report.json"
        ),
      })
    );
    const encoded = await Effect.runPromise(
      Schema.encodeEffect(InfrastructureBoundedReceiptJson)(receipt)
    );
    const decoded = await Effect.runPromise(
      Schema.decodeUnknownEffect(Schema.fromJsonString(Schema.Unknown))(encoded)
    );
    const validate = new Ajv2020({
      allErrors: true,
      strict: false,
      validateFormats: false,
    }).compile(boundedReceiptSchema);
    expect(validate(decoded)).toBeTruthy();
    expect(encoded).toContain("BND-J14-preview-infrastructure-drift-report");
    expect(encoded).toContain("provider-writes:0");
    expect(encoded).not.toContain("raw-provider-payload");
    expect(encoded).not.toContain("secret-value");
  });

  it("rejects malformed fingerprints and empty observation packets", async () => {
    const valid = structuredClone(await reportFor([observation({})]));
    await expect(
      Effect.runPromise(
        Schema.decodeUnknownEffect(InfrastructureDriftReport)({
          ...valid,
          authorityFingerprint: "not-a-fingerprint",
        })
      )
    ).rejects.toBeDefined();
    await expect(
      Effect.runPromise(
        Schema.decodeUnknownEffect(InfrastructureDriftReportInput)({
          authorityFingerprint: fingerprint,
          desiredPlan: {
            _tag: "Observed",
            create: 0,
            delete: 0,
            noOp: 0,
            replace: 0,
            update: 0,
          },
          observedAt: "2026-07-31T01:00:00.000Z",
          observations: [],
          runDurationMilliseconds: 1,
          sourceSha,
          stage: "preview",
        })
      )
    ).rejects.toBeDefined();
    await expect(
      Effect.runPromise(
        Schema.decodeUnknownEffect(InfrastructureDriftArtifactPath)(
          "../outside.json"
        )
      )
    ).rejects.toBeDefined();
  });
});

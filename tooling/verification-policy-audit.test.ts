import { readFileSync } from "node:fs";

import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  auditVerification,
  CriticalJourney,
  CriticalJourneysJson,
  JourneyCommandMapJson,
  ProofPacket,
  ProofPacketJson,
} from "./verification-policy.js";
import type {
  ProofPacket as ProofPacketType,
  VerificationSnapshot,
} from "./verification-policy.js";

const root = new URL("../", import.meta.url);
const readJson = (path: URL) => readFileSync(path, "utf-8");
const journeys = Effect.runSync(
  Schema.decodeUnknownEffect(CriticalJourneysJson)(
    readJson(new URL("docs/verification/critical-journeys.json", root))
  )
);
const commandMap = Effect.runSync(
  Schema.decodeUnknownEffect(JourneyCommandMapJson)(
    readJson(new URL("docs/verification/journey-command-map.json", root))
  )
);
const detailPath = "docs/evidence/verification/details/packet.json";
const interoperableSchema = readFileSync(
  new URL("docs/verification/proof-packet.schema.json", root),
  "utf-8"
);
const InteroperableSchemaContract = Schema.Struct({
  $defs: Schema.Struct({
    boundedText: Schema.Struct({
      maxLength: Schema.Literal(240),
      minLength: Schema.Literal(1),
      type: Schema.Literal("string"),
    }),
    detailPath: Schema.Struct({
      maxLength: Schema.Literal(200),
      pattern: Schema.Literal(
        "^docs/evidence/verification/details/(?!.*\\.\\.)[A-Za-z0-9][A-Za-z0-9._/-]*\\.json$"
      ),
      type: Schema.Literal("string"),
    }),
    lifecycle: Schema.Struct({ allOf: Schema.Array(Schema.Unknown) }),
    packetPath: Schema.Struct({
      maxLength: Schema.Literal(200),
      pattern: Schema.Literal(
        "^docs/evidence/verification/packets/(?!.*\\.\\.)[A-Za-z0-9][A-Za-z0-9._/-]*\\.json$"
      ),
      type: Schema.Literal("string"),
    }),
  }),
  $schema: Schema.Literal("https://json-schema.org/draft/2020-12/schema"),
  additionalProperties: Schema.Literal(false),
  allOf: Schema.Array(Schema.Unknown).check(Schema.isMinLength(10)),
  properties: Schema.Struct({
    externalConsequence: Schema.Struct({
      $ref: Schema.Literal("#/$defs/externalConsequence"),
    }),
    lifecycle: Schema.Struct({ $ref: Schema.Literal("#/$defs/lifecycle") }),
    outcome: Schema.Struct({ enum: Schema.Array(Schema.String) }),
    status: Schema.Struct({ enum: Schema.Array(Schema.String) }),
  }),
  required: Schema.Array(Schema.String),
  type: Schema.Literal("object"),
});
const interoperableContract = Effect.runSync(
  Schema.decodeUnknownEffect(
    Schema.fromJsonString(InteroperableSchemaContract)
  )(interoperableSchema, { onExcessProperty: "preserve" })
);
// oxlint-disable-next-line eslint-plugin-unicorn/no-thenable -- JSON Schema 2020-12 requires the literal `then` keyword.
const thenKey = "then";
const InteroperableStatusRule = Schema.Struct({
  if: Schema.Struct({
    properties: Schema.Struct({
      status: Schema.Struct({ const: Schema.String }),
    }),
  }),
  [thenKey]: Schema.Struct({
    properties: Schema.Struct({
      lifecycle: Schema.Struct({
        properties: Schema.Struct({
          state: Schema.Struct({ const: Schema.String }),
        }),
      }),
      outcome: Schema.Struct({ const: Schema.String }),
    }),
  }),
});
const statusRules = interoperableContract.allOf
  .filter(Schema.is(InteroperableStatusRule))
  .map((rule) => Schema.decodeUnknownSync(InteroperableStatusRule)(rule));
const InteroperableSupersessionRule = Schema.Struct({
  else: Schema.Struct({
    not: Schema.Struct({
      anyOf: Schema.Tuple([
        Schema.Struct({
          required: Schema.Tuple([Schema.Literal("successor")]),
        }),
        Schema.Struct({ required: Schema.Tuple([Schema.Literal("reason")]) }),
      ]),
    }),
  }),
  if: Schema.Struct({
    properties: Schema.Struct({
      state: Schema.Struct({ const: Schema.Literal("superseded") }),
    }),
  }),
  [thenKey]: Schema.Struct({
    required: Schema.Tuple([
      Schema.Literal("successor"),
      Schema.Literal("reason"),
    ]),
  }),
});
const firstJourney = journeys.at(0);
const firstCommand = commandMap.commands.at(0);

if (firstJourney === undefined || firstCommand === undefined) {
  throw new Error(
    "verification fixtures require a journey and command-map entry"
  );
}

const report = (snapshot: VerificationSnapshot) =>
  auditVerification(snapshot, {
    detailPath: "tmp/verification-policy-report.json",
    generatedAt: "2026-07-21T00:00:00.000Z",
    maxFindings: 20,
  });

const packet = (): ProofPacketType => ({
  authority: {
    approvalReceipt: null,
    externalAccess: "none",
    identitySource: "local shell",
    principal: "local maintainer",
    rollbackOwner: "repository maintainer",
  },
  candidate: {
    artifactDigest: "b".repeat(64),
    repositoryCommit: "a".repeat(40),
    sourceDigest: "a".repeat(64),
  },
  commandReceipt: {
    detailPath,
    detailSha256: "c".repeat(64),
    exitCode: 0,
    invariant: "mock mode remains local",
    invocation: "bun run --filter @bundjil/codex-proxy smoke-test",
    outcome: "passed",
    postcondition: "local mock smoke-test passed",
    recoveryHint: "inspect retained local detail",
    target: "ephemeral local proxy",
  },
  environment: { target: "ephemeral local proxy", tier: "local" },
  evidence: [
    { path: detailPath, provenance: "test fixture", sha256: "c".repeat(64) },
  ],
  externalConsequence: { outcome: "none", target: "no external target" },
  externalReadback: {
    outcome: "not_required",
    receipt: "local only",
    required: false,
  },
  journeyResults: [
    {
      journeyId: "BND-J03-proxy-health-auth-sse",
      oracle: "smoke test exits zero",
      status: "passed",
    },
  ],
  kind: "local",
  lifecycle: { state: "inconclusive" },
  limitations: ["local only"],
  nonClaims: ["no hosted claim"],
  observedAt: "2026-07-21T00:00:00.000Z",
  outcome: "inconclusive",
  postconditions: ["local proxy mock response passed"],
  rollback: {
    identity: "stop local process",
    outcome: "not_needed",
    owner: "repository maintainer",
  },
  schemaVersion: 1,
  status: "inconclusive",
});

const snapshot = (
  packets: readonly ProofPacketType[] = []
): VerificationSnapshot => ({
  commandMap,
  detailArtifacts: [
    {
      path: detailPath,
      sha256: "c".repeat(64),
      sizeBytes: 20,
      validJson: true,
    },
  ],
  journeys,
  packets,
  repositoryPaths: [
    "docs/verification/critical-journeys.json",
    "docs/verification/journey-command-map.json",
    detailPath,
  ],
});

const codes = (current: VerificationSnapshot) =>
  report(current).findings.map((finding) => finding.code);

describe("verification policy", () => {
  it("accepts the current ten journey inventory and command map", () => {
    expect(report(snapshot()).ok).toBeTruthy();
  });

  it("decodes every packet template through the Effect Schema", () => {
    for (const name of [
      "local",
      "preview",
      "production",
      "messaging",
      "approval-gated",
    ]) {
      expect(() =>
        Effect.runSync(
          Schema.decodeUnknownEffect(ProofPacketJson)(
            readJson(new URL(`docs/verification/templates/${name}.json`, root)),
            { onExcessProperty: "error" }
          )
        )
      ).not.toThrow();
    }
  });

  it("decodes the interoperable schema contract and preserves semantic pairings", () => {
    expect(interoperableContract.required).toStrictEqual(
      expect.arrayContaining([
        "status",
        "outcome",
        "lifecycle",
        "externalConsequence",
        "externalReadback",
      ])
    );
    const provedRule = statusRules.find(
      (rule) => rule.if.properties.status.const === "proved"
    );
    const deferredRule = statusRules.find(
      (rule) => rule.if.properties.status.const === "deferred"
    );
    expect(provedRule?.then.properties).toStrictEqual({
      lifecycle: { properties: { state: { const: "accepted" } } },
      outcome: { const: "passed" },
    });
    expect(deferredRule?.then.properties).toStrictEqual({
      lifecycle: { properties: { state: { const: "deferred" } } },
      outcome: { const: "not_attempted" },
    });
    expect(
      interoperableContract.$defs.lifecycle.allOf.some(
        Schema.is(InteroperableSupersessionRule)
      )
    ).toBeTruthy();
  });

  it("rejects every required missing journey field at the Effect Schema boundary", () => {
    for (const invalid of [
      { ...firstJourney, startingState: undefined },
      { ...firstJourney, oracle: undefined },
      { ...firstJourney, expectedSideEffects: undefined },
      { ...firstJourney, preservedInvariants: undefined },
      { ...firstJourney, evidence: undefined },
      { ...firstJourney, nonClaims: undefined },
    ]) {
      expect(() =>
        Effect.runSync(Schema.decodeUnknownEffect(CriticalJourney)(invalid))
      ).toThrow(/Expected/);
    }
  });

  it("rejects duplicate, unknown, and unmapped journey owners", () => {
    const duplicate = {
      ...snapshot(),
      commandMap: {
        ...commandMap,
        commands: [...commandMap.commands, firstCommand],
      },
    };
    const unknown = {
      ...snapshot(),
      commandMap: {
        ...commandMap,
        commands: [{ ...firstCommand, journeyId: "BND-J99-unknown" }],
      },
    };
    expect(codes(duplicate)).toContain("COMMAND_MAP");
    expect(codes(unknown)).toContain("UNKNOWN_JOURNEY");
  });

  it("rejects false local/provider, Preview-as-Production, and unavailable-readback claims", () => {
    const localProof = {
      ...packet(),
      status: "proved",
      lifecycle: { state: "accepted" },
      outcome: "passed",
    } satisfies ProofPacketType;
    const falseProof = {
      ...packet(),
      environment: { target: "Preview deployment", tier: "preview" },
      externalConsequence: {
        outcome: "observed",
        target: "Preview deployment",
      },
      externalReadback: {
        outcome: "unavailable",
        receipt: "unavailable",
        required: true,
      },
      kind: "preview",
      lifecycle: { state: "accepted" },
      outcome: "passed",
      status: "proved",
    } satisfies ProofPacketType;
    const previewAsProduction = {
      ...packet(),
      environment: { target: "Preview deployment", tier: "production" },
      externalReadback: {
        outcome: "available",
        receipt: "readback",
        required: true,
      },
      kind: "preview",
    } satisfies ProofPacketType;
    const unavailable = {
      ...packet(),
      environment: { target: "Production alias", tier: "production" },
      externalReadback: {
        outcome: "unavailable",
        receipt: "unavailable",
        required: true,
      },
      kind: "production",
      status: "failed",
    } satisfies ProofPacketType;
    expect(codes(snapshot([falseProof]))).toContain("FALSE_PROOF");
    expect(report(snapshot([localProof])).ok).toBeTruthy();
    expect(codes(snapshot([previewAsProduction]))).toContain("PREVIEW_TIER");
    expect(codes(snapshot([unavailable]))).toContain(
      "UNAVAILABLE_INCONCLUSIVE"
    );
  });

  it("rejects authority, candidate, digest, rollback, and detail-artifact gaps", () => {
    const invalid = {
      ...packet(),
      candidate: { ...packet().candidate, repositoryCommit: "not-a-commit" },
      authority: { ...packet().authority, principal: "" },
      commandReceipt: {
        ...packet().commandReceipt,
        detailPath: "tmp/raw.log",
        detailSha256: "bad",
      },
      evidence: [
        {
          path: "docs/evidence/verification/missing.json",
          provenance: "fixture",
          sha256: "d".repeat(64),
        },
      ],
      rollback: { ...packet().rollback, identity: "" },
    };
    expect(() =>
      Effect.runSync(Schema.decodeUnknownEffect(ProofPacket)(invalid))
    ).toThrow(/Expected/);
    const outside = {
      ...packet(),
      commandReceipt: { ...packet().commandReceipt, detailPath: "tmp/raw.log" },
    } satisfies ProofPacketType;
    expect(codes(snapshot([outside]))).toContain("DETAIL_ROOT");
    expect(codes(snapshot([outside]))).toContain("DETAIL_MISSING");
  });

  it("rejects traversal, unbounded text, and unknown packet properties at the schema boundary", () => {
    for (const invalid of [
      {
        ...packet(),
        commandReceipt: {
          ...packet().commandReceipt,
          detailPath:
            "docs/evidence/verification/details/nested/../escaped.json",
        },
      },
      { ...packet(), limitations: ["x".repeat(241)] },
      { ...packet(), unknownField: "not part of the contract" },
    ]) {
      expect(() =>
        Effect.runSync(
          Schema.decodeUnknownEffect(ProofPacket)(invalid, {
            onExcessProperty: "error",
          })
        )
      ).toThrow(/Expected|Unexpected key|is forbidden|cannot traverse/);
    }
  });

  it("rejects contradictory authority, readback, lifecycle, outcome, consequence, and journey claims", () => {
    const localReadback = {
      ...packet(),
      externalReadback: {
        outcome: "available",
        receipt: "contradictory local readback",
        required: true,
      },
    } satisfies ProofPacketType;
    const externalNoAuthority = {
      ...packet(),
      environment: { target: "Preview deployment", tier: "preview" },
      externalConsequence: {
        outcome: "not_attempted",
        target: "Preview deployment",
      },
      externalReadback: {
        outcome: "not_required",
        receipt: "contradictory readback",
        required: true,
      },
      kind: "preview",
    } satisfies ProofPacketType;
    const lifecycle = {
      ...packet(),
      lifecycle: {
        reason: "only valid when superseded",
        state: "failed",
      },
      outcome: "failed",
      status: "proved",
    } satisfies ProofPacketType;
    const unavailableConsequence = {
      ...packet(),
      environment: { target: "Production alias", tier: "production" },
      externalConsequence: {
        outcome: "unavailable",
        target: "Production alias",
      },
      externalReadback: {
        outcome: "available",
        receipt: "contradictory readback",
        required: true,
      },
      kind: "production",
    } satisfies ProofPacketType;
    const journeyMismatch = {
      ...packet(),
      journeyResults: [
        ...packet().journeyResults,
        ...packet().journeyResults,
        {
          journeyId: "BND-J99-unknown",
          oracle: "unknown journey",
          status: "inconclusive",
        },
      ],
    } satisfies ProofPacketType;

    expect(codes(snapshot([localReadback]))).toContain("LOCAL_READBACK");
    expect(codes(snapshot([externalNoAuthority]))).toStrictEqual(
      expect.arrayContaining(["EXTERNAL_AUTHORITY", "READBACK_CONTRADICTION"])
    );
    expect(codes(snapshot([lifecycle]))).toStrictEqual(
      expect.arrayContaining([
        "LIFECYCLE_STATUS",
        "STATUS_OUTCOME",
        "UNEXPECTED_SUCCESSOR",
      ])
    );
    expect(codes(snapshot([unavailableConsequence]))).toContain(
      "CONSEQUENCE_UNAVAILABLE"
    );
    expect(codes(snapshot([journeyMismatch]))).toStrictEqual(
      expect.arrayContaining([
        "PACKET_JOURNEY_DUPLICATE",
        "PACKET_JOURNEY_UNKNOWN",
      ])
    );
  });

  it("rejects corrupt, digest-mismatched, and oversized retained detail", () => {
    const current = {
      ...snapshot([packet()]),
      detailArtifacts: [
        {
          path: detailPath,
          sha256: "d".repeat(64),
          sizeBytes: 256_001,
          validJson: false,
        },
      ],
    } satisfies VerificationSnapshot;
    expect(codes(current)).toContain("DETAIL_CORRUPT");
    expect(codes(current)).toContain("DETAIL_DIGEST");
    expect(codes(current)).toContain("DETAIL_OVERSIZED");
  });

  it("keeps interruption, pipe-close, rerun avoidance, output safety, and bounded detail semantic", () => {
    const interrupted = {
      ...packet(),
      commandReceipt: {
        ...packet().commandReceipt,
        exitCode: 0,
        outcome: "interrupted",
      },
    } satisfies ProofPacketType;
    const pipe = {
      ...packet(),
      commandReceipt: {
        ...packet().commandReceipt,
        exitCode: 0,
        outcome: "pipe_closed",
      },
    } satisfies ProofPacketType;
    const unsafe = {
      ...packet(),
      commandReceipt: {
        ...packet().commandReceipt,
        recoveryHint: "paste bearer sk-abcdefghijklmnop",
      },
    } satisfies ProofPacketType;
    const rerun = {
      ...packet(),
      commandReceipt: {
        ...packet().commandReceipt,
        exitCode: null,
        outcome: "rerun_avoided",
      },
    } satisfies ProofPacketType;
    const handledInterruption = {
      ...packet(),
      commandReceipt: {
        ...packet().commandReceipt,
        exitCode: 1,
        outcome: "interrupted",
      },
    } satisfies ProofPacketType;
    expect(codes(snapshot([interrupted]))).toContain("INTERRUPTED_EXIT");
    expect(codes(snapshot([pipe]))).toContain("PIPE_CLOSE_EXIT");
    expect(codes(snapshot([unsafe]))).toContain("UNSAFE_OUTPUT");
    expect(report(snapshot([handledInterruption])).ok).toBeTruthy();
    expect(report(snapshot([rerun])).ok).toBeTruthy();
  });
});

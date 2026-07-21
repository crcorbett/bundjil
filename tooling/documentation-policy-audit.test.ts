import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  auditDocumentation,
  boundedDocumentationFindings,
  DocumentationPolicyReportJson,
} from "./documentation-policy.js";
import type {
  CurrentOwnerPolicy,
  DocumentationFile,
  DocumentationManifest,
  DocumentationSnapshot,
} from "./documentation-policy.js";

const metadata = [
  "---",
  "document_type: fixture",
  "lifecycle: current",
  "authority: canonical",
  "owner: fixture-owner",
  "last_reviewed: 2026-07-21",
  "review_trigger: fixture changes",
  "---",
].join("\n");

const occurrenceDecision = JSON.stringify({
  acceptedOrDefaultBehavior:
    "Retain exact match, duplicate rejection, occurrence isolation, and stale-entry detection.",
  state: "accepted",
});

const ownerPolicy: CurrentOwnerPolicy = {
  acceptedTaskStates: { "HGI-300": "completed" },
  nonterminalTaskTerms: ["pending", "underway"],
  owners: ["README.md"],
  rules: [
    {
      claimType: "authority-grant",
      id: "fixture-contradiction",
      nonClaimTerms: ["not", "cannot"],
      ownerPaths: ["README.md"],
      requiredTermGroups: [
        ["tool output", "fixture output"],
        ["approval", "authorizes"],
      ],
      repairHint: "Repair the earliest owner.",
    },
  ],
  schemaVersion: 2,
  taskStateOwnerPaths: ["README.md"],
};

const baseFiles: readonly DocumentationFile[] = [
  {
    content: "# Repository\n\n[Docs](docs/README.md)\n\n`bun run verification`",
    path: "README.md",
  },
  { content: `${metadata}\n\n# Documentation`, path: "docs/README.md" },
  {
    content: `${metadata}\n\n# Architecture`,
    path: "docs/architecture/README.md",
  },
  {
    content: `${metadata}\n\n# Specs`,
    path: "docs/product-specs/index.md",
  },
  {
    content: `${metadata}\n\n# Current plan index`,
    path: "docs/exec-plans/active/README.md",
  },
  {
    content: `${metadata.replace("lifecycle: current", "lifecycle: historical")}\n\n# Completed plan index`,
    path: "docs/exec-plans/completed/README.md",
  },
  {
    content: occurrenceDecision,
    path: "docs/documentation-audit/HGI-308-boundary-exceptions.decision.json",
  },
  { content: "# Package", path: "packages/demo/README.md" },
  {
    content: JSON.stringify({
      name: "bundjil-fixture",
      scripts: { verification: "fixture" },
    }),
    path: "package.json",
  },
  {
    content: JSON.stringify({ name: "@bundjil/demo", scripts: {} }),
    path: "packages/demo/package.json",
  },
];

const manifests: readonly DocumentationManifest[] = [
  {
    name: "bundjil-fixture",
    path: "package.json",
    scripts: { verification: "fixture" },
  },
  { name: "@bundjil/demo", path: "packages/demo/package.json", scripts: {} },
];

const snapshot = (
  files: readonly DocumentationFile[] = baseFiles,
  manifestInput: readonly DocumentationManifest[] = manifests,
  policy: CurrentOwnerPolicy = ownerPolicy
): DocumentationSnapshot => ({
  files,
  manifests: manifestInput,
  ownerPolicy: policy,
  repositoryPaths: files.map((file) => file.path),
});

const run = (input: DocumentationSnapshot, maxFindings = 20) =>
  auditDocumentation(input, {
    detailPath: "tmp/docs-policy-report.json",
    generatedAt: "2026-07-21T12:00:00.000Z",
    maxFindings,
  });

const runbookPaths = {
  agent: [
    "local-development.md",
    "deploy-promote.md",
    "executor.md",
    "sendblue.md",
    "incident-revocation.md",
  ],
  proxy: [
    "local-auth.md",
    "preview-proof.md",
    "production-proof.md",
    "reauthentication.md",
    "incident-revocation.md",
  ],
} as const;

const runbookMetadata = (documentType: string, owner: string) =>
  [
    "---",
    `document_type: ${documentType}`,
    "lifecycle: current",
    "authority: canonical",
    `owner: ${owner}`,
    "last_reviewed: 2026-07-21",
    "review_trigger: fixture changes",
    "---",
  ].join("\n");

const runbookFixture = (path: string, owner: string): DocumentationFile => ({
  content: [
    runbookMetadata("runbook", owner),
    "# Fixture runbook",
    "## Scope and non-claims",
    "No provider claim.",
    "## Preconditions",
    "Inspect the target.",
    "## Authority envelope",
    "Identity Operation Resource Environment Duration/revocation Approval Receipt",
    "## Inputs and secret handling",
    "Name inputs only.",
    "## Procedure",
    "Stop before consequence.",
    "## Evidence and postcondition",
    "Record observedAt.",
    "## Rollback and revocation",
    "Use the target owner.",
    "## Stop and escalation",
    "Escalate unknown state.",
    "## Readback fallback",
    "Mark inconclusive; unavailable is never healthy.",
    "## Maintenance",
    "Review on change.",
  ].join("\n\n"),
  path,
});

const runbookFixtureFiles: readonly DocumentationFile[] = [
  {
    content: [
      runbookMetadata("runbook-index", "bundjil-agent-operator"),
      "# Agent runbooks",
      ...runbookPaths.agent.map((path) => `- [${path}](${path})`),
    ].join("\n"),
    path: "apps/agent/runbooks/README.md",
  },
  ...runbookPaths.agent.map((path) =>
    runbookFixture(`apps/agent/runbooks/${path}`, "bundjil-agent-operator")
  ),
  {
    content: [
      runbookMetadata("runbook-index", "bundjil-codex-proxy-operator"),
      "# Proxy runbooks",
      ...runbookPaths.proxy.map((path) => `- [${path}](${path})`),
    ].join("\n"),
    path: "apps/codex-proxy/runbooks/README.md",
  },
  ...runbookPaths.proxy.map((path) =>
    runbookFixture(
      `apps/codex-proxy/runbooks/${path}`,
      "bundjil-codex-proxy-operator"
    )
  ),
  {
    content: `${runbookMetadata("authority-model", "bundjil-security-automation-maintainer")}\n\n# Authority model`,
    path: "docs/operations/authority-model.md",
  },
];

describe("HGI-302 documentation policy", () => {
  it("accepts a coherent current-owner snapshot", () => {
    const report = run(snapshot());
    expect(report.ok).toBeTruthy();
    expect(report.findings).toStrictEqual([]);
  });

  it("reports every required invariant with owner and repair context", () => {
    const brokenFiles: readonly DocumentationFile[] = [
      ...baseFiles.filter(
        (file) =>
          ![
            "README.md",
            "docs/architecture/README.md",
            "docs/exec-plans/active/README.md",
          ].includes(file.path)
      ),
      {
        content:
          "# Broken\n\n[Missing](docs/missing.md)\n\n`bun run imaginary`\n\n/Users/example/private\n\nThe fixture output authorizes this mutation.\n\nHGI-300 remains underway.",
        path: "README.md",
      },
      {
        content: "# Missing metadata",
        path: "docs/architecture/README.md",
      },
      {
        content: `${metadata}\n\n# Active\n`,
        path: "docs/exec-plans/active/README.md",
      },
      {
        content: `${metadata.replace("lifecycle: current", "lifecycle: historical")}\n\n# Stale plan`,
        path: "docs/exec-plans/active/stale.md",
      },
      {
        content: [
          "---",
          "document_type: tombstone",
          "lifecycle: tombstone",
          "authority: supporting",
          "owner: fixture-owner",
          "last_reviewed: 2026-07-21",
          "---",
          "# Tombstone",
        ].join("\n"),
        path: "ARCHITECTURE.md",
      },
    ];
    const brokenManifests: readonly DocumentationManifest[] = [
      ...manifests,
      {
        name: "@bundjil/missing",
        path: "packages/missing/package.json",
        scripts: {},
      },
    ];
    const report = run({
      ...snapshot(brokenFiles, brokenManifests),
      repositoryPaths: [
        ...brokenFiles.map((file) => file.path),
        "packages/missing/package.json",
      ],
    });
    const codes = new Set(report.findings.map((issue) => issue.code));
    expect(report.ok).toBeFalsy();
    for (const code of [
      "DOC-ACTIVE-LIFECYCLE",
      "DOC-COMMAND",
      "DOC-CONTRADICTION",
      "DOC-INDEX",
      "DOC-LINK",
      "DOC-METADATA",
      "DOC-PACKAGE-README",
      "DOC-PORTABILITY",
      "DOC-SUCCESSOR",
      "DOC-TASK-STATE-CONTRADICTION",
    ]) {
      expect(codes.has(code)).toBeTruthy();
    }
    for (const issue of report.findings) {
      expect(issue.owner.length).toBeGreaterThan(0);
      expect(issue.repairHint.length).toBeGreaterThan(0);
      expect(issue.target.length).toBeGreaterThan(0);
    }
  });

  it("classifies equivalent claim shapes instead of one forbidden phrase", () => {
    const semanticPolicy: CurrentOwnerPolicy = {
      ...ownerPolicy,
      rules: [
        {
          claimType: "external-actuality",
          id: "provider-actuality",
          nonClaimTerms: ["not", "deferred", "inconclusive"],
          ownerPaths: ["README.md"],
          repairHint: "Require a dated provider readback.",
          requiredTermGroups: [
            ["eve", "provider endpoint"],
            ["production", "now"],
            ["active", "deployed", "serves"],
          ],
        },
      ],
    };
    for (const claim of [
      "Eve serves Production traffic now.",
      "The provider endpoint is active in Production.",
      "Eve is deployed and serving users now.",
    ]) {
      const files = baseFiles.map((file) =>
        file.path === "README.md" ? { ...file, content: claim } : file
      );
      const report = run(snapshot(files, manifests, semanticPolicy));
      expect(
        report.findings.some(
          (issue) =>
            issue.code === "DOC-CONTRADICTION" &&
            issue.owner === "provider-actuality"
        )
      ).toBeTruthy();
    }
    const bounded = baseFiles.map((file) =>
      file.path === "README.md"
        ? {
            ...file,
            content:
              "Eve is not active in Production without a dated readback.",
          }
        : file
    );
    expect(run(snapshot(bounded, manifests, semanticPolicy)).ok).toBeTruthy();
  });

  it("rejects a weakened occurrence-control decision", () => {
    const weakened = baseFiles.map((file) =>
      file.path ===
      "docs/documentation-audit/HGI-308-boundary-exceptions.decision.json"
        ? {
            content: JSON.stringify({
              acceptedOrDefaultBehavior: "Use symbol-only exceptions.",
              state: "accepted",
            }),
            path: file.path,
          }
        : file
    );
    const report = run(snapshot(weakened));
    expect(
      report.findings.some((issue) => issue.code === "DOC-CONTROL-DECISION")
    ).toBeTruthy();
  });

  it("bounds console output while preserving full JSON detail", async () => {
    const huge = "x".repeat(500);
    const additions = Array.from({ length: 30 }, (_, index) => ({
      content: `${metadata}\n\n# Broken\n\n[Missing](../${huge}-${index}.md)`,
      path: `docs/architecture/broken-${index}.md`,
    }));
    const files = [...baseFiles, ...additions];
    const report = run(snapshot(files), 5);
    expect(report.shownFindings).toBe(5);
    expect(report.omittedFindings).toBeGreaterThan(0);
    expect(boundedDocumentationFindings(report)).toHaveLength(5);
    expect(
      boundedDocumentationFindings(report).every(
        (issue) => issue.detail.length <= 240
      )
    ).toBeTruthy();
    const encoded = await Effect.runPromise(
      Schema.encodeEffect(DocumentationPolicyReportJson)(report)
    );
    const decoded = await Effect.runPromise(
      Schema.decodeUnknownEffect(DocumentationPolicyReportJson)(encoded)
    );
    expect(
      decoded.findings.some((issue) => issue.detail.length > 240)
    ).toBeTruthy();
  });

  it("enforces the HGI-303 runbook inventory, authority shape, secret safety, and claim boundary", () => {
    const coherentFiles = [...baseFiles, ...runbookFixtureFiles];
    expect(
      run(snapshot(coherentFiles)).findings.filter((issue) =>
        issue.code.startsWith("DOC-RUNBOOK")
      )
    ).toStrictEqual([]);

    const mutations: readonly [string, readonly DocumentationFile[]][] = [
      [
        "DOC-RUNBOOK-INVENTORY",
        coherentFiles.filter(
          (file) => file.path !== "apps/agent/runbooks/executor.md"
        ),
      ],
      [
        "DOC-RUNBOOK-STRUCTURE",
        coherentFiles.map((file) =>
          file.path === "apps/agent/runbooks/local-development.md"
            ? {
                ...file,
                content: file.content.replace("## Preconditions", "## Setup"),
              }
            : file
        ),
      ],
      [
        "DOC-RUNBOOK-SECRET",
        coherentFiles.map((file) =>
          file.path === "apps/agent/runbooks/sendblue.md"
            ? {
                ...file,
                content: `${file.content}\nBUNDJIL_SECRET=literal-value`,
              }
            : file
        ),
      ],
      [
        "DOC-RUNBOOK-CLAIM",
        coherentFiles.map((file) =>
          file.path === "apps/codex-proxy/runbooks/production-proof.md"
            ? {
                ...file,
                content: `${file.content}\nThe proxy is currently deployed to Production.`,
              }
            : file
        ),
      ],
      [
        "DOC-RUNBOOK-CLAIM",
        coherentFiles.map((file) =>
          file.path === "apps/agent/runbooks/deploy-promote.md"
            ? {
                ...file,
                content: `${file.content}\nA passing preflight grants authority.`,
              }
            : file
        ),
      ],
    ];

    for (const [expectedCode, files] of mutations) {
      const report = run({
        ...snapshot(files),
        repositoryPaths: files.map((file) => file.path),
      });
      expect(
        report.findings.some((issue) => issue.code === expectedCode)
      ).toBeTruthy();
    }
  });
});

import { describe, expect, it } from "vitest";
import { parse as parseYamlDocument } from "yaml";

import { auditAuthority } from "./authority-policy.js";
import type {
  AuthorityRegister,
  AuthoritySnapshot,
  AuthorityWorkflow,
  GitHubActionsLock,
} from "./authority-policy.js";

const pins = {
  "actions/checkout": "11d5960a326750d5838078e36cf38b85af677262",
  "actions/setup-node": "49933ea5288caeca8642d1e84afbd3f7d6820020",
  "anthropics/claude-code-action": "855c772a30bf1a423d6ff9a0db600098226c2cfc",
  "changesets/action": "a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d",
  "oven-sh/setup-bun": "0c5077e51419868618aeaa5fe8019c62421857d6",
} as const;

const workflow = (path: string, content: string): AuthorityWorkflow => ({
  content,
  document: parseYamlDocument(content),
  path,
});

const ci = () =>
  workflow(
    ".github/workflows/ci.yml",
    `name: CI
on:
  push:
permissions:
  contents: read
concurrency:
  group: ci-
  cancel-in-progress: true
jobs:
  check:
    if: github.repository == 'crcorbett/bundjil'
    timeout-minutes: 20
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@${pins["actions/checkout"]} # v4
      - uses: actions/setup-node@${pins["actions/setup-node"]}
      - uses: oven-sh/setup-bun@${pins["oven-sh/setup-bun"]}
`
  );

const release = () =>
  workflow(
    ".github/workflows/release.yml",
    `name: Release
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
concurrency:
  group: release-main
  cancel-in-progress: false
jobs:
  version-pr:
    if: github.repository == 'crcorbett/bundjil' && github.ref == 'refs/heads/main' && vars.BUNDJIL_RELEASE_AUTHORITY_EPOCH == 'hgi-304-v1'
    timeout-minutes: 20
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@${pins["actions/checkout"]}
        with:
          persist-credentials: false
      - uses: actions/setup-node@${pins["actions/setup-node"]}
      - uses: oven-sh/setup-bun@${pins["oven-sh/setup-bun"]}
      - uses: changesets/action@${pins["changesets/action"]}
`
  );

const claude = () =>
  workflow(
    ".github/workflows/claude.yml",
    `name: Claude
on:
  issue_comment:
    types: [created]
permissions:
  contents: read
  issues: read
  pull-requests: read
  id-token: write
concurrency:
  group: claude-
  cancel-in-progress: true
jobs:
  interact:
    if: github.actor == 'crcorbett' && startsWith(github.event.comment.body, '@claude')
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@${pins["actions/checkout"]}
        with:
          persist-credentials: false
      - uses: anthropics/claude-code-action@${pins["anthropics/claude-code-action"]}
        with:
          claude_args: --allowedTools=Read,Glob,Grep
`
  );

const authorityRows = [
  {
    id: "github-ci",
    status: "bounded",
    surface: "workflow",
    target: "github-actions",
  },
  {
    id: "github-release-pr",
    status: "disabled_pending_proof",
    surface: "workflow",
    target: "github-actions",
  },
  {
    id: "github-claude-interactive",
    status: "foreground_only",
    surface: "workflow",
    target: "github-actions",
  },
  {
    id: "github-claude-auto-review-retired",
    status: "retired",
    surface: "workflow",
    target: "github-actions",
  },
  {
    id: "vercel-agent",
    status: "disabled_pending_proof",
    surface: "provider",
    target: "vercel",
  },
  {
    id: "vercel-codex-proxy",
    status: "disabled_pending_proof",
    surface: "provider",
    target: "vercel",
  },
  {
    id: "executor-agent",
    status: "foreground_only",
    surface: "provider",
    target: "executor",
  },
  {
    id: "sendblue-inbound",
    status: "bounded",
    surface: "provider",
    target: "sendblue",
  },
  {
    id: "sendblue-outbound",
    status: "foreground_only",
    surface: "provider",
    target: "sendblue",
  },
  {
    id: "photon-management",
    status: "bounded",
    surface: "provider",
    target: "photon",
  },
  {
    id: "photon-inbound",
    status: "bounded",
    surface: "provider",
    target: "photon",
  },
  {
    id: "photon-outbound",
    status: "foreground_only",
    surface: "provider",
    target: "photon",
  },
  {
    id: "upstash-sendblue-replay",
    status: "bounded",
    surface: "provider",
    target: "upstash",
  },
  {
    id: "upstash-codex-profile",
    status: "bounded",
    surface: "provider",
    target: "upstash",
  },
  {
    id: "secret-store",
    status: "disabled_pending_proof",
    surface: "provider",
    target: "secret-store",
  },
  {
    id: "ai-gateway",
    status: "foreground_only",
    surface: "provider",
    target: "ai-gateway",
  },
  {
    id: "codex-model-proxy",
    status: "disabled_pending_proof",
    surface: "provider",
    target: "codex-model-proxy",
  },
  {
    id: "eve-interaction",
    status: "foreground_only",
    surface: "interaction",
    target: "eve-interaction",
  },
] as const satisfies readonly Pick<
  AuthorityRegister["records"][number],
  "id" | "status" | "surface" | "target"
>[];

const register = (): AuthorityRegister => ({
  emergencyContainment: {
    allowedOperations: ["one-shot exact-target containment"],
    approvalBoundary: "named emergency approval",
    durationRevocation: "time-bounded and revocable",
    escalation: "escalate unresolved containment",
    forbiddenOperations: ["normal operation", "ongoing automation"],
    nonClaim: "Containment is not normal operation.",
    receipt: "sanitized containment receipt",
    reconciliation: "reconcile the exact target before resuming",
    status: "containment_only",
    stopCondition: "stop on missing emergency approval",
  },
  lastReviewed: "2026-07-21",
  owner: "bundjil-security-automation-maintainer",
  records: authorityRows.map((row): AuthorityRegister["records"][number] => ({
    approvalBoundary: "named approval boundary",
    approvalReceipt: "sanitized receipt path",
    auditEvidence: "dated evidence path",
    durationRevocation: "time bounded and revocable",
    environment: "named environment",
    escalation: "escalate to owner",
    id: row.id,
    identitySource: "GitHub identity",
    nonClaim: "No current external state is asserted.",
    operation: "bounded operation",
    principal: "named principal",
    readback: {
      availability: "unavailable",
      evidence: "readback unavailable",
      outcome: "inconclusive",
    },
    resource: "exact resource",
    rollback: "target-owned rollback",
    stopCondition: "stop on missing approval",
    status: row.status,
    surface: row.surface,
    target: row.target,
  })),
  reviewTrigger: "workflow, provider, or authority changes",
  schemaVersion: 1,
});

const actionRows = [
  {
    action: "actions/checkout",
    approvedWorkflows: [
      ".github/workflows/ci.yml",
      ".github/workflows/claude.yml",
      ".github/workflows/release.yml",
    ],
    pin: pins["actions/checkout"],
  },
  {
    action: "actions/setup-node",
    approvedWorkflows: [
      ".github/workflows/ci.yml",
      ".github/workflows/release.yml",
    ],
    pin: pins["actions/setup-node"],
  },
  {
    action: "oven-sh/setup-bun",
    approvedWorkflows: [
      ".github/workflows/ci.yml",
      ".github/workflows/release.yml",
    ],
    pin: pins["oven-sh/setup-bun"],
  },
  {
    action: "changesets/action",
    approvedWorkflows: [".github/workflows/release.yml"],
    pin: pins["changesets/action"],
  },
  {
    action: "anthropics/claude-code-action",
    approvedWorkflows: [".github/workflows/claude.yml"],
    pin: pins["anthropics/claude-code-action"],
  },
] as const;

const lock = (): GitHubActionsLock => ({
  actions: actionRows.map((row) => ({
    action: row.action,
    approvedWorkflows: [...row.approvedWorkflows],
    pin: row.pin,
    provenance: "official action release review",
    ref: "reviewed release ref",
    tag: "reviewed release tag",
    updateOwner: "bundjil-security-automation-maintainer",
    updatedAt: "2026-07-21",
  })),
  lastReviewed: "2026-07-21",
  owner: "bundjil-security-automation-maintainer",
  reviewTrigger: "action release or workflow use changes",
  schemaVersion: 1,
});

const snapshot = (): AuthoritySnapshot => ({
  automationRegister:
    "Emergency containment is one-shot, time-bounded, exact-target, non-normal-operation, approval, receipt, and reconciliation-bound.",
  authorityRegister: register(),
  githubActionsLock: lock(),
  repositoryPaths: [
    ".github/workflows/ci.yml",
    ".github/workflows/claude.yml",
    ".github/workflows/release.yml",
  ],
  workflows: [ci(), claude(), release()],
});

const run = (input = snapshot()) =>
  auditAuthority(input, {
    detailPath: "tmp/authority-policy-report.json",
    generatedAt: "2026-07-21T12:00:00.000Z",
    maxFindings: 5,
  });

const withWorkflow = (
  input: AuthoritySnapshot,
  path: string,
  update: (content: string) => string
): AuthoritySnapshot => ({
  ...input,
  workflows: input.workflows.map((item) =>
    item.path === path ? workflow(path, update(item.content)) : item
  ),
});

describe("HGI-304 authority policy", () => {
  it("accepts the desired bounded workflow and authority state", () => {
    const report = run();
    expect(report.ok).toBeTruthy();
    expect(report.findings).toStrictEqual([]);
  });

  it("rejects workflow inventory, permissions, loop, mutation, target, pin, and timeout drift", () => {
    let broken = snapshot();
    broken = {
      ...broken,
      repositoryPaths: [
        ...broken.repositoryPaths,
        ".github/workflows/claude-code-review.yml",
      ],
    };
    broken = withWorkflow(broken, ".github/workflows/ci.yml", (content) =>
      content
        .replace("contents: read", "contents: write")
        .replace("timeout-minutes: 20", "timeout-minutes: 0")
    );
    broken = withWorkflow(broken, ".github/workflows/release.yml", (content) =>
      content
        .replace("branches: [main]", "branches: [release]")
        .replace("crcorbett/bundjil", "other/repository")
        .replace(pins["changesets/action"], "v1")
        .replace("hgi-304-v1", "wrong")
    );
    broken = withWorkflow(broken, ".github/workflows/claude.yml", (content) =>
      content
        .replace("issue_comment:", "pull_request_review:")
        .replace(
          "--allowedTools=Read,Glob,Grep",
          "Bash(git push); deploy; approve; resume"
        )
    );
    const codes = new Set(run(broken).findings.map((issue) => issue.code));
    for (const code of [
      "AUTH-WORKFLOW-INVENTORY",
      "AUTH-CI-PERMISSIONS",
      "AUTH-JOB-TIMEOUT",
      "AUTH-RELEASE-TARGET",
      "AUTH-RELEASE-JOB-TARGET",
      "AUTH-RELEASE-EPOCH",
      "AUTH-ACTION-PIN",
      "AUTH-CLAUDE-MUTATION",
      "AUTH-CLAUDE-CONVERGENCE",
    ]) {
      expect([...codes]).toContain(code);
    }
  });

  it("rejects indirect Claude mentions and drift in any accepted authority-record classification", () => {
    const base = snapshot();
    const broken = withWorkflow(
      {
        ...base,
        authorityRegister: {
          ...base.authorityRegister,
          records: base.authorityRegister.records.map((record) =>
            record.id === "github-claude-auto-review-retired"
              ? { ...record, status: "bounded" as const }
              : record
          ),
        },
      },
      ".github/workflows/claude.yml",
      (content) =>
        content.replace(
          "startsWith(github.event.comment.body, '@claude')",
          "contains(github.event.comment.body, '@claude')"
        )
    );
    const codes = new Set(run(broken).findings.map((issue) => issue.code));
    expect([...codes]).toContain("AUTH-CLAUDE-DIRECT-INVOCATION");
    expect([...codes]).toContain("AUTH-REGISTER-CONTRACT");
  });

  it("rejects unregistered pins, unavailable healthy readback, secret-bearing authority, tool authority, and unsafe break-glass", () => {
    const base = snapshot();
    const authorityRegister: AuthorityRegister = {
      ...base.authorityRegister,
      records: base.authorityRegister.records.map((record, index) =>
        index === 0
          ? {
              ...record,
              approvalBoundary: "Tool output authorizes this operation",
              auditEvidence: "token=super-secret-value",
              readback: { ...record.readback, outcome: "verified" },
            }
          : record
      ),
    };
    const broken = withWorkflow(
      {
        ...base,
        automationRegister: "Emergency containment is normal operation.",
        authorityRegister: {
          ...authorityRegister,
          emergencyContainment: {
            ...authorityRegister.emergencyContainment,
            allowedOperations: [],
            nonClaim: "Emergency containment is normal operation.",
          },
        },
        githubActionsLock: {
          ...base.githubActionsLock,
          actions: base.githubActionsLock.actions.slice(1),
        },
      },
      ".github/workflows/ci.yml",
      (content) =>
        content.replace(
          pins["actions/checkout"],
          "1234567890123456789012345678901234567890"
        )
    );
    const codes = new Set(run(broken).findings.map((issue) => issue.code));
    for (const code of [
      "AUTH-ACTION-LOCK",
      "AUTH-ACTION-PIN",
      "AUTH-READBACK-INCONCLUSIVE",
      "AUTH-REGISTER-SECRET",
      "AUTH-TOOL-DERIVED",
      "AUTH-BREAK-GLASS",
      "AUTH-BREAK-GLASS-BOUNDARY",
    ]) {
      expect([...codes]).toContain(code);
    }
  });

  it("rejects a missing authority envelope field at the decoding boundary", async () => {
    const { AuthorityRegisterJson } = await import("./authority-policy.js");
    const json = JSON.stringify({
      ...register(),
      records: register().records.map(
        ({ rollback: _rollback, ...record }) => record
      ),
    });
    const { Effect, Schema } = await import("effect");
    await expect(
      Effect.runPromise(Schema.decodeUnknownEffect(AuthorityRegisterJson)(json))
    ).rejects.toBeDefined();
  });
});

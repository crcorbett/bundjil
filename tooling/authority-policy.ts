import { Schema } from "effect";

export interface AuthorityWorkflow {
  readonly content: string;
  readonly document: unknown;
  readonly path: string;
}

export interface AuthoritySnapshot {
  readonly automationRegister: string;
  readonly authorityRegister: AuthorityRegister;
  readonly githubActionsLock: GitHubActionsLock;
  readonly repositoryPaths: readonly string[];
  readonly workflows: readonly AuthorityWorkflow[];
}

export const AuthorityFinding = Schema.Struct({
  code: Schema.NonEmptyString,
  detail: Schema.NonEmptyString,
  invariant: Schema.NonEmptyString,
  postcondition: Schema.NonEmptyString,
  repairHint: Schema.NonEmptyString,
  target: Schema.NonEmptyString,
});
export interface AuthorityFinding {
  readonly code: string;
  readonly detail: string;
  readonly invariant: string;
  readonly postcondition: string;
  readonly repairHint: string;
  readonly target: string;
}

export const AuthorityPolicyReport = Schema.Struct({
  checkedWorkflows: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  detailPath: Schema.NonEmptyString,
  findings: Schema.Array(AuthorityFinding),
  generatedAt: Schema.NonEmptyString,
  ok: Schema.Boolean,
  omittedFindings: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  schemaVersion: Schema.Literal(1),
  shownFindings: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
});
export type AuthorityPolicyReport = typeof AuthorityPolicyReport.Type;
export const AuthorityPolicyReportJson = Schema.fromJsonString(
  AuthorityPolicyReport
);

const Readback = Schema.Struct({
  availability: Schema.Literals(["available", "unavailable"]),
  evidence: Schema.NonEmptyString,
  outcome: Schema.Literals(["verified", "inconclusive"]),
});

const AuthorityRecord = Schema.Struct({
  approvalBoundary: Schema.NonEmptyString,
  approvalReceipt: Schema.NonEmptyString,
  auditEvidence: Schema.NonEmptyString,
  durationRevocation: Schema.NonEmptyString,
  environment: Schema.NonEmptyString,
  escalation: Schema.NonEmptyString,
  id: Schema.NonEmptyString,
  identitySource: Schema.NonEmptyString,
  nonClaim: Schema.NonEmptyString,
  operation: Schema.NonEmptyString,
  principal: Schema.NonEmptyString,
  readback: Readback,
  resource: Schema.NonEmptyString,
  rollback: Schema.NonEmptyString,
  stopCondition: Schema.NonEmptyString,
  status: Schema.Literals([
    "bounded",
    "foreground_only",
    "disabled_pending_proof",
    "retired",
  ]),
  surface: Schema.Literals(["workflow", "provider", "interaction"]),
  target: Schema.Literals([
    "github-actions",
    "vercel",
    "executor",
    "sendblue",
    "upstash",
    "secret-store",
    "ai-gateway",
    "codex-model-proxy",
    "eve-interaction",
  ]),
});

const EmergencyContainment = Schema.Struct({
  allowedOperations: Schema.Array(Schema.NonEmptyString),
  approvalBoundary: Schema.NonEmptyString,
  durationRevocation: Schema.NonEmptyString,
  escalation: Schema.NonEmptyString,
  forbiddenOperations: Schema.Array(Schema.NonEmptyString),
  nonClaim: Schema.NonEmptyString,
  receipt: Schema.NonEmptyString,
  reconciliation: Schema.NonEmptyString,
  status: Schema.Literal("containment_only"),
  stopCondition: Schema.NonEmptyString,
});

export const AuthorityRegister = Schema.Struct({
  emergencyContainment: EmergencyContainment,
  lastReviewed: Schema.NonEmptyString,
  owner: Schema.NonEmptyString,
  records: Schema.Array(AuthorityRecord),
  reviewTrigger: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
});
export type AuthorityRegister = typeof AuthorityRegister.Type;
export const AuthorityRegisterJson = Schema.fromJsonString(AuthorityRegister);

const ActionPin = Schema.String.check(Schema.isPattern(/^[a-f0-9]{40}$/));
const GitHubActionLockEntry = Schema.Struct({
  action: Schema.NonEmptyString,
  approvedWorkflows: Schema.Array(Schema.NonEmptyString),
  pin: ActionPin,
  provenance: Schema.NonEmptyString,
  ref: Schema.NonEmptyString,
  tag: Schema.NonEmptyString,
  updateOwner: Schema.NonEmptyString,
  updatedAt: Schema.NonEmptyString,
});
export const GitHubActionsLock = Schema.Struct({
  actions: Schema.Array(GitHubActionLockEntry),
  lastReviewed: Schema.NonEmptyString,
  owner: Schema.NonEmptyString,
  reviewTrigger: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
});
export type GitHubActionsLock = typeof GitHubActionsLock.Type;
export const GitHubActionsLockJson = Schema.fromJsonString(GitHubActionsLock);

export interface AuthorityPolicyOptions {
  readonly detailPath: string;
  readonly generatedAt: string;
  readonly maxFindings: number;
}

const requiredWorkflowPaths = [
  ".github/workflows/ci.yml",
  ".github/workflows/claude.yml",
  ".github/workflows/release.yml",
] as const;

const requiredAuthorityRecords = [
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

const requiredAuthorityIds = requiredAuthorityRecords.map(({ id }) => id);
const requiredAuthorityRecordById = new Map<
  string,
  (typeof requiredAuthorityRecords)[number]
>(requiredAuthorityRecords.map((record) => [record.id, record] as const));

const requiredPins = {
  "actions/checkout": "11d5960a326750d5838078e36cf38b85af677262",
  "actions/setup-node": "49933ea5288caeca8642d1e84afbd3f7d6820020",
  "anthropics/claude-code-action": "855c772a30bf1a423d6ff9a0db600098226c2cfc",
  "changesets/action": "a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d",
  "oven-sh/setup-bun": "0c5077e51419868618aeaa5fe8019c62421857d6",
} as const;
const approvedPinByAction = new Map<string, string>(
  Object.entries(requiredPins)
);
const approvedWorkflowsByAction: Readonly<Record<string, readonly string[]>> = {
  "actions/checkout": requiredWorkflowPaths,
  "actions/setup-node": [
    ".github/workflows/ci.yml",
    ".github/workflows/release.yml",
  ],
  "anthropics/claude-code-action": [".github/workflows/claude.yml"],
  "changesets/action": [".github/workflows/release.yml"],
  "oven-sh/setup-bun": [
    ".github/workflows/ci.yml",
    ".github/workflows/release.yml",
  ],
};

type Mapping = Readonly<Record<string, unknown>>;

const isMapping = (value: unknown): value is Mapping =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readMapping = (value: unknown, key: string): Mapping | undefined => {
  if (!isMapping(value)) {
    return undefined;
  }
  const child = value[key];
  return isMapping(child) ? child : undefined;
};

const finding = (
  code: string,
  invariant: string,
  target: string,
  repairHint: string,
  detail: string,
  postcondition: string
): AuthorityFinding => ({
  code,
  detail,
  invariant,
  postcondition,
  repairHint,
  target,
});

const inventoryFindings = (
  snapshot: AuthoritySnapshot
): readonly AuthorityFinding[] => {
  const workflows = snapshot.repositoryPaths.filter((path) =>
    path.startsWith(".github/workflows/")
  );
  const expected = new Set<string>(requiredWorkflowPaths);
  const unexpected = workflows.filter((path) => !expected.has(path));
  const missing = requiredWorkflowPaths.filter(
    (path) => !workflows.includes(path)
  );
  const findings: AuthorityFinding[] = [];
  if (missing.length > 0 || unexpected.length > 0) {
    findings.push(
      finding(
        "AUTH-WORKFLOW-INVENTORY",
        "GitHub workflow inventory is exact and excludes autonomous review loops",
        ".github/workflows/**",
        "Keep only ci.yml, claude.yml, and release.yml; retire auto-review workflows",
        `Missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}`,
        "Exactly the three approved workflow paths remain"
      )
    );
  }
  return findings;
};

const timeoutFindings = (
  workflow: AuthorityWorkflow
): readonly AuthorityFinding[] => {
  const jobs = readMapping(workflow.document, "jobs");
  if (!jobs) {
    return [
      finding(
        "AUTH-JOB-TIMEOUT",
        "Every workflow job has a bounded timeout",
        workflow.path,
        "Declare timeout-minutes between 1 and 60 for every job",
        "Workflow has no parseable jobs mapping",
        "Every declared job has an explicit bounded timeout"
      ),
    ];
  }
  return Object.entries(jobs).flatMap(([name, job]) => {
    const timeout = isMapping(job) ? job["timeout-minutes"] : undefined;
    return typeof timeout === "number" && timeout > 0 && timeout <= 60
      ? []
      : [
          finding(
            "AUTH-JOB-TIMEOUT",
            "Every workflow job has a bounded timeout",
            `${workflow.path}#jobs.${name}`,
            "Declare timeout-minutes between 1 and 60",
            `Observed timeout-minutes: ${String(timeout)}`,
            "The job is bounded to at most 60 minutes"
          ),
        ];
  });
};

const explicitControlFindings = (
  workflow: AuthorityWorkflow
): readonly AuthorityFinding[] => {
  const permissions = readMapping(workflow.document, "permissions");
  const concurrency = readMapping(workflow.document, "concurrency");
  const issues: AuthorityFinding[] = [];
  if (!permissions) {
    issues.push(
      finding(
        "AUTH-PERMISSIONS",
        "Every workflow declares explicit least-privilege permissions",
        workflow.path,
        "Add a root permissions mapping with only the required scopes",
        "Root permissions are absent or not a mapping",
        "The workflow declares only its intended authority"
      )
    );
  }
  if (!concurrency || typeof concurrency["group"] !== "string") {
    issues.push(
      finding(
        "AUTH-CONCURRENCY",
        "Every workflow declares an explicit concurrency group",
        workflow.path,
        "Add concurrency.group and cancel-in-progress explicitly",
        "Concurrency group is absent",
        "Concurrent runs have an explicit policy"
      )
    );
  }
  return issues;
};

const actionUses = (
  content: string
): readonly { action: string; pin: string }[] =>
  [
    ...content.matchAll(
      /^\s*(?:-\s*)?uses:\s*([^\s@]+)@([^\s#]+)(?:\s+#.*)?$/gm
    ),
  ].map((match) => ({ action: match[1] ?? "", pin: match[2] ?? "" }));

const pinFindings = (
  workflow: AuthorityWorkflow,
  lock: GitHubActionsLock
): readonly AuthorityFinding[] => {
  const registered = new Map(
    lock.actions.map((entry) => [entry.action, entry])
  );
  const lockIssues = Object.entries(requiredPins).flatMap(([action, pin]) => {
    const entry = registered.get(action);
    const approvedWorkflows = approvedWorkflowsByAction[action] ?? [];
    return entry?.pin === pin &&
      entry.approvedWorkflows.length === approvedWorkflows.length &&
      approvedWorkflows.every((path) =>
        entry.approvedWorkflows.includes(path)
      ) &&
      entry.provenance.trim() &&
      entry.ref.trim() &&
      entry.tag.trim() &&
      entry.updateOwner.trim() &&
      entry.updatedAt.trim()
      ? []
      : [
          finding(
            "AUTH-ACTION-LOCK",
            "Every approved action pin is registered with update and provenance metadata",
            "docs/operations/github-actions-lock.json",
            `Register ${action} at its approved immutable pin with updatedAt and provenance`,
            `Registered pin: ${entry?.pin ?? "missing"}`,
            "The lock exactly records each approved immutable action pin"
          ),
        ];
  });
  const useIssues = actionUses(workflow.content).flatMap(({ action, pin }) => {
    const entry = registered.get(action);
    const expected = approvedPinByAction.get(action);
    return /^[a-f0-9]{40}$/.test(pin) &&
      entry?.pin === pin &&
      entry.approvedWorkflows.includes(workflow.path) &&
      (!expected || pin === expected)
      ? []
      : [
          finding(
            "AUTH-ACTION-PIN",
            "Workflow action references use registered approved immutable pins",
            workflow.path,
            "Use the exact SHA registered in github-actions-lock.json",
            `${action}@${pin} is short, unregistered, mismatched, or not approved for this workflow`,
            "Every action use resolves to its registered immutable pin"
          ),
        ];
  });
  return [...lockIssues, ...useIssues];
};

const lockInventoryFindings = (
  lock: GitHubActionsLock
): readonly AuthorityFinding[] => {
  const actions = lock.actions.map((entry) => entry.action);
  const expected = Object.keys(requiredPins);
  const missing = expected.filter((action) => !actions.includes(action));
  const unexpected = actions.filter((action) => !expected.includes(action));
  const duplicate = actions.filter(
    (action, index) => actions.indexOf(action) !== index
  );
  return missing.length === 0 &&
    unexpected.length === 0 &&
    duplicate.length === 0
    ? []
    : [
        finding(
          "AUTH-ACTION-LOCK-INVENTORY",
          "GitHub action lock contains each approved action exactly once",
          "docs/operations/github-actions-lock.json",
          "Keep one lock entry for each approved action and remove unknown entries",
          `Missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}; duplicate: ${duplicate.join(", ") || "none"}`,
          "The action lock is a complete one-to-one record of approved action pins"
        ),
      ];
};

const exactPermissions = (
  permissions: Mapping | undefined,
  expected: Readonly<Record<string, string>>
) =>
  !!permissions &&
  Object.keys(permissions).length === Object.keys(expected).length &&
  Object.entries(expected).every(([key, value]) => permissions[key] === value);

const ciFindings = (
  workflow: AuthorityWorkflow
): readonly AuthorityFinding[] => {
  const permissions = readMapping(workflow.document, "permissions");
  const concurrency = readMapping(workflow.document, "concurrency");
  const { content } = workflow;
  const issues: AuthorityFinding[] = [];
  if (!exactPermissions(permissions, { contents: "read" })) {
    issues.push(
      finding(
        "AUTH-CI-PERMISSIONS",
        "CI has contents-read authority only and no secret or id-token access",
        workflow.path,
        "Set root permissions to exactly contents: read",
        "CI permissions are widened, missing, or not exact",
        "CI can read repository contents and nothing else"
      )
    );
  }
  if (concurrency?.["cancel-in-progress"] !== true) {
    issues.push(
      finding(
        "AUTH-CI-CONCURRENCY",
        "CI cancels stale runs",
        workflow.path,
        "Set concurrency.cancel-in-progress: true",
        `Observed cancellation policy: ${String(concurrency?.["cancel-in-progress"])}`,
        "A newer CI run cancels stale work"
      )
    );
  }
  if (!/github\.repository\s*==\s*['"]crcorbett\/bundjil['"]/.test(content)) {
    issues.push(
      finding(
        "AUTH-CI-TARGET",
        "CI is scoped to the exact repository",
        workflow.path,
        "Gate the CI job with github.repository == 'crcorbett/bundjil'",
        "The exact repository target gate is absent",
        "CI runs only for the intended repository target"
      )
    );
  }
  if (/\b(?:secrets|id-token)\b/i.test(content)) {
    issues.push(
      finding(
        "AUTH-CI-SECRET-SCOPE",
        "CI does not request secret or OpenID token authority",
        workflow.path,
        "Remove secret and id-token references from CI",
        "CI workflow mentions a prohibited secret or id-token scope",
        "CI has no secret or id-token capability"
      )
    );
  }
  return issues;
};

const releaseFindings = (
  workflow: AuthorityWorkflow
): readonly AuthorityFinding[] => {
  const permissions = readMapping(workflow.document, "permissions");
  const concurrency = readMapping(workflow.document, "concurrency");
  const trigger = readMapping(readMapping(workflow.document, "on"), "push");
  const branches = trigger?.["branches"];
  const mainOnly =
    Array.isArray(branches) && branches.length === 1 && branches[0] === "main";
  const { content } = workflow;
  const issues: AuthorityFinding[] = [];
  if (!mainOnly) {
    issues.push(
      finding(
        "AUTH-RELEASE-TARGET",
        "Release automation targets the repository main branch only",
        workflow.path,
        "Set on.push.branches to exactly [main]",
        "Release trigger is not an exact main-branch target",
        "Only pushes to main can create a version PR"
      )
    );
  }
  if (
    !/github\.repository\s*==\s*['"]crcorbett\/bundjil['"]/.test(content) ||
    !/github\.ref\s*==\s*['"]refs\/heads\/main['"]/.test(content)
  ) {
    issues.push(
      finding(
        "AUTH-RELEASE-JOB-TARGET",
        "Release writer is gated to the exact repository and main ref",
        workflow.path,
        "Gate the release job to crcorbett/bundjil and refs/heads/main",
        "The exact repository/ref job gate is absent",
        "Only the intended repository main ref can reach the release writer"
      )
    );
  }
  if (
    !/vars\.BUNDJIL_RELEASE_AUTHORITY_EPOCH\s*==\s*['"]hgi-304-v1['"]/.test(
      content
    )
  ) {
    issues.push(
      finding(
        "AUTH-RELEASE-EPOCH",
        "Release automation requires the exact HGI-304 authority epoch gate",
        workflow.path,
        "Gate the release job with vars.BUNDJIL_RELEASE_AUTHORITY_EPOCH == 'hgi-304-v1'",
        "The exact release authority epoch gate is absent",
        "Release remains disabled until the approved authority epoch is present"
      )
    );
  }
  if (
    !exactPermissions(permissions, {
      contents: "write",
      "pull-requests": "write",
    })
  ) {
    issues.push(
      finding(
        "AUTH-RELEASE-PERMISSIONS",
        "Release has only contents and pull-requests write authority",
        workflow.path,
        "Set root permissions to exactly contents: write and pull-requests: write",
        "Release permissions are missing, widened, or incomplete",
        "Release has only version-PR authority"
      )
    );
  }
  if (concurrency?.["cancel-in-progress"] !== false) {
    issues.push(
      finding(
        "AUTH-RELEASE-CONCURRENCY",
        "Release runs are serialized and never cancelled mid-flight",
        workflow.path,
        "Set concurrency.cancel-in-progress: false",
        `Observed cancellation policy: ${String(concurrency?.["cancel-in-progress"])}`,
        "Release runs serialize without cancellation"
      )
    );
  }
  if (!/persist-credentials:\s*false/.test(content)) {
    issues.push(
      finding(
        "AUTH-RELEASE-CREDENTIALS",
        "Release checkout does not persist credentials",
        workflow.path,
        "Set actions/checkout persist-credentials: false",
        "Checkout credential persistence is not explicitly disabled",
        "Checkout credentials are not persisted"
      )
    );
  }
  if (/\b(?:npm|pnpm|bun|changeset)\s+publish\b/i.test(content)) {
    issues.push(
      finding(
        "AUTH-RELEASE-PUBLISH",
        "Release workflow creates version PRs and does not publish packages",
        workflow.path,
        "Remove publish commands; retain only the version-PR action",
        "A package publish command was found",
        "Release creates a version PR without publishing"
      )
    );
  }
  return issues;
};

const claudeFindings = (
  workflow: AuthorityWorkflow
): readonly AuthorityFinding[] => {
  const permissions = readMapping(workflow.document, "permissions");
  const concurrency = readMapping(workflow.document, "concurrency");
  const { content } = workflow;
  const expectedPermissions = {
    contents: "read",
    "id-token": "write",
    issues: "read",
    "pull-requests": "read",
  };
  const issues: AuthorityFinding[] = [];
  if (!exactPermissions(permissions, expectedPermissions)) {
    issues.push(
      finding(
        "AUTH-CLAUDE-PERMISSIONS",
        "Interactive Claude has read permissions plus id-token only",
        workflow.path,
        "Set the exact contents, issues, pull-requests read and id-token write permissions",
        "Claude permissions are missing, widened, or not exact",
        "Claude retains only its approved read-oriented authority"
      )
    );
  }
  if (concurrency?.["cancel-in-progress"] !== true) {
    issues.push(
      finding(
        "AUTH-CLAUDE-CONCURRENCY",
        "Interactive Claude work is bounded and superseded runs cancel",
        workflow.path,
        "Set a concurrency group with cancel-in-progress: true",
        `Observed cancellation policy: ${String(concurrency?.["cancel-in-progress"])}`,
        "A newer approved interaction cancels stale work"
      )
    );
  }
  if (!/github\.actor\s*==\s*['"]crcorbett['"]/.test(content)) {
    issues.push(
      finding(
        "AUTH-CLAUDE-ACTOR",
        "Interactive Claude is gated to the exact repository owner actor",
        workflow.path,
        "Gate the job with github.actor == 'crcorbett'",
        "The exact owner actor gate is absent",
        "Only the approved owner can invoke the interaction"
      )
    );
  }
  if (
    !/startsWith\(github\.event\.comment\.body,\s*['"]@claude['"]\)/.test(
      content
    )
  ) {
    issues.push(
      finding(
        "AUTH-CLAUDE-DIRECT-INVOCATION",
        "Interactive Claude accepts only an owner comment beginning exactly with @claude",
        workflow.path,
        "Gate the job with startsWith(github.event.comment.body, '@claude')",
        "The exact direct-invocation gate is absent or uses a looser lexical match",
        "Quoted, forwarded, indirect, embedded, and third-party mentions do not start the workflow"
      )
    );
  }
  if (!/--allowedTools[=:][^\n]*(?:Read|Glob|Grep)/.test(content)) {
    issues.push(
      finding(
        "AUTH-CLAUDE-TOOLS",
        "Interactive Claude declares explicit read-only tools",
        workflow.path,
        "Declare a read-only --allowedTools list such as Read,Glob,Grep",
        "No explicit read-only allowed-tools declaration was found",
        "Claude has an explicit read-only tool set"
      )
    );
  }
  if (
    /\b(?:git\s+push|deploy|release|approve|resume|gh\s+pr\s+comment|Bash\s*\()/i.test(
      content
    )
  ) {
    issues.push(
      finding(
        "AUTH-CLAUDE-MUTATION",
        "Interactive Claude does not contain shell or operational mutation paths",
        workflow.path,
        "Remove deploy, release, approval, resume, comment, push, and shell mutation paths",
        "A prohibited mutation-oriented command or tool was found",
        "Claude interaction remains read-only and non-operational"
      )
    );
  }
  if (/pull_request_review|pull_request_target|schedule:/i.test(content)) {
    issues.push(
      finding(
        "AUTH-CLAUDE-CONVERGENCE",
        "Claude review is interactive and has no autonomous repeated review loop",
        workflow.path,
        "Remove automatic review triggers and retain one explicit interaction trigger",
        "An automatic or repeated review trigger was found",
        "Claude work starts only from a bounded owner interaction"
      )
    );
  }
  return issues;
};

const workflowFindings = (
  workflow: AuthorityWorkflow,
  lock: GitHubActionsLock
): readonly AuthorityFinding[] => {
  const common = [
    ...timeoutFindings(workflow),
    ...explicitControlFindings(workflow),
    ...pinFindings(workflow, lock),
  ];
  switch (workflow.path) {
    case ".github/workflows/ci.yml": {
      return [...common, ...ciFindings(workflow)];
    }
    case ".github/workflows/release.yml": {
      return [...common, ...releaseFindings(workflow)];
    }
    case ".github/workflows/claude.yml": {
      return [...common, ...claudeFindings(workflow)];
    }
    default: {
      return common;
    }
  }
};

const authorityFindings = (
  register: AuthorityRegister
): readonly AuthorityFinding[] => {
  const ids = register.records.map((record) => record.id);
  const required = new Set<string>(requiredAuthorityIds);
  const unexpected = ids.filter((id) => !required.has(id));
  const missing = requiredAuthorityIds.filter((id) => !ids.includes(id));
  const duplicate = ids.filter((id, index) => ids.indexOf(id) !== index);
  const coverage = missing.length || unexpected.length || duplicate.length;
  const coverageIssues = coverage
    ? [
        finding(
          "AUTH-REGISTER-COVERAGE",
          "Authority register exactly covers every workflow, provider, and interaction surface",
          "docs/operations/authority-register.json",
          "Keep exactly the required HGI-304 authority record IDs and no extras",
          `Missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}; duplicate: ${duplicate.join(", ") || "none"}`,
          "Every required authority surface has one complete durable envelope"
        ),
      ]
    : [];
  const semanticIssues = register.records.flatMap((record) => {
    const text = JSON.stringify(record);
    const issues: AuthorityFinding[] = [];
    const requiredRecord = requiredAuthorityRecordById.get(record.id);
    if (
      requiredRecord &&
      (record.status !== requiredRecord.status ||
        record.surface !== requiredRecord.surface ||
        record.target !== requiredRecord.target)
    ) {
      issues.push(
        finding(
          "AUTH-REGISTER-CONTRACT",
          "Every authority record preserves its accepted identity, surface, target, and static admission state",
          `docs/operations/authority-register.json#${record.id}`,
          `Restore surface ${requiredRecord.surface}, target ${requiredRecord.target}, and status ${requiredRecord.status}`,
          `Observed surface ${record.surface}, target ${record.target}, status ${record.status}`,
          "All 15 authority surfaces retain their accepted static classification"
        )
      );
    }
    if (
      record.readback.availability === "unavailable" &&
      record.readback.outcome !== "inconclusive"
    ) {
      issues.push(
        finding(
          "AUTH-READBACK-INCONCLUSIVE",
          "Unavailable readback is recorded as inconclusive, never healthy",
          `docs/operations/authority-register.json#${record.id}`,
          "Set unavailable readback outcome to inconclusive and name the evidence gap",
          "Unavailable readback was treated as verified",
          "The record makes no health claim without an available readback"
        )
      );
    }
    if (
      /(?:bearer\s+[a-z0-9._-]{12,}|(?:api[_-]?key|token|secret)\s*[:=]\s*[^\s]+)/i.test(
        text
      )
    ) {
      issues.push(
        finding(
          "AUTH-REGISTER-SECRET",
          "Authority records name secret owners without embedding secret values",
          `docs/operations/authority-register.json#${record.id}`,
          "Remove the secret-shaped value and retain only the owning secret reference",
          "Record contains a secret-shaped value",
          "The authority record contains no credential material"
        )
      );
    }
    if (
      /tool (?:output|response).*authori[sz]|preflight.*authori[sz]/i.test(text)
    ) {
      issues.push(
        finding(
          "AUTH-TOOL-DERIVED",
          "Tool output and preflight results are observations, not authority grants",
          `docs/operations/authority-register.json#${record.id}`,
          "Name the human approval boundary and treat tool output as evidence only",
          "Record derives authority from a tool response or preflight",
          "Authority derives from the recorded approval boundary only"
        )
      );
    }
    return issues;
  });
  return [...coverageIssues, ...semanticIssues];
};

const containmentFindings = (
  register: AuthorityRegister
): readonly AuthorityFinding[] => {
  const containment = register.emergencyContainment;
  const joined = [
    ...containment.allowedOperations,
    ...containment.forbiddenOperations,
    containment.nonClaim,
    containment.durationRevocation,
  ].join(" ");
  const unsafeNormalOperation =
    /normal operation/i.test(joined) &&
    !/not normal operation|non-normal-operation/i.test(joined);
  const missingForbidden = containment.forbiddenOperations.length === 0;
  const missingAllowed = containment.allowedOperations.length === 0;
  return unsafeNormalOperation || missingAllowed || missingForbidden
    ? [
        finding(
          "AUTH-BREAK-GLASS-BOUNDARY",
          "Emergency containment is a constrained exception, never normal operation",
          "docs/operations/authority-register.json#emergencyContainment",
          "Name one-shot exact-target containment operations, forbidden normal operations, and reconciliation",
          `Allowed operations: ${containment.allowedOperations.length}; forbidden operations: ${containment.forbiddenOperations.length}; normal-operation claim: ${unsafeNormalOperation}`,
          "Emergency containment remains time-bounded, approved, receipted, and reconciled"
        ),
      ]
    : [];
};

const automationRegisterFindings = (
  content: string
): readonly AuthorityFinding[] => {
  const required = [
    "one-shot",
    "time-bounded",
    "exact-target",
    "non-normal-operation",
    "approval",
    "receipt",
    "reconciliation",
  ];
  const missing = required.filter(
    (term) => !content.toLowerCase().includes(term)
  );
  return missing.length === 0
    ? []
    : [
        finding(
          "AUTH-BREAK-GLASS",
          "Emergency containment is one-shot, time-bounded, exact-target, approved, receipted, and reconciled",
          "docs/operations/automation-register.md",
          `Document the missing containment bounds: ${missing.join(", ")}`,
          `Missing required terms: ${missing.join(", ")}`,
          "Emergency containment cannot become normal operation"
        ),
      ];
};

export const auditAuthority = (
  snapshot: AuthoritySnapshot,
  options: AuthorityPolicyOptions
): AuthorityPolicyReport => {
  const findings = [
    ...inventoryFindings(snapshot),
    ...lockInventoryFindings(snapshot.githubActionsLock),
    ...snapshot.workflows.flatMap((workflow) =>
      workflowFindings(workflow, snapshot.githubActionsLock)
    ),
    ...authorityFindings(snapshot.authorityRegister),
    ...containmentFindings(snapshot.authorityRegister),
    ...automationRegisterFindings(snapshot.automationRegister),
  ].toSorted((left, right) =>
    `${left.code}:${left.target}`.localeCompare(`${right.code}:${right.target}`)
  );
  const shownFindings = Math.min(findings.length, options.maxFindings);
  return {
    checkedWorkflows: snapshot.workflows.length,
    detailPath: options.detailPath,
    findings,
    generatedAt: options.generatedAt,
    ok: findings.length === 0,
    omittedFindings: findings.length - shownFindings,
    schemaVersion: 1,
    shownFindings,
  };
};

export const boundedAuthorityFindings = (report: AuthorityPolicyReport) =>
  report.findings.slice(0, report.shownFindings);

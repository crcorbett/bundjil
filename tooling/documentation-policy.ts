import { posix } from "node:path";

import { Result, Schema } from "effect";

export interface DocumentationFile {
  readonly content: string;
  readonly path: string;
}

export interface DocumentationManifest {
  readonly name: string;
  readonly path: string;
  readonly scripts: Readonly<Record<string, string>>;
}

export interface CurrentOwnerRule {
  readonly claimType: string;
  readonly id: string;
  readonly nonClaimTerms: readonly string[];
  readonly ownerPaths: readonly string[];
  readonly requiredTermGroups: readonly (readonly string[])[];
  readonly repairHint: string;
}

export interface CurrentOwnerPolicy {
  readonly acceptedTaskStates: Readonly<Record<string, string>>;
  readonly nonterminalTaskTerms: readonly string[];
  readonly owners: readonly string[];
  readonly rules: readonly CurrentOwnerRule[];
  readonly taskStateOwnerPaths: readonly string[];
  readonly schemaVersion: number;
}

export interface DocumentationSnapshot {
  readonly files: readonly DocumentationFile[];
  readonly manifests: readonly DocumentationManifest[];
  readonly ownerPolicy: CurrentOwnerPolicy;
  readonly repositoryPaths: readonly string[];
}

export const DocumentationFinding = Schema.Struct({
  code: Schema.NonEmptyString,
  detail: Schema.NonEmptyString,
  invariant: Schema.NonEmptyString,
  owner: Schema.NonEmptyString,
  repairHint: Schema.NonEmptyString,
  target: Schema.NonEmptyString,
});
export type DocumentationFinding = typeof DocumentationFinding.Type;

export const DocumentationPolicyReport = Schema.Struct({
  checkedFiles: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  detailPath: Schema.NonEmptyString,
  findings: Schema.Array(DocumentationFinding),
  generatedAt: Schema.NonEmptyString,
  omittedFindings: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  ok: Schema.Boolean,
  schemaVersion: Schema.Literal(1),
  shownFindings: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
});
export type DocumentationPolicyReport = typeof DocumentationPolicyReport.Type;

export const DocumentationPolicyReportJson = Schema.fromJsonString(
  DocumentationPolicyReport
);
const OccurrenceControlDecisionJson = Schema.fromJsonString(
  Schema.Struct({
    acceptedOrDefaultBehavior: Schema.String,
    state: Schema.String,
  })
);

export interface DocumentationPolicyOptions {
  readonly detailPath: string;
  readonly generatedAt: string;
  readonly maxFindings: number;
}

type Frontmatter = Readonly<Record<string, string>>;

const lifecycleValues = new Set([
  "active",
  "archived",
  "current",
  "evidence",
  "failed",
  "historical",
  "implemented",
  "inconclusive",
  "proposed",
  "reference",
  "superseded",
  "tombstone",
]);
const authorityValues = new Set([
  "canonical",
  "external",
  "generated",
  "supporting",
]);

const finding = (
  code: string,
  invariant: string,
  owner: string,
  target: string,
  repairHint: string,
  detail: string
): DocumentationFinding => ({
  code,
  detail,
  invariant,
  owner,
  repairHint,
  target,
});

const parseFrontmatter = (file: DocumentationFile): Frontmatter | undefined => {
  if (!file.content.startsWith("---\n")) {
    return undefined;
  }
  const end = file.content.indexOf("\n---\n", 4);
  if (end === -1) {
    return undefined;
  }
  return Object.fromEntries(
    file.content
      .slice(4, end)
      .split("\n")
      .flatMap((line) => {
        const separator = line.indexOf(":");
        if (separator < 1) {
          return [];
        }
        return [
          [
            line.slice(0, separator).trim(),
            line
              .slice(separator + 1)
              .trim()
              .replaceAll(/^['"]|['"]$/g, ""),
          ] as const,
        ];
      })
  );
};

const isCurrentMetadataOwner = (path: string) =>
  path === "ARCHITECTURE.md" ||
  path === "docs/README.md" ||
  path === "docs/documentation-audit/README.md" ||
  path === "docs/operations/authority-model.md" ||
  path === "docs/product-specs/index.md" ||
  path === "docs/product-specs/harness-governance-documentation.md" ||
  /^docs\/architecture\/(?!legacy-atlas\.md$).+\.md$/.test(path) ||
  /^docs\/exec-plans\/active\/.+\.md$/.test(path) ||
  path === "docs/exec-plans/completed/README.md" ||
  /^apps\/(agent|codex-proxy)\/runbooks\/.+\.md$/.test(path);

const validDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
};

const metadataFindings = (
  files: readonly DocumentationFile[]
): readonly DocumentationFinding[] =>
  files
    .filter((file) => isCurrentMetadataOwner(file.path))
    .flatMap((file) => {
      const metadata = parseFrontmatter(file);
      if (!metadata) {
        return [
          finding(
            "DOC-METADATA",
            "Current maintainer documents declare lifecycle and authority metadata",
            "bundjil-documentation-owner",
            file.path,
            "Add the frontmatter contract routed by docs/README.md",
            "No complete frontmatter block was found"
          ),
        ];
      }
      const required = [
        "document_type",
        "lifecycle",
        "authority",
        "owner",
        "last_reviewed",
      ];
      const missing = required.filter((key) => !metadata[key]);
      const { authority } = metadata;
      const lastReviewed = metadata["last_reviewed"];
      const { lifecycle } = metadata;
      const owner = metadata["owner"] ?? "bundjil-documentation-owner";
      const reviewTrigger = metadata["review_trigger"];
      const issues: DocumentationFinding[] = missing.length
        ? [
            finding(
              "DOC-METADATA",
              "Current maintainer documents declare complete metadata",
              owner,
              file.path,
              `Add the missing fields: ${missing.join(", ")}`,
              `Missing metadata: ${missing.join(", ")}`
            ),
          ]
        : [];
      if (lifecycle && !lifecycleValues.has(lifecycle)) {
        issues.push(
          finding(
            "DOC-METADATA-VALUE",
            "Lifecycle metadata uses the repository vocabulary",
            owner,
            file.path,
            "Use a lifecycle value defined by docs/README.md",
            `Unknown lifecycle ${lifecycle}`
          )
        );
      }
      if (authority && !authorityValues.has(authority)) {
        issues.push(
          finding(
            "DOC-METADATA-VALUE",
            "Authority metadata uses the repository vocabulary",
            owner,
            file.path,
            "Use an authority value defined by docs/README.md",
            `Unknown authority ${authority}`
          )
        );
      }
      if (lastReviewed && !validDate(lastReviewed)) {
        issues.push(
          finding(
            "DOC-METADATA-VALUE",
            "Review dates are real YYYY-MM-DD dates",
            owner,
            file.path,
            "Correct last_reviewed to a real calendar date",
            `Invalid review date ${lastReviewed}`
          )
        );
      }
      if (["active", "current"].includes(lifecycle ?? "") && !reviewTrigger) {
        issues.push(
          finding(
            "DOC-METADATA-VALUE",
            "Current documentation declares a material-change review trigger",
            owner,
            file.path,
            "Add a concrete review_trigger",
            `${lifecycle} document has no review_trigger`
          )
        );
      }
      return issues;
    });

const stripCodeFences = (content: string) =>
  content.replaceAll(/```[\s\S]*?```/g, "");

const linkFindings = (
  files: readonly DocumentationFile[],
  repositoryPaths: readonly string[]
): readonly DocumentationFinding[] => {
  const paths = new Set(repositoryPaths);
  return files.flatMap((file) => {
    if (!file.path.endsWith(".md")) {
      return [];
    }
    const issues: DocumentationFinding[] = [];
    for (const match of stripCodeFences(file.content).matchAll(
      /(?<!!)\[[^\]]*\]\(([^)]+)\)/g
    )) {
      const raw = match[1]?.trim() ?? "";
      const target = raw.split(/[?#]/)[0] ?? "";
      if (
        !target ||
        target.startsWith("#") ||
        target.startsWith("/") ||
        /^[a-z]+:/i.test(target) ||
        target.includes("<")
      ) {
        continue;
      }
      const resolved = posix
        .normalize(posix.join(posix.dirname(file.path), target))
        .replace(/\/$/, "");
      const exists =
        paths.has(resolved) ||
        repositoryPaths.some((path) => path.startsWith(`${resolved}/`));
      if (!exists) {
        issues.push(
          finding(
            "DOC-LINK",
            "Repository-relative Markdown links resolve",
            "bundjil-documentation-owner",
            file.path,
            "Correct the target or restore the documented owner",
            `${raw} resolves to missing ${resolved}`
          )
        );
      }
    }
    return issues;
  });
};

const indexCoverage = (
  files: readonly DocumentationFile[],
  indexPath: string,
  memberPattern: RegExp,
  label: string
): readonly DocumentationFinding[] => {
  const index = files.find((file) => file.path === indexPath);
  if (!index) {
    return [
      finding(
        "DOC-INDEX",
        `${label} has one canonical index`,
        "bundjil-documentation-owner",
        indexPath,
        "Restore the canonical index",
        "Index is missing"
      ),
    ];
  }
  return files
    .filter((file) => memberPattern.test(file.path))
    .flatMap((file) => {
      const relative = posix.relative(posix.dirname(indexPath), file.path);
      const occurrences = [
        ...index.content.matchAll(/\]\(([^)#?]+)(?:[?#][^)]*)?\)/g),
      ].filter((match) => posix.normalize(match[1] ?? "") === relative).length;
      return occurrences === 1
        ? []
        : [
            finding(
              "DOC-INDEX",
              `${label} classifies every retained member exactly once`,
              "bundjil-documentation-owner",
              file.path,
              `Add one exact ${relative} link to ${indexPath}`,
              `${relative} appears ${occurrences} times in ${indexPath}`
            ),
          ];
    });
};

const lifecycleFindings = (
  files: readonly DocumentationFile[]
): readonly DocumentationFinding[] =>
  files
    .filter(
      (file) =>
        /^docs\/exec-plans\/active\/.+\.md$/.test(file.path) &&
        !file.path.endsWith("/README.md")
    )
    .flatMap((file) => {
      const lifecycle = parseFrontmatter(file)?.["lifecycle"] ?? "missing";
      return ["active", "current", "proposed"].includes(lifecycle)
        ? []
        : [
            finding(
              "DOC-ACTIVE-LIFECYCLE",
              "The active route contains only current implementation intent",
              "bundjil-product-owner",
              file.path,
              "Move terminal work to completed and update both indexes",
              `Active plan declares lifecycle ${lifecycle}`
            ),
          ];
    });

const successorFindings = (
  files: readonly DocumentationFile[],
  repositoryPaths: readonly string[]
): readonly DocumentationFinding[] => {
  const paths = new Set(repositoryPaths);
  return files.flatMap((file) => {
    const metadata = parseFrontmatter(file);
    if (
      !metadata ||
      !["superseded", "tombstone"].includes(metadata["lifecycle"] ?? "")
    ) {
      return [];
    }
    const { successor } = metadata;
    const owner = metadata["owner"] ?? "bundjil-documentation-owner";
    let resolved = "";
    if (successor) {
      resolved =
        successor.startsWith("./") || successor.startsWith("../")
          ? posix.normalize(posix.join(posix.dirname(file.path), successor))
          : successor;
    }
    const issues: DocumentationFinding[] = [];
    if (!successor || !paths.has(resolved)) {
      issues.push(
        finding(
          "DOC-SUCCESSOR",
          "Superseded and tombstone routes name a resolvable successor",
          owner,
          file.path,
          "Add a repository-relative successor pointing to the current owner",
          successor
            ? `Missing successor ${resolved}`
            : "No successor is declared"
        )
      );
    }
    if (!(metadata["superseded_reason"] || metadata["successor_reason"])) {
      issues.push(
        finding(
          "DOC-SUCCESSOR",
          "Superseded and tombstone routes explain the ownership transition",
          owner,
          file.path,
          "Add superseded_reason or successor_reason",
          "No transition reason is declared"
        )
      );
    }
    return issues;
  });
};

const readmeFindings = (
  snapshot: DocumentationSnapshot
): readonly DocumentationFinding[] => {
  const paths = new Set(snapshot.repositoryPaths);
  return snapshot.manifests.flatMap((manifest) => {
    if (!/^(apps|packages)\/[^/]+\/package\.json$/.test(manifest.path)) {
      return [];
    }
    const readme = manifest.path.replace(/package\.json$/, "README.md");
    return paths.has(readme)
      ? []
      : [
          finding(
            "DOC-PACKAGE-README",
            "Every app and package has a sibling README owner",
            manifest.name,
            manifest.path,
            `Create ${readme} with purpose, public boundary, and commands`,
            `${readme} is missing`
          ),
        ];
  });
};

const commandFindings = (
  snapshot: DocumentationSnapshot
): readonly DocumentationFinding[] => {
  const root = snapshot.manifests.find(
    (manifest) => manifest.path === "package.json"
  );
  return snapshot.files.flatMap((file) => {
    if (
      !snapshot.ownerPolicy.owners.includes(file.path) &&
      !/^(apps|packages)\/[^/]+\/README\.md$/.test(file.path) &&
      !/^apps\/(agent|codex-proxy)\/runbooks\/.+\.md$/.test(file.path) &&
      !/^\.agents\/skills\/(effect-client-wrapper|package-structure|prd-implementer|prd-review|prd-writer)\/SKILL\.md$/.test(
        file.path
      )
    ) {
      return [];
    }
    const issues: DocumentationFinding[] = [];
    for (const match of file.content.matchAll(
      /\bbun run (?!--filter\b)([a-zA-Z0-9:_-]+)/g
    )) {
      const command = match[1] ?? "";
      if (!root?.scripts[command]) {
        issues.push(
          finding(
            "DOC-COMMAND",
            "Documented root Bun commands resolve to package.json scripts",
            root?.name ?? "bundjil-root",
            file.path,
            "Correct the command or add it to the owning manifest",
            `bun run ${command} is absent from package.json`
          )
        );
      }
    }
    for (const match of file.content.matchAll(
      /\bbun run --filter ([^\s`]+) ([a-zA-Z0-9:_-]+)/g
    )) {
      const packageName = match[1] ?? "";
      const command = match[2] ?? "";
      const owner = snapshot.manifests.find(
        (manifest) => manifest.name === packageName
      );
      if (!owner?.scripts[command]) {
        issues.push(
          finding(
            "DOC-COMMAND",
            "Filtered Bun commands resolve to an owning workspace script",
            packageName,
            file.path,
            "Correct the package/script pair or add the script to its manifest",
            owner
              ? `${command} is absent from ${owner.path}`
              : `${packageName} is not a workspace manifest name`
          )
        );
      }
    }
    return issues;
  });
};

const portabilityFindings = (
  snapshot: DocumentationSnapshot
): readonly DocumentationFinding[] =>
  snapshot.files
    .filter(
      (file) =>
        snapshot.ownerPolicy.owners.includes(file.path) ||
        /^\.agents\/skills\/.+\.md$/.test(file.path) ||
        /^apps\/(agent|codex-proxy)\/runbooks\/.+\.md$/.test(file.path)
    )
    .flatMap((file) =>
      (file.content.match(/\/Users\/[^/\s]+\//g) ?? []).map((value) =>
        finding(
          "DOC-PORTABILITY",
          "Current documentation and skills avoid personal absolute paths",
          "bundjil-documentation-owner",
          file.path,
          "Use repository-relative paths or a named environment input",
          `Found personal path prefix ${value}`
        )
      )
    );

const semanticSegments = (content: string) =>
  content
    .replace(/^---\n[\s\S]*?\n---\n/u, "")
    .replaceAll(/```[\s\S]*?```/g, "")
    .split(/\n|(?<=[.!?;])\s+/u)
    .map((segment) =>
      segment
        .toLocaleLowerCase("en")
        .replaceAll(/[`*_]/g, "")
        .replaceAll(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

const missingOwnerFindings = (
  files: ReadonlyMap<string, string>,
  policy: CurrentOwnerPolicy
): readonly DocumentationFinding[] =>
  policy.owners.flatMap((owner) =>
    files.has(owner)
      ? []
      : [
          finding(
            "DOC-OWNER",
            "Every declared current semantic owner exists",
            "bundjil-documentation-owner",
            owner,
            "Restore the owner or update the checked-in owner policy",
            "Declared current owner is missing"
          ),
        ]
  );

const semanticClaimFindings = (
  files: ReadonlyMap<string, string>,
  policy: CurrentOwnerPolicy
): readonly DocumentationFinding[] =>
  policy.rules.flatMap((rule) =>
    rule.ownerPaths.flatMap((owner) => {
      const content = files.get(owner);
      if (content === undefined) {
        return [];
      }
      return semanticSegments(content).flatMap((segment) => {
        const statesClaim = rule.requiredTermGroups.every((terms) =>
          terms.some((term) => segment.includes(term.toLocaleLowerCase("en")))
        );
        const isNonClaim = rule.nonClaimTerms.some((term) =>
          segment.includes(term.toLocaleLowerCase("en"))
        );
        return statesClaim && !isNonClaim
          ? [
              finding(
                "DOC-CONTRADICTION",
                "Current semantic owners contain no prohibited claim shape",
                rule.id,
                owner,
                rule.repairHint,
                `claimType=${rule.claimType}; statement=${segment}`
              ),
            ]
          : [];
      });
    })
  );

const taskStateSegmentFindings = (
  segment: string,
  owner: string,
  policy: CurrentOwnerPolicy
): readonly DocumentationFinding[] => {
  const mentions = [...segment.matchAll(/\bhgi-\d{3}\b/giu)];
  return mentions.flatMap((mention, index) => {
    const taskId = mention[0]?.toLocaleUpperCase("en") ?? "";
    const acceptedState = policy.acceptedTaskStates[taskId];
    if (!acceptedState || mention.index === undefined) {
      return [];
    }
    const nextIndex = mentions[index + 1]?.index ?? segment.length;
    const taskClaim = segment.slice(mention.index, nextIndex);
    if (taskClaim.includes(acceptedState.toLocaleLowerCase("en"))) {
      return [];
    }
    const nonterminal = policy.nonterminalTaskTerms.find((term) =>
      taskClaim.includes(term.toLocaleLowerCase("en"))
    );
    return nonterminal
      ? [
          finding(
            "DOC-TASK-STATE-CONTRADICTION",
            "Accepted task state claims agree with their validation receipts",
            taskId,
            owner,
            `Describe ${taskId} as ${acceptedState} or remove the stale state claim`,
            `Expected ${acceptedState}; statement uses ${nonterminal}: ${taskClaim}`
          ),
        ]
      : [];
  });
};

const taskStateFindings = (
  files: ReadonlyMap<string, string>,
  policy: CurrentOwnerPolicy
): readonly DocumentationFinding[] =>
  policy.taskStateOwnerPaths.flatMap((owner) => {
    const content = files.get(owner);
    return content === undefined
      ? []
      : semanticSegments(content).flatMap((segment) =>
          taskStateSegmentFindings(segment, owner, policy)
        );
  });

const contradictionFindings = (
  snapshot: DocumentationSnapshot
): readonly DocumentationFinding[] => {
  const files = new Map(
    snapshot.files.map((file) => [file.path, file.content])
  );
  return [
    ...missingOwnerFindings(files, snapshot.ownerPolicy),
    ...semanticClaimFindings(files, snapshot.ownerPolicy),
    ...taskStateFindings(files, snapshot.ownerPolicy),
  ];
};

const occurrenceControlFindings = (
  files: readonly DocumentationFile[]
): readonly DocumentationFinding[] => {
  const path =
    "docs/documentation-audit/HGI-308-boundary-exceptions.decision.json";
  const file = files.find((candidate) => candidate.path === path);
  if (!file) {
    return [
      finding(
        "DOC-CONTROL-DECISION",
        "HGI-302 preserves the accepted occurrence-control decision",
        "bundjil-tooling-owner",
        path,
        "Restore the accepted HGI-308 decision record",
        "Decision record is missing"
      ),
    ];
  }
  const decoded = Schema.decodeUnknownResult(OccurrenceControlDecisionJson)(
    file.content
  );
  if (Result.isFailure(decoded)) {
    return [
      finding(
        "DOC-CONTROL-DECISION",
        "The occurrence-control decision remains valid JSON",
        "bundjil-tooling-owner",
        path,
        "Repair the decision record without weakening its accepted behavior",
        String(decoded.failure)
      ),
    ];
  }
  const record = decoded.success;
  const required = [
    "exact match",
    "duplicate rejection",
    "occurrence isolation",
    "stale-entry detection",
  ];
  const missing = required.filter(
    (fragment) => !record.acceptedOrDefaultBehavior.includes(fragment)
  );
  if (record.state !== "accepted" || missing.length > 0) {
    return [
      finding(
        "DOC-CONTROL-DECISION",
        "Occurrence controls retain the accepted equivalence bar",
        "bundjil-tooling-owner",
        path,
        "Restore accepted state and all four equivalence properties",
        `state=${record.state}; missing=${missing.join(", ") || "none"}`
      ),
    ];
  }
  return [];
};

const requiredRunbookPaths = [
  "apps/agent/runbooks/local-development.md",
  "apps/agent/runbooks/deploy-promote.md",
  "apps/agent/runbooks/executor.md",
  "apps/agent/runbooks/sendblue.md",
  "apps/agent/runbooks/incident-revocation.md",
  "apps/codex-proxy/runbooks/local-auth.md",
  "apps/codex-proxy/runbooks/preview-proof.md",
  "apps/codex-proxy/runbooks/production-proof.md",
  "apps/codex-proxy/runbooks/reauthentication.md",
  "apps/codex-proxy/runbooks/incident-revocation.md",
] as const;

const requiredRunbookRoutePaths = [
  "apps/agent/runbooks/README.md",
  "apps/codex-proxy/runbooks/README.md",
  "docs/operations/authority-model.md",
  ...requiredRunbookPaths,
] as const;

const requiredRunbookHeadings = [
  "## Scope and non-claims",
  "## Preconditions",
  "## Authority envelope",
  "## Inputs and secret handling",
  "## Procedure",
  "## Evidence and postcondition",
  "## Rollback and revocation",
  "## Stop and escalation",
  "## Readback fallback",
  "## Maintenance",
] as const;

const requiredAuthorityTerms = [
  "Identity",
  "Operation",
  "Resource",
  "Environment",
  "Duration/revocation",
  "Approval",
  "Receipt",
] as const;

const hasRunbookRoute = (repositoryPaths: readonly string[]) =>
  repositoryPaths.some(
    (path) =>
      path.startsWith("apps/agent/runbooks/") ||
      path.startsWith("apps/codex-proxy/runbooks/") ||
      path === "docs/operations/authority-model.md"
  );

const missingRunbookRouteFindings = (
  repositoryPaths: readonly string[]
): readonly DocumentationFinding[] => {
  const paths = new Set(repositoryPaths);
  return requiredRunbookRoutePaths.flatMap((path) =>
    paths.has(path)
      ? []
      : [
          finding(
            "DOC-RUNBOOK-INVENTORY",
            "HGI-303 retains two target-owned indexes, ten runbooks, and one durable authority model",
            "bundjil-app-operators",
            path,
            `Restore the required target-owned route ${path}`,
            "Required HGI-303 route is missing"
          ),
        ]
  );
};

const runbookIndexFindings = (
  files: readonly DocumentationFile[]
): readonly DocumentationFinding[] => [
  ...indexCoverage(
    files,
    "apps/agent/runbooks/README.md",
    /^apps\/agent\/runbooks\/(?!README\.md$).+\.md$/,
    "Agent runbook inventory"
  ),
  ...indexCoverage(
    files,
    "apps/codex-proxy/runbooks/README.md",
    /^apps\/codex-proxy\/runbooks\/(?!README\.md$).+\.md$/,
    "Codex proxy runbook inventory"
  ),
];

const runbookStructureFindings = (
  file: DocumentationFile,
  owner: string
): readonly DocumentationFinding[] => {
  const missing = requiredRunbookHeadings.filter(
    (heading) => !file.content.includes(heading)
  );
  return missing.length === 0
    ? []
    : [
        finding(
          "DOC-RUNBOOK-STRUCTURE",
          "Every app runbook carries the complete sequential operating contract",
          owner,
          file.path,
          `Restore the missing sections: ${missing.join(", ")}`,
          `Missing sections: ${missing.join(", ")}`
        ),
      ];
};

const runbookAuthorityFindings = (
  file: DocumentationFile,
  owner: string
): readonly DocumentationFinding[] => {
  const lowered = file.content.toLocaleLowerCase("en");
  const missing: string[] = requiredAuthorityTerms.filter(
    (term) => !lowered.includes(term.toLocaleLowerCase("en"))
  );
  for (const required of [
    "observedAt",
    "inconclusive",
    "never healthy",
  ] as const) {
    if (!file.content.includes(required)) {
      missing.push(required);
    }
  }
  return missing.length === 0
    ? []
    : [
        finding(
          "DOC-RUNBOOK-AUTHORITY",
          "Every app runbook records authority, just-in-time evidence, and unavailable-readback behavior",
          owner,
          file.path,
          `Add the missing authority/readback terms: ${missing.join(", ")}`,
          `Missing terms: ${missing.join(", ")}`
        ),
      ];
};

const runbookMetadataFindings = (
  file: DocumentationFile,
  metadata: Frontmatter | undefined,
  owner: string
): readonly DocumentationFinding[] =>
  metadata?.["document_type"] === "runbook" &&
  metadata["lifecycle"] === "current" &&
  metadata["authority"] === "canonical"
    ? []
    : [
        finding(
          "DOC-RUNBOOK-METADATA",
          "Every operational member is a current canonical runbook with an explicit owner",
          owner,
          file.path,
          "Restore document_type runbook, lifecycle current, authority canonical, owner, and review trigger",
          `document_type=${metadata?.["document_type"] ?? "missing"}; lifecycle=${metadata?.["lifecycle"] ?? "missing"}; authority=${metadata?.["authority"] ?? "missing"}`
        ),
      ];

const runbookSecretFindings = (
  file: DocumentationFile,
  owner: string
): readonly DocumentationFinding[] => {
  const secretAssignment =
    /\b(?:BUNDJIL|UPSTASH|KV|VERCEL|SENDBLUE)_[A-Z0-9_]+\s*=\s*(?!["']?\$|["']?<)[^\s`]+/u.exec(
      file.content
    );
  const bearerLiteral = /\bBearer\s+(?!\$|<|\{)[A-Za-z0-9._~+/-]{12,}/u.exec(
    file.content
  );
  const exposed = secretAssignment?.[0] ?? bearerLiteral?.[0];
  return exposed === undefined
    ? []
    : [
        finding(
          "DOC-RUNBOOK-SECRET",
          "Runbooks name secret inputs without embedding values or bearer material",
          owner,
          file.path,
          "Remove the value and keep only the variable/binding name plus the approved secret-loading route",
          exposed
        ),
      ];
};

const runbookClaimFindings = (
  file: DocumentationFile,
  owner: string
): readonly DocumentationFinding[] => {
  const segments = semanticSegments(file.content);
  const actuality = segments.find((segment) =>
    /\b(?:is|are) (?:currently )?(?:deployed|active|running|ready|operational) (?:in|on|to) (?:production|preview)\b/u.test(
      segment
    )
  );
  const toolAuthority = segments.find((segment) =>
    /\b(?:successful|passing|passed) (?:command|preflight|tool|readback|probe)[^.;]*(?:authorizes|approves|grants|permits)\b/u.test(
      segment
    )
  );
  const unsafeClaim = actuality ?? toolAuthority;
  return unsafeClaim === undefined
    ? []
    : [
        finding(
          "DOC-RUNBOOK-CLAIM",
          "Runbooks do not convert undated provider actuality or tool output into authority",
          owner,
          file.path,
          "Replace the standing claim with a dated target-owned readback, explicit non-claim, and separate approval receipt",
          unsafeClaim
        ),
      ];
};

const runbookMemberFindings = (
  file: DocumentationFile
): readonly DocumentationFinding[] => {
  const metadata = parseFrontmatter(file);
  const owner = metadata?.["owner"] ?? "bundjil-app-operators";
  return [
    ...runbookStructureFindings(file, owner),
    ...runbookAuthorityFindings(file, owner),
    ...runbookMetadataFindings(file, metadata, owner),
    ...runbookSecretFindings(file, owner),
    ...runbookClaimFindings(file, owner),
  ];
};

const competingRunbookOwnerFindings = (
  repositoryPaths: readonly string[]
): readonly DocumentationFinding[] =>
  repositoryPaths.some((path) => path.startsWith("docs/runbooks/"))
    ? [
        finding(
          "DOC-RUNBOOK-OWNER",
          "Agent and proxy operations remain with their target apps",
          "bundjil-documentation-owner",
          "docs/runbooks/",
          "Move the operation to the owning app runbook and retain only durable authority rationale centrally",
          "A competing central runbook path exists"
        ),
      ]
    : [];

const runbookFindings = (
  files: readonly DocumentationFile[],
  repositoryPaths: readonly string[]
): readonly DocumentationFinding[] => {
  if (!hasRunbookRoute(repositoryPaths)) {
    return [];
  }

  const byPath = new Map(files.map((file) => [file.path, file]));
  const memberIssues = requiredRunbookPaths.flatMap((path) => {
    const file = byPath.get(path);
    return file === undefined ? [] : runbookMemberFindings(file);
  });
  return [
    ...missingRunbookRouteFindings(repositoryPaths),
    ...runbookIndexFindings(files),
    ...memberIssues,
    ...competingRunbookOwnerFindings(repositoryPaths),
  ];
};

const compareFindings = (
  left: DocumentationFinding,
  right: DocumentationFinding
) =>
  left.code.localeCompare(right.code) ||
  left.target.localeCompare(right.target) ||
  left.detail.localeCompare(right.detail);

export const auditDocumentation = (
  snapshot: DocumentationSnapshot,
  options: DocumentationPolicyOptions
): DocumentationPolicyReport => {
  const findings = [
    ...metadataFindings(snapshot.files),
    ...linkFindings(snapshot.files, snapshot.repositoryPaths),
    ...indexCoverage(
      snapshot.files,
      "docs/product-specs/index.md",
      /^docs\/product-specs\/(?!index\.md$).+\.md$/,
      "Product-spec inventory"
    ),
    ...indexCoverage(
      snapshot.files,
      "docs/exec-plans/active/README.md",
      /^docs\/exec-plans\/active\/(?!README\.md$).+\.md$/,
      "Active-plan inventory"
    ),
    ...indexCoverage(
      snapshot.files,
      "docs/exec-plans/completed/README.md",
      /^docs\/exec-plans\/completed\/(?!README\.md$).+\.md$/,
      "Completed-plan inventory"
    ),
    ...lifecycleFindings(snapshot.files),
    ...successorFindings(snapshot.files, snapshot.repositoryPaths),
    ...readmeFindings(snapshot),
    ...commandFindings(snapshot),
    ...portabilityFindings(snapshot),
    ...contradictionFindings(snapshot),
    ...occurrenceControlFindings(snapshot.files),
    ...runbookFindings(snapshot.files, snapshot.repositoryPaths),
  ].toSorted(compareFindings);
  const shownFindings = Math.min(options.maxFindings, findings.length);
  return {
    checkedFiles: snapshot.files.length,
    detailPath: options.detailPath,
    findings,
    generatedAt: options.generatedAt,
    omittedFindings: findings.length - shownFindings,
    ok: findings.length === 0,
    schemaVersion: 1,
    shownFindings,
  };
};

export const boundedDocumentationFindings = (
  report: DocumentationPolicyReport
): readonly DocumentationFinding[] =>
  report.findings.slice(0, report.shownFindings).map((issue) => ({
    ...issue,
    detail:
      issue.detail.length <= 240
        ? issue.detail
        : `${issue.detail.slice(0, 239)}…`,
  }));

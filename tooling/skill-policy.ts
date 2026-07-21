import { posix } from "node:path";

import { Result, Schema } from "effect";
import { parse as parseYamlDocument } from "yaml";

export interface SkillFile {
  readonly content: string;
  readonly path: string;
}

export interface SkillLink {
  readonly isSymbolicLink: boolean;
  readonly path: string;
  readonly resolvedPath: string;
  readonly target: string;
  readonly targetExists: boolean;
}

export interface SkillSnapshot {
  readonly files: readonly SkillFile[];
  readonly links: readonly SkillLink[];
  readonly repositoryPaths: readonly string[];
}

export const SkillFinding = Schema.Struct({
  code: Schema.NonEmptyString,
  detail: Schema.NonEmptyString,
  invariant: Schema.NonEmptyString,
  owner: Schema.NonEmptyString,
  repairHint: Schema.NonEmptyString,
  target: Schema.NonEmptyString,
});
export type SkillFinding = typeof SkillFinding.Type;

export const SkillPolicyReport = Schema.Struct({
  checkedFiles: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  checkedLinks: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  detailPath: Schema.NonEmptyString,
  findings: Schema.Array(SkillFinding),
  generatedAt: Schema.NonEmptyString,
  omittedFindings: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  ok: Schema.Boolean,
  schemaVersion: Schema.Literal(1),
  shownFindings: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
});
export type SkillPolicyReport = typeof SkillPolicyReport.Type;

export const SkillPolicyReportJson = Schema.fromJsonString(SkillPolicyReport);
const SkillFrontmatter = Schema.Struct({
  description: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
});
const SkillUiMetadata = Schema.Struct({
  interface: Schema.Struct({
    default_prompt: Schema.NonEmptyString,
    display_name: Schema.NonEmptyString,
    short_description: Schema.NonEmptyString,
  }),
});

export interface SkillPolicyOptions {
  readonly detailPath: string;
  readonly generatedAt: string;
  readonly maxFindings: number;
}

const requiredMirrors = [
  "docs-maintainer",
  "effect-client-wrapper",
  "package-structure",
  "prd-implementer",
  "prd-review",
  "prd-writer",
] as const;

const policyFiles = {
  agents: "AGENTS.md",
  browser: ".agents/skills/agent-browser/SKILL.md",
  buildingComponents: ".agents/skills/building-components/SKILL.md",
  compositionPatterns: ".agents/skills/vercel-composition-patterns/SKILL.md",
  docsMaintainer: ".agents/skills/docs-maintainer/SKILL.md",
  docsProfile:
    ".agents/skills/docs-maintainer/references/repository-profile.md",
  effectPatterns: "docs/architecture/effect-patterns.md",
  implementer: ".agents/skills/prd-implementer/SKILL.md",
  packageStructure: ".agents/skills/package-structure/SKILL.md",
  packageProfile:
    ".agents/skills/package-structure/references/repository-profile.md",
  reactPractices: ".agents/skills/vercel-react-best-practices/SKILL.md",
  reviewer: ".agents/skills/prd-review/SKILL.md",
  shadcn: ".agents/skills/shadcn/SKILL.md",
  wrapper: ".agents/skills/effect-client-wrapper/SKILL.md",
  writer: ".agents/skills/prd-writer/SKILL.md",
} as const;

const requiredPolicy: readonly (readonly [keyof typeof policyFiles, string])[] =
  [
    ["agents", "bun run check:skills"],
    ["agents", "typeof Contract.Type"],
    ["agents", "typeof Contract.Encoded"],
    ["agents", "Config.schema"],
    ["agents", "named operations"],
    ["agents", "live/mock Layers"],
    ["agents", ".agents/skills/docs-maintainer"],
    ["agents", "Preserve"],
    ["docsMaintainer", "Change required"],
    ["docsMaintainer", "Preserve"],
    ["docsMaintainer", "observed data only"],
    [
      "docsMaintainer",
      "Scheduled or background freshness work emits an isolated candidate",
    ],
    ["docsProfile", "apps/agent/runbooks/**"],
    ["docsProfile", "apps/codex-proxy/runbooks/**"],
    ["docsProfile", "python3 tooling/quick_validate.py"],
    ["effectPatterns", "typeof Contract.Type"],
    ["effectPatterns", "typeof Contract.Encoded"],
    ["effectPatterns", "Schema.decodeUnknownEffect"],
    ["effectPatterns", "Schema.decodeEffect"],
    ["effectPatterns", "Schema.encodeEffect"],
    ["effectPatterns", "Config.schema"],
    ["effectPatterns", "HttpClient"],
    ["effectPatterns", "Schema.TaggedErrorClass"],
    ["effectPatterns", "Match"],
    ["effectPatterns", "Helper Admission"],
    ["writer", "## Required Impact Ledger"],
    ["writer", ".agents/skills/docs-maintainer"],
    ["writer", ".agents/skills/effect-client-wrapper"],
    ["writer", "typeof Contract.Type"],
    ["writer", "typeof Contract.Encoded"],
    ["writer", "Schema.decodeUnknownEffect"],
    ["writer", "Schema.decodeEffect"],
    ["writer", "Schema.encodeEffect"],
    ["writer", "inbound"],
    ["writer", "outbound"],
    ["writer", "Do not encode a fixed audit-pass or subagent count"],
    ["implementer", ".agents/skills/effect-client-wrapper"],
    ["implementer", ".agents/skills/docs-maintainer"],
    ["implementer", "Change required"],
    ["implementer", "typeof Contract.Type"],
    ["implementer", "typeof Contract.Encoded"],
    ["implementer", "Schema.decodeUnknownEffect"],
    ["implementer", "Schema.decodeEffect"],
    ["implementer", "Schema.encodeEffect"],
    ["implementer", "raw public primitives"],
    ["implementer", "unencoded outward writes"],
    ["implementer", "stale exceptions"],
    ["implementer", "helper sprawl"],
    ["implementer", "Use a goal only when the user explicitly requests one"],
    ["packageStructure", "Use this skill directly"],
    ["packageStructure", "Required separation"],
    ["packageStructure", "helper sprawl"],
    ["packageProfile", "@bundjil/source"],
    ["reviewer", "Use this repository-owned contract directly"],
    ["reviewer", ".agents/skills/docs-maintainer"],
    ["reviewer", "DeepWiki"],
    ["reviewer", "Change required"],
    ["reviewer", "use one primary reviewer"],
    ["wrapper", "Config.schema"],
    ["wrapper", "ConfigProvider"],
    ["wrapper", "Schema.encodeEffect"],
    ["wrapper", "Schema.decodeUnknownEffect"],
    ["wrapper", "Schema.decodeEffect"],
    ["wrapper", "codec's `Encoded` type, use `Schema.decodeEffect` instead"],
    ["wrapper", "Schema.TaggedErrorClass"],
    ["wrapper", "layerLive"],
    ["wrapper", "layerMock"],
    ["browser", "docs/architecture/frontend-composition.md"],
    ["buildingComponents", "docs/architecture/frontend-composition.md"],
    ["buildingComponents", "primitive -> composite -> layout -> route"],
    ["buildingComponents", "schema-owned URL"],
    ["compositionPatterns", "docs/architecture/frontend-composition.md"],
    ["compositionPatterns", "schema-owned URL"],
    ["reactPractices", "docs/architecture/frontend-composition.md"],
    ["reactPractices", "data-bearing leaves"],
    ["shadcn", "docs/architecture/frontend-composition.md"],
  ];

interface DocumentationMaintenanceContract {
  readonly id: string;
  readonly ownerPath: (typeof policyFiles)[keyof typeof policyFiles];
  readonly requiredTermGroups: readonly (readonly string[])[];
  readonly repairHint: string;
}

const documentationMaintenanceContracts: readonly DocumentationMaintenanceContract[] =
  [
    {
      id: "ordinary-change-route",
      ownerPath: policyFiles.agents,
      requiredTermGroups: [
        ["material"],
        ["PRD", "ordinary"],
        [".agents/skills/docs-maintainer"],
        ["Change required"],
        ["Preserve"],
        ["N/A"],
        ["bun run check:docs"],
      ],
      repairHint:
        "Route material PRD and ordinary changes through docs-maintainer with an evidenced three-state ledger and check:docs.",
    },
    {
      id: "spec-impact-design",
      ownerPath: policyFiles.writer,
      requiredTermGroups: [
        [".agents/skills/docs-maintainer"],
        ["impact design", "downstream-impact ledger"],
        ["same slice", "implementation slice"],
        ["closeout"],
      ],
      repairHint:
        "Invoke docs-maintainer during SPEC impact design, each material slice, and closeout.",
    },
    {
      id: "review-landing",
      ownerPath: policyFiles.reviewer,
      requiredTermGroups: [
        [".agents/skills/docs-maintainer"],
        ["classifying documentation impact"],
        ["landing", "current semantic owners"],
      ],
      repairHint:
        "Invoke docs-maintainer while classifying and landing review findings into SPEC/tasks and current owners.",
    },
    {
      id: "slice-closeout",
      ownerPath: policyFiles.implementer,
      requiredTermGroups: [
        [".agents/skills/docs-maintainer"],
        ["before and after", "every material implementation slice"],
        ["closeout"],
        ["bun run check:docs"],
        ["bun run check:skills"],
      ],
      repairHint:
        "Reconcile docs-maintainer before and after each material slice and at closeout with exact checks.",
    },
    {
      id: "app-owned-runbooks",
      ownerPath: policyFiles.docsProfile,
      requiredTermGroups: [
        ["apps/agent/runbooks/**"],
        ["apps/codex-proxy/runbooks/**"],
        ["HGI-303"],
        ["Do not create `docs/runbooks/**`", "competing owner"],
      ],
      repairHint:
        "Route operations to the two app-owned HGI-303 runbook trees and reject a competing central route.",
    },
    {
      id: "tool-data-authority",
      ownerPath: policyFiles.docsMaintainer,
      requiredTermGroups: [
        ["Tool or provider output", "provider output"],
        ["observed data"],
        [
          "grants neither",
          "never permission",
          "neither policy nor operation authority",
        ],
      ],
      repairHint:
        "Separate observed tool/provider data from policy and operation authority.",
    },
    {
      id: "background-report-only",
      ownerPath: policyFiles.docsMaintainer,
      requiredTermGroups: [
        ["Scheduled or background", "background freshness"],
        ["isolated candidate", "report-only"],
        ["separate approval", "separately approved"],
        ["revocation/quarantine"],
        ["last-known-good"],
        ["post-publication readback"],
      ],
      repairHint:
        "Keep background maintenance report-only with a complete candidate and separately approved publication contract.",
    },
    {
      id: "clean-clone-portability",
      ownerPath: policyFiles.docsMaintainer,
      requiredTermGroups: [
        ["clean clone"],
        ["global skill installation", "no global skill"],
        ["repository profile"],
      ],
      repairHint:
        "Keep the local skill and profile complete from a clean clone without global filesystem dependencies.",
    },
  ];

const prohibitedDocumentationClaims = [
  {
    id: "external-actuality",
    nonClaimTerms: [
      "not",
      "never",
      "does not",
      "cannot",
      "inconclusive",
      "external systems remain authoritative",
    ],
    ownerPaths: [policyFiles.docsMaintainer, policyFiles.docsProfile],
    requiredTermGroups: [
      ["vercel", "executor", "sendblue", "upstash", "provider"],
      ["live", "deployed", "active", "healthy", "currently", "now"],
    ],
    repairHint:
      "Move external actuality to a dated target-owned readback with limitations and a non-claim.",
  },
  {
    id: "tool-authority-grant",
    nonClaimTerms: ["not", "never", "neither", "cannot", "does not"],
    ownerPaths: [policyFiles.docsMaintainer, policyFiles.docsProfile],
    requiredTermGroups: [
      ["tool output", "provider output", "provider response", "tool response"],
      ["authorizes", "grants", "permission", "permits", "approval"],
    ],
    repairHint:
      "Separate observed tool/provider data from identity, policy, approval, capability, and authority.",
  },
] as const;

const finding = (
  code: string,
  invariant: string,
  owner: string,
  target: string,
  repairHint: string,
  detail: string
): SkillFinding => ({ code, detail, invariant, owner, repairHint, target });

const containsSemanticTerm = (content: string, term: string) =>
  new RegExp(
    `(?:^|[^a-z0-9])${term.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z0-9])`,
    "u"
  ).test(content);

const fileMap = (snapshot: SkillSnapshot) =>
  new Map(snapshot.files.map((file) => [file.path, file.content]));

const requiredFragmentFindings = (
  snapshot: SkillSnapshot
): readonly SkillFinding[] => {
  const files = fileMap(snapshot);
  return requiredPolicy.flatMap(([key, fragment]) => {
    const path = policyFiles[key];
    const content = files.get(path);
    if (content?.includes(fragment)) {
      return [];
    }
    return [
      finding(
        "SKILL-POLICY",
        "Repository instruction surfaces retain required architectural policy",
        key,
        path,
        `Restore the canonical policy fragment: ${fragment}`,
        content === undefined
          ? "Required policy file is missing"
          : `Missing required fragment ${fragment}`
      ),
    ];
  });
};

const documentationMaintenanceFindings = (
  snapshot: SkillSnapshot
): readonly SkillFinding[] => {
  const files = fileMap(snapshot);
  return documentationMaintenanceContracts.flatMap((contract) => {
    const content = files.get(contract.ownerPath)?.toLocaleLowerCase() ?? "";
    const missingGroups = contract.requiredTermGroups.filter(
      (group) =>
        !group.some((term) =>
          containsSemanticTerm(content, term.toLocaleLowerCase())
        )
    );
    if (missingGroups.length === 0) {
      return [];
    }
    return [
      finding(
        "SKILL-DOCS-MAINTENANCE",
        "Documentation maintenance routes cover ordinary work, PRD phases, owner boundaries, authority, automation, and portability",
        contract.id,
        contract.ownerPath,
        contract.repairHint,
        `Missing semantic term groups: ${missingGroups
          .map((group) => group.join(" | "))
          .join("; ")}`
      ),
    ];
  });
};

const documentationClaimFindings = (
  snapshot: SkillSnapshot
): readonly SkillFinding[] => {
  const files = fileMap(snapshot);
  return prohibitedDocumentationClaims.flatMap((rule) =>
    rule.ownerPaths.flatMap((path) => {
      const content = files.get(path) ?? "";
      const segments = content.split(/(?:\n\s*\n)|(?:\n(?=- ))|(?<=[.!?])\s+/u);
      return segments.flatMap((segment) => {
        const normalized = segment.toLocaleLowerCase();
        const matchesClaim = rule.requiredTermGroups.every((group) =>
          group.some((term) => containsSemanticTerm(normalized, term))
        );
        const boundedNonClaim = rule.nonClaimTerms.some((term) =>
          containsSemanticTerm(normalized, term)
        );
        if (!matchesClaim || boundedNonClaim) {
          return [];
        }
        return [
          finding(
            "SKILL-DOCS-CLAIM",
            "Documentation-maintenance owners contain no undated external actuality or tool-authority grant",
            rule.id,
            path,
            rule.repairHint,
            segment.replaceAll(/\s+/g, " ").trim()
          ),
        ];
      });
    })
  );
};

const mirrorFindings = (snapshot: SkillSnapshot): readonly SkillFinding[] => {
  const links = new Map(snapshot.links.map((link) => [link.path, link]));
  const issues: SkillFinding[] = [];
  for (const link of snapshot.links) {
    if (!link.isSymbolicLink || !link.targetExists) {
      issues.push(
        finding(
          "SKILL-MIRROR",
          "Every Claude skill route is a resolvable symbolic link",
          "bundjil-skill-owner",
          link.path,
          "Point the route at its repository-local .agents skill target",
          `isSymbolicLink=${link.isSymbolicLink}; targetExists=${link.targetExists}; target=${link.target}`
        )
      );
    }
    if (!link.resolvedPath.startsWith(".agents/skills/")) {
      issues.push(
        finding(
          "SKILL-MIRROR",
          "Claude mirrors stay inside the repository-owned skill tree",
          "bundjil-skill-owner",
          link.path,
          "Use ../../.agents/skills/<same-name>",
          `Resolved outside .agents/skills: ${link.resolvedPath}`
        )
      );
    }
  }
  for (const name of requiredMirrors) {
    const path = `.claude/skills/${name}`;
    const link = links.get(path);
    const expectedTarget = `../../.agents/skills/${name}`;
    if (
      !link ||
      !link.isSymbolicLink ||
      !link.targetExists ||
      link.target !== expectedTarget
    ) {
      issues.push(
        finding(
          "SKILL-MIRROR-REQUIRED",
          "Every required PRD, package, and Effect skill has an exact Claude mirror",
          name,
          path,
          `Create ${path} -> ${expectedTarget}`,
          link
            ? `target=${link.target}; exists=${link.targetExists}`
            : "Required mirror is missing"
        )
      );
    }
  }
  if (links.has(".claude/skills/create-package")) {
    issues.push(
      finding(
        "SKILL-MIRROR-LEGACY",
        "The legacy create-package alias is retired",
        "package-structure",
        ".claude/skills/create-package",
        "Remove the alias and use package-structure",
        "Legacy create-package mirror remains present"
      )
    );
  }
  return issues;
};

const skillFrontmatter = (content: string): string | undefined => {
  if (!content.startsWith("---\n")) {
    return undefined;
  }
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) {
    return undefined;
  }
  return content.slice(4, end);
};

const parseYaml = (
  content: string
):
  | { readonly _tag: "Failure"; readonly detail: string }
  | { readonly _tag: "Success"; readonly value: unknown } => {
  try {
    return { _tag: "Success", value: parseYamlDocument(content) };
  } catch (error) {
    return { _tag: "Failure", detail: String(error) };
  }
};

const skillFileMetadataFinding = (
  file: SkillFile
): SkillFinding | undefined => {
  const name = file.path.split("/").at(-2) ?? "missing";
  const frontmatter = skillFrontmatter(file.content);
  if (!frontmatter) {
    return finding(
      "SKILL-METADATA",
      "Every local skill has complete name and description frontmatter",
      name,
      file.path,
      "Add parseable name and description frontmatter",
      "Skill frontmatter is missing"
    );
  }
  const parsed = parseYaml(frontmatter);
  if (parsed._tag === "Failure") {
    return finding(
      "SKILL-METADATA",
      "Every local skill has valid YAML frontmatter",
      name,
      file.path,
      "Repair the YAML frontmatter",
      parsed.detail
    );
  }
  const decoded = Schema.decodeUnknownResult(SkillFrontmatter)(parsed.value);
  if (Result.isFailure(decoded)) {
    return finding(
      "SKILL-METADATA",
      "Every local skill has schema-valid name and description metadata",
      name,
      file.path,
      "Add non-empty name and description fields",
      String(decoded.failure)
    );
  }
  return decoded.success.name === name
    ? undefined
    : finding(
        "SKILL-METADATA",
        "Skill metadata name matches its route",
        name,
        file.path,
        `Set name: ${name}`,
        `Metadata declares ${decoded.success.name}`
      );
};

const skillUiMetadataFinding = (
  files: ReadonlyMap<string, string>,
  name: (typeof requiredMirrors)[number]
): SkillFinding | undefined => {
  const path = `.agents/skills/${name}/agents/openai.yaml`;
  const content = files.get(path);
  if (content === undefined) {
    return finding(
      "SKILL-UI-METADATA",
      "Required local skills have portable OpenAI UI metadata",
      name,
      path,
      "Restore agents/openai.yaml",
      "UI metadata file is missing"
    );
  }
  const parsed = parseYaml(content);
  if (parsed._tag === "Failure") {
    return finding(
      "SKILL-UI-METADATA",
      "Required local skill UI metadata is valid YAML",
      name,
      path,
      "Repair agents/openai.yaml",
      parsed.detail
    );
  }
  const decoded = Schema.decodeUnknownResult(SkillUiMetadata)(parsed.value);
  if (Result.isFailure(decoded)) {
    return finding(
      "SKILL-UI-METADATA",
      "Required local skill UI metadata satisfies its schema",
      name,
      path,
      "Restore interface display_name, short_description, and default_prompt",
      String(decoded.failure)
    );
  }
  return decoded.success.interface.default_prompt.includes(`$${name}`)
    ? undefined
    : finding(
        "SKILL-UI-METADATA",
        "Skill default prompts name their owning skill",
        name,
        path,
        `Name $${name} in default_prompt`,
        `default_prompt must name $${name}`
      );
};

const metadataFindings = (snapshot: SkillSnapshot): readonly SkillFinding[] => {
  const files = fileMap(snapshot);
  const skillIssues = snapshot.files
    .filter((file) => /^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(file.path))
    .flatMap((file) => {
      const issue = skillFileMetadataFinding(file);
      return issue ? [issue] : [];
    });
  const uiIssues = requiredMirrors.flatMap((name) => {
    const issue = skillUiMetadataFinding(files, name);
    return issue ? [issue] : [];
  });
  return [...skillIssues, ...uiIssues];
};

const linkFindings = (snapshot: SkillSnapshot): readonly SkillFinding[] => {
  const paths = new Set(snapshot.repositoryPaths);
  return snapshot.files
    .filter((file) => /^\.agents\/skills\/.+\.(?:md|mdx)$/.test(file.path))
    .flatMap((file) => {
      const issues: SkillFinding[] = [];
      for (const match of file.content
        .replaceAll(/```[\s\S]*?```/g, "")
        .matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)) {
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
        const resolved = posix.normalize(
          posix.join(posix.dirname(file.path), target)
        );
        const exists =
          paths.has(resolved) ||
          snapshot.repositoryPaths.some((path) =>
            path.startsWith(`${resolved.replace(/\/$/, "")}/`)
          );
        if (!exists) {
          issues.push(
            finding(
              "SKILL-REFERENCE",
              "Repository-local skill references resolve",
              file.path.split("/").at(2) ?? "bundjil-skill-owner",
              file.path,
              "Correct the reference or restore the owned target",
              `${raw} resolves to missing ${resolved}`
            )
          );
        }
      }
      return issues;
    });
};

const executableAndPortabilityFindings = (
  snapshot: SkillSnapshot
): readonly SkillFinding[] => {
  const files = fileMap(snapshot);
  const issues: SkillFinding[] = [];
  const examples = snapshot.files
    .filter((file) => /^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(file.path))
    .flatMap((file) =>
      [...file.content.matchAll(/```(?:ts|typescript)\n([\s\S]*?)```/g)].map(
        (match) => ({ content: match[1] ?? "", path: file.path })
      )
    );
  const forbidden: readonly (readonly [string, RegExp])[] = [
    ["generic SDK callback field", /\buse\s*:\s*</u],
    ["generic SDK callback invocation", /\.use\s*\(/u],
    ["raw semantic identifier", /\b(?:id|identifier)\s*:\s*string\b/iu],
    [
      "primitive semantic Config",
      /Config\.(?:string|nonEmptyString|redacted)\s*\(/u,
    ],
    ["native-class error branch", /\binstanceof\b/u],
    ["unchecked generic SDK result", /Effect\.Effect<\s*A(?:\s*,|>)/u],
    ["synchronous codec", /Schema\.(?:decode|encode)(?:Unknown)?Sync\s*\(/u],
    ["unknown outbound encoder", /Schema\.encodeUnknownEffect/u],
  ];
  for (const example of examples) {
    for (const [label, pattern] of forbidden) {
      if (pattern.test(example.content)) {
        issues.push(
          finding(
            "SKILL-EXECUTABLE-EXAMPLE",
            "Governed Effect/PRD skills contain no contradictory executable examples",
            example.path.split("/").at(2) ?? "bundjil-skill-owner",
            example.path,
            "Rewrite the executable example to the canonical typed boundary pattern",
            `Executable example contains ${label}`
          )
        );
      }
    }
  }
  for (const file of snapshot.files.filter((candidate) =>
    /^\.agents\/skills\/.+\.(?:md|mdx|ya?ml)$/.test(candidate.path)
  )) {
    const matches = file.content.match(/\/Users\/[^/\s]+\//g) ?? [];
    for (const match of matches) {
      issues.push(
        finding(
          "SKILL-PORTABILITY",
          "Repository-local skills contain no personal absolute paths",
          file.path.split("/").at(2) ?? "bundjil-skill-owner",
          file.path,
          "Use a repository-relative path or named input",
          `Found personal path prefix ${match}`
        )
      );
    }
  }
  const contradictory: readonly (readonly [string, string, RegExp])[] = [
    [
      policyFiles.effectPatterns,
      "synchronous codec",
      /Schema\.(?:decode|encode)(?:Unknown)?Sync\s*\(/u,
    ],
    [
      policyFiles.effectPatterns,
      "unknown outbound encoder",
      /Schema\.encodeUnknownEffect/u,
    ],
    [
      policyFiles.writer,
      "unknown outbound encoder",
      /Schema\.encodeUnknownEffect/u,
    ],
    [
      policyFiles.implementer,
      "unknown outbound encoder",
      /Schema\.encodeUnknownEffect/u,
    ],
  ];
  for (const [path, label, pattern] of contradictory) {
    if (pattern.test(files.get(path) ?? "")) {
      issues.push(
        finding(
          "SKILL-CONTRADICTION",
          "Current instruction owners contain no contradictory boundary policy",
          "bundjil-skill-owner",
          path,
          "Remove or rewrite the contradictory policy",
          `Contains ${label}`
        )
      );
    }
  }
  const staleSitePolicy =
    /Site Repo|docs\/(?:DESIGN|FRONTEND)\.md|docs\/architecture\/frontend\/|@packages\/ui|WEB_OG_TYPOGRAPHY/u;
  for (const path of [
    policyFiles.browser,
    policyFiles.buildingComponents,
    policyFiles.compositionPatterns,
    policyFiles.reactPractices,
    policyFiles.shadcn,
  ]) {
    if (staleSitePolicy.test(files.get(path) ?? "")) {
      issues.push(
        finding(
          "SKILL-STALE-POLICY",
          "Frontend skills route to Bundjil rather than stale Site policy",
          "bundjil-frontend-owner",
          path,
          "Replace stale Site-specific instructions with the Bundjil route",
          "Contains stale Site-specific frontend policy"
        )
      );
    }
  }
  return issues;
};

const compareFindings = (left: SkillFinding, right: SkillFinding) =>
  left.code.localeCompare(right.code) ||
  left.target.localeCompare(right.target) ||
  left.detail.localeCompare(right.detail);

export const auditSkills = (
  snapshot: SkillSnapshot,
  options: SkillPolicyOptions
): SkillPolicyReport => {
  const findings = [
    ...requiredFragmentFindings(snapshot),
    ...documentationMaintenanceFindings(snapshot),
    ...documentationClaimFindings(snapshot),
    ...mirrorFindings(snapshot),
    ...metadataFindings(snapshot),
    ...linkFindings(snapshot),
    ...executableAndPortabilityFindings(snapshot),
  ].toSorted(compareFindings);
  const shownFindings = Math.min(options.maxFindings, findings.length);
  return {
    checkedFiles: snapshot.files.length,
    checkedLinks: snapshot.links.length,
    detailPath: options.detailPath,
    findings,
    generatedAt: options.generatedAt,
    omittedFindings: findings.length - shownFindings,
    ok: findings.length === 0,
    schemaVersion: 1,
    shownFindings,
  };
};

export const boundedSkillFindings = (
  report: SkillPolicyReport
): readonly SkillFinding[] =>
  report.findings.slice(0, report.shownFindings).map((issue) => ({
    ...issue,
    detail:
      issue.detail.length <= 240
        ? issue.detail
        : `${issue.detail.slice(0, 239)}…`,
  }));

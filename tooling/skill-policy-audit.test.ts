import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";
import { posix, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { auditSkills, boundedSkillFindings } from "./skill-policy.js";
import type { SkillFile, SkillSnapshot } from "./skill-policy.js";

const repositoryRoot = resolve(import.meta.dirname, "..");

const repositorySnapshot = (): SkillSnapshot => {
  const discoveredPaths = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: repositoryRoot, encoding: "utf-8" }
  )
    .split("\0")
    .filter(Boolean)
    .toSorted();
  const repositoryPaths = discoveredPaths.filter((path) => {
    try {
      lstatSync(resolve(repositoryRoot, path));
      return true;
    } catch {
      return false;
    }
  });
  const selected = repositoryPaths.filter(
    (path) =>
      path === "AGENTS.md" ||
      path === "docs/architecture/effect-patterns.md" ||
      (path.startsWith(".agents/skills/") && /\.(?:md|mdx|ya?ml)$/.test(path))
  );
  const files = selected.map(
    (path): SkillFile => ({
      content: readFileSync(resolve(repositoryRoot, path), "utf-8"),
      path,
    })
  );
  const links = repositoryPaths
    .filter((path) => /^\.claude\/skills\/[^/]+$/.test(path))
    .map((path) => {
      const absolute = resolve(repositoryRoot, path);
      const isSymbolicLink = lstatSync(absolute).isSymbolicLink();
      const target = isSymbolicLink ? readlinkSync(absolute) : "not-a-link";
      const resolvedPath = isSymbolicLink
        ? posix.normalize(posix.join(posix.dirname(path), target))
        : path;
      return {
        isSymbolicLink,
        path,
        resolvedPath,
        target,
        targetExists: existsSync(resolve(repositoryRoot, resolvedPath)),
      };
    });
  return { files, links, repositoryPaths };
};

const run = (snapshot: SkillSnapshot, maxFindings = 20) =>
  auditSkills(snapshot, {
    detailPath: "tmp/skill-policy-report.json",
    generatedAt: "2026-07-21T12:00:00.000Z",
    maxFindings,
  });

const replaceFile = (
  snapshot: SkillSnapshot,
  path: string,
  update: (content: string) => string
): SkillSnapshot => ({
  ...snapshot,
  files: snapshot.files.map((file) =>
    file.path === path ? { ...file, content: update(file.content) } : file
  ),
});

describe("HGI-302 skill policy", () => {
  it("accepts the complete repository-local mirror and policy graph", () => {
    const report = run(repositorySnapshot());
    expect(report.findings).toStrictEqual([]);
    expect(report.ok).toBeTruthy();
  });

  it("rejects broken and legacy mirrors", () => {
    const base = repositorySnapshot();
    const broken: SkillSnapshot = {
      ...base,
      links: [
        ...base.links.filter(
          (link) => link.path !== ".claude/skills/package-structure"
        ),
        {
          isSymbolicLink: true,
          path: ".claude/skills/create-package",
          resolvedPath: ".agents/skills/create-package",
          target: "../../.agents/skills/create-package",
          targetExists: false,
        },
      ],
    };
    const report = run(broken);
    const codes = new Set(report.findings.map((issue) => issue.code));
    expect(codes.has("SKILL-MIRROR")).toBeTruthy();
    expect(codes.has("SKILL-MIRROR-LEGACY")).toBeTruthy();
    expect(codes.has("SKILL-MIRROR-REQUIRED")).toBeTruthy();
  });

  it("rejects metadata, reference, portability, and executable-example drift", () => {
    const base = repositorySnapshot();
    const brokenMetadata = replaceFile(
      base,
      ".agents/skills/prd-review/agents/openai.yaml",
      (content) => content.replace("default_prompt:", "removed_prompt:")
    );
    const brokenReference = replaceFile(
      brokenMetadata,
      ".agents/skills/package-structure/SKILL.md",
      (content) => `${content}\n\n[Missing](references/missing.md)\n`
    );
    const brokenExample = replaceFile(
      brokenReference,
      ".agents/skills/effect-client-wrapper/SKILL.md",
      (content) =>
        `${content}\n\n\`\`\`ts\nconst bad: { id: string } = input\n\`\`\`\n/Users/example/private\n`
    );
    const report = run(brokenExample);
    const codes = new Set(report.findings.map((issue) => issue.code));
    expect(codes.has("SKILL-EXECUTABLE-EXAMPLE")).toBeTruthy();
    expect(codes.has("SKILL-PORTABILITY")).toBeTruthy();
    expect(codes.has("SKILL-REFERENCE")).toBeTruthy();
    expect(codes.has("SKILL-UI-METADATA")).toBeTruthy();
  });

  it("bounds console diagnostics while retaining the complete finding list", () => {
    const base = repositorySnapshot();
    const links = Array.from({ length: 30 }, (_, index) => ({
      isSymbolicLink: true,
      path: `.claude/skills/broken-${index}`,
      resolvedPath: `.agents/skills/missing-${index}`,
      target: `../../.agents/skills/missing-${index}`,
      targetExists: false,
    }));
    const report = run({ ...base, links: [...base.links, ...links] }, 5);
    expect(report.findings.length).toBeGreaterThan(5);
    expect(report.shownFindings).toBe(5);
    expect(report.omittedFindings).toBeGreaterThan(0);
    expect(boundedSkillFindings(report)).toHaveLength(5);
  });
});

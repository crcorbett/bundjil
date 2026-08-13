import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const packageRoot = dirname(import.meta.dirname);
const commandFixtureTimeoutMilliseconds = 120_000;

const runCommand = (script: string, environment: Record<string, string>) => {
  const child = spawnSync(
    "bun",
    ["--conditions=@bundjil/source", "run", `scripts/${script}`],
    {
      cwd: packageRoot,
      encoding: "utf-8",
      env: {
        ...process.env,
        ...environment,
      },
    }
  );
  return {
    exitCode: child.status,
    output: `${child.stdout}\n${child.stderr}`,
  };
};

describe("infrastructure operator command boundaries", () => {
  it(
    "preserves bounded blocked output across command and Layer failures",
    () => {
      const sharedPath = "tmp/proof/operator-command-boundary.json";
      const cases = [
        {
          script: "generate-adoption-manifest.ts",
          environment: {
            BUNDJIL_INFRASTRUCTURE_ADOPTION_PATH: sharedPath,
            BUNDJIL_INFRASTRUCTURE_INVENTORY_PATH: sharedPath,
          },
          output: '"status":"blocked"',
        },
        {
          script: "inventory-live.ts",
          environment: {
            BUNDJIL_INFRASTRUCTURE_MODE: "offline",
            BUNDJIL_INFRASTRUCTURE_STAGE: "preview",
          },
          output: '"status":"blocked"',
        },
        {
          script: "migrate-state.ts",
          environment: {
            BUNDJIL_INFRASTRUCTURE_ADOPTION_PATH: sharedPath,
            BUNDJIL_STATE_MIGRATION_AUTHORITY_PATH: sharedPath,
            BUNDJIL_STATE_MIGRATION_BACKUP_PATH: sharedPath,
            BUNDJIL_STATE_MIGRATION_CANDIDATE: "operator-command-candidate",
            BUNDJIL_STATE_MIGRATION_MODE: "plan",
            BUNDJIL_STATE_MIGRATION_RECEIPT_PATH: sharedPath,
            BUNDJIL_STATE_MIGRATION_STAGE: "preview",
          },
          output: "migration-path-conflict",
        },
        {
          script: "prove-adoption-state.ts",
          environment: {
            BUNDJIL_ALCHEMY_STATE_ACCESS_KEY_ID: "",
            BUNDJIL_ALCHEMY_STATE_SECRET_ACCESS_KEY: "",
            BUNDJIL_INFRASTRUCTURE_ADOPTION_PATH: sharedPath,
            BUNDJIL_INFRASTRUCTURE_AUTHORITY_PATH: sharedPath,
            BUNDJIL_INFRASTRUCTURE_CANDIDATE_IDENTITY:
              "operator-command-candidate",
            BUNDJIL_INFRASTRUCTURE_RECEIPT_PATH: sharedPath,
            BUNDJIL_INFRASTRUCTURE_STAGE: "preview",
          },
          output: "configuration-invalid",
        },
        {
          script: "report-drift.ts",
          environment: {
            BUNDJIL_ALCHEMY_STATE_ACCESS_KEY_ID: "",
            BUNDJIL_ALCHEMY_STATE_SECRET_ACCESS_KEY: "",
            BUNDJIL_INFRASTRUCTURE_DRIFT_STAGE: "prod",
          },
          output: "drift-report-boundary-failed",
        },
      ] as const;

      for (const fixture of cases) {
        const result = runCommand(fixture.script, fixture.environment);
        expect(result.exitCode).not.toBe(0);
        expect(result.output).toContain(fixture.output);
        expect(result.output).not.toContain("ConfigError");
      }

      const previewConfiguration = runCommand(
        "preview-configuration-drift.ts",
        {
          BUNDJIL_PREVIEW_CONFIGURATION_AUTHORITY_PATH: "",
          BUNDJIL_PREVIEW_VERCEL_PROJECT_ID: "",
          BUNDJIL_PREVIEW_VERCEL_TEAM_ID: "",
        }
      );
      expect(previewConfiguration.exitCode).not.toBe(0);
    },
    commandFixtureTimeoutMilliseconds
  );

  it("rejects invalid authority and Photon binding files before provider reads", () => {
    const directory = mkdtempSync(join(packageRoot, "tmp-command-boundary-"));
    const authorityPath = join(directory, "authority.json");
    const bindingPath = join(directory, "binding.json");
    writeFileSync(authorityPath, "{}");
    writeFileSync(bindingPath, "{}");
    chmodSync(authorityPath, 0o644);
    chmodSync(bindingPath, 0o644);

    try {
      const authority = runCommand("validate-vercel-git-link-authority.ts", {
        BUNDJIL_VERCEL_GIT_LINK_AUTHORITY_PATH: relative(
          packageRoot,
          authorityPath
        ),
      });
      expect(authority.exitCode).not.toBe(0);
      expect(authority.output).toContain('"status":"invalid"');

      const binding = runCommand("bind-photon-preview-webhook.ts", {
        BUNDJIL_PHOTON_BINDING_VERCEL_PROJECT_ID: "project-preview",
        BUNDJIL_PHOTON_BINDING_VERCEL_TEAM_ID: "team-preview",
        BUNDJIL_PHOTON_PREVIEW_PROJECT_ID: "photon-preview",
        BUNDJIL_PHOTON_PREVIEW_PROJECT_SECRET: "photon-project-secret",
        BUNDJIL_PHOTON_WEBHOOK_BINDING_PATH: bindingPath,
      });
      expect(binding.exitCode).not.toBe(0);
      expect(binding.output).toContain('"status":"blocked"');
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});

import { readFileSync, readdirSync } from "node:fs";

import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

// YAML is the external input; decode just the workflow fields checked here.
const Workflow = Schema.Struct({
  on: Schema.Unknown,
  permissions: Schema.Record(Schema.String, Schema.String),
  concurrency: Schema.Struct({
    group: Schema.String,
    "cancel-in-progress": Schema.Boolean,
  }),
  jobs: Schema.Record(
    Schema.String,
    Schema.Struct({
      if: Schema.String,
      "timeout-minutes": Schema.Number,
      environment: Schema.optional(Schema.String),
      permissions: Schema.optional(Schema.Record(Schema.String, Schema.String)),
      env: Schema.optional(Schema.Record(Schema.String, Schema.String)),
      steps: Schema.Array(
        Schema.Struct({
          name: Schema.optional(Schema.String),
          uses: Schema.optional(Schema.String),
          run: Schema.optional(Schema.String),
          "timeout-minutes": Schema.optional(Schema.Number),
          with: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
          env: Schema.optional(Schema.Record(Schema.String, Schema.String)),
        })
      ),
    })
  ),
});
const workflow = (name: string) =>
  Schema.decodeUnknownSync(Workflow)(
    parse(
      readFileSync(
        new URL(`../.github/workflows/${name}.yml`, import.meta.url),
        "utf-8"
      )
    )
  );

const production = workflow("production");
const deploy = Schema.decodeUnknownSync(Workflow.fields.jobs.value)(
  production.jobs["deploy"]
);

describe("deployment workflow safeguards", () => {
  it("only deploys successful CI for a main push in this repository", () => {
    expect(production.on).toStrictEqual({
      workflow_run: { workflows: ["CI"], types: ["completed"] },
    });
    expect(deploy.if.replaceAll(/\s+/gu, " ").trim()).toBe(
      "github.repository == 'crcorbett/bundjil' && github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push' && github.event.workflow_run.head_branch == 'main' && github.event.workflow_run.head_repository.full_name == 'crcorbett/bundjil'"
    );
    expect(deploy.environment).toBe("Production");
    expect(production.concurrency).toStrictEqual({
      group: "production-crcorbett-bundjil",
      "cancel-in-progress": false,
    });
  });

  it("checks out the verified source and leaves time to roll back", () => {
    const checkout = deploy.steps.find((step) =>
      step.uses?.startsWith("actions/checkout@")
    );
    expect(checkout?.with).toMatchObject({
      ref: `\${{ github.event.workflow_run.head_sha }}`,
      "persist-credentials": false,
    });
    expect(deploy.env).toStrictEqual({
      BUNDJIL_PRODUCTION_SOURCE_SHA: `\${{ github.event.workflow_run.head_sha }}`,
      BUNDJIL_PRODUCTION_AGENT_CALLBACK_ALIAS: `\${{ vars.BUNDJIL_PRODUCTION_AGENT_CALLBACK_ALIAS }}`,
    });
    const identity = deploy.steps.find(
      (step) => step.name === "Verify checkout identity"
    )?.run;
    expect(identity).toContain(
      'test "$(git rev-parse HEAD)" = "$BUNDJIL_PRODUCTION_SOURCE_SHA"'
    );
    expect(identity).toContain(
      'test "$(git remote get-url origin)" = "https://github.com/crcorbett/bundjil"'
    );
    expect(deploy["timeout-minutes"]).toBe(60);
    expect(
      deploy.steps.every((step) => (step["timeout-minutes"] ?? 0) > 0)
    ).toBeTruthy();
    expect(
      deploy.steps.reduce(
        (total, step) => total + (step["timeout-minutes"] ?? 0),
        0
      )
    ).toBeLessThan(60);
    expect(deploy.steps.at(-1)?.["timeout-minutes"]).toBe(45);
    expect(deploy.steps.at(-1)?.run).toBe("bun run production:deploy:internal");
  });

  it("only passes the six named Production settings to the deploy command", () => {
    const names = [
      "VERCEL_TEAM_ID",
      "AGENT_VERCEL_PROJECT_ID",
      "PROXY_VERCEL_PROJECT_ID",
      "PROXY_HEALTH_URL",
      "AGENT_VERCEL_TOKEN",
      "PROXY_VERCEL_TOKEN",
    ];
    expect(deploy.steps.at(-1)?.env).toStrictEqual(
      Object.fromEntries(
        names.map((name) => [
          `BUNDJIL_PRODUCTION_${name}`,
          `\u0024{{ steps.doppler.outputs.BUNDJIL_PRODUCTION_${name} }}`,
        ])
      )
    );
    for (const app of ["agent", "codex-proxy"]) {
      const config = Schema.decodeUnknownSync(
        Schema.Struct({
          git: Schema.Struct({ deploymentEnabled: Schema.Boolean }),
        })
      )(
        JSON.parse(
          readFileSync(
            new URL(`../apps/${app}/vercel.json`, import.meta.url),
            "utf-8"
          )
        )
      );
      expect(config.git.deploymentEnabled).toBeFalsy();
    }
  });

  it("keeps Actions pinned, checkout credentials disabled and permissions narrow", () => {
    const files = readdirSync(
      new URL("../.github/workflows/", import.meta.url)
    );
    expect(files.toSorted()).toStrictEqual([
      "ci.yml",
      "claude.yml",
      "infrastructure-drift.yml",
      "production.yml",
    ]);
    for (const file of files) {
      const current = workflow(file.replace(".yml", ""));
      expect(current.permissions).toStrictEqual(
        file === "claude.yml"
          ? {
              contents: "read",
              "pull-requests": "read",
              issues: "read",
              "id-token": "write",
            }
          : { contents: "read" }
      );
      for (const job of Object.values(current.jobs)) {
        expect(job.permissions).toBeUndefined();
        expect(job["timeout-minutes"]).toBeGreaterThan(0);
        for (const step of job.steps.filter(
          (entry) => entry.uses !== undefined
        )) {
          expect(step.uses).toMatch(/^[\w./-]+@[a-f0-9]{40}$/u);
        }
        for (const step of job.steps.filter((entry) =>
          entry.uses?.startsWith("actions/checkout@")
        )) {
          expect(step.with?.["persist-credentials"]).toBeFalsy();
        }
      }
    }
  });

  it("runs the same secret-free checks in CI and keeps drift off pull requests", () => {
    const ci = workflow("ci");
    expect(ci.on).toStrictEqual({
      push: { branches: ["main"] },
      pull_request: { branches: ["main"] },
    });
    expect(ci.jobs["verify"]?.steps.at(-1)?.run).toBe("bun run verification");
    const drift = workflow("infrastructure-drift");
    expect(drift.on).toStrictEqual({
      schedule: [{ cron: "17 3 * * 1" }],
      workflow_dispatch: null,
    });
    expect(drift.jobs["preview-report"]?.environment).toBe(
      "infrastructure-read-only-preview"
    );
    expect(drift.jobs["preview-report"]?.env).toMatchObject({
      BUNDJIL_INFRASTRUCTURE_MODE: "sync",
      BUNDJIL_INFRASTRUCTURE_STAGE: "preview",
      BUNDJIL_INFRASTRUCTURE_DRIFT_ACCEPT_UNOWNED: "false",
    });
    expect(
      drift.jobs["preview-report"]?.steps.some(
        (step) =>
          step.run ===
          'bun run --env-file "$RUNNER_TEMP/bundjil-infrastructure-drift.env" infrastructure:drift-report:internal'
      )
    ).toBeTruthy();
  });

  it("only lets Cooper explicitly invoke the read-only Claude workflow", () => {
    const claude = workflow("claude");
    expect(claude.on).toStrictEqual({ issue_comment: { types: ["created"] } });
    expect(claude.jobs["claude"]?.if.replaceAll(/\s+/gu, " ").trim()).toBe(
      "github.actor == 'crcorbett' && startsWith(github.event.comment.body, '@claude')"
    );
    expect(claude.jobs["claude"]?.steps.at(-1)?.with?.["claude_args"]).toBe(
      "--allowedTools=Read,Glob,Grep"
    );
  });
});

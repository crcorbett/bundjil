import { assert } from "@effect/vitest";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, it } from "vitest";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import stableEnvironmentAuthorityPolicy from "../schemas/stable-vercel-environment-authority.schema.json" with { type: "json" };

const authority = {
  schemaVersion: "1",
  principal: "authorized operator",
  identitySource: "authenticated exact-project readback",
  localWrite: true,
  externalAccess: "mutation",
  operations: [
    "read exact Preview Vercel project, environment, Marketplace and Git deployment metadata",
    "update only the four existing sensitive Preview Photon environment bindings by exact environment ID",
    "read and write only BundjilInfrastructure Preview Alchemy state",
    "push only the accepted implementation branch for Vercel Git Preview deployment",
    "observe only Vercel Git-created Preview deployments without create or promotion",
  ],
  resources: [
    "vercel:project:bundjil-agent:environment:preview",
    "vercel:project:bundjil-agent:marketplace:read-only",
    "vercel:project:bundjil-codex-proxy:environment:read-only",
    "vercel:project:bundjil-codex-proxy:marketplace:read-only",
    "alchemy:BundjilInfrastructure:preview",
    "git:crcorbett/bundjil:branch:codex/alchemy-vercel-photon-infrastructure",
    "photon:isolated-preview-project:read-only",
  ],
  environments: ["preview"],
  duration: "bounded task window",
  revocation: "stop before the next operation",
  approvalRequired: true,
  approvalReceipt: "delegation:exact",
  stopConditions: ["stop on identity or plan mismatch"],
  readback: ["read every exact environment identity after write"],
  rollback: ["reapply only an externally retained prior revision"],
  escalation: "preserve redacted evidence and stop",
};

const options = {
  allErrors: true,
  strict: false,
  validateFormats: false,
} as const;

describe("stable Vercel environment authority", () => {
  it("accepts only the exact Preview stable-binding envelope", () => {
    assert.strictEqual(
      new Ajv2020(options).compile(authorityEnvelopeSchema)(authority),
      true
    );
    assert.strictEqual(
      new Ajv2020(options).compile(stableEnvironmentAuthorityPolicy)(authority),
      true
    );
  });

  it("rejects Production, deletion, and broader-resource false greens", () => {
    const validate = new Ajv2020(options).compile(
      stableEnvironmentAuthorityPolicy
    );
    assert.strictEqual(
      validate({ ...authority, environments: ["preview", "production"] }),
      false
    );
    assert.strictEqual(
      validate({
        ...authority,
        operations: [...authority.operations, "delete an environment value"],
      }),
      false
    );
    assert.strictEqual(
      validate({
        ...authority,
        resources: [...authority.resources, "vercel:all-projects"],
      }),
      false
    );
  });
});

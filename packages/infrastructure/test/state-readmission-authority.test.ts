import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import policy from "../schemas/preview-state-readmission-authority.schema.json" with { type: "json" };

const authority = {
  schemaVersion: "1",
  principal: "Cooper",
  identitySource: "Cooper personal provider sessions",
  localWrite: true,
  externalAccess: "mutation",
  operations: ["alchemy-preview-state-readmission"],
  resources: [
    "alchemy:BundjilInfrastructure:preview",
    "r2:bundjil-alchemy-state:bundjil/v1",
    "vercel:bundjil-agent:read-only",
    "vercel:bundjil-codex-proxy:read-only",
    "photon:bundjil-preview:read-only",
    "alchemy-resource:vercel-environment:prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB:hZ4Ea3hhN741T0TZ",
    "alchemy-resource:vercel-environment:prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB:ibc2M4AaGdOfePVg",
    "alchemy-resource:vercel-environment:prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB:MPmsWURGwVFb0xGT",
    "alchemy-resource:vercel-environment:prj_4oEP9KDgGfpiSfxsoT4AvcLrvuVB:ysasVLtSKmcJfzFN",
    "alchemy-resource:vercel-environment:prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN:gyJ7AADGYjvMH88V",
    "alchemy-resource:vercel-environment:prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN:V2TJ2607F2AS8X3S",
    "alchemy-resource:vercel-environment:prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN:vUrZ5VqhnPAeI0sQ",
    "alchemy-resource:vercel-environment:prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN:w6YGQ6AyZ2Sws1H9",
  ],
  environments: ["preview"],
  duration: "one exact operation",
  revocation: "stop before another plan or apply",
  approvalRequired: true,
  approvalReceipt: "approved goal in Codex task",
  stopConditions: ["any plan outside the exact approved updates"],
  readback: ["following Alchemy plan must be unchanged"],
  rollback: [
    "stop and restore the prior accepted manifest under new authority",
  ],
  escalation: "Cooper",
};

describe("Preview state re-admission authority", () => {
  const options = { allErrors: true, strict: false } as const;
  const envelope = new Ajv2020(options).compile(authorityEnvelopeSchema);
  const validate = new Ajv2020(options).compile(policy);

  it("accepts only the fixed Preview state-only operation", () => {
    expect(envelope(authority)).toBeTruthy();
    expect(validate(authority)).toBeTruthy();
    expect(validate({ ...authority, environments: ["prod"] })).toBeFalsy();
    expect(
      validate({
        ...authority,
        operations: ["alchemy-preview-state-readmission", "vercel-update"],
      })
    ).toBeFalsy();
    expect(
      validate({
        ...authority,
        resources: [...authority.resources, "vercel:all-projects"],
      })
    ).toBeFalsy();
  });
});

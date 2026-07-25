import { assert } from "@effect/vitest";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, it } from "vitest";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import vercelGitLinkAuthorityPolicy from "../schemas/vercel-git-link-authority.schema.json" with { type: "json" };

const authority = {
  schemaVersion: "1",
  principal: "authorized operator",
  identitySource: "authenticated exact-project readback",
  localWrite: true,
  externalAccess: "mutation",
  operations: [
    "read exact bundjil-agent Vercel project Git link metadata",
    "connect only bundjil-agent to github:crcorbett/bundjil after absent-link readback",
    "read exact bundjil-agent Vercel project Git link metadata after connect",
    "disconnect only that exact Git link to restore the absent-link rollback state",
  ],
  resources: [
    "vercel:team_1LX7ZujbijowTv8J9k0aU7nD:project:prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN",
    "vercel:project:bundjil-agent:git:github:crcorbett/bundjil",
  ],
  environments: ["preview", "production"],
  duration: "bounded task window",
  revocation: "stop before the next operation",
  approvalRequired: true,
  approvalReceipt: "delegation:exact",
  stopConditions: ["stop on identity mismatch"],
  readback: ["read before and after by exact identity"],
  rollback: ["disconnect only the exact link"],
  escalation: "preserve redacted evidence",
};

const options = {
  allErrors: true,
  strict: false,
  validateFormats: false,
} as const;

describe("Vercel Git-link authority", () => {
  it("accepts only the exact project-global Git-link envelope", () => {
    assert.strictEqual(
      new Ajv2020(options).compile(authorityEnvelopeSchema)(authority),
      true
    );
    assert.strictEqual(
      new Ajv2020(options).compile(vercelGitLinkAuthorityPolicy)(authority),
      true
    );
  });

  it("rejects a Preview-only or wrong-repository false green", () => {
    const validate = new Ajv2020(options).compile(vercelGitLinkAuthorityPolicy);
    assert.strictEqual(
      validate({ ...authority, environments: ["preview"] }),
      false
    );
    assert.strictEqual(
      validate({
        ...authority,
        resources: [
          authority.resources[0],
          "vercel:project:bundjil-agent:git:github:someone-else/bundjil",
        ],
      }),
      false
    );
  });
});

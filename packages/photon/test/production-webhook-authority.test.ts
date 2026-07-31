import { assert } from "@effect/vitest";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, it } from "vitest";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import productionWebhookCutoverAuthorityPolicy from "../schemas/production-webhook-cutover-authority.schema.json" with { type: "json" };

const authority = {
  schemaVersion: "1",
  principal: "authorized operator",
  identitySource: "authenticated exact-project readback",
  localWrite: true,
  externalAccess: "mutation",
  operations: [
    "read exact Production Photon webhook topology",
    "create one parallel Production webhook at the exact approved callback URL",
    "read back the exact new webhook while preserving the original webhook",
    "persist the create-only binding only in the exact mode-0600 local artifact",
  ],
  resources: [
    "photon:source-production-project:webhooks",
    "photon:source-production-project:webhook:original:retain",
    "local:tmp/proof:production-webhook-binding",
  ],
  environments: ["production"],
  duration: "bounded cutover window",
  revocation: "stop before the next operation",
  approvalRequired: true,
  approvalReceipt: "delegation:exact",
  stopConditions: ["stop on identity or topology mismatch"],
  readback: ["read both exact callbacks after create"],
  rollback: ["delete only the rollout-created callback on failure"],
  escalation: "preserve redacted evidence and stop",
};
const options = {
  allErrors: true,
  strict: false,
  validateFormats: false,
} as const;

describe("Production Photon webhook cutover authority", () => {
  it("accepts only the exact parallel-create envelope", () => {
    assert.strictEqual(
      new Ajv2020(options).compile(authorityEnvelopeSchema)(authority),
      true
    );
    assert.strictEqual(
      new Ajv2020(options).compile(productionWebhookCutoverAuthorityPolicy)(
        authority
      ),
      true
    );
  });

  it("rejects Preview, original deletion and broader-resource false greens", () => {
    const validate = new Ajv2020(options).compile(
      productionWebhookCutoverAuthorityPolicy
    );
    assert.strictEqual(
      validate({ ...authority, environments: ["preview"] }),
      false
    );
    assert.strictEqual(
      validate({
        ...authority,
        operations: [...authority.operations, "delete the original webhook"],
      }),
      false
    );
    assert.strictEqual(
      validate({
        ...authority,
        resources: [...authority.resources, "photon:all-projects"],
      }),
      false
    );
  });
});

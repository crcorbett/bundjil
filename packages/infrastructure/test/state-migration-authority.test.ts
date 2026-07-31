import { strict as assert } from "node:assert";

import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, it } from "vitest";

import previewAuthorityPolicy from "../schemas/preview-state-migration-authority.schema.json" with { type: "json" };
import productionAuthorityPolicy from "../schemas/production-state-migration-authority.schema.json" with { type: "json" };

const productionAuthority = {
  externalAccess: "mutation",
  environments: ["production"],
  resources: [
    "alchemy:BundjilInfrastructure:prod:state-only",
    "state-fqn-sha256:0f7472767c87d78ee9863e7e560527be52a17d4f58ef6c8a2dc3faeda5c789a1",
  ],
  operations: [
    "read and back up all BundjilInfrastructure Production Alchemy state rows",
    "delete only the one exact manifest-absent retained state row",
    "restore the complete exact pre-migration Production state from the retained backup",
  ],
  readback: [
    "require 69 rows before, 68 rows after retirement, and zero provider transport calls",
  ],
  rollback: [
    "restore every backed-up row and remove only rows absent from the backup",
  ],
  stopConditions: [
    "state version, stack, stage, manifest digest, row count, status, retain policy, type or fingerprint mismatch",
    "any Vercel, Photon, deployment, credential, billing, webhook or message operation",
  ],
};

describe("state migration authority", () => {
  it("accepts only the exact Production state-only authority", () => {
    const ajv = new Ajv2020({
      allErrors: true,
      strict: false,
      validateFormats: false,
    });
    const validateProduction = ajv.compile(productionAuthorityPolicy);
    const validatePreview = ajv.compile(previewAuthorityPolicy);

    assert.strictEqual(validateProduction(productionAuthority), true);
    assert.strictEqual(validatePreview(productionAuthority), false);
    assert.strictEqual(
      validateProduction({
        ...productionAuthority,
        environments: ["preview"],
      }),
      false
    );
    assert.strictEqual(
      validateProduction({
        ...productionAuthority,
        resources: [
          "alchemy:BundjilInfrastructure:prod:state-only",
          "state-fqn-sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        ],
      }),
      false
    );
  });
});

import { Schema } from "effect";
import { assert, describe, it } from "vitest";

import { WorkspaceSchemaError } from "../src/index.js";

describe("workspace schema error contract", () => {
  it("encodes and decodes only the target tag", () => {
    const expected = {
      _tag: "WorkspaceSchemaError",
      boundary: "WorkspaceStatusSuccess",
      message: "Unable to encode workspace status success.",
      cause: { defect: "fixture" },
    } as const;
    const encoded = Schema.encodeUnknownSync(WorkspaceSchemaError)(
      new WorkspaceSchemaError({
        boundary: "WorkspaceStatusSuccess",
        message: "Unable to encode workspace status success.",
        cause: { defect: "fixture" },
      })
    );

    assert.deepStrictEqual(encoded, expected);

    const decoded = Schema.decodeUnknownSync(WorkspaceSchemaError)(expected);
    assert.strictEqual(decoded._tag, "WorkspaceSchemaError");
    assert.strictEqual(Schema.is(WorkspaceSchemaError)(decoded), true);

    const oldEncoded = { ...expected, _tag: "BundjilAgentSchemaError" };
    assert.strictEqual(Schema.is(WorkspaceSchemaError)(oldEncoded), false);
    assert.throws(() => {
      Schema.decodeUnknownSync(WorkspaceSchemaError)(oldEncoded);
    });
  });
});

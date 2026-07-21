import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tooling/boundary-audit.test.ts",
      "tooling/documentation-policy-audit.test.ts",
      "tooling/documentation-policy.test.ts",
      "tooling/skill-policy-audit.test.ts",
    ],
  },
});

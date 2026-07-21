import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tooling/boundary-audit.test.ts",
      "tooling/documentation-policy-audit.test.ts",
      "tooling/documentation-policy.test.ts",
      "tooling/skill-policy-audit.test.ts",
      "tooling/authority-policy-audit.test.ts",
      "tooling/verification-policy-audit.test.ts",
      "tooling/control-policy.test.ts",
      "tooling/evals/harness-evaluation.test.ts",
    ],
  },
});

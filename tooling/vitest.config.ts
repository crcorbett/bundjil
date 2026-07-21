import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tooling/boundary-audit.test.ts",
      "tooling/documentation-policy.test.ts",
    ],
  },
});

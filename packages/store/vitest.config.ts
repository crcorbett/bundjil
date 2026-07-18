import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { conditions: ["@bundjil/source"] },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**"],
    globals: false,
    include: ["test/**/*.test.ts"],
    passWithNoTests: false,
  },
});

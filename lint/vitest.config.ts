import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    include: ["lint/oxlint-plugin.test.ts"],
  },
});

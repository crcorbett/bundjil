import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import vitest from "ultracite/oxlint/vitest";

export default defineConfig({
  extends: [core, react, vitest],
  ignorePatterns: ["**/dist/**", "**/.turbo/**"],
  jsPlugins: ["./lint/oxlint-plugin.ts"],
  overrides: [
    {
      files: [
        "apps/**/*.ts",
        "apps/**/*.tsx",
        "apps/**/*.mts",
        "apps/**/*.cts",
        "packages/**/*.ts",
        "packages/**/*.tsx",
        "packages/**/*.mts",
        "packages/**/*.cts",
      ],
      rules: {
        "bundjil/tagged-error-name": "error",
      },
    },
  ],
  rules: {
    "eslint/func-names": "off",
    "eslint/func-style": "off",
    "eslint/no-negated-condition": "off",
    "eslint/no-shadow": "off",
    "eslint/no-unused-vars": "off",
    "eslint/require-await": "off",
    "eslint/sort-keys": "off",
    "typescript/no-floating-promises": "off",
    "typescript/no-misused-promises": "off",
    "typescript/promise-function-async": "off",
    "typescript/strict-boolean-expressions": "off",
    "typescript/use-unknown-in-catch-callback-variable": "off",
  },
});

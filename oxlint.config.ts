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
        "bundjil/no-ambient-time-in-effect": "error",
        "bundjil/no-runtime-execution-outside-boundary": "error",
        "bundjil/require-try-promise-catch": "error",
        "bundjil/tagged-error-name": "error",
      },
    },
    {
      files: ["tooling/**/*.ts"],
      rules: {
        "bundjil/no-ambient-time-in-effect": "error",
      },
    },
    {
      files: [
        "apps/agent/agent/**/*.ts",
        "apps/agent/agent/**/*.tsx",
        "apps/agent/agent/**/*.mts",
        "apps/agent/agent/**/*.cts",
        "apps/codex-proxy/src/**/*.ts",
        "apps/codex-proxy/src/**/*.tsx",
        "apps/codex-proxy/src/**/*.mts",
        "apps/codex-proxy/src/**/*.cts",
        "packages/*/src/**/*.ts",
        "packages/*/src/**/*.tsx",
        "packages/*/src/**/*.mts",
        "packages/*/src/**/*.cts",
      ],
      rules: {
        "bundjil/no-async-await-in-effect-service": "error",
        "bundjil/no-primitive-effect-failure": "error",
      },
    },
    {
      files: [
        "packages/infrastructure/scripts/**/*.ts",
        "packages/infrastructure/scripts/**/*.tsx",
        "packages/infrastructure/scripts/**/*.mts",
        "packages/infrastructure/scripts/**/*.cts",
      ],
      rules: {
        "bundjil/no-primitive-effect-failure": "error",
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

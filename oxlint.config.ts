import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import vitest from "ultracite/oxlint/vitest";

const bundjilVitest = {
  ...vitest,
  overrides: vitest.overrides?.map((override) => ({
    ...override,
    rules: {
      ...override.rules,
      // Keep one bounded contract or lifecycle in one test while still
      // rejecting unreviewably large assertion bodies.
      "vitest/max-expects": ["error", { max: 20 }],
    },
  })),
};

export default defineConfig({
  extends: [core, react, bundjilVitest],
  ignorePatterns: [
    "**/dist/**",
    "**/.turbo/**",
    ".agents/**",
    ".claude/**",
    ".cursor/**",
    "lint/fixtures/**",
    "tooling/codec-provenance.fixture.ts",
    "tools/oxlint/anti-slop/**",
  ],
  jsPlugins: [
    "./lint/oxlint-plugin.ts",
    {
      name: "anti-slop",
      specifier: "./tools/oxlint/anti-slop/index.ts",
    },
    {
      name: "anti-slop-effect",
      specifier: "./tools/oxlint/anti-slop/effect/index.ts",
    },
  ],
  overrides: [
    {
      files: ["**/*.{ts,tsx,mts,cts}"],
      rules: {
        "no-redeclare": "off",
      },
    },
    {
      // The local lint plugin reads Oxc's untyped ESTree nodes. Runtime
      // representation checks are the parser boundary in this one file.
      files: ["lint/oxlint-plugin.ts"],
      rules: {
        "anti-slop/no-runtime-typeof": "off",
      },
    },
    {
      // These are the named ingress owners for provider, YAML and process
      // values. They must accept unknown data before their local decoder can
      // establish the domain contract.
      files: [
        "apps/agent/scripts/production-preflight.ts",
        "apps/codex-proxy/src/env.ts",
        "packages/codex/src/provider/contracts.ts",
        "packages/photon/src/client.ts",
        "tooling/authority-policy.ts",
      ],
      rules: {
        "anti-slop/no-unknown-parameters": "off",
      },
    },
    {
      // These parser implementations inspect raw container representations
      // before returning a decoded, frozen or observed domain value.
      files: [
        "packages/codex/src/provider/contracts.ts",
        "packages/photon/src/client.ts",
        "tooling/authority-policy.ts",
      ],
      rules: {
        "anti-slop/no-runtime-typeof": "off",
      },
    },
    {
      // The SDK failure observer owns a deliberately opaque provider value;
      // the authority parser owns a deliberately open YAML mapping.
      files: ["packages/photon/src/client.ts", "tooling/authority-policy.ts"],
      rules: {
        "anti-slop/no-known-value-widening": "off",
      },
    },
    {
      files: ["packages/codex/src/provider/contracts.ts"],
      rules: {
        "anti-slop/no-object-parameters": "off",
      },
    },
    {
      files: ["packages/photon/src/client.ts"],
      rules: {
        "anti-slop/no-unknown-returns": "off",
      },
    },
    {
      files: ["tooling/authority-policy.ts"],
      rules: {
        "anti-slop/no-unsafe-dictionary-type": "off",
      },
    },
    {
      // These raw adapter surfaces return provider-owned values. Their live
      // Layers decode each result before it reaches a public Bundjil service.
      files: ["packages/store/src/upstash-client.internal.ts"],
      rules: {
        "anti-slop/no-unknown-returns": "off",
      },
    },
    {
      // These narrow host adapters inspect process or request representations
      // at their owning boundary before returning decoded domain values.
      files: [
        "packages/codex/scripts/stage-near-expiry-profile.ts",
        "packages/codex/src/provider/request-mapper.ts",
      ],
      rules: {
        "anti-slop/no-runtime-typeof": "off",
      },
    },
    {
      // These contract tests deliberately inject unknown or malformed provider
      // values so they can prove the owning decoder rejects them.
      files: [
        "apps/agent/test/production-preflight.test.ts",
        "packages/codex/test/codex-direct-provider.test.ts",
        "packages/codex/test/codex-oauth.test.ts",
        "packages/codex/test/codex-responses-proof.test.ts",
        "packages/codex/test/error-contracts.test.ts",
        "packages/codex/test/local-profile-import.test.ts",
        "packages/codex/test/profile-commit.test.ts",
        "packages/codex/test/subscription-login.test.ts",
        "packages/infrastructure/test-alchemy/vercel-stable-environment-provider.test.ts",
        "packages/infrastructure/test/adoption-manifest.test.ts",
        "packages/infrastructure/test/vercel-contracts.test.ts",
        "packages/photon/test/management-read.test.ts",
        "packages/store/test/atomic-key-value-store.test.ts",
        "packages/store/test/upstash-atomic-key-value-store.test.ts",
      ],
      rules: {
        "anti-slop/no-unknown-parameters": "off",
      },
    },
    {
      // These tests assert the exact host representation returned by Fetch,
      // Bun, Node streams or a provider-shaped fixture.
      files: [
        "apps/agent/test/eve-auth-policy.test.ts",
        "apps/agent/test/executor-connection.test.ts",
        "apps/agent/test/model-provider.test.ts",
        "apps/codex-proxy/test/prove-preview.test.ts",
        "packages/codex/test/codex-direct-provider.test.ts",
        "packages/codex/test/codex-responses-proof.test.ts",
        "packages/photon/test/photon-transport.test.ts",
      ],
      rules: {
        "anti-slop/no-runtime-typeof": "off",
      },
    },
    {
      // This proof checks that decoded nested objects are frozen without
      // weakening the public Codex JSON contract to expose test-only fields.
      files: ["packages/codex/test/codex-responses-proof.test.ts"],
      rules: {
        "anti-slop/no-reflect-get": "off",
      },
    },
    {
      // These two files are the package-owned live and controlled-test Layer
      // composition roots. They consume private service constructors so every
      // other runtime consumer can import a closed Layer.
      files: [
        "packages/codex/src/runtime.ts",
        "packages/codex/src/testing/index.ts",
      ],
      rules: {
        "anti-slop-effect/no-service-constructor-imports": "off",
      },
    },
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
        "apps/*/agent/**/*.ts",
        "apps/*/agent/**/*.tsx",
        "apps/*/agent/**/*.mts",
        "apps/*/agent/**/*.cts",
        "apps/*/src/**/*.ts",
        "apps/*/src/**/*.tsx",
        "apps/*/src/**/*.mts",
        "apps/*/src/**/*.cts",
        "apps/*/scripts/**/*.ts",
        "apps/*/scripts/**/*.tsx",
        "apps/*/scripts/**/*.mts",
        "apps/*/scripts/**/*.cts",
        "packages/*/src/**/*.ts",
        "packages/*/src/**/*.tsx",
        "packages/*/src/**/*.mts",
        "packages/*/src/**/*.cts",
        "packages/*/scripts/**/*.ts",
        "packages/*/scripts/**/*.tsx",
        "packages/*/scripts/**/*.mts",
        "packages/*/scripts/**/*.cts",
      ],
      rules: {
        "bundjil/no-exported-effect-gen-function": "error",
        "bundjil/no-unregistered-native-collection": "error",
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
        "bundjil/no-layer-or-die-in-service": "error",
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
        "bundjil/no-layer-or-die-in-service": "error",
        "bundjil/no-primitive-effect-failure": "error",
      },
    },
  ],
  rules: {
    "anti-slop/no-chained-type-assertions": "error",
    "anti-slop/no-conditional-empty-object-spread": "error",
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-module-mocking": "error",
    "anti-slop/no-object-parameters": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    "anti-slop/no-runtime-typeof": "error",
    "anti-slop/no-shape-in-symbol-names": "error",
    "anti-slop/no-unknown-parameters": "error",
    "anti-slop/no-unknown-returns": "error",
    "anti-slop/no-unknown-type-aliases": "error",
    "anti-slop/no-unsafe-dictionary-type": "error",
    "anti-slop/no-widen-then-assert": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "error",
    "anti-slop-effect/no-service-constructor-imports": "error",
    "eslint/func-names": "off",
    "eslint/func-style": "off",
    "eslint/max-classes-per-file": "off",
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
    "unicorn/no-negated-condition": "off",
  },
});

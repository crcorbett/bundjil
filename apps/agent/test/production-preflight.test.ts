import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { describe, expect, it as vitestIt } from "vitest";

import {
  preflightProductionPromotion,
  ProductionPreflightSnapshot,
} from "../agent/production-preflight.js";

const fingerprint = (prefix: string) => prefix.repeat(64);

const fixture = {
  adapter: "vercel-readonly-metadata-v1",
  agent: {
    deploymentProtection: true,
    eveAuth: true,
    modelProvider: "codex-proxy",
    project: "bundjil-agent",
    proxyBaseUrl: "https://bundjil-codex-proxy.vercel.app/v1",
    scope: "personal",
    stableDomain: "bundjil-agent.vercel.app",
    variables: [
      {
        name: "BUNDJIL_AGENT_MODEL_PROVIDER",
        target: "production",
        type: "encrypted",
      },
      {
        name: "BUNDJIL_CODEX_PROXY_BASE_URL",
        target: "production",
        type: "encrypted",
      },
      {
        name: "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
        target: "production",
        type: "sensitive",
      },
    ],
  },
  previewIdentity: {
    cipherKeyId: "preview-key",
    derivedFenceKeyFingerprint: fingerprint("a"),
    derivedLockKeyFingerprint: fingerprint("b"),
    derivedProfileKeyFingerprint: fingerprint("c"),
    namespaceFingerprint: fingerprint("d"),
    subjectFingerprint: fingerprint("e"),
  },
  productionIdentity: {
    cipherKeyId: "production-key",
    derivedFenceKeyFingerprint: fingerprint("f"),
    derivedLockKeyFingerprint: fingerprint("0"),
    derivedProfileKeyFingerprint: fingerprint("1"),
    namespaceFingerprint: fingerprint("2"),
    subjectFingerprint: fingerprint("3"),
  },
  proxy: {
    deploymentProtection: true,
    mode: "live",
    project: "bundjil-codex-proxy",
    scope: "personal",
    stableDomain: "bundjil-codex-proxy.vercel.app",
    variables: [
      {
        name: "BUNDJIL_CODEX_PROXY_MODE",
        target: "production",
        type: "sensitive",
      },
      {
        name: "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
        target: "production",
        type: "sensitive",
      },
      { name: "BUNDJIL_CODEX_PROFILE_ID", target: "production", type: "plain" },
      {
        name: "BUNDJIL_CODEX_CONNECTOR_ID",
        target: "production",
        type: "plain",
      },
      {
        name: "BUNDJIL_CODEX_INSTALLATION_ID",
        target: "production",
        type: "plain",
      },
      { name: "BUNDJIL_CODEX_SUBJECT_ID", target: "production", type: "plain" },
      {
        name: "BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY",
        target: "production",
        type: "sensitive",
      },
      {
        name: "BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID",
        target: "production",
        type: "sensitive",
      },
      {
        name: "BUNDJIL_UPSTASH_REDIS_REST_URL",
        target: "production",
        type: "sensitive",
      },
      {
        name: "BUNDJIL_UPSTASH_REDIS_REST_TOKEN",
        target: "production",
        type: "sensitive",
      },
      {
        name: "BUNDJIL_UPSTASH_REDIS_KEY_PREFIX",
        target: "production",
        type: "encrypted",
      },
    ],
  },
  readOnly: true,
  rollback: { agentDeploymentId: "dpl_agent", proxyDeploymentId: "dpl_proxy" },
} as const;

const decodeFixture = (input: unknown) =>
  Schema.decodeUnknownEffect(ProductionPreflightSnapshot)(input);

describe("Production promotion preflight", () => {
  it.effect(
    "accepts a personal-scope, live, isolated Production metadata snapshot",
    () =>
      Effect.gen(function* () {
        const evidence = yield* decodeFixture(fixture).pipe(
          Effect.andThen(preflightProductionPromotion)
        );

        assert.strictEqual(evidence.go, true);
        assert.deepStrictEqual(evidence.rejected, []);
      })
  );

  it.effect("rejects secret bindings downgraded to plain text", () =>
    Effect.gen(function* () {
      const evidence = yield* decodeFixture({
        ...fixture,
        agent: {
          ...fixture.agent,
          variables: fixture.agent.variables.map((variable) =>
            variable.name === "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"
              ? { ...variable, type: "plain" }
              : variable
          ),
        },
        proxy: {
          ...fixture.proxy,
          variables: fixture.proxy.variables.map((variable) =>
            variable.name === "BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY"
              ? { ...variable, type: "plain" }
              : variable
          ),
        },
      }).pipe(Effect.andThen(preflightProductionPromotion));

      assert.strictEqual(evidence.go, false);
      assert.deepStrictEqual(evidence.rejected, [
        "missing-production-variable:BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
        "missing-production-variable:BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY",
      ]);
    })
  );

  it.effect(
    "rejects wrong projects, stale hosts, absent Eve auth, wrong mode, missing bindings, shared identity, protection, and rollback references",
    () =>
      Effect.gen(function* () {
        const evidence = yield* decodeFixture({
          ...fixture,
          agent: {
            ...fixture.agent,
            deploymentProtection: false,
            eveAuth: false,
            project: "wrong-agent",
            proxyBaseUrl: "https://preview-bundjil-codex-proxy.vercel.app/v1",
            variables: [],
          },
          productionIdentity: fixture.previewIdentity,
          proxy: {
            ...fixture.proxy,
            mode: "mock",
            project: "wrong-proxy",
            variables: [],
          },
          rollback: { agentDeploymentId: "", proxyDeploymentId: "" },
        }).pipe(Effect.andThen(preflightProductionPromotion));

        assert.strictEqual(evidence.go, false);
        assert.deepStrictEqual(evidence.rejected, [
          "wrong-agent-project",
          "wrong-proxy-project",
          "missing-deployment-protection",
          "missing-eve-auth",
          "wrong-proxy-mode",
          "stale-or-nonproduction-proxy-host",
          "missing-production-variable:BUNDJIL_AGENT_MODEL_PROVIDER",
          "missing-production-variable:BUNDJIL_CODEX_PROXY_BASE_URL",
          "missing-production-variable:BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
          "missing-production-variable:BUNDJIL_CODEX_PROXY_MODE",
          "missing-production-variable:BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
          "missing-production-variable:BUNDJIL_CODEX_PROFILE_ID",
          "missing-production-variable:BUNDJIL_CODEX_CONNECTOR_ID",
          "missing-production-variable:BUNDJIL_CODEX_INSTALLATION_ID",
          "missing-production-variable:BUNDJIL_CODEX_SUBJECT_ID",
          "missing-production-variable:BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY",
          "missing-production-variable:BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID",
          "missing-production-variable:BUNDJIL_UPSTASH_REDIS_REST_URL",
          "missing-production-variable:BUNDJIL_UPSTASH_REDIS_REST_TOKEN",
          "missing-production-variable:BUNDJIL_UPSTASH_REDIS_KEY_PREFIX",
          "shared-preview-production-identity",
          "missing-accepted-rollback-reference",
        ]);
      })
  );

  vitestIt(
    "fails closed when target bindings, scope, or the read-only capability are absent",
    () => {
      expect(() =>
        Schema.decodeUnknownSync(ProductionPreflightSnapshot)({
          ...fixture,
          agent: {
            ...fixture.agent,
            variables: fixture.agent.variables.map((variable) => ({
              ...variable,
              target: "preview",
            })),
          },
        })
      ).toThrow("Expected");
      expect(() =>
        Schema.decodeUnknownSync(ProductionPreflightSnapshot)({
          ...fixture,
          proxy: { ...fixture.proxy, scope: "team" },
        })
      ).toThrow("Expected");
      expect(() =>
        Schema.decodeUnknownSync(ProductionPreflightSnapshot)({
          ...fixture,
          readOnly: false,
        })
      ).toThrow("Expected");
    }
  );
});

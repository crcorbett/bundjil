import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { describe, expect, it as vitestIt } from "vitest";

import {
  preflightProductionPromotion,
  ProductionPreflightSnapshot,
} from "../agent/production-preflight.js";

const fingerprint = (character: string) => character.repeat(64);

const beforeFirstMutation = {
  adapter: "vercel-readonly-metadata-v1",
  agent: {
    deploymentProtection: true,
    project: "bundjil-agent",
    scope: "personal",
    stableDomain: "bundjil-agent.vercel.app",
    teamId: "team_1LX7ZujbijowTv8J9k0aU7nD",
  },
  operationAuthority: "external-receipt-required",
  inventory: {
    previewIdentityReuse: false,
    productionAgentActivation: "absent",
    productionProxyActivation: "absent",
  },
  proxy: {
    deploymentProtection: true,
    project: "bundjil-codex-proxy",
    scope: "personal",
    stableDomain: "bundjil-codex-proxy.vercel.app",
    teamId: "team_1LX7ZujbijowTv8J9k0aU7nD",
  },
  readOnly: true,
  source: {
    clean: true,
    pushedSha: "0f30d3b000000000000000000000000000000000",
  },
  stage: "before-first-mutation",
} as const;

const proxyProvisioned = {
  ...beforeFirstMutation,
  inventory: {
    previewIdentityReuse: false,
    productionAgentActivation: "absent",
    productionProxyActivation: "provisioned",
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
    ...beforeFirstMutation.proxy,
    mode: "live",
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
        name: "KV_REST_API_URL",
        target: "production",
        type: "sensitive",
      },
      {
        name: "KV_REST_API_TOKEN",
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
  stage: "proxy-provisioned",
  storedProfileProof: {
    ciphertextPresent: true,
    envelopeVersion2: true,
    expiryValid: true,
    found: true,
    markerLeakFalse: true,
    profileKindSubscription: true,
    refreshCapable: true,
    requiresReauthenticationFalse: true,
  },
} as const;

const proxyAcceptedAgentConfigured = {
  ...proxyProvisioned,
  acceptedProxy: {
    configFingerprint: fingerprint("4"),
    deploymentId: "dpl_proxycurrent",
    sourceSha: beforeFirstMutation.source.pushedSha,
    stableUrl: "https://bundjil-codex-proxy.vercel.app/v1",
  },
  agent: {
    ...beforeFirstMutation.agent,
    bearerFingerprint: fingerprint("5"),
    eveAuth: {
      anonymousFallback: false,
      deployedLocalDev: false,
      vercelOidc: true,
    },
    modelProvider: "codex-proxy",
    proxyBaseUrl: "https://bundjil-codex-proxy.vercel.app/v1",
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
  inventory: {
    previewIdentityReuse: false,
    productionAgentActivation: "configured",
    productionProxyActivation: "accepted",
  },
  previewBearerFingerprint: fingerprint("6"),
  stage: "proxy-accepted-agent-configured",
} as const;

const agentAcceptedRollbackReady = {
  ...proxyAcceptedAgentConfigured,
  acceptedAgent: {
    configFingerprint: fingerprint("7"),
    deploymentId: "dpl_agentcurrent",
    sourceSha: beforeFirstMutation.source.pushedSha,
  },
  rollback: {
    agent: {
      current: {
        configFingerprint: fingerprint("7"),
        deploymentId: "dpl_agentcurrent",
      },
      previous: {
        configFingerprint: fingerprint("8"),
        deploymentId: "dpl_agentprevious",
      },
    },
    proxy: {
      current: {
        configFingerprint: fingerprint("4"),
        deploymentId: "dpl_proxycurrent",
      },
      previous: {
        configFingerprint: fingerprint("9"),
        deploymentId: "dpl_proxyprevious",
      },
    },
  },
  inventory: {
    previewIdentityReuse: false,
    productionAgentActivation: "accepted",
    productionProxyActivation: "accepted",
  },
  stage: "agent-accepted-rollback-ready",
} as const;

const sendblueFinalPromotion = {
  ...agentAcceptedRollbackReady,
  rollbackDrill: { completed: true },
  sendblue: { productionActivated: false },
  soak: { completed: true },
  stage: "sendblue-final-promotion",
} as const;

const decode = (input: unknown) =>
  Schema.decodeUnknownEffect(ProductionPreflightSnapshot, {
    onExcessProperty: "error",
  })(input);

describe("Production promotion preflight", () => {
  for (const fixture of [
    beforeFirstMutation,
    proxyProvisioned,
    proxyAcceptedAgentConfigured,
    agentAcceptedRollbackReady,
    sendblueFinalPromotion,
  ]) {
    it.effect(`accepts the ${fixture.stage} checkpoint`, () =>
      Effect.gen(function* () {
        const evidence = yield* decode(fixture).pipe(
          Effect.andThen(preflightProductionPromotion)
        );

        assert.strictEqual(evidence.go, true);
        assert.deepStrictEqual(evidence.rejected, []);
        assert.strictEqual(evidence.stage, fixture.stage);
      })
    );
  }

  vitestIt("rejects missing and premature checkpoint evidence", () => {
    expect(() =>
      decode(beforeFirstMutation).pipe(Effect.runSync)
    ).not.toThrow();
    expect(() =>
      decode({ ...beforeFirstMutation, operationAuthority: undefined }).pipe(
        Effect.runSync
      )
    ).toThrow("Expected");
    expect(() =>
      decode({
        ...beforeFirstMutation,
        approval: "granted",
        operationAuthority: undefined,
      }).pipe(Effect.runSync)
    ).toThrow("Unexpected key");
    expect(() =>
      decode({ ...proxyProvisioned, storedProfileProof: undefined }).pipe(
        Effect.runSync
      )
    ).toThrow("Expected");
    expect(() =>
      decode({
        ...proxyAcceptedAgentConfigured,
        acceptedProxy: undefined,
      }).pipe(Effect.runSync)
    ).toThrow("Expected");
    expect(() =>
      decode({ ...agentAcceptedRollbackReady, rollback: undefined }).pipe(
        Effect.runSync
      )
    ).toThrow("Expected");
    expect(() =>
      decode({ ...sendblueFinalPromotion, soak: undefined }).pipe(
        Effect.runSync
      )
    ).toThrow("Expected");
    expect(() =>
      decode({
        ...beforeFirstMutation,
        proxy: { ...beforeFirstMutation.proxy, mode: "live" },
      }).pipe(Effect.runSync)
    ).toThrow("Unexpected key");
    expect(() =>
      decode({
        ...proxyProvisioned,
        acceptedProxy: proxyAcceptedAgentConfigured.acceptedProxy,
      }).pipe(Effect.runSync)
    ).toThrow("Unexpected key");
    expect(() =>
      decode({
        ...proxyAcceptedAgentConfigured,
        acceptedAgent: agentAcceptedRollbackReady.acceptedAgent,
      }).pipe(Effect.runSync)
    ).toThrow("Unexpected key");
    expect(() =>
      decode({ ...agentAcceptedRollbackReady, soak: { completed: true } }).pipe(
        Effect.runSync
      )
    ).toThrow("Unexpected key");
    expect(() =>
      decode({
        ...sendblueFinalPromotion,
        sendblue: { productionActivated: false, variables: [] },
      }).pipe(Effect.runSync)
    ).toThrow("Unexpected key");
  });

  it.effect("rejects plain secret bindings and shared identities", () =>
    Effect.gen(function* () {
      const evidence = yield* decode({
        ...proxyProvisioned,
        productionIdentity: proxyProvisioned.previewIdentity,
        proxy: {
          ...proxyProvisioned.proxy,
          variables: proxyProvisioned.proxy.variables.map((variable) =>
            variable.name === "BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY"
              ? { ...variable, type: "plain" }
              : variable
          ),
        },
      }).pipe(Effect.andThen(preflightProductionPromotion));

      assert.strictEqual(evidence.go, false);
      assert.deepStrictEqual(evidence.rejected, [
        "missing-production-variable:BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY",
        "shared-preview-production-identity",
      ]);
    })
  );

  it.effect(
    "requires sensitive metadata for both internal bearer bindings",
    () =>
      Effect.gen(function* () {
        for (const type of ["plain", "encrypted"] as const) {
          const proxyEvidence = yield* decode({
            ...proxyProvisioned,
            proxy: {
              ...proxyProvisioned.proxy,
              variables: proxyProvisioned.proxy.variables.map((variable) =>
                variable.name === "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"
                  ? { ...variable, type }
                  : variable
              ),
            },
          }).pipe(Effect.andThen(preflightProductionPromotion));

          assert.deepStrictEqual(proxyEvidence.rejected, [
            "missing-production-variable:BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
          ]);

          const agentEvidence = yield* decode({
            ...proxyAcceptedAgentConfigured,
            agent: {
              ...proxyAcceptedAgentConfigured.agent,
              variables: proxyAcceptedAgentConfigured.agent.variables.map(
                (variable) =>
                  variable.name === "BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN"
                    ? { ...variable, type }
                    : variable
              ),
            },
          }).pipe(Effect.andThen(preflightProductionPromotion));

          assert.deepStrictEqual(agentEvidence.rejected, [
            "missing-production-variable:BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN",
          ]);
        }
      })
  );

  it.effect(
    "accepts exactly one runtime Upstash alias family and rejects ambiguous aliases",
    () =>
      Effect.gen(function* () {
        const directRuntime = yield* decode({
          ...proxyProvisioned,
          proxy: {
            ...proxyProvisioned.proxy,
            variables: proxyProvisioned.proxy.variables.map((variable) => {
              if (variable.name === "KV_REST_API_URL") {
                return { ...variable, name: "UPSTASH_REDIS_REST_URL" };
              }
              if (variable.name === "KV_REST_API_TOKEN") {
                return { ...variable, name: "UPSTASH_REDIS_REST_TOKEN" };
              }
              return variable;
            }),
          },
        }).pipe(Effect.andThen(preflightProductionPromotion));

        assert.strictEqual(directRuntime.go, true);

        const ambiguous = yield* decode({
          ...proxyProvisioned,
          proxy: {
            ...proxyProvisioned.proxy,
            variables: [
              ...proxyProvisioned.proxy.variables,
              {
                name: "UPSTASH_REDIS_REST_URL",
                target: "production",
                type: "sensitive",
              },
              {
                name: "UPSTASH_REDIS_REST_TOKEN",
                target: "production",
                type: "sensitive",
              },
            ],
          },
        }).pipe(Effect.andThen(preflightProductionPromotion));

        assert.deepStrictEqual(ambiguous.rejected, [
          "ambiguous-production-variable:UPSTASH_REDIS_REST_URL|KV_REST_API_URL",
          "ambiguous-production-variable:UPSTASH_REDIS_REST_TOKEN|KV_REST_API_TOKEN",
        ]);
      })
  );

  it.effect(
    "rejects mismatched accepted source and current rollback evidence",
    () =>
      Effect.gen(function* () {
        const sourceEvidence = yield* decode({
          ...agentAcceptedRollbackReady,
          acceptedAgent: {
            ...agentAcceptedRollbackReady.acceptedAgent,
            sourceSha: "a".repeat(40),
          },
          acceptedProxy: {
            ...agentAcceptedRollbackReady.acceptedProxy,
            sourceSha: "b".repeat(40),
          },
        }).pipe(Effect.andThen(preflightProductionPromotion));

        assert.deepStrictEqual(sourceEvidence.rejected, [
          "accepted-proxy-source-mismatch",
          "accepted-agent-source-mismatch",
        ]);

        const deploymentEvidence = yield* decode({
          ...agentAcceptedRollbackReady,
          rollback: {
            agent: {
              ...agentAcceptedRollbackReady.rollback.agent,
              current: {
                ...agentAcceptedRollbackReady.rollback.agent.current,
                deploymentId: "dpl_wrongagent",
              },
            },
            proxy: {
              ...agentAcceptedRollbackReady.rollback.proxy,
              current: {
                ...agentAcceptedRollbackReady.rollback.proxy.current,
                deploymentId: "dpl_wrongproxy",
              },
            },
          },
        }).pipe(Effect.andThen(preflightProductionPromotion));

        assert.deepStrictEqual(deploymentEvidence.rejected, [
          "proxy-current-rollback-mismatch",
          "agent-current-rollback-mismatch",
        ]);

        const configEvidence = yield* decode({
          ...agentAcceptedRollbackReady,
          rollback: {
            agent: {
              ...agentAcceptedRollbackReady.rollback.agent,
              current: {
                ...agentAcceptedRollbackReady.rollback.agent.current,
                configFingerprint: fingerprint("a"),
              },
            },
            proxy: {
              ...agentAcceptedRollbackReady.rollback.proxy,
              current: {
                ...agentAcceptedRollbackReady.rollback.proxy.current,
                configFingerprint: fingerprint("b"),
              },
            },
          },
        }).pipe(Effect.andThen(preflightProductionPromotion));

        assert.deepStrictEqual(configEvidence.rejected, [
          "proxy-current-rollback-mismatch",
          "agent-current-rollback-mismatch",
        ]);

        const sharedPreviousConfig = yield* decode({
          ...agentAcceptedRollbackReady,
          rollback: {
            agent: {
              ...agentAcceptedRollbackReady.rollback.agent,
              previous: {
                ...agentAcceptedRollbackReady.rollback.agent.previous,
                configFingerprint:
                  agentAcceptedRollbackReady.rollback.agent.current
                    .configFingerprint,
              },
            },
            proxy: {
              ...agentAcceptedRollbackReady.rollback.proxy,
              previous: {
                ...agentAcceptedRollbackReady.rollback.proxy.previous,
                configFingerprint:
                  agentAcceptedRollbackReady.rollback.proxy.current
                    .configFingerprint,
              },
            },
          },
        }).pipe(Effect.andThen(preflightProductionPromotion));

        assert.strictEqual(sharedPreviousConfig.go, true);
      })
  );

  vitestIt(
    "fails closed for wrong targets, scope, mode, hosts, OIDC, immutable references, and read-only state",
    () => {
      expect(() =>
        decode({
          ...proxyProvisioned,
          proxy: {
            ...proxyProvisioned.proxy,
            variables: proxyProvisioned.proxy.variables.map((variable) => ({
              ...variable,
              target: "preview",
            })),
          },
        }).pipe(Effect.runSync)
      ).toThrow("Expected");
      expect(() =>
        decode({
          ...beforeFirstMutation,
          agent: { ...beforeFirstMutation.agent, scope: "team" },
        }).pipe(Effect.runSync)
      ).toThrow("Expected");
      expect(() =>
        decode({
          ...beforeFirstMutation,
          agent: { ...beforeFirstMutation.agent, teamId: "team_wrong" },
        }).pipe(Effect.runSync)
      ).toThrow("Expected");
      expect(() =>
        decode({
          ...beforeFirstMutation,
          proxy: { ...beforeFirstMutation.proxy, teamId: "team_wrong" },
        }).pipe(Effect.runSync)
      ).toThrow("Expected");
      expect(() =>
        decode({
          ...proxyProvisioned,
          inventory: {
            ...proxyProvisioned.inventory,
            productionProxyActivation: "absent",
          },
        }).pipe(Effect.runSync)
      ).toThrow("Expected");
      expect(() =>
        decode({
          ...proxyAcceptedAgentConfigured,
          inventory: {
            ...proxyAcceptedAgentConfigured.inventory,
            productionAgentActivation: "accepted",
          },
        }).pipe(Effect.runSync)
      ).toThrow("Expected");
      expect(() =>
        decode({
          ...agentAcceptedRollbackReady,
          inventory: {
            ...agentAcceptedRollbackReady.inventory,
            productionAgentActivation: "configured",
          },
        }).pipe(Effect.runSync)
      ).toThrow("Expected");
      expect(() =>
        decode({
          ...proxyProvisioned,
          proxy: { ...proxyProvisioned.proxy, mode: "mock" },
        }).pipe(Effect.runSync)
      ).toThrow("Expected");
      for (const stableUrl of [
        "http://bundjil-codex-proxy.vercel.app/v1",
        "https://operator@bundjil-codex-proxy.vercel.app/v1",
        "https://operator:password@bundjil-codex-proxy.vercel.app/v1",
        "https://bundjil-codex-proxy.vercel.app:443/v1",
        "https://bundjil-codex-proxy.vercel.app:8443/v1",
        "https://bundjil-codex-proxy.vercel.app/v1?bypass=present",
        "https://bundjil-codex-proxy.vercel.app/v1#fragment",
      ]) {
        expect(() =>
          decode({
            ...proxyAcceptedAgentConfigured,
            acceptedProxy: {
              ...proxyAcceptedAgentConfigured.acceptedProxy,
              stableUrl,
            },
          }).pipe(Effect.runSync)
        ).toThrow("Expected");
      }
      expect(() =>
        decode({
          ...proxyAcceptedAgentConfigured,
          agent: {
            ...proxyAcceptedAgentConfigured.agent,
            proxyBaseUrl:
              "https://bundjil-codex-proxy.vercel.app/v1?bypass=present",
          },
        }).pipe(Effect.runSync)
      ).toThrow("Expected");
      expect(() =>
        decode({
          ...proxyAcceptedAgentConfigured,
          agent: {
            ...proxyAcceptedAgentConfigured.agent,
            eveAuth: {
              ...proxyAcceptedAgentConfigured.agent.eveAuth,
              vercelOidc: false,
            },
          },
        }).pipe(Effect.runSync)
      ).toThrow("Expected");
      expect(() =>
        decode({
          ...agentAcceptedRollbackReady,
          rollback: {
            ...agentAcceptedRollbackReady.rollback,
            proxy: {
              ...agentAcceptedRollbackReady.rollback.proxy,
              previous: agentAcceptedRollbackReady.rollback.proxy.current,
            },
          },
        }).pipe(Effect.runSync)
      ).toThrow("distinct deployments");
      expect(() =>
        decode({ ...beforeFirstMutation, readOnly: false }).pipe(Effect.runSync)
      ).toThrow("Expected");
    }
  );
});

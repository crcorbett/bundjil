import { Data, Effect, Schema } from "effect";

import { AgentModelProviderMode } from "./model-provider.js";

const VercelVariableType = Schema.Literals(["encrypted", "plain", "sensitive"]);

type VercelVariableKind = typeof VercelVariableType.Type;
type ExpectedVariableBinding = readonly [
  name: string,
  allowedTypes: readonly VercelVariableKind[],
];

const ImmutableDeploymentReference = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^dpl_[A-Za-z0-9]+$/))
);

const ImmutableSourceReference = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{40}$/))
);

const OpaqueIdentityFingerprint = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/))
);

const PersonalVercelTeamId = Schema.Literal("team_1LX7ZujbijowTv8J9k0aU7nD");

const ProductionProxyUrl = Schema.Literal(
  "https://bundjil-codex-proxy.vercel.app/v1"
).pipe(Schema.decodeTo(Schema.URLFromString));

const VercelProductionVariable = Schema.Struct({
  name: Schema.NonEmptyString,
  target: Schema.Literal("production"),
  type: VercelVariableType,
});

const agentProjectFields = {
  deploymentProtection: Schema.Literal(true),
  project: Schema.Literal("bundjil-agent"),
  scope: Schema.Literal("personal"),
  stableDomain: Schema.Literal("bundjil-agent.vercel.app"),
  teamId: PersonalVercelTeamId,
} as const;

const proxyProjectFields = {
  deploymentProtection: Schema.Literal(true),
  project: Schema.Literal("bundjil-codex-proxy"),
  scope: Schema.Literal("personal"),
  stableDomain: Schema.Literal("bundjil-codex-proxy.vercel.app"),
  teamId: PersonalVercelTeamId,
} as const;

const ProductionIdentity = Schema.Struct({
  cipherKeyId: Schema.NonEmptyString,
  derivedFenceKeyFingerprint: OpaqueIdentityFingerprint,
  derivedLockKeyFingerprint: OpaqueIdentityFingerprint,
  derivedProfileKeyFingerprint: OpaqueIdentityFingerprint,
  namespaceFingerprint: OpaqueIdentityFingerprint,
  subjectFingerprint: OpaqueIdentityFingerprint,
});

const commonSnapshotFields = {
  adapter: Schema.Literal("vercel-readonly-metadata-v1"),
  agent: Schema.Struct(agentProjectFields),
  approval: Schema.Literal("granted"),
  proxy: Schema.Struct(proxyProjectFields),
  readOnly: Schema.Literal(true),
  source: Schema.Struct({
    clean: Schema.Literal(true),
    pushedSha: ImmutableSourceReference,
  }),
} as const;

const proxyProvisionedFields = {
  ...commonSnapshotFields,
  inventory: Schema.Struct({
    previewIdentityReuse: Schema.Literal(false),
    productionAgentActivation: Schema.Literal("absent"),
    productionProxyActivation: Schema.Literal("provisioned"),
  }),
  previewIdentity: ProductionIdentity,
  productionIdentity: ProductionIdentity,
  proxy: Schema.Struct({
    ...proxyProjectFields,
    mode: Schema.Literal("live"),
    variables: Schema.Array(VercelProductionVariable),
  }),
  storedProfileProof: Schema.Struct({
    ciphertextPresent: Schema.Literal(true),
    envelopeVersion2: Schema.Literal(true),
    expiryValid: Schema.Literal(true),
    found: Schema.Literal(true),
    markerLeakFalse: Schema.Literal(true),
    profileKindSubscription: Schema.Literal(true),
    refreshCapable: Schema.Literal(true),
    requiresReauthenticationFalse: Schema.Literal(true),
  }),
} as const;

const acceptedProxyFields = {
  ...proxyProvisionedFields,
  inventory: Schema.Struct({
    previewIdentityReuse: Schema.Literal(false),
    productionAgentActivation: Schema.Literal("configured"),
    productionProxyActivation: Schema.Literal("accepted"),
  }),
  acceptedProxy: Schema.Struct({
    configFingerprint: OpaqueIdentityFingerprint,
    deploymentId: ImmutableDeploymentReference,
    sourceSha: ImmutableSourceReference,
    stableUrl: ProductionProxyUrl,
  }),
  agent: Schema.Struct({
    ...agentProjectFields,
    bearerFingerprint: OpaqueIdentityFingerprint,
    eveAuth: Schema.Struct({
      anonymousFallback: Schema.Literal(false),
      deployedLocalDev: Schema.Literal(false),
      vercelOidc: Schema.Literal(true),
    }),
    modelProvider: AgentModelProviderMode.pipe(
      Schema.check(
        Schema.makeFilter((mode) =>
          mode === "codex-proxy"
            ? undefined
            : "Production agent must use the Codex proxy model provider."
        )
      )
    ),
    proxyBaseUrl: ProductionProxyUrl,
    variables: Schema.Array(VercelProductionVariable),
  }),
  previewBearerFingerprint: OpaqueIdentityFingerprint,
} as const;

const rollbackReference = Schema.Struct({
  configFingerprint: OpaqueIdentityFingerprint,
  deploymentId: ImmutableDeploymentReference,
});

export const BeforeFirstMutationPreflightSnapshot = Schema.Struct({
  ...commonSnapshotFields,
  inventory: Schema.Struct({
    previewIdentityReuse: Schema.Literal(false),
    productionAgentActivation: Schema.Literal("absent"),
    productionProxyActivation: Schema.Literal("absent"),
  }),
  stage: Schema.Literal("before-first-mutation"),
});

export const ProxyProvisionedPreflightSnapshot = Schema.Struct({
  ...proxyProvisionedFields,
  stage: Schema.Literal("proxy-provisioned"),
});

export const ProxyAcceptedAgentConfiguredPreflightSnapshot = Schema.Struct({
  ...acceptedProxyFields,
  stage: Schema.Literal("proxy-accepted-agent-configured"),
});

const agentAcceptedRollbackReadyFields = {
  ...acceptedProxyFields,
  inventory: Schema.Struct({
    previewIdentityReuse: Schema.Literal(false),
    productionAgentActivation: Schema.Literal("accepted"),
    productionProxyActivation: Schema.Literal("accepted"),
  }),
  acceptedAgent: Schema.Struct({
    configFingerprint: OpaqueIdentityFingerprint,
    deploymentId: ImmutableDeploymentReference,
    sourceSha: ImmutableSourceReference,
  }),
  rollback: Schema.Struct({
    agent: Schema.Struct({
      current: rollbackReference,
      previous: rollbackReference,
    }).pipe(
      Schema.check(
        Schema.makeFilter((references) =>
          references.current.deploymentId !== references.previous.deploymentId
            ? undefined
            : "Agent rollback references must identify distinct deployments."
        )
      )
    ),
    proxy: Schema.Struct({
      current: rollbackReference,
      previous: rollbackReference,
    }).pipe(
      Schema.check(
        Schema.makeFilter((references) =>
          references.current.deploymentId !== references.previous.deploymentId
            ? undefined
            : "Proxy rollback references must identify distinct deployments."
        )
      )
    ),
  }),
} as const;

export const AgentAcceptedRollbackReadyPreflightSnapshot = Schema.Struct({
  ...agentAcceptedRollbackReadyFields,
  stage: Schema.Literal("agent-accepted-rollback-ready"),
});

export const SendblueFinalPromotionPreflightSnapshot = Schema.Struct({
  ...agentAcceptedRollbackReadyFields,
  rollbackDrill: Schema.Struct({ completed: Schema.Literal(true) }),
  sendblue: Schema.Struct({ productionActivated: Schema.Literal(false) }),
  soak: Schema.Struct({ completed: Schema.Literal(true) }),
  stage: Schema.Literal("sendblue-final-promotion"),
});

export const ProductionPreflightSnapshot = Schema.Union([
  BeforeFirstMutationPreflightSnapshot,
  ProxyProvisionedPreflightSnapshot,
  ProxyAcceptedAgentConfiguredPreflightSnapshot,
  AgentAcceptedRollbackReadyPreflightSnapshot,
  SendblueFinalPromotionPreflightSnapshot,
]);

export type ProductionPreflightSnapshot =
  typeof ProductionPreflightSnapshot.Type;

export const ProductionPreflightEvidence = Schema.Struct({
  checks: Schema.Array(Schema.NonEmptyString),
  go: Schema.Boolean,
  rejected: Schema.Array(Schema.NonEmptyString),
  stage: Schema.Literals([
    "before-first-mutation",
    "proxy-provisioned",
    "proxy-accepted-agent-configured",
    "agent-accepted-rollback-ready",
    "sendblue-final-promotion",
  ]),
});

export type ProductionPreflightEvidence =
  typeof ProductionPreflightEvidence.Type;

export class ProductionPreflightError extends Data.TaggedError(
  "ProductionPreflightError"
)<{ readonly message: string }> {}

const expectedAgentVariables = [
  ["BUNDJIL_AGENT_MODEL_PROVIDER", ["encrypted", "sensitive"]],
  ["BUNDJIL_CODEX_PROXY_BASE_URL", ["encrypted", "sensitive"]],
  ["BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN", ["sensitive"]],
] as const;

const expectedProxyVariables = [
  ["BUNDJIL_CODEX_PROXY_MODE", ["encrypted", "sensitive"]],
  ["BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN", ["sensitive"]],
  ["BUNDJIL_CODEX_PROFILE_ID", ["plain"]],
  ["BUNDJIL_CODEX_CONNECTOR_ID", ["plain"]],
  ["BUNDJIL_CODEX_INSTALLATION_ID", ["plain"]],
  ["BUNDJIL_CODEX_SUBJECT_ID", ["plain"]],
  ["BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY", ["sensitive"]],
  ["BUNDJIL_CODEX_PROFILE_ENCRYPTION_KEY_ID", ["encrypted", "sensitive"]],
  ["BUNDJIL_UPSTASH_REDIS_REST_URL", ["sensitive"]],
  ["BUNDJIL_UPSTASH_REDIS_REST_TOKEN", ["sensitive"]],
  ["BUNDJIL_UPSTASH_REDIS_KEY_PREFIX", ["encrypted", "sensitive"]],
] as const;

const sameIdentity = (
  preview: typeof ProductionIdentity.Type,
  production: typeof ProductionIdentity.Type
) =>
  preview.namespaceFingerprint === production.namespaceFingerprint ||
  preview.subjectFingerprint === production.subjectFingerprint ||
  preview.cipherKeyId === production.cipherKeyId ||
  preview.derivedProfileKeyFingerprint ===
    production.derivedProfileKeyFingerprint ||
  preview.derivedLockKeyFingerprint === production.derivedLockKeyFingerprint ||
  preview.derivedFenceKeyFingerprint === production.derivedFenceKeyFingerprint;

const missingVariableBindings = (
  variables: readonly (typeof VercelProductionVariable.Type)[],
  expected: readonly ExpectedVariableBinding[]
) =>
  expected.flatMap(([name, allowedTypes]) =>
    variables.some(
      (variable) =>
        variable.name === name && allowedTypes.includes(variable.type)
    )
      ? []
      : [`missing-production-variable:${name}`]
  );

export const preflightProductionPromotion = Effect.fn(
  "ProductionPromotion.preflight"
)(function* (snapshot: ProductionPreflightSnapshot) {
  const rejected =
    snapshot.stage === "before-first-mutation"
      ? []
      : [
          ...missingVariableBindings(
            snapshot.proxy.variables,
            expectedProxyVariables
          ),
          ...(sameIdentity(
            snapshot.previewIdentity,
            snapshot.productionIdentity
          )
            ? ["shared-preview-production-identity"]
            : []),
          ...(snapshot.stage === "proxy-provisioned"
            ? []
            : [
                ...missingVariableBindings(
                  snapshot.agent.variables,
                  expectedAgentVariables
                ),
                ...(snapshot.previewBearerFingerprint ===
                snapshot.agent.bearerFingerprint
                  ? ["shared-preview-production-bearer"]
                  : []),
                ...(snapshot.acceptedProxy.sourceSha ===
                snapshot.source.pushedSha
                  ? []
                  : ["accepted-proxy-source-mismatch"]),
                ...(snapshot.stage === "proxy-accepted-agent-configured"
                  ? []
                  : [
                      ...(snapshot.acceptedAgent.sourceSha ===
                      snapshot.source.pushedSha
                        ? []
                        : ["accepted-agent-source-mismatch"]),
                      ...(snapshot.rollback.proxy.current.deploymentId ===
                        snapshot.acceptedProxy.deploymentId &&
                      snapshot.rollback.proxy.current.configFingerprint ===
                        snapshot.acceptedProxy.configFingerprint
                        ? []
                        : ["proxy-current-rollback-mismatch"]),
                      ...(snapshot.rollback.agent.current.deploymentId ===
                        snapshot.acceptedAgent.deploymentId &&
                      snapshot.rollback.agent.current.configFingerprint ===
                        snapshot.acceptedAgent.configFingerprint
                        ? []
                        : ["agent-current-rollback-mismatch"]),
                    ]),
              ]),
        ];

  return yield* ProductionPreflightEvidence.pipe(Schema.decodeUnknownEffect)({
    checks: ["read-only-adapter", "ordered-staged-preflight", snapshot.stage],
    go: rejected.length === 0,
    rejected,
    stage: snapshot.stage,
  }).pipe(
    Effect.mapError(
      () =>
        new ProductionPreflightError({
          message: "Unable to encode sanitized Production preflight evidence.",
        })
    )
  );
});

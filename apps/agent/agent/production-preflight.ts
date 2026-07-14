import { Data, Effect, Schema } from "effect";

import { AgentModelProviderMode } from "./model-provider.js";

const VercelVariableType = Schema.Literals(["encrypted", "plain", "sensitive"]);

type VercelVariableKind = typeof VercelVariableType.Type;
type ExpectedVariableBinding = readonly [
  name: string,
  allowedTypes: readonly VercelVariableKind[],
];

const VercelProductionVariable = Schema.Struct({
  name: Schema.NonEmptyString,
  target: Schema.Literal("production"),
  type: VercelVariableType,
});

const OpaqueIdentityFingerprint = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-f0-9]{64}$/))
);

const ProductionIdentity = Schema.Struct({
  cipherKeyId: Schema.NonEmptyString,
  derivedFenceKeyFingerprint: OpaqueIdentityFingerprint,
  derivedLockKeyFingerprint: OpaqueIdentityFingerprint,
  derivedProfileKeyFingerprint: OpaqueIdentityFingerprint,
  namespaceFingerprint: OpaqueIdentityFingerprint,
  subjectFingerprint: OpaqueIdentityFingerprint,
});

export const ProductionPreflightSnapshot = Schema.Struct({
  adapter: Schema.Literal("vercel-readonly-metadata-v1"),
  agent: Schema.Struct({
    deploymentProtection: Schema.Boolean,
    eveAuth: Schema.Boolean,
    modelProvider: AgentModelProviderMode,
    project: Schema.NonEmptyString,
    proxyBaseUrl: Schema.URLFromString,
    scope: Schema.Literal("personal"),
    stableDomain: Schema.NonEmptyString,
    variables: Schema.Array(VercelProductionVariable),
  }),
  previewIdentity: ProductionIdentity,
  productionIdentity: ProductionIdentity,
  proxy: Schema.Struct({
    deploymentProtection: Schema.Boolean,
    mode: Schema.Literals(["live", "local", "mock"]),
    project: Schema.NonEmptyString,
    scope: Schema.Literal("personal"),
    stableDomain: Schema.NonEmptyString,
    variables: Schema.Array(VercelProductionVariable),
  }),
  readOnly: Schema.Literal(true),
  rollback: Schema.Struct({
    agentDeploymentId: Schema.String,
    proxyDeploymentId: Schema.String,
  }),
});

export type ProductionPreflightSnapshot =
  typeof ProductionPreflightSnapshot.Type;

export const ProductionPreflightEvidence = Schema.Struct({
  checks: Schema.Array(Schema.NonEmptyString),
  go: Schema.Boolean,
  rejected: Schema.Array(Schema.NonEmptyString),
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
  ["BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN", ["encrypted", "sensitive"]],
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
  preview: ProductionPreflightSnapshot["previewIdentity"],
  production: ProductionPreflightSnapshot["productionIdentity"]
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
  const rejected = [
    ...(snapshot.agent.project === "bundjil-agent"
      ? []
      : ["wrong-agent-project"]),
    ...(snapshot.proxy.project === "bundjil-codex-proxy"
      ? []
      : ["wrong-proxy-project"]),
    ...(snapshot.agent.stableDomain === "bundjil-agent.vercel.app"
      ? []
      : ["wrong-agent-domain"]),
    ...(snapshot.proxy.stableDomain === "bundjil-codex-proxy.vercel.app"
      ? []
      : ["wrong-proxy-domain"]),
    ...(snapshot.agent.deploymentProtection &&
    snapshot.proxy.deploymentProtection
      ? []
      : ["missing-deployment-protection"]),
    ...(snapshot.agent.eveAuth ? [] : ["missing-eve-auth"]),
    ...(snapshot.agent.modelProvider === "codex-proxy"
      ? []
      : ["wrong-agent-model-provider"]),
    ...(snapshot.proxy.mode === "live" ? [] : ["wrong-proxy-mode"]),
    ...(snapshot.agent.proxyBaseUrl.hostname ===
      "bundjil-codex-proxy.vercel.app" &&
    snapshot.agent.proxyBaseUrl.pathname === "/v1"
      ? []
      : ["stale-or-nonproduction-proxy-host"]),
    ...missingVariableBindings(
      snapshot.agent.variables,
      expectedAgentVariables
    ),
    ...missingVariableBindings(
      snapshot.proxy.variables,
      expectedProxyVariables
    ),
    ...(sameIdentity(snapshot.previewIdentity, snapshot.productionIdentity)
      ? ["shared-preview-production-identity"]
      : []),
    ...(snapshot.rollback.agentDeploymentId.length > 0 &&
    snapshot.rollback.proxyDeploymentId.length > 0
      ? []
      : ["missing-accepted-rollback-reference"]),
  ];

  return yield* ProductionPreflightEvidence.pipe(Schema.decodeUnknownEffect)({
    checks: [
      "personal-scope",
      "stable-production-domains",
      "production-variable-bindings",
      "live-codex-proxy-mode",
      "explicit-eve-auth",
      "deployment-protection",
      "disjoint-derived-identities",
      "accepted-rollback-references",
      "read-only-adapter",
    ],
    go: rejected.length === 0,
    rejected,
  }).pipe(
    Effect.mapError(
      () =>
        new ProductionPreflightError({
          message: "Unable to encode sanitized Production preflight evidence.",
        })
    )
  );
});

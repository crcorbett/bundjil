import { Schema } from "effect";

import {
  VercelDeploymentId,
  VercelGitSha,
  VercelProjectId,
} from "./schemas.js";

export const ProductionProject = Schema.Literals(["agent", "proxy"]);
export type ProductionProject = typeof ProductionProject.Type;

export const ProductionDeploymentUrl = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isPattern(/^https:\/\/[a-z0-9-]+\.vercel\.app$/)),
  Schema.brand("@bundjil/infrastructure/vercel/ProductionDeploymentUrl")
);
export type ProductionDeploymentUrl = typeof ProductionDeploymentUrl.Type;

export const ProductionDeployment = Schema.Struct({
  project: ProductionProject,
  deploymentId: VercelDeploymentId,
  projectId: VercelProjectId,
  url: ProductionDeploymentUrl,
  target: Schema.Literal("production"),
  readyState: Schema.Literal("READY"),
  sourceSha: VercelGitSha,
});
export type ProductionDeployment = typeof ProductionDeployment.Type;

export const StageProductionDeployment = Schema.Struct({
  project: ProductionProject,
  sourceSha: VercelGitSha,
});
export type StageProductionDeployment = typeof StageProductionDeployment.Type;

export const InspectProductionDeployment = Schema.Struct({
  project: ProductionProject,
  deploymentId: VercelDeploymentId,
});
export type InspectProductionDeployment =
  typeof InspectProductionDeployment.Type;

export const ProductionProxyHealth = Schema.Struct({
  ok: Schema.Literal(true),
  service: Schema.Literal("bundjil-codex-proxy"),
  mode: Schema.Literal("live"),
  reasoningEffort: Schema.Literal("high"),
});
export type ProductionProxyHealth = typeof ProductionProxyHealth.Type;

export const AutomaticProductionStatus = Schema.Literals([
  "already-current",
  "stale",
  "promoted",
]);
export type AutomaticProductionStatus = typeof AutomaticProductionStatus.Type;

export const AutomaticProductionReceipt = Schema.Struct({
  status: AutomaticProductionStatus,
  sourceSha: VercelGitSha,
  previousProxyDeploymentId: VercelDeploymentId,
  previousAgentDeploymentId: VercelDeploymentId,
  proxyDeploymentId: Schema.NullOr(VercelDeploymentId),
  agentDeploymentId: Schema.NullOr(VercelDeploymentId),
  stableProxyDeploymentId: VercelDeploymentId,
  stableAgentDeploymentId: VercelDeploymentId,
  rollbackReady: Schema.Boolean,
});
export type AutomaticProductionReceipt = typeof AutomaticProductionReceipt.Type;
export const AutomaticProductionReceiptJson = Schema.fromJsonString(
  AutomaticProductionReceipt
);

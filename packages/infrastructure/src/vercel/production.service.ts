import type { Effect } from "effect";
import { Context } from "effect";

import type { ProductionDeploymentError } from "./production.errors.js";
import type {
  InspectProductionDeployment,
  ProductionDeployment,
  ProductionProject,
  ProductionProxyHealth,
  StageProductionDeployment,
} from "./production.schemas.js";
import type { VercelGitSha } from "./schemas.js";

export interface ProductionDeploymentsContract {
  readonly current: (
    project: ProductionProject
  ) => Effect.Effect<ProductionDeployment, ProductionDeploymentError>;
  readonly currentAgentCallback: Effect.Effect<
    ProductionDeployment,
    ProductionDeploymentError
  >;
  readonly stage: (
    input: StageProductionDeployment
  ) => Effect.Effect<ProductionDeployment, ProductionDeploymentError>;
  readonly inspect: (
    input: InspectProductionDeployment
  ) => Effect.Effect<ProductionDeployment, ProductionDeploymentError>;
  readonly promote: (
    deployment: ProductionDeployment
  ) => Effect.Effect<void, ProductionDeploymentError>;
  readonly assignAgentCallback: (
    deployment: ProductionDeployment
  ) => Effect.Effect<void, ProductionDeploymentError>;
  readonly rollback: (
    deployment: ProductionDeployment
  ) => Effect.Effect<void, ProductionDeploymentError>;
  readonly readMainSha: Effect.Effect<VercelGitSha, ProductionDeploymentError>;
  readonly probeProxyHealth: Effect.Effect<
    ProductionProxyHealth,
    ProductionDeploymentError
  >;
}

export class ProductionDeployments extends Context.Service<
  ProductionDeployments,
  ProductionDeploymentsContract
>()("@bundjil/infrastructure/vercel/ProductionDeployments") {}

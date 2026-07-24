/* oxlint-disable max-classes-per-file -- The five read-only Vercel capabilities share one bounded provider subpath owner. */

import type { Effect } from "effect";
import { Context } from "effect";

import type {
  VercelDeploymentsReadError,
  VercelDomainsReadError,
  VercelEnvironmentVariablesReadError,
  VercelMarketplaceBindingsReadError,
  VercelProjectsReadError,
} from "./errors.js";
import type {
  DiscoverVercelProject,
  ListedVercelDeployments,
  ListedVercelEnvironmentVariables,
  ListedVercelMarketplaceBindings,
  ListedVercelProjectDomains,
  ListedVercelProjects,
  ListVercelDeployments,
  ListVercelEnvironmentVariables,
  ListVercelMarketplaceBindings,
  ListVercelProjectDomains,
  ListVercelProjects,
  ObserveVercelDeployment,
  ObserveVercelEnvironmentVariable,
  ObserveVercelMarketplaceBinding,
  ObserveVercelProject,
  ObserveVercelProjectDomain,
  VercelDeploymentObservation,
  VercelEnvironmentVariableObservation,
  VercelMarketplaceBindingObservation,
  VercelProjectDomainObservation,
  VercelProjectDiscovery,
  VercelProjectObservation,
} from "./schemas.js";

export interface VercelProjectsShape {
  readonly discoverProject: (
    input: DiscoverVercelProject
  ) => Effect.Effect<VercelProjectDiscovery, VercelProjectsReadError>;
  readonly observeProject: (
    input: ObserveVercelProject
  ) => Effect.Effect<VercelProjectObservation, VercelProjectsReadError>;
  readonly listProjects: (
    input: ListVercelProjects
  ) => Effect.Effect<ListedVercelProjects, VercelProjectsReadError>;
}

export class VercelProjects extends Context.Service<
  VercelProjects,
  VercelProjectsShape
>()("@bundjil/infrastructure/vercel/VercelProjects") {}

export interface VercelDomainsShape {
  readonly observeDomain: (
    input: ObserveVercelProjectDomain
  ) => Effect.Effect<VercelProjectDomainObservation, VercelDomainsReadError>;
  readonly listDomains: (
    input: ListVercelProjectDomains
  ) => Effect.Effect<ListedVercelProjectDomains, VercelDomainsReadError>;
}

export class VercelDomains extends Context.Service<
  VercelDomains,
  VercelDomainsShape
>()("@bundjil/infrastructure/vercel/VercelDomains") {}

export interface VercelEnvironmentVariablesShape {
  readonly observeEnvironmentVariable: (
    input: ObserveVercelEnvironmentVariable
  ) => Effect.Effect<
    VercelEnvironmentVariableObservation,
    VercelEnvironmentVariablesReadError
  >;
  readonly listEnvironmentVariables: (
    input: ListVercelEnvironmentVariables
  ) => Effect.Effect<
    ListedVercelEnvironmentVariables,
    VercelEnvironmentVariablesReadError
  >;
}

export class VercelEnvironmentVariables extends Context.Service<
  VercelEnvironmentVariables,
  VercelEnvironmentVariablesShape
>()("@bundjil/infrastructure/vercel/VercelEnvironmentVariables") {}

export interface VercelMarketplaceBindingsShape {
  readonly observeMarketplaceBinding: (
    input: ObserveVercelMarketplaceBinding
  ) => Effect.Effect<
    VercelMarketplaceBindingObservation,
    VercelMarketplaceBindingsReadError
  >;
  readonly listMarketplaceBindings: (
    input: ListVercelMarketplaceBindings
  ) => Effect.Effect<
    ListedVercelMarketplaceBindings,
    VercelMarketplaceBindingsReadError
  >;
}

export class VercelMarketplaceBindings extends Context.Service<
  VercelMarketplaceBindings,
  VercelMarketplaceBindingsShape
>()("@bundjil/infrastructure/vercel/VercelMarketplaceBindings") {}

export interface VercelDeploymentsShape {
  readonly observeDeployment: (
    input: ObserveVercelDeployment
  ) => Effect.Effect<VercelDeploymentObservation, VercelDeploymentsReadError>;
  readonly listDeployments: (
    input: ListVercelDeployments
  ) => Effect.Effect<ListedVercelDeployments, VercelDeploymentsReadError>;
}

export class VercelDeployments extends Context.Service<
  VercelDeployments,
  VercelDeploymentsShape
>()("@bundjil/infrastructure/vercel/VercelDeployments") {}

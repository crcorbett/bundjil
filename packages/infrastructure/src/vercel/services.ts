/* oxlint-disable max-classes-per-file -- The five read-only Vercel capabilities share one bounded provider subpath owner. */

import type { Effect } from "effect";
import { Context } from "effect";

import type {
  VercelCredentialError,
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
  VercelAccessToken,
  VercelCredentialScope,
} from "./schemas.js";

export interface VercelCredentialsContract {
  readonly accessToken: (
    scope: VercelCredentialScope
  ) => Effect.Effect<VercelAccessToken, VercelCredentialError>;
}

export class VercelCredentials extends Context.Service<
  VercelCredentials,
  VercelCredentialsContract
>()("@bundjil/infrastructure/vercel/VercelCredentials") {}

export interface VercelProjectsContract {
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
  VercelProjectsContract
>()("@bundjil/infrastructure/vercel/VercelProjects") {}

export interface VercelDomainsContract {
  readonly observeDomain: (
    input: ObserveVercelProjectDomain
  ) => Effect.Effect<VercelProjectDomainObservation, VercelDomainsReadError>;
  readonly listDomains: (
    input: ListVercelProjectDomains
  ) => Effect.Effect<ListedVercelProjectDomains, VercelDomainsReadError>;
}

export class VercelDomains extends Context.Service<
  VercelDomains,
  VercelDomainsContract
>()("@bundjil/infrastructure/vercel/VercelDomains") {}

export interface VercelEnvironmentVariablesContract {
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
  VercelEnvironmentVariablesContract
>()("@bundjil/infrastructure/vercel/VercelEnvironmentVariables") {}

export interface VercelMarketplaceBindingsContract {
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
  VercelMarketplaceBindingsContract
>()("@bundjil/infrastructure/vercel/VercelMarketplaceBindings") {}

export interface VercelDeploymentsContract {
  readonly observeDeployment: (
    input: ObserveVercelDeployment
  ) => Effect.Effect<VercelDeploymentObservation, VercelDeploymentsReadError>;
  readonly listDeployments: (
    input: ListVercelDeployments
  ) => Effect.Effect<ListedVercelDeployments, VercelDeploymentsReadError>;
}

export class VercelDeployments extends Context.Service<
  VercelDeployments,
  VercelDeploymentsContract
>()("@bundjil/infrastructure/vercel/VercelDeployments") {}

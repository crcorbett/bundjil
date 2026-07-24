/* oxlint-disable unicorn/no-array-method-this-argument -- Effect and Effect Array data-first combinators are not native Array methods with a thisArg. */

import type { Resource } from "alchemy";
import { Unowned } from "alchemy/AdoptPolicy";
import { isResolved } from "alchemy/Diff";
import * as Provider from "alchemy/Provider";
import { Resource as makeResource } from "alchemy/Resource";
import { Array, Effect, Layer, Match, Schema } from "effect";

import {
  VercelDeploymentsReadError,
  VercelDomainsReadError,
  VercelEnvironmentVariablesReadError,
  VercelMarketplaceBindingsReadError,
  VercelProjectsReadError,
} from "./errors.js";
import type {
  VercelDeploymentObservationAttributes as VercelDeploymentObservationAttributesType,
  VercelDeploymentObservationProps as VercelDeploymentObservationPropsType,
  VercelEnvironmentVariableAttributes as VercelEnvironmentVariableAttributesType,
  VercelEnvironmentVariableProps as VercelEnvironmentVariablePropsType,
  VercelInventoryScope,
  VercelMarketplaceBindingAttributes as VercelMarketplaceBindingAttributesType,
  VercelMarketplaceBindingProps as VercelMarketplaceBindingPropsType,
  VercelProjectAttributes as VercelProjectAttributesType,
  VercelProjectDomainAttributes as VercelProjectDomainAttributesType,
  VercelProjectDomainProps as VercelProjectDomainPropsType,
  VercelProjectProps as VercelProjectPropsType,
  VercelProjectObservation as VercelProjectObservationType,
} from "./schemas.js";
import {
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
} from "./schemas.js";
import {
  VercelDeployments,
  VercelDomains,
  VercelEnvironmentVariables,
  VercelMarketplaceBindings,
  VercelProjects,
} from "./services.js";

const missingVercelResource = undefined;
const VercelReadOnlyNoopDiff = Schema.Struct({
  action: Schema.Literal("noop"),
});

const requireFoundProject = Effect.fn("requireFoundProject")(
  (observation: VercelProjectObservationType) =>
    Match.value(observation).pipe(
      Match.tag("Missing", () =>
        Effect.fail(
          new VercelProjectsReadError({
            operation: "observeProject",
            reason: "notFound",
            retry: "never",
            message: "The Vercel project was not found.",
          })
        )
      ),
      Match.tag("Found", ({ attributes }) => Effect.succeed(attributes)),
      Match.exhaustive
    )
);

export type VercelProject = Resource<
  "Bundjil.Infrastructure.VercelProject",
  VercelProjectPropsType,
  VercelProjectAttributesType
>;
export const VercelProject = makeResource<VercelProject>(
  "Bundjil.Infrastructure.VercelProject",
  { defaultRemovalPolicy: "retain" }
);

export type VercelProjectDomain = Resource<
  "Bundjil.Infrastructure.VercelProjectDomain",
  VercelProjectDomainPropsType,
  VercelProjectDomainAttributesType
>;
export const VercelProjectDomain = makeResource<VercelProjectDomain>(
  "Bundjil.Infrastructure.VercelProjectDomain",
  { defaultRemovalPolicy: "retain" }
);

export type VercelEnvironmentVariable = Resource<
  "Bundjil.Infrastructure.VercelEnvironmentVariable",
  VercelEnvironmentVariablePropsType,
  VercelEnvironmentVariableAttributesType
>;
export const VercelEnvironmentVariable =
  makeResource<VercelEnvironmentVariable>(
    "Bundjil.Infrastructure.VercelEnvironmentVariable",
    { defaultRemovalPolicy: "retain" }
  );

export type VercelMarketplaceBinding = Resource<
  "Bundjil.Infrastructure.VercelMarketplaceBinding",
  VercelMarketplaceBindingPropsType,
  VercelMarketplaceBindingAttributesType
>;
export const VercelMarketplaceBinding = makeResource<VercelMarketplaceBinding>(
  "Bundjil.Infrastructure.VercelMarketplaceBinding",
  { defaultRemovalPolicy: "retain" }
);

export type VercelDeploymentObservationResource = Resource<
  "Bundjil.Infrastructure.VercelDeploymentObservation",
  VercelDeploymentObservationPropsType,
  VercelDeploymentObservationAttributesType
>;
export const VercelDeploymentObservationResource =
  makeResource<VercelDeploymentObservationResource>(
    "Bundjil.Infrastructure.VercelDeploymentObservation",
    { defaultRemovalPolicy: "retain" }
  );

export const layerVercelReadOnlyProviders = (scope: VercelInventoryScope) => {
  const projectProvider = Provider.succeed(
    VercelProject,
    VercelProject.Provider.of({
      read: Effect.fn("VercelProjectProvider.read")(function* ({
        olds,
        output,
      }) {
        const projects = yield* VercelProjects;
        const observation = yield* projects.observeProject(
          ObserveVercelProject.make({
            stage: olds.stage,
            teamId: olds.teamId,
            projectId: output?.projectId ?? olds.projectId,
          })
        );
        return yield* Match.value(observation).pipe(
          Match.tag("Missing", () => Effect.succeed(missingVercelResource)),
          Match.tag("Found", ({ attributes }) =>
            Effect.succeed(
              output === undefined ? Unowned(attributes) : attributes
            )
          ),
          Match.exhaustive
        );
      }),
      diff: Effect.fn("VercelProjectProvider.diff")(({ news }) =>
        Effect.sync(() =>
          isResolved(news)
            ? VercelReadOnlyNoopDiff.make({ action: "noop" })
            : missingVercelResource
        )
      ),
      reconcile: Effect.fn("VercelProjectProvider.reconcile")(function* ({
        news,
      }) {
        const projects = yield* VercelProjects;
        return yield* projects
          .observeProject(
            ObserveVercelProject.make({
              stage: news.stage,
              teamId: news.teamId,
              projectId: news.projectId,
            })
          )
          .pipe(Effect.flatMap(requireFoundProject));
      }),
      delete: Effect.fn("VercelProjectProvider.delete")(() =>
        Effect.fail(
          new VercelProjectsReadError({
            operation: "observeProject",
            reason: "writeForbidden",
            retry: "never",
            message: "Vercel project deletion is disabled in read/import mode.",
          })
        )
      ),
      list: Effect.fn("VercelProjectProvider.list")(function* () {
        const projects = yield* VercelProjects;
        const pages = yield* Effect.forEach(scope.projects, (projectScope) =>
          projects.listProjects(
            ListVercelProjects.make({
              stage: projectScope.stage,
              teamId: projectScope.teamId,
            })
          )
        );
        return Array.dedupeWith(
          Array.flatMap(pages, (page) => page.projects),
          (left, right) =>
            left.teamId === right.teamId && left.projectId === right.projectId
        );
      }),
      stables: ["teamId", "projectId"],
    })
  );

  const domainProvider = Provider.succeed(
    VercelProjectDomain,
    VercelProjectDomain.Provider.of({
      read: Effect.fn("VercelProjectDomainProvider.read")(function* ({
        olds,
        output,
      }) {
        const domains = yield* VercelDomains;
        const observation = yield* domains.observeDomain(
          ObserveVercelProjectDomain.make({
            stage: olds.stage,
            teamId: olds.teamId,
            projectId: olds.projectId,
            domain: output?.domain ?? olds.domain,
          })
        );
        return yield* Match.value(observation).pipe(
          Match.tag("Missing", () => Effect.succeed(missingVercelResource)),
          Match.tag("Found", ({ attributes }) =>
            Effect.succeed(
              output === undefined ? Unowned(attributes) : attributes
            )
          ),
          Match.exhaustive
        );
      }),
      diff: Effect.fn("VercelProjectDomainProvider.diff")(({ news }) =>
        Effect.sync(() =>
          isResolved(news)
            ? VercelReadOnlyNoopDiff.make({ action: "noop" })
            : missingVercelResource
        )
      ),
      reconcile: Effect.fn("VercelProjectDomainProvider.reconcile")(function* ({
        news,
      }) {
        const domains = yield* VercelDomains;
        const observation = yield* domains.observeDomain(
          ObserveVercelProjectDomain.make(news)
        );
        return yield* Match.value(observation).pipe(
          Match.tag("Missing", () =>
            Effect.fail(
              new VercelDomainsReadError({
                operation: "observeDomain",
                reason: "notFound",
                retry: "never",
                message: "The Vercel project domain was not found.",
              })
            )
          ),
          Match.tag("Found", ({ attributes }) => Effect.succeed(attributes)),
          Match.exhaustive
        );
      }),
      delete: Effect.fn("VercelProjectDomainProvider.delete")(() =>
        Effect.fail(
          new VercelDomainsReadError({
            operation: "observeDomain",
            reason: "writeForbidden",
            retry: "never",
            message: "Vercel domain deletion is disabled in read/import mode.",
          })
        )
      ),
      list: Effect.fn("VercelProjectDomainProvider.list")(function* () {
        const domains = yield* VercelDomains;
        const pages = yield* Effect.forEach(scope.projects, (projectScope) =>
          domains.listDomains(ListVercelProjectDomains.make(projectScope))
        );
        return Array.flatMap(pages, (page) => page.domains);
      }),
      stables: ["teamId", "projectId", "domain"],
    })
  );

  const environmentVariableProvider = Provider.succeed(
    VercelEnvironmentVariable,
    VercelEnvironmentVariable.Provider.of({
      read: Effect.fn("VercelEnvironmentVariableProvider.read")(function* ({
        olds,
        output,
      }) {
        const environmentVariables = yield* VercelEnvironmentVariables;
        const observation =
          yield* environmentVariables.observeEnvironmentVariable(
            ObserveVercelEnvironmentVariable.make({
              stage: olds.stage,
              teamId: olds.teamId,
              projectId: olds.projectId,
              environmentVariableId:
                output?.environmentVariableId ?? olds.environmentVariableId,
            })
          );
        return yield* Match.value(observation).pipe(
          Match.tag("Missing", () => Effect.succeed(missingVercelResource)),
          Match.tag("Found", ({ attributes }) =>
            Effect.succeed(
              output === undefined ? Unowned(attributes) : attributes
            )
          ),
          Match.exhaustive
        );
      }),
      diff: Effect.fn("VercelEnvironmentVariableProvider.diff")(({ news }) =>
        Effect.sync(() =>
          isResolved(news)
            ? VercelReadOnlyNoopDiff.make({ action: "noop" })
            : missingVercelResource
        )
      ),
      reconcile: Effect.fn("VercelEnvironmentVariableProvider.reconcile")(
        function* ({ news }) {
          const environmentVariables = yield* VercelEnvironmentVariables;
          const observation =
            yield* environmentVariables.observeEnvironmentVariable(
              ObserveVercelEnvironmentVariable.make(news)
            );
          return yield* Match.value(observation).pipe(
            Match.tag("Missing", () =>
              Effect.fail(
                new VercelEnvironmentVariablesReadError({
                  operation: "observeEnvironmentVariable",
                  reason: "notFound",
                  retry: "never",
                  message: "The Vercel environment variable was not found.",
                })
              )
            ),
            Match.tag("Found", ({ attributes }) => Effect.succeed(attributes)),
            Match.exhaustive
          );
        }
      ),
      delete: Effect.fn("VercelEnvironmentVariableProvider.delete")(() =>
        Effect.fail(
          new VercelEnvironmentVariablesReadError({
            operation: "observeEnvironmentVariable",
            reason: "writeForbidden",
            retry: "never",
            message:
              "Vercel environment variable deletion is disabled in read/import mode.",
          })
        )
      ),
      list: Effect.fn("VercelEnvironmentVariableProvider.list")(function* () {
        const environmentVariables = yield* VercelEnvironmentVariables;
        const pages = yield* Effect.forEach(scope.projects, (projectScope) =>
          environmentVariables.listEnvironmentVariables(
            ListVercelEnvironmentVariables.make(projectScope)
          )
        );
        return Array.flatMap(pages, (page) => page.environmentVariables);
      }),
      stables: ["teamId", "projectId", "environmentVariableId"],
    })
  );

  const marketplaceProvider = Provider.succeed(
    VercelMarketplaceBinding,
    VercelMarketplaceBinding.Provider.of({
      read: Effect.fn("VercelMarketplaceBindingProvider.read")(function* ({
        olds,
        output,
      }) {
        const bindings = yield* VercelMarketplaceBindings;
        const observation = yield* bindings.observeMarketplaceBinding(
          ObserveVercelMarketplaceBinding.make({
            stage: olds.stage,
            teamId: olds.teamId,
            projectId: olds.projectId,
            resourceId: output?.resourceId ?? olds.resourceId,
          })
        );
        return yield* Match.value(observation).pipe(
          Match.tag("Missing", () => Effect.succeed(missingVercelResource)),
          Match.tag("Found", ({ attributes }) =>
            Effect.succeed(
              output === undefined ? Unowned(attributes) : attributes
            )
          ),
          Match.exhaustive
        );
      }),
      diff: Effect.fn("VercelMarketplaceBindingProvider.diff")(({ news }) =>
        Effect.sync(() =>
          isResolved(news)
            ? VercelReadOnlyNoopDiff.make({ action: "noop" })
            : missingVercelResource
        )
      ),
      reconcile: Effect.fn("VercelMarketplaceBindingProvider.reconcile")(
        function* ({ news }) {
          const bindings = yield* VercelMarketplaceBindings;
          const observation = yield* bindings.observeMarketplaceBinding(
            ObserveVercelMarketplaceBinding.make(news)
          );
          return yield* Match.value(observation).pipe(
            Match.tag("Missing", () =>
              Effect.fail(
                new VercelMarketplaceBindingsReadError({
                  operation: "observeMarketplaceBinding",
                  reason: "notFound",
                  retry: "never",
                  message: "The Vercel Marketplace binding was not found.",
                })
              )
            ),
            Match.tag("Found", ({ attributes }) => Effect.succeed(attributes)),
            Match.exhaustive
          );
        }
      ),
      delete: Effect.fn("VercelMarketplaceBindingProvider.delete")(() =>
        Effect.fail(
          new VercelMarketplaceBindingsReadError({
            operation: "observeMarketplaceBinding",
            reason: "writeForbidden",
            retry: "never",
            message:
              "Vercel Marketplace binding deletion is disabled in read/import mode.",
          })
        )
      ),
      list: Effect.fn("VercelMarketplaceBindingProvider.list")(function* () {
        const bindings = yield* VercelMarketplaceBindings;
        const pages = yield* Effect.forEach(scope.projects, (projectScope) =>
          bindings.listMarketplaceBindings(
            ListVercelMarketplaceBindings.make(projectScope)
          )
        );
        return Array.flatMap(pages, (page) => page.bindings);
      }),
      stables: [
        "teamId",
        "projectId",
        "integrationId",
        "configurationId",
        "resourceId",
        "databaseId",
      ],
    })
  );

  const deploymentProvider = Provider.succeed(
    VercelDeploymentObservationResource,
    VercelDeploymentObservationResource.Provider.of({
      read: Effect.fn("VercelDeploymentObservationProvider.read")(function* ({
        olds,
        output,
      }) {
        const deployments = yield* VercelDeployments;
        const observation = yield* deployments.observeDeployment(
          ObserveVercelDeployment.make({
            stage: olds.stage,
            teamId: olds.teamId,
            projectId: olds.projectId,
            deploymentId: output?.deploymentId ?? olds.deploymentId,
          })
        );
        return yield* Match.value(observation).pipe(
          Match.tag("Missing", () => Effect.succeed(missingVercelResource)),
          Match.tag("Found", ({ attributes }) =>
            Effect.succeed(
              output === undefined ? Unowned(attributes) : attributes
            )
          ),
          Match.exhaustive
        );
      }),
      diff: Effect.fn("VercelDeploymentObservationProvider.diff")(({ news }) =>
        Effect.sync(() =>
          isResolved(news)
            ? VercelReadOnlyNoopDiff.make({ action: "noop" })
            : missingVercelResource
        )
      ),
      reconcile: Effect.fn("VercelDeploymentObservationProvider.reconcile")(
        function* ({ news }) {
          const deployments = yield* VercelDeployments;
          const observation = yield* deployments.observeDeployment(
            ObserveVercelDeployment.make(news)
          );
          return yield* Match.value(observation).pipe(
            Match.tag("Missing", () =>
              Effect.fail(
                new VercelDeploymentsReadError({
                  operation: "observeDeployment",
                  reason: "notFound",
                  retry: "never",
                  message: "The Vercel deployment observation was not found.",
                })
              )
            ),
            Match.tag("Found", ({ attributes }) => Effect.succeed(attributes)),
            Match.exhaustive
          );
        }
      ),
      delete: Effect.fn("VercelDeploymentObservationProvider.delete")(() =>
        Effect.fail(
          new VercelDeploymentsReadError({
            operation: "observeDeployment",
            reason: "writeForbidden",
            retry: "never",
            message:
              "Vercel deployment deletion is absent from infrastructure convergence.",
          })
        )
      ),
      list: Effect.fn("VercelDeploymentObservationProvider.list")(function* () {
        const deployments = yield* VercelDeployments;
        const pages = yield* Effect.forEach(scope.projects, (projectScope) =>
          deployments.listDeployments(ListVercelDeployments.make(projectScope))
        );
        return Array.flatMap(pages, (page) => page.deployments);
      }),
      stables: ["teamId", "projectId", "deploymentId", "gitSha"],
    })
  );

  return Layer.mergeAll(
    projectProvider,
    domainProvider,
    environmentVariableProvider,
    marketplaceProvider,
    deploymentProvider
  );
};

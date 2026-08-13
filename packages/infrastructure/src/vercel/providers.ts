/* oxlint-disable unicorn/no-array-method-this-argument -- Effect and Effect Array data-first combinators are not native Array methods with a thisArg. */

import type { Resource } from "alchemy";
import { Unowned } from "alchemy/AdoptPolicy";
import { isResolved } from "alchemy/Diff";
import * as Provider from "alchemy/Provider";
import { Resource as makeResource } from "alchemy/Resource";
import { Array, Effect, Layer, Match, Schedule, Schema } from "effect";

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
  ObserveVercelDeployment,
  ObserveVercelEnvironmentVariable,
  ObserveVercelMarketplaceBinding,
  ObserveVercelProject,
  ObserveVercelProjectDomain,
  VercelEnvironmentVariableAttributes,
} from "./schemas.js";
import {
  VercelDeployments,
  VercelDomains,
  VercelEnvironmentVariables,
  VercelMarketplaceBindings,
  VercelProjects,
} from "./services.js";
import {
  ResolveVercelPreviewPhotonValue,
  UpdateVercelStableEnvironmentVariable,
  VercelPreviewPhotonBindingValues,
  VercelPreviewPhotonEnvironmentKey,
  VercelStableEnvironmentBindings,
  VercelStableEnvironmentWriteError,
} from "./stable-environment.js";

const missingVercelResource = undefined;
const VercelReadOnlyNoopDiff = Schema.Struct({
  action: Schema.Literal("noop"),
});
const VercelEnvironmentUpdateDiff = Schema.Struct({
  action: Schema.Literal("update"),
});

const sameTargets = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length &&
  left.every((target, index) => target === right[index]);

const sameValueOwnership = (
  left: VercelEnvironmentVariablePropsType["desired"],
  right: VercelEnvironmentVariablePropsType["desired"]
) => {
  if (left === undefined || right === undefined) {
    return left === right;
  }
  if (
    left.key !== right.key ||
    left.type !== right.type ||
    left.gitBranch !== right.gitBranch ||
    !sameTargets(left.targets, right.targets) ||
    left.valueOwnership._tag !== right.valueOwnership._tag
  ) {
    return false;
  }
  if (
    left.valueOwnership._tag !== "Managed" ||
    right.valueOwnership._tag !== "Managed"
  ) {
    return true;
  }
  return (
    left.valueOwnership.reference.owner ===
      right.valueOwnership.reference.owner &&
    left.valueOwnership.reference.reference ===
      right.valueOwnership.reference.reference &&
    left.valueOwnership.reference.revision ===
      right.valueOwnership.reference.revision
  );
};

const environmentReadFailure = (message: string) =>
  new VercelEnvironmentVariablesReadError({
    operation: "observeEnvironmentVariable",
    reason: "invalidResponse",
    retry: "never",
    message,
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
        return yield* Effect.forEach(
          scope.projects,
          (projectScope) =>
            projects
              .observeProject(ObserveVercelProject.make(projectScope))
              .pipe(Effect.flatMap(requireFoundProject)),
          { concurrency: 1 }
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
          Match.tag("Found", ({ attributes }) => {
            const valueOwnership =
              output !== undefined &&
              output.providerUpdatedAt !== undefined &&
              output.providerUpdatedAt === attributes.providerUpdatedAt
                ? output.valueOwnership
                : {
                    _tag: "ObservedUnknown" as const,
                    configured: true as const,
                  };
            const current = VercelEnvironmentVariableAttributes.make({
              ...attributes,
              valueOwnership,
              deploymentRequired:
                output !== undefined &&
                output.providerUpdatedAt !== undefined &&
                output.providerUpdatedAt === attributes.providerUpdatedAt
                  ? output.deploymentRequired
                  : false,
              ownership: output === undefined ? "Unowned" : "Owned",
            });
            return Effect.succeed(
              output === undefined ? Unowned(current) : current
            );
          }),
          Match.exhaustive
        );
      }),
      diff: Effect.fn("VercelEnvironmentVariableProvider.diff")(
        ({ news, olds }) =>
          Effect.sync(() => {
            if (!isResolved(news)) {
              return missingVercelResource;
            }
            return sameValueOwnership(news.desired, olds.desired)
              ? VercelReadOnlyNoopDiff.make({ action: "noop" })
              : VercelEnvironmentUpdateDiff.make({ action: "update" });
          })
      ),
      reconcile: Effect.fn("VercelEnvironmentVariableProvider.reconcile")(
        function* ({ news }) {
          const environmentVariables = yield* VercelEnvironmentVariables;
          const observation =
            yield* environmentVariables.observeEnvironmentVariable(
              ObserveVercelEnvironmentVariable.make(news)
            );
          const attributes = yield* Match.value(observation).pipe(
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
          if (news.desired === undefined) {
            return attributes;
          }
          if (
            attributes.key !== news.desired.key ||
            attributes.type !== news.desired.type ||
            attributes.gitBranch !== news.desired.gitBranch ||
            !sameTargets(attributes.targets, news.desired.targets)
          ) {
            return yield* environmentReadFailure(
              "The observed Vercel environment metadata does not match the desired physical binding."
            );
          }
          return yield* Match.value(news.desired.valueOwnership).pipe(
            Match.tag("ObservedUnknown", (valueOwnership) =>
              Effect.succeed(
                VercelEnvironmentVariableAttributes.make({
                  ...attributes,
                  valueOwnership,
                  deploymentRequired: false,
                  ownership: "Owned",
                })
              )
            ),
            Match.tag("Absent", () =>
              Effect.fail(
                new VercelStableEnvironmentWriteError({
                  operation: "updateStableEnvironmentVariable",
                  reason: "protected",
                  retry: "never",
                  certainty: { _tag: "Known" },
                  message:
                    "An absent stable environment value cannot delete a retained binding.",
                })
              )
            ),
            Match.tag("Managed", (valueOwnership) =>
              Effect.gen(function* reconcileManagedStableEnvironment() {
                const target = Match.value(news.stage).pipe(
                  Match.when("preview", () => "preview" as const),
                  Match.when("prod", () => "production" as const),
                  Match.exhaustive
                );
                if (
                  news.desired?.type !== "sensitive" ||
                  news.desired.targets.length !== 1 ||
                  news.desired.targets[0] !== target
                ) {
                  return yield* new VercelStableEnvironmentWriteError({
                    operation: "updateStableEnvironmentVariable",
                    reason: "unsupportedBinding",
                    retry: "never",
                    certainty: { _tag: "Known" },
                    message:
                      "Managed stable writes are restricted to exact stage-owned sensitive bindings.",
                  });
                }
                const key = yield* Schema.decodeUnknownEffect(
                  VercelPreviewPhotonEnvironmentKey
                )(news.desired.key).pipe(
                  Effect.mapError(
                    () =>
                      new VercelStableEnvironmentWriteError({
                        operation: "updateStableEnvironmentVariable",
                        reason: "unsupportedBinding",
                        retry: "never",
                        certainty: { _tag: "Known" },
                        message:
                          "This environment key is not an approved Photon managed binding.",
                      })
                  )
                );
                const values = yield* VercelPreviewPhotonBindingValues;
                const value = yield* values.resolvePreviewPhotonValue(
                  ResolveVercelPreviewPhotonValue.make({
                    stage: news.stage,
                    environmentVariableId: news.environmentVariableId,
                    key,
                    valueOwnership: {
                      _tag: "Managed",
                      reference: valueOwnership.reference,
                    },
                  })
                );
                const bindings = yield* VercelStableEnvironmentBindings;
                const update = Match.value(news.stage).pipe(
                  Match.when("preview", () =>
                    UpdateVercelStableEnvironmentVariable.make({
                      stage: "preview",
                      teamId: news.teamId,
                      projectId: news.projectId,
                      environmentVariableId: news.environmentVariableId,
                      key,
                      type: "sensitive",
                      targets: ["preview"],
                      valueOwnership: {
                        _tag: "Managed",
                        reference: valueOwnership.reference,
                      },
                      value,
                      previousProviderUpdatedAt: attributes.providerUpdatedAt,
                    })
                  ),
                  Match.when("prod", () =>
                    UpdateVercelStableEnvironmentVariable.make({
                      stage: "prod",
                      teamId: news.teamId,
                      projectId: news.projectId,
                      environmentVariableId: news.environmentVariableId,
                      key,
                      type: "sensitive",
                      targets: ["production"],
                      valueOwnership: {
                        _tag: "Managed",
                        reference: valueOwnership.reference,
                      },
                      value,
                      previousProviderUpdatedAt: attributes.providerUpdatedAt,
                    })
                  ),
                  Match.exhaustive
                );
                const updated = yield* bindings
                  .updateStableEnvironmentVariable(update)
                  .pipe(
                    Effect.retry({
                      times: 2,
                      schedule: Schedule.exponential("100 millis").pipe(
                        Schedule.jittered
                      ),
                      while: (failure) =>
                        failure.certainty._tag === "Known" &&
                        (failure.reason === "rateLimited" ||
                          failure.reason === "transient"),
                    })
                  );
                return yield* environmentVariables
                  .observeEnvironmentVariable(
                    ObserveVercelEnvironmentVariable.make({
                      stage: news.stage,
                      teamId: news.teamId,
                      projectId: news.projectId,
                      environmentVariableId: news.environmentVariableId,
                    })
                  )
                  .pipe(
                    Effect.flatMap((readback) =>
                      readback._tag === "Found" &&
                      readback.attributes.key === updated.key &&
                      readback.attributes.type === updated.type &&
                      sameTargets(
                        readback.attributes.targets,
                        updated.targets
                      ) &&
                      readback.attributes.providerUpdatedAt ===
                        updated.providerUpdatedAt
                        ? Effect.succeed(
                            VercelEnvironmentVariableAttributes.make({
                              ...readback.attributes,
                              valueOwnership: {
                                _tag: "Managed",
                                reference: valueOwnership.reference,
                              },
                              deploymentRequired: true,
                              ownership: "Owned",
                            })
                          )
                        : Effect.fail(
                            new VercelStableEnvironmentWriteError({
                              operation: "updateStableEnvironmentVariable",
                              reason: "transient",
                              retry: "backoff",
                              certainty: {
                                _tag: "Uncertain",
                                recovery: "observeByPhysicalIdentity",
                              },
                              message:
                                "The stable environment readback has not converged to the acknowledged provider revision.",
                            })
                          )
                    ),
                    Effect.retry({
                      times: 3,
                      schedule: Schedule.exponential("100 millis").pipe(
                        Schedule.jittered
                      ),
                      while: (failure) => failure.retry === "backoff",
                    })
                  );
              })
            ),
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

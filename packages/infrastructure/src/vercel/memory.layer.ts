import { Array, Context, Effect, Layer, Option, pipe, Ref } from "effect";
/* oxlint-disable unicorn/no-array-method-this-argument -- Effect Array data-first combinators are not native Array methods with thisArg. */

import { VercelProjectsReadError } from "./errors.js";
import {
  ListedVercelDeployments,
  ListedVercelEnvironmentVariables,
  ListedVercelMarketplaceBindings,
  ListedVercelProjectDomains,
  ListedVercelProjects,
  VercelDeploymentObservation,
  VercelEnvironmentVariableAttributes,
  VercelEnvironmentVariableKey,
  VercelEnvironmentVariableObservation,
  VercelEnvironmentVariableUpdatedAt,
  VercelMarketplaceBindingObservation,
  VercelProjectDomainObservation,
  VercelProjectDiscovery,
  VercelProjectObservation,
  VercelReadOnlyInventory,
} from "./schemas.js";
import type {
  DiscoverVercelProject,
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
  VercelReadOnlyInventory as VercelReadOnlyInventoryType,
} from "./schemas.js";
import {
  VercelDeployments,
  VercelDomains,
  VercelEnvironmentVariables,
  VercelMarketplaceBindings,
  VercelProjects,
} from "./services.js";
import type { UpdateVercelStableEnvironmentVariable } from "./stable-environment.js";

export interface VercelMemoryControlShape {
  readonly snapshot: Effect.Effect<VercelReadOnlyInventoryType>;
  readonly providerWriteCount: Effect.Effect<number>;
  readonly stableEnvironmentAttemptCount: Effect.Effect<number>;
  readonly recordStableEnvironmentAttempt: Effect.Effect<void>;
  readonly updateEnvironmentVariable: (
    input: UpdateVercelStableEnvironmentVariable
  ) => Effect.Effect<typeof VercelEnvironmentVariableAttributes.Type>;
}

export class VercelMemoryControl extends Context.Service<
  VercelMemoryControl,
  VercelMemoryControlShape
>()("@bundjil/infrastructure/vercel/VercelMemoryControl") {}

export const layerVercelMemory = (inventory: VercelReadOnlyInventoryType) =>
  Layer.effectContext(
    Effect.gen(function* makeVercelMemory() {
      const state = yield* Ref.make(inventory);
      const providerWrites = yield* Ref.make(0);
      const stableEnvironmentAttempts = yield* Ref.make(0);
      const updateEnvironmentVariable = Effect.fn(
        "VercelMemoryControl.updateEnvironmentVariable"
      )(function* (input: UpdateVercelStableEnvironmentVariable) {
        const current = yield* Ref.get(state);
        const existing = Array.findFirst(
          current.environmentVariables,
          (environmentVariable) =>
            environmentVariable.stage === input.stage &&
            environmentVariable.teamId === input.teamId &&
            environmentVariable.projectId === input.projectId &&
            environmentVariable.environmentVariableId ===
              input.environmentVariableId
        );
        if (existing._tag === "None") {
          return yield* Effect.die(
            "The stable environment memory fixture is missing its exact physical identity."
          );
        }
        const providerUpdatedAt = VercelEnvironmentVariableUpdatedAt.make(
          (existing.value.providerUpdatedAt ?? 0) + 1
        );
        const updated = VercelEnvironmentVariableAttributes.make({
          ...existing.value,
          key: VercelEnvironmentVariableKey.make(input.key),
          type: input.type,
          targets: input.targets,
          sensitive: true,
          providerUpdatedAt,
          valueOwnership: input.valueOwnership,
          deploymentRequired: true,
          ownership: "Owned",
        });
        yield* Ref.update(state, (candidate) =>
          VercelReadOnlyInventory.make({
            ...candidate,
            environmentVariables: Array.map(
              candidate.environmentVariables,
              (environmentVariable) =>
                environmentVariable.environmentVariableId ===
                input.environmentVariableId
                  ? updated
                  : environmentVariable
            ),
          })
        );
        yield* Ref.update(providerWrites, (count) => count + 1);
        return updated;
      });

      const observeProject = Effect.fn("VercelProjectsMemory.observeProject")(
        function* (input: ObserveVercelProject) {
          const current = yield* Ref.get(state);
          return Option.match(
            Array.findFirst(
              current.projects,
              (project) =>
                project.stage === input.stage &&
                project.teamId === input.teamId &&
                project.projectId === input.projectId
            ),
            {
              onNone: () =>
                VercelProjectObservation.make({
                  _tag: "Missing",
                  stage: input.stage,
                  teamId: input.teamId,
                  projectId: input.projectId,
                }),
              onSome: (attributes) =>
                VercelProjectObservation.make({
                  _tag: "Found",
                  attributes,
                }),
            }
          );
        }
      );

      const discoverProject = Effect.fn("VercelProjectsMemory.discoverProject")(
        function* (input: DiscoverVercelProject) {
          const current = yield* Ref.get(state);
          const matches = pipe(
            current.projects,
            Array.filter(
              (project) =>
                project.stage === input.stage &&
                project.teamId === input.teamId &&
                project.name === input.name
            )
          );
          if (matches.length > 1) {
            return yield* new VercelProjectsReadError({
              operation: "discoverProject",
              reason: "ambiguous",
              retry: "never",
              message:
                "More than one Vercel project matched the scoped project name.",
            });
          }
          return Option.match(Array.head(matches), {
            onNone: () =>
              VercelProjectDiscovery.make({
                _tag: "Missing",
                stage: input.stage,
                teamId: input.teamId,
                name: input.name,
              }),
            onSome: (attributes) =>
              VercelProjectDiscovery.make({ _tag: "Found", attributes }),
          });
        }
      );

      const listProjects = Effect.fn("VercelProjectsMemory.listProjects")(
        function* (input: ListVercelProjects) {
          const current = yield* Ref.get(state);
          return ListedVercelProjects.make({
            projects: pipe(
              current.projects,
              Array.filter(
                (project) =>
                  project.stage === input.stage &&
                  project.teamId === input.teamId
              )
            ),
          });
        }
      );

      const observeDomain = Effect.fn("VercelDomainsMemory.observeDomain")(
        function* (input: ObserveVercelProjectDomain) {
          const current = yield* Ref.get(state);
          return Option.match(
            Array.findFirst(
              current.domains,
              (domain) =>
                domain.stage === input.stage &&
                domain.teamId === input.teamId &&
                domain.projectId === input.projectId &&
                domain.domain === input.domain
            ),
            {
              onNone: () =>
                VercelProjectDomainObservation.make({
                  _tag: "Missing",
                  stage: input.stage,
                  teamId: input.teamId,
                  projectId: input.projectId,
                  domain: input.domain,
                }),
              onSome: (attributes) =>
                VercelProjectDomainObservation.make({
                  _tag: "Found",
                  attributes,
                }),
            }
          );
        }
      );

      const listDomains = Effect.fn("VercelDomainsMemory.listDomains")(
        function* (input: ListVercelProjectDomains) {
          const current = yield* Ref.get(state);
          return ListedVercelProjectDomains.make({
            domains: pipe(
              current.domains,
              Array.filter(
                (domain) =>
                  domain.stage === input.stage &&
                  domain.teamId === input.teamId &&
                  domain.projectId === input.projectId
              )
            ),
          });
        }
      );

      const observeEnvironmentVariable = Effect.fn(
        "VercelEnvironmentVariablesMemory.observeEnvironmentVariable"
      )(function* (input: ObserveVercelEnvironmentVariable) {
        const current = yield* Ref.get(state);
        return Option.match(
          Array.findFirst(
            current.environmentVariables,
            (environmentVariable) =>
              environmentVariable.stage === input.stage &&
              environmentVariable.teamId === input.teamId &&
              environmentVariable.projectId === input.projectId &&
              environmentVariable.environmentVariableId ===
                input.environmentVariableId
          ),
          {
            onNone: () =>
              VercelEnvironmentVariableObservation.make({
                _tag: "Missing",
                stage: input.stage,
                teamId: input.teamId,
                projectId: input.projectId,
                environmentVariableId: input.environmentVariableId,
              }),
            onSome: (attributes) =>
              VercelEnvironmentVariableObservation.make({
                _tag: "Found",
                attributes,
              }),
          }
        );
      });

      const listEnvironmentVariables = Effect.fn(
        "VercelEnvironmentVariablesMemory.listEnvironmentVariables"
      )(function* (input: ListVercelEnvironmentVariables) {
        const current = yield* Ref.get(state);
        return ListedVercelEnvironmentVariables.make({
          environmentVariables: pipe(
            current.environmentVariables,
            Array.filter(
              (environmentVariable) =>
                environmentVariable.stage === input.stage &&
                environmentVariable.teamId === input.teamId &&
                environmentVariable.projectId === input.projectId
            )
          ),
        });
      });

      const observeMarketplaceBinding = Effect.fn(
        "VercelMarketplaceBindingsMemory.observeMarketplaceBinding"
      )(function* (input: ObserveVercelMarketplaceBinding) {
        const current = yield* Ref.get(state);
        return Option.match(
          Array.findFirst(
            current.marketplaceBindings,
            (binding) =>
              binding.stage === input.stage &&
              binding.teamId === input.teamId &&
              binding.projectId === input.projectId &&
              binding.resourceId === input.resourceId
          ),
          {
            onNone: () =>
              VercelMarketplaceBindingObservation.make({
                _tag: "Missing",
                stage: input.stage,
                teamId: input.teamId,
                projectId: input.projectId,
                resourceId: input.resourceId,
              }),
            onSome: (attributes) =>
              VercelMarketplaceBindingObservation.make({
                _tag: "Found",
                attributes,
              }),
          }
        );
      });

      const listMarketplaceBindings = Effect.fn(
        "VercelMarketplaceBindingsMemory.listMarketplaceBindings"
      )(function* (input: ListVercelMarketplaceBindings) {
        const current = yield* Ref.get(state);
        return ListedVercelMarketplaceBindings.make({
          bindings: pipe(
            current.marketplaceBindings,
            Array.filter(
              (binding) =>
                binding.stage === input.stage &&
                binding.teamId === input.teamId &&
                binding.projectId === input.projectId
            )
          ),
        });
      });

      const observeDeployment = Effect.fn(
        "VercelDeploymentsMemory.observeDeployment"
      )(function* (input: ObserveVercelDeployment) {
        const current = yield* Ref.get(state);
        return Option.match(
          Array.findFirst(
            current.deployments,
            (deployment) =>
              deployment.stage === input.stage &&
              deployment.teamId === input.teamId &&
              deployment.projectId === input.projectId &&
              deployment.deploymentId === input.deploymentId
          ),
          {
            onNone: () =>
              VercelDeploymentObservation.make({
                _tag: "Missing",
                stage: input.stage,
                teamId: input.teamId,
                projectId: input.projectId,
                deploymentId: input.deploymentId,
              }),
            onSome: (attributes) =>
              VercelDeploymentObservation.make({
                _tag: "Found",
                attributes,
              }),
          }
        );
      });

      const listDeployments = Effect.fn(
        "VercelDeploymentsMemory.listDeployments"
      )(function* (input: ListVercelDeployments) {
        const current = yield* Ref.get(state);
        return ListedVercelDeployments.make({
          deployments: pipe(
            current.deployments,
            Array.filter(
              (deployment) =>
                deployment.stage === input.stage &&
                deployment.teamId === input.teamId &&
                deployment.projectId === input.projectId
            )
          ),
        });
      });

      return Context.empty().pipe(
        Context.add(
          VercelProjects,
          VercelProjects.of({ discoverProject, observeProject, listProjects })
        ),
        Context.add(
          VercelDomains,
          VercelDomains.of({ observeDomain, listDomains })
        ),
        Context.add(
          VercelEnvironmentVariables,
          VercelEnvironmentVariables.of({
            observeEnvironmentVariable,
            listEnvironmentVariables,
          })
        ),
        Context.add(
          VercelMarketplaceBindings,
          VercelMarketplaceBindings.of({
            observeMarketplaceBinding,
            listMarketplaceBindings,
          })
        ),
        Context.add(
          VercelDeployments,
          VercelDeployments.of({ observeDeployment, listDeployments })
        ),
        Context.add(
          VercelMemoryControl,
          VercelMemoryControl.of({
            snapshot: Ref.get(state).pipe(
              Effect.map((current) => VercelReadOnlyInventory.make(current))
            ),
            providerWriteCount: Ref.get(providerWrites),
            stableEnvironmentAttemptCount: Ref.get(stableEnvironmentAttempts),
            recordStableEnvironmentAttempt: Ref.update(
              stableEnvironmentAttempts,
              (count) => count + 1
            ),
            updateEnvironmentVariable,
          })
        )
      );
    })
  );

export const emptyVercelInventory = VercelReadOnlyInventory.make({
  projects: [],
  domains: [],
  environmentVariables: [],
  marketplaceBindings: [],
  deployments: [],
});
